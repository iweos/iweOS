const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path, imports = {}) {
  const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
  const loadedModule = { exports: {} };
  new Function('exports', 'require', 'module', source)(loadedModule.exports, name => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  }, loadedModule);
  return loadedModule.exports;
}
const policy = load('src/lib/dataroom-permissions.ts');
let membership = null;
let session = null;
const redirect = destination => { throw Object.assign(new Error('redirect'), { destination }); };
const access = load('src/lib/server/dataroom-access.ts', {
  'server-only': {},
  'next/navigation': { redirect },
  '@/lib/server/prisma': { prisma: { dataroomMembership: { findUnique: async () => membership } } },
  '@/lib/server/session': { getAuthSession: async () => session },
  '@/lib/server/platform-owner': { platformAdminEmailAllowed: email => email === 'owner@example.test' },
  '@/lib/dataroom-permissions': policy,
});
const credential = { id: 'account', email: 'staff@example.test', platformRole: null, emailVerifiedAt: new Date() };
async function denied(permission, destination) {
  await assert.rejects(access.requireDataroomAccess(permission), error => error.destination === destination);
}
(async () => {
  await denied('payments', '/sign-in?portal=admin');
  session = { credential, credentialId: credential.id, profile: null };
  await denied('overview', '/app');
  const profiles = [
    ['Finance', ['payments']],
    ['Operations', ['schools', 'users', 'results', 'manageSchools']],
    ['Viewer', ['overview', 'schools', 'users', 'payments', 'results', 'audit']],
    ['Custom audit reviewer', ['audit']],
    ['Administrator', ['manageAccess']],
  ];
  for (const [name, permissions] of profiles) {
    membership = { isActive: true, role: { name, permissions } };
    for (const { key } of policy.DATAROOM_MODULES) {
      if (permissions.includes(key) || permissions.includes('manageAccess')) {
        assert.equal((await access.requireDataroomAccess(key)).roleName, name);
      } else await denied(key, policy.dataroomDestination(permissions));
    }
  }
  membership = { isActive: true, role: { name: 'Finance', permissions: ['payments'] } };
  const users = load('src/lib/server/dataroom-user-actions.ts', {
    argon2: {}, 'node:crypto': {}, 'next/cache': {}, 'next/navigation': { redirect }, zod: require('zod'),
    '@/lib/server/platform-owner': { platformAdminEmailAllowed: () => false },
    '@/lib/server/dataroom-access': access, '@/lib/server/prisma': { prisma: {} },
    '@/lib/server/auth-email': {}, '@/lib/dataroom-permissions': policy,
  });
  for (const action of Object.values(users)) await assert.rejects(action(new FormData()), error => error.destination === '/dataroom/payments');
  const schoolActions = load('src/lib/server/dataroom-actions.ts', {
    '@prisma/client': require('@prisma/client'), 'next/cache': {}, 'next/navigation': { redirect },
    '@/lib/server/dataroom-access': access, '@/lib/server/account-integrity': {}, '@/lib/server/prisma': { prisma: {} },
  });
  for (const action of Object.values(schoolActions)) await assert.rejects(action(new FormData()), error => error.destination === '/dataroom/payments');
  membership.isActive = false;
  await denied('manageAccess', '/app');
  credential.platformRole = 'PLATFORM_ADMIN';
  assert.equal((await access.requireDataroomAccess('manageAccess')).protected, true);
  credential.platformRole = null;
  credential.email = 'owner@example.test';
  assert.equal((await access.requireDataroomAccess('manageAccess')).protected, true);
  credential.emailVerifiedAt = null;
  await denied('manageAccess', '/sign-in?portal=admin');
  for (const values of [[], ['invalid'], ['manageSchools']]) assert.throws(() => policy.validatePermissions(values));
  assert.deepEqual(policy.validatePermissions(['schools', 'schools', 'manageSchools']), ['schools', 'manageSchools']);
  const routes = { 'page.tsx': 'overview', 'schools/page.tsx': 'schools', 'schools/[schoolId]/page.tsx': 'schools', 'users/page.tsx': 'users', 'payments/page.tsx': 'payments', 'results/page.tsx': 'results', 'audit/page.tsx': 'audit', 'integrity/page.tsx': 'integrity', 'access/page.tsx': 'manageAccess' };
  for (const [file, permission] of Object.entries(routes)) assert.ok(fs.readFileSync(`src/app/dataroom/${file}`, 'utf8').includes(`requireDataroomAccess("${permission}")`), `Missing guard: ${file}`);
  // Exercise mutations with an isolated in-memory database, never production accounts.
  const actor = { credentialId: '00000000-0000-4000-8000-000000000001', email: 'admin@example.test', protected: false };
  const targetId = '00000000-0000-4000-8000-000000000002';
  const roleId = '00000000-0000-4000-8000-000000000003';
  let target = { id: targetId, email: 'member@example.test', platformRole: null };
  let savedMembership = { credentialId: targetId, roleId, isActive: true, credential: target };
  const audit = [];
  let emails = 0;
  const db = {
    authCredential: { findUnique: async () => target, findUniqueOrThrow: async () => target, create: async data => ({ id: targetId, ...data.data }) },
    dataroomMembership: { findUnique: async () => ({ roleId }), findUniqueOrThrow: async () => savedMembership, create: async ({ data }) => { savedMembership = { ...data, isActive: true, credential: target }; }, update: async ({ data }) => { savedMembership = { ...savedMembership, ...data }; } },
    dataroomRole: { create: async ({ data }) => ({ id: roleId, ...data }), update: async ({ data }) => ({ id: roleId, ...data }) },
    dataroomAccessLog: { create: async ({ data }) => { audit.push(data); } },
  };
  db.$transaction = async callback => callback(db);
  const mutations = load('src/lib/server/dataroom-user-actions.ts', {
    argon2: { default: { hash: async () => 'test-hash' } }, 'node:crypto': require('node:crypto'),
    'next/cache': { revalidatePath: () => {} }, 'next/navigation': { redirect }, zod: require('zod'),
    '@/lib/server/platform-owner': { platformAdminEmailAllowed: email => email === 'owner@example.test' },
    '@/lib/server/dataroom-access': { requireDataroomAccess: async () => actor }, '@/lib/server/prisma': { prisma: db },
    '@/lib/server/auth-email': { sendPasswordReset: async () => { emails++; } }, '@/lib/dataroom-permissions': policy,
  });
  function form(fields) { const value = new FormData(); value.set('feedback', 'inline'); for (const [key, items] of Object.entries(fields)) for (const item of Array.isArray(items) ? items : [items]) value.append(key, item); return value; }
  let response = await mutations.saveDataroomRole(form({ id: roleId, name: 'Operations', permissions: ['schools'] }));
  assert.equal(response.error, true, 'Cannot remove own manageAccess permission');
  assert.equal(audit.length, 0);
  response = await mutations.saveDataroomRole(form({ name: 'Custom viewer', permissions: ['schools'] }));
  assert.equal(response.error, false);
  assert.equal(audit.at(-1).action, 'role.created');
  response = await mutations.addDataroomUser(form({ fullName: 'Test Member', email: 'member@example.test', roleId }));
  assert.equal(response.error, false);
  assert.match(response.message, /password unchanged/);
  response = await mutations.updateDataroomUser(form({ credentialId: targetId, operation: 'revoke' }));
  assert.equal(response.error, false); assert.equal(savedMembership.isActive, false);
  assert.equal((await mutations.sendDataroomSetupEmail(form({ credentialId: targetId }))).error, true);
  assert.equal(emails, 0);
  response = await mutations.updateDataroomUser(form({ credentialId: targetId, roleId }));
  assert.equal(response.error, false); assert.equal(savedMembership.isActive, true);
  assert.equal((await mutations.sendDataroomSetupEmail(form({ credentialId: targetId }))).error, false);
  assert.equal(emails, 1);
  target = { ...target, email: 'owner@example.test' };
  assert.equal((await mutations.updateDataroomUser(form({ credentialId: targetId, operation: 'revoke' }))).error, true);
  target = { ...target, email: 'member@example.test', id: actor.credentialId };
  assert.equal((await mutations.updateDataroomUser(form({ credentialId: actor.credentialId, operation: 'revoke' }))).error, true);
  assert.equal((await mutations.addDataroomUser(form({ email: 'invalid' }))).error, true);
  console.log('PASS: inline action feedback, role creation, member assignment, revoke/restore, setup email, audit trail and owner/self protections.');
  console.log('PASS: all role/module combinations, direct-route guards, revocation, verification, protected owner and custom role validation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
