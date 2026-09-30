import { requireDataroomAccess } from "@/lib/server/dataroom-access";
import { prisma } from "@/lib/server/prisma";
import { DATAROOM_MODULES } from "@/lib/dataroom-permissions";
import { addDataroomUser, saveDataroomRole, updateDataroomUser, sendDataroomSetupEmail } from "@/lib/server/dataroom-user-actions";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";

export default async function DataroomAccessPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  await requireDataroomAccess("manageAccess");
  const params = await searchParams;
  const [roles, members, logs] = await Promise.all([
    prisma.dataroomRole.findMany({ orderBy: { name: "asc" } }),
    prisma.dataroomMembership.findMany({ include: { role: true, credential: { select: { email: true, emailVerifiedAt: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.dataroomAccessLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  return <div className="dataroom-access">
    <section className="platform-page-heading"><div><p>Permissions</p><h1>Dataroom access</h1><span>Add your team and choose which modules each role can use.</span></div></section>
    {params.message || params.error ? <p role="status" className={params.error ? "access-error" : "platform-success-notice"}>{params.error || params.message}</p> : null}
    <details className="platform-panel"><summary>Add Dataroom user</summary><form action={addDataroomUser} className="access-form">
      <label>Full name<input name="fullName" required minLength={2} maxLength={120} autoComplete="name" /></label>
      <label>Email<input name="email" type="email" required autoComplete="email" /></label>
      <label>Role<select name="roleId" required defaultValue=""><option value="" disabled>Choose a role</option>{roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
      <AuthSubmitButton idleLabel="Add user" pendingLabel="Adding user…" />
    </form></details>
    <section className="platform-panel"><h2>Team members</h2><p>Platform owners retain protected administrator access. Existing school memberships are separate from Dataroom roles.</p>
      {members.map(member => <article className="access-member" key={member.credentialId}><div><strong>{member.fullName}</strong><small>{member.credential.email}</small><small>{member.isActive ? member.credential.emailVerifiedAt ? "Active" : "Awaiting verification" : "Access revoked"}</small></div>
        <form action={updateDataroomUser}><input type="hidden" name="credentialId" value={member.credentialId} /><label><span className="sr-only">Role for {member.fullName}</span><select name="roleId" defaultValue={member.roleId}>{roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label><AuthSubmitButton idleLabel={member.isActive ? "Save role" : "Restore access"} pendingLabel="Saving…" /><button name="operation" value="revoke" disabled={!member.isActive}>Revoke access</button></form>
        <form action={sendDataroomSetupEmail}><input type="hidden" name="credentialId" value={member.credentialId} /><AuthSubmitButton idleLabel="Send password setup" pendingLabel="Sending…" /></form>
      </article>)}
      {!members.length ? <p>No team members added yet.</p> : null}
    </section>
    <section className="platform-panel"><h2>Roles and module permissions</h2><p>Create as many roles as you need. Manage Dataroom access grants full administration, including the ability to change other roles.</p>
      {[...roles, { id: "", name: "", permissions: [] as string[] }].map(role => <details key={role.id || "new"}><summary>{role.name || "+ Add role"}</summary><form action={saveDataroomRole} className="access-form"><input type="hidden" name="id" value={role.id} /><label>Role name<input name="name" required minLength={2} maxLength={60} defaultValue={role.name} /></label><fieldset><legend>Permitted modules and actions</legend>{DATAROOM_MODULES.map(module => <label className="access-permission" key={module.key}><input type="checkbox" name="permissions" value={module.key} defaultChecked={role.permissions.includes(module.key)} /><span><strong>{module.label}</strong><small>{module.description}</small></span></label>)}</fieldset><AuthSubmitButton idleLabel="Save role" pendingLabel="Saving…" /></form></details>)}
    </section>
    <details className="platform-panel"><summary>Access change history</summary>{logs.map(log => <p key={log.id}><strong>{log.action}</strong> · {log.target}<br /><small>{log.actorEmail} · {log.createdAt.toLocaleString("en-GB", { timeZone: "Africa/Lagos" })} WAT</small></p>)}</details>
  </div>;
}
