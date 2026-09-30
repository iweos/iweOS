"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Description, Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { ArrowRight, Check, ChevronRight, Clock3, History, KeyRound, LoaderCircle, LockKeyhole, Mail, MoreHorizontal, Plus, Search, ShieldCheck, Users, X, AlertTriangle } from "lucide-react";
import { DATAROOM_MODULES, validatePermissions } from "@/lib/dataroom-permissions";
import "./access-workspace.css";

export type AccessMember = { id: string; name: string; email: string; roleId: string; roleName: string; active: boolean; verified: boolean; protected: boolean };
export type AccessRole = { id: string; name: string; permissions: string[] };
export type AccessLog = { id: string; action: string; target: string; actorEmail: string; date: string };
type Action = (form: FormData) => Promise<{ message: string; error: boolean } | void>;
type Props = { members: AccessMember[]; roles: AccessRole[]; logs: AccessLog[]; currentId: string; message?: string; error?: string; actions: { add: Action; role: Action; member: Action; email: Action } };
type Editor = { kind: "add" } | { kind: "role"; role?: AccessRole } | { kind: "member"; member: AccessMember; revoke?: boolean } | { kind: "history" } | { kind: "email"; member: AccessMember };
const viewing = DATAROOM_MODULES.filter(m => !["integrity", "manageSchools", "manageAccess"].includes(m.key));
const managing = DATAROOM_MODULES.filter(m => ["integrity", "manageSchools", "manageAccess"].includes(m.key));
function roleDescription(role: AccessRole) {
  if (role.permissions.includes("manageAccess")) return "Full platform access and team administration.";
  const names = DATAROOM_MODULES.filter(module => role.permissions.includes(module.key)).map(module => module.label);
  return names.length ? names.join(" · ") : "No module access configured.";
}
function initials(name: string) { return name.split(/\s+/).slice(0,2).map(s => s[0]).join("").toUpperCase(); }
function status(member: AccessMember) { return member.protected ? "Protected owner" : !member.active ? "Revoked" : member.verified ? "Active" : "Unverified"; }

export default function AccessWorkspace({ members, roles, logs, currentId, actions, message, error }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"members" | "roles">("members");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [notice, setNotice] = useState({ text: error || message || "", error: Boolean(error) });
  const [formError, setFormError] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState<{ form: FormData; action: Action; names: string[]; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<FormData | null>(null);
  const search = query.trim().toLowerCase();
  const visible = members.filter(m => `${m.name} ${m.email} ${m.roleName} ${status(m)}`.toLowerCase().includes(search));
  const affected = editor?.kind === "role" ? members.filter(m => m.roleId === editor.role?.id && m.active) : [];
  function open(next: Editor) { setDraft(null); setFormError(""); setConfirmation(null); setSelected(next.kind === "role" ? next.role?.permissions ?? [] : []); setEditor(next); }
  function close() { if (!pending) { setEditor(null); setConfirmation(null); } }
  function submit(action: Action, form: FormData) {
    form.set("feedback", "inline"); setFormError("");
    startTransition(async () => {
      try {
        const result = await action(form);
        if (result?.error) { setFormError(result.message); setConfirmation(null); return; }
        setNotice({ text: result?.message ?? "Changes saved.", error: false });
        setEditor(null); setConfirmation(null); router.refresh();
      } catch { setFormError("We could not complete this request. Your entries are retained. Please retry."); setConfirmation(null); }
    });
  }
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending || !editor) return;
    const form = new FormData(event.currentTarget); setDraft(form);
    if (editor.kind === "role") {
      try { validatePermissions(selected); } catch (e) { setFormError((e as Error).message); return; }
      const changed = editor.role && [...selected].sort().join() !== [...editor.role.permissions].sort().join();
      if (changed || selected.some(p => ["manageAccess", "integrity", "manageSchools"].includes(p))) {
        setConfirmation({ action: actions.role, form, names: affected.map(m => m.name), text: selected.includes("manageAccess") ? "This role grants full administration, including control of all users and roles." : "These module permissions take effect for every active member assigned to this role." }); return;
      }
      submit(actions.role, form);
    } else if (editor.kind === "member") {
      setConfirmation({ action: actions.member, form, names: [editor.member.name], text: editor.revoke ? "This person will lose Dataroom access immediately. Their school memberships remain unchanged. You can restore access later." : "This person's Dataroom permissions will change to the selected role. Saving also restores access if it was revoked." });
    } else if (editor.kind === "add") {
      const role = roles.find(r => r.id === form.get("roleId"));
      if (role?.permissions.includes("manageAccess")) { setConfirmation({ action: actions.add, form, names: [String(form.get("fullName"))], text: "You are granting full administration, including management of all users, roles and modules." }); return; }
      submit(actions.add, form);
    } else if (editor.kind === "email") submit(actions.email, form);
  }
  const title = editor?.kind === "add" ? "Add team member" : editor?.kind === "role" ? editor.role ? `Edit ${editor.role.name}` : "Create a role" : editor?.kind === "history" ? "Access history" : editor?.kind === "email" ? "Send password setup" : editor?.revoke ? "Revoke access" : "Change member role";
  return <div className="access-workspace">
    <header className="aw-heading"><div><span className="aw-eyebrow">WORKSPACE / ACCESS</span><h1>Your team. The right access.</h1><p>Manage the people and permissions behind iweOS.</p></div><button className="aw-button aw-primary" onClick={() => open(tab === "members" ? {kind:"add"} : {kind:"role"})}><Plus size={17} />{tab === "members" ? "Add member" : "Create role"}</button></header>
    <div className="aw-navigation"><div role="tablist" aria-label="Access management">{([['members','Team members',members.length],['roles','Roles & permissions',roles.length]] as const).map(([key,label,count]) => <button key={key} role="tab" id={`aw-tab-${key}`} aria-selected={tab===key} aria-controls="aw-panel" tabIndex={tab===key?0:-1} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const next=key==='members'?'roles':'members';setTab(next);document.getElementById(`aw-tab-${next}`)?.focus();}}} onClick={()=>{setTab(key);setQuery("");}}>{label}<span>{count}</span></button>)}</div><button className="aw-history" aria-label="Access history" onClick={()=>open({kind:"history"})}><History size={16}/><span>Access history</span></button></div>
    {notice.text ? <div className={`aw-notice ${notice.error?'is-error':''}`} role={notice.error?'alert':'status'}><span>{notice.error?<AlertTriangle size={18}/>:<Check size={18}/>} {notice.text}</span><button aria-label="Dismiss notification" onClick={()=>setNotice({text:"",error:false})}><X size={16}/></button></div>:null}
    <section className="aw-panel" id="aw-panel" role="tabpanel" aria-labelledby={`aw-tab-${tab}`}>
      {tab==='members'?<><div className="aw-panel-top"><div><h2>Team members</h2><p>{members.filter(m=>m.active).length} with access · {members.filter(m=>!m.verified && m.active && !m.protected).length} awaiting verification</p></div><label className="aw-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, email or role" aria-label="Search team members"/>{query?<button aria-label="Clear search" onClick={()=>setQuery("")}><X size={15}/></button>:null}</label></div>
      <div className="aw-table" role="table" aria-label="Team members"><div className="aw-table-head" role="row"><span role="columnheader">Member</span><span role="columnheader">Role</span><span role="columnheader">Status</span><span className="sr-only" role="columnheader">Actions</span></div>
      {visible.map(member=><div className="aw-member-row" role="row" key={member.id}><div className="aw-person" role="cell"><span className={`aw-avatar ${member.protected?'is-owner':''}`}>{member.protected?<ShieldCheck size={19}/>:initials(member.name)}</span><div><strong>{member.name}{member.id===currentId?<em>You</em>:null}</strong><small>{member.email}</small></div></div><div className="aw-role-cell" role="cell"><span className="aw-role-pill">{member.roleName}</span></div><div role="cell" className="aw-status-cell"><span className={`aw-status ${member.protected?'is-protected':!member.active?'is-revoked':member.verified?'is-active':'is-pending'}`}>{member.protected?<LockKeyhole size={12}/>:<i/>}{status(member)}</span></div><div role="cell" className="aw-row-action">{member.protected||member.id===currentId?<span title="Protected: you cannot edit this account's access" className="aw-lock"><LockKeyhole size={15}/></span>:<Menu><MenuButton className="aw-icon-button" aria-label={`Actions for ${member.name}`}><MoreHorizontal size={20}/></MenuButton><MenuItems anchor="bottom end" className="aw-menu"><MenuItem><button onClick={()=>open({kind:'member',member})}><KeyRound size={16}/>{member.active?'Change role':'Restore access'}</button></MenuItem>{member.active?<><MenuItem><button onClick={()=>open({kind:'email',member})}><Mail size={16}/>Send setup email</button></MenuItem><MenuItem><button className="aw-danger-text" onClick={()=>open({kind:'member',member,revoke:true})}><LockKeyhole size={16}/>Revoke access</button></MenuItem></>:null}</MenuItems></Menu>}</div></div>)}
      {!visible.length?<div className="aw-empty"><Users size={28}/><h3>{query?'No matching members':'Make room for your team'}</h3><p>{query?'Try another name, email or role.':'Add a member and choose the access they need.'}</p><button className="aw-button" onClick={()=>query?setQuery(""):open({kind:'add'})}>{query?'Clear search':'Add your first member'}</button></div>:null}</div><footer className="aw-panel-footer"><ShieldCheck size={15}/><span>Protected owners retain full access. School memberships are managed separately.</span></footer></>:<><div className="aw-panel-top"><div><h2>Roles & permissions</h2><p>A clear scope for every person on your team.</p></div><span className="aw-subtle">{roles.length} roles</span></div><div className="aw-role-list">{roles.map(role=><button className="aw-role-row" key={role.id} onClick={()=>open({kind:'role',role})}><span className="aw-role-icon"><KeyRound size={19}/></span><span className="aw-role-description"><strong>{role.name}</strong><small>{roleDescription(role)}</small></span><span className="aw-role-count" aria-label={`${members.filter(m=>m.roleId===role.id).length} assigned members`}><Users size={14}/>{members.filter(m=>m.roleId===role.id).length}<span>members</span></span><ChevronRight size={17}/></button>)}</div></>}
    </section>
    <p className="aw-bottom-note"><LockKeyhole size={14}/> Access is enforced on every page and management action.</p>
    <Dialog open={Boolean(editor)} onClose={close} className="aw-dialog"><DialogBackdrop className="aw-backdrop"/><div className="aw-drawer-position"><DialogPanel className="aw-drawer"><header className="aw-drawer-header"><span className="aw-eyebrow">{confirmation?'REVIEW CHANGE':'DATAROOM ACCESS'}</span><button className="aw-icon-button" onClick={close} disabled={pending} aria-label="Close panel"><X size={21}/></button><DialogTitle>{confirmation?'Confirm access change':title}</DialogTitle><Description>{confirmation?'Review the scope before applying this change.':editor?.kind==='role'?'Define what this role can view and manage.':editor?.kind==='history'?'The latest 30 changes, with who made them and when.':'Give each person the access they need.'}</Description></header>
    {formError?<p className="aw-form-error" role="alert">{formError}</p>:null}
    {confirmation?<><div className="aw-drawer-body"><div className="aw-warning"><AlertTriangle size={21}/><p>{confirmation.text}</p></div><h3>Affected members ({confirmation.names.length})</h3>{confirmation.names.length?<ul className="aw-affected">{confirmation.names.map((name,index)=><li key={index}><Users size={15}/>{name}</li>)}</ul>:<p className="aw-subtle">No active members are assigned yet. This applies to future assignments.</p>}</div><footer className="aw-drawer-footer"><button className="aw-button" disabled={pending} onClick={()=>setConfirmation(null)}>Back to editing</button><button className="aw-button aw-primary" disabled={pending} autoFocus onClick={()=>submit(confirmation.action,confirmation.form)}>{pending?<LoaderCircle className="aw-spin" size={16}/>:<Check size={16}/>}Confirm change</button></footer></>:editor?.kind==='history'?<div className="aw-drawer-body aw-timeline">{logs.length?logs.map(log=><article key={log.id}><span><Clock3 size={15}/></span><div><strong>{log.action.replaceAll('.',' ').replaceAll('_',' ')}</strong><p>{log.target}</p><small>{log.actorEmail}<br/>{new Date(log.date).toLocaleString('en-GB',{timeZone:'Africa/Lagos'})} WAT</small></div></article>):<p className="aw-subtle">No access changes recorded yet.</p>}</div>:<form data-loading-indicator="off" key={editor?.kind+(editor?.kind==='role'?editor.role?.id??'new':'')} onSubmit={handleSubmit} className="aw-editor-form"><div className="aw-drawer-body">
    {editor?.kind==='add'?<><label className="aw-field">Full name<input name="fullName" defaultValue={String(draft?.get("fullName") ?? "")} required minLength={2} maxLength={120} autoComplete="name" placeholder="e.g. Ada Okafor" data-autofocus/></label><label className="aw-field">Email address<input name="email" defaultValue={String(draft?.get("email") ?? "")} required type="email" maxLength={254} autoComplete="email" placeholder="name@company.com"/></label><label className="aw-field">Assign a role<select name="roleId" defaultValue={String(draft?.get("roleId") ?? "")} required><option value="" disabled>Choose a role</option>{roles.map(role=><option key={role.id} value={role.id}>{role.name}</option>)}</select></label><p className="aw-hint">Existing users keep their password. For a new user, send a password setup email from their member menu after adding them.</p></>:null}
    {editor?.kind==='role'?<><input type="hidden" name="id" value={editor.role?.id??''}/><label className="aw-field">Role name<input name="name" required minLength={2} maxLength={60} defaultValue={String(draft?.get("name") ?? editor.role?.name ?? "")} placeholder="e.g. School support" data-autofocus/></label><p className="aw-hint">{affected.length} active member{affected.length===1?' uses':'s use'} this role. Changes apply immediately after confirmation.</p>{([{label:'View modules',description:'Read access to platform information.',modules:viewing},{label:'Management actions',description:'These permissions can change access or school data.',modules:managing}]).map(group=><fieldset className="aw-permissions" key={group.label}><legend>{group.label}</legend><p>{group.description}</p>{group.modules.map(module=><label key={module.key}><input type="checkbox" name="permissions" value={module.key} checked={selected.includes(module.key)} onChange={e=>setSelected(old=>e.target.checked?[...old,module.key]:old.filter(k=>k!==module.key))}/><span><strong>{module.label}</strong><small>{module.description}</small></span></label>)}</fieldset>)}</>:null}
    {editor?.kind==='member'||editor?.kind==='email'?<><input type="hidden" name="credentialId" value={editor.member.id}/><div className="aw-selected-person"><span className="aw-avatar">{initials(editor.member.name)}</span><div><strong>{editor.member.name}</strong><small>{editor.member.email}</small></div></div>{editor.kind==='email'?<p className="aw-hint">Send a secure password setup link to this email. The link expires in 30 minutes. It also lets an existing user reset their password.</p>:editor.revoke?<><input type="hidden" name="operation" value="revoke"/><p className="aw-hint">You can restore this person’s Dataroom access at any time.</p></>:<label className="aw-field">Assign a role<select name="roleId" defaultValue={String(draft?.get("roleId") ?? editor.member.roleId)} required>{roles.map(role=><option key={role.id} value={role.id}>{role.name}</option>)}</select></label>}</>:null}
    </div><footer className="aw-drawer-footer"><button type="button" className="aw-button" disabled={pending} onClick={close}>Cancel</button><button type="submit" className="aw-button aw-primary" disabled={pending}>{pending?<LoaderCircle className="aw-spin" size={16}/>:<ArrowRight size={16}/>} {pending?'Working…':editor?.kind==='add'?'Add member':editor?.kind==='email'?'Send setup email':editor?.kind==='role'?'Save role':'Review change'}</button></footer></form>}
    </DialogPanel></div></Dialog>
  </div>;
}
