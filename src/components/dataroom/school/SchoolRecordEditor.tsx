"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogPanel, DialogTitle, Description } from "@headlessui/react";
import { Pencil, X, LoaderCircle } from "lucide-react";
import { updateSchoolRecord } from "@/lib/server/dataroom-school-records";
export type SchoolEditField = { name: string; label: string; value: string; options?: string[]; required?: boolean };
export default function SchoolRecordEditor({ schoolId, id, kind, name, fields }: { schoolId: string; id: string; kind: "user" | "student" | "school"; name: string; fields: SchoolEditField[] }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return <><button className="sw-icon" aria-label={`Edit ${name}`} onClick={() => { setFeedback(""); setOpen(true); }}><Pencil size={17}/></button>
    <Dialog open={open} onClose={() => !pending && setOpen(false)} className="sw-dialog"><div className="sw-shade"/><DialogPanel className="sw-drawer">
      <header><DialogTitle>Edit {name}</DialogTitle><Description>Changes apply only to this school. Access changes take effect immediately and are logged.</Description><button className="sw-icon" aria-label="Close editor" disabled={pending} onClick={() => setOpen(false)}><X/></button></header>
      <form data-loading-indicator="off" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); start(async () => { try { const result = await updateSchoolRecord(data); if (result.error) setFeedback(result.error); else { setOpen(false); setFeedback("Changes saved."); router.refresh(); } } catch { setFeedback("Could not save. Your entries are retained; please retry."); } }); }}>
        <input type="hidden" name="schoolId" value={schoolId}/><input type="hidden" name="id" value={id}/><input type="hidden" name="kind" value={kind}/>
        <div className="sw-form-body">{feedback && <p role="alert">{feedback}</p>}{fields.map(field => <label key={field.name}>{field.label}{field.options ? <select name={field.name} defaultValue={field.value}>{field.options.map(option => <option key={option}>{option}</option>)}</select> : <input name={field.name} defaultValue={field.value} required={field.required} maxLength={200}/>}</label>)}
        {kind === "user" && <label className="sw-confirm"><input type="checkbox" required/> I have reviewed this member’s role and access for this school.</label>}</div>
        <footer><button type="button" disabled={pending} onClick={() => setOpen(false)}>Cancel</button><button disabled={pending} type="submit">{pending && <LoaderCircle size={16}/>} {pending ? "Saving…" : "Save changes"}</button></footer>
      </form></DialogPanel></Dialog>{!open && feedback && <span role="status">{feedback}</span>}</>;
}
