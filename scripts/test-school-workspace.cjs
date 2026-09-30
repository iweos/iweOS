const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, imports) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const loadedModule = { exports: {} };
  new Function('exports', 'require', 'module', output)(loadedModule.exports, key => { if (!(key in imports)) throw new Error(key); return imports[key]; }, loadedModule);
  return loadedModule.exports;
}
const policy = load('src/lib/result-tracking.ts', {});
const schoolId = '00000000-0000-4000-8000-000000000010';
const recordId = '00000000-0000-4000-8000-000000000011';
(async () => {
  assert.equal(policy.trackedResultState(undefined, false, 0), 'Not started');
  assert.equal(policy.trackedResultState('DRAFT', false, 1), 'In progress');
  assert.equal(policy.trackedResultState(undefined, true, 4), 'Ready to publish');
  assert.equal(policy.trackedResultState('PUBLISHED', false, 0), 'Published');
  assert.equal(policy.trackedResultState('UNPUBLISHED', true, 4), 'Withdrawn');
  const service = load('src/lib/server/school-result-tracking.ts', {
    'server-only': {}, '@/lib/result-tracking': policy,
    '@/lib/server/prisma': { prisma: {
      enrollment: { findMany: async ({where}) => { assert.equal(where.schoolId, schoolId); assert.equal(where.student.status, 'active'); assert.equal(where.termId, 'term'); return ['missing','partial','ready','published','withdrawn'].map(studentId => ({ studentId, classId:'class', class:{name:'JSS1'}, student:{fullName:studentId,studentCode:studentId} })); } },
      resultPublication: { findMany: async ({where}) => { assert.equal(where.schoolId, schoolId); return [{studentId:'published',status:'PUBLISHED'},{studentId:'withdrawn',status:'UNPUBLISHED'}]; } },
    } },
    '@/lib/server/result-readiness': { getResultReadinessMap: async ({schoolId: scope, studentIds}) => { assert.equal(scope, schoolId); return new Map(studentIds.map(id => [id,{ready:id==='ready',expectedSubjects:3,scoredSubjects:id==='ready'?3:id==='partial'?1:0}])); } },
  });
  const result = await service.schoolResultTracking(schoolId, 'term');
  assert.equal(result.total, 5);
  for (const state of policy.RESULT_STATES) assert.equal(result.counts[state], 1);
  let allowed = true, target = null, changed = 0, logs = 0, adminCount = 1;
  const tx = { $queryRaw: async () => [], profile:{findFirst:async ({where}) => { assert.equal(where.schoolId,schoolId); return target; },count:async()=>adminCount,update:async()=>{changed++;}}, student:{updateMany:async ({where})=>{assert.equal(where.schoolId,schoolId);return {count:0};}}, auditLog:{create:async()=>{logs++;}} };
  const actions = load('src/lib/server/dataroom-school-records.ts', {
    zod:require('zod'),'next/cache':{revalidatePath:()=>{}},
    '@/lib/server/dataroom-access':{requireDataroomAccess:async(permission)=>{assert.equal(permission,'manageAccess');if(!allowed)throw new Error('denied');return {credentialId:'self',email:'owner@example.test'};}},
    '@/lib/server/platform-owner':{platformAdminEmailAllowed:email=>email==='owner@example.test'},
    '@/lib/server/prisma':{prisma:{$transaction:async callback=>callback(tx)}},
  });
  function form(kind, extra={}) { const f=new FormData();for(const [k,v] of Object.entries({schoolId,id:recordId,kind,fullName:'Test Person',role:'TEACHER',isActive:'inactive',...extra}))f.set(k,v);return f; }
  allowed=false;await assert.rejects(actions.updateSchoolRecord(form('user')),/denied/);allowed=true;
  assert.match((await actions.updateSchoolRecord(form('user'))).error,/not found/);
  target={role:'ADMIN',isActive:true,credentialId:'someone',email:'member@example.test'};
  assert.match((await actions.updateSchoolRecord(form('user'))).error,/at least one/);
  assert.equal(changed,0);
  target.credentialId='self';assert.match((await actions.updateSchoolRecord(form('user'))).error,/own membership/);
  target.credentialId='someone';target.email='owner@example.test';assert.match((await actions.updateSchoolRecord(form('user'))).error,/protected owners/);
  target.email='member@example.test';adminCount=2;
  assert.deepEqual(await actions.updateSchoolRecord(form('user')),{});assert.equal(changed,1);assert.equal(logs,1);
  assert.match((await actions.updateSchoolRecord(form('student',{status:'withdrawn'}))).error,/not found/);
  assert.match((await actions.updateSchoolRecord(form('school'))).error,/mismatch/);
  console.log('PASS: all readiness states, enrollment denominator, school scoping, permission rejection, last-admin/self/owner protections and audit logging.');
})().catch(error=>{console.error(error);process.exitCode=1;});
