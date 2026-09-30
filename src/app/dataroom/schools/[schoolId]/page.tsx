import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { z } from "zod";
import { updateSchoolStatusAction } from "@/lib/server/dataroom-actions";
import { Prisma } from "@prisma/client";
import { permits, type DataroomPermission } from "@/lib/dataroom-permissions";
import { requireDataroomAccess } from "@/lib/server/dataroom-access";
import { prisma } from "@/lib/server/prisma";
import SchoolRecordEditor from "@/components/dataroom/school/SchoolRecordEditor";
import SchoolTabs from "@/components/dataroom/school/SchoolTabs";
import SchoolResults from "@/components/dataroom/school/SchoolResults";
import OpenSchoolPortalButton from "@/components/dataroom/OpenSchoolPortalButton";
import "@/components/dataroom/school/school-workspace.css";
const tabs: { key: string; label: string; permission: DataroomPermission }[] = [
  { key: "overview", label: "Overview", permission: "schools" },
  { key: "users", label: "Users", permission: "users" },
  { key: "students", label: "Students", permission: "schools" },
  { key: "academics", label: "Classes & sessions", permission: "schools" },
  { key: "results", label: "Results", permission: "results" },
  { key: "payments", label: "Payments", permission: "payments" },
  { key: "settings", label: "School settings", permission: "schools" },
  { key: "activity", label: "Activity", permission: "audit" },
];
type Props = { params: Promise<{ schoolId: string }>; searchParams: Promise<Record<string, string | undefined>> };
export default async function DataroomSchoolDetailPage({ params, searchParams }: Props) {
  const { schoolId } = await params;
  if (!z.string().uuid().safeParse(schoolId).success) notFound();
  const query = await searchParams;
  const tab = tabs.find(t => t.key === query.tab) ?? tabs[0];
  const context = await requireDataroomAccess(tab.permission);
  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { id: true, name: true, logoUrl: true, code: true, status: true, phone: true, addressLine1: true, currency: true } });
  if (!school) notFound();
  const ownAdmin = await prisma.profile.findFirst({ where: { schoolId, credentialId: context.credentialId, role: "ADMIN", isActive: true }, select: { id: true } });
  const canEdit = permits(context.permissions, "manageAccess");
  const base = `/dataroom/schools/${schoolId}`;
  const q = (query.q ?? "").trim();
  const page = Math.max(1, Math.min(100000, Math.floor(Number(query.page) || 1)));
  const skip = (page - 1) * 25;
  let content: React.ReactNode;
  function pager(total: number) { return <nav className="sw-pagination" aria-label="Directory pages"><span>{total} matching records · Page {page} of {Math.max(1, Math.ceil(total / 25))}</span>{page > 1 && <Link href={`${base}?${new URLSearchParams({ tab: tab.key, q, page: String(page - 1) })}`}>Previous</Link>}{skip + 25 < total && <Link href={`${base}?${new URLSearchParams({ tab: tab.key, q, page: String(page + 1) })}`}>Next</Link>}</nav>; }
  const search = <form className="sw-filters"><input type="hidden" name="tab" value={tab.key}/><label>Search {tab.label.toLowerCase()}<input name="q" defaultValue={q} placeholder="Search this school"/></label><button>Search</button>{q && <Link href={`${base}?tab=${tab.key}`}>Clear</Link>}</form>;
  if (tab.key === "results") content = <SchoolResults schoolId={schoolId} params={query}/>;
  else if (tab.key === "users") {
    const where: Prisma.ProfileWhereInput = { schoolId, ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}) };
    const [rows, total] = await Promise.all([prisma.profile.findMany({ where, take: 25, skip, orderBy: [{ fullName: "asc" }, { id: "asc" }], include: { authCredential: { select: { emailVerifiedAt: true, lastLoginAt: true, platformRole: true } } } }), prisma.profile.count({ where })]);
    content = <><h2>School users</h2><p>School memberships, not separate accounts. Changes here do not change roles in other schools.</p>{search}<div className="sw-list">{rows.map(row => <article className="sw-row" key={row.id}><div><strong>{row.fullName}</strong><small>{row.email}</small><small>{row.authCredential?.lastLoginAt ? `Last login ${row.authCredential.lastLoginAt.toLocaleDateString("en-GB", { timeZone: "Africa/Lagos" })}` : "No recorded login"}</small></div><span>{row.role === "ADMIN" ? "Administrator" : "Teacher"}</span><span className="sw-badge">{!row.isActive ? "Inactive" : !row.credentialId ? "Not linked" : !row.authCredential?.emailVerifiedAt ? "Unverified" : "Active"}</span>{canEdit && row.credentialId !== context.credentialId && !row.authCredential?.platformRole && <SchoolRecordEditor schoolId={schoolId} id={row.id} kind="user" name={row.fullName} fields={[{ name: "fullName", label: "Full name", value: row.fullName, required: true }, { name: "role", label: "School role", value: row.role, options: ["ADMIN", "TEACHER"] }, { name: "isActive", label: "School access", value: row.isActive ? "active" : "inactive", options: ["active", "inactive"] }]}/>}</article>)}{!rows.length && <p className="sw-empty">No matching school users.</p>}</div>{pager(total)}</>;
  } else if (tab.key === "students") {
    const where: Prisma.StudentWhereInput = { schoolId, ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { studentCode: { contains: q, mode: "insensitive" } }] } : {}) };
    const [rows, total] = await Promise.all([prisma.student.findMany({ where, take: 25, skip, orderBy: [{ fullName: "asc" }, { id: "asc" }], select: { id: true, fullName: true, studentCode: true, status: true, className: true } }), prisma.student.count({ where })]);
    content = <><h2>Students</h2><p>Review school records and manage student status. Result tracking uses class enrollment for the selected term.</p>{search}<div className="sw-list">{rows.map(row => <article className="sw-row" key={row.id}><div><strong>{row.fullName}</strong><small>{row.studentCode} · {row.className || "Class not set"}</small></div><span className="sw-badge">{row.status}</span>{canEdit && <SchoolRecordEditor schoolId={schoolId} id={row.id} kind="student" name={row.fullName} fields={[{ name: "status", label: "Student status", value: row.status, options: ["active", "inactive", "graduated", "suspended", "withdrawn"] }]}/>}</article>)}{!rows.length && <p className="sw-empty">No matching students.</p>}</div>{pager(total)}</>;
  } else if (tab.key === "payments") {
    const where: Prisma.PaymentWhereInput = { schoolId, ...(q ? { OR: [{ providerRef: { contains: q, mode: "insensitive" } }, { invoice: { invoiceNo: { contains: q, mode: "insensitive" } } }] } : {}) };
    const [rows, total, summary] = await Promise.all([prisma.payment.findMany({ where, skip, take: 25, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, providerRef: true, status: true, amount: true, createdAt: true, invoice: { select: { invoiceNo: true } } } }), prisma.payment.count({ where }), prisma.payment.aggregate({ where: { schoolId, status: "SUCCESS" }, _sum: { amount: true }, _count: true })]);
    const money = (amount: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: school.currency }).format(amount);
    content = <><h2>School payments</h2><p>School lifetime successful collections: <strong>{money(Number(summary._sum.amount ?? 0))}</strong> · {summary._count} transactions. Provider-confirmed payments are read-only.</p>{search}<div className="sw-list">{rows.map(row => <article className="sw-row" key={row.id}><div><strong>{row.providerRef}</strong><small>{row.invoice.invoiceNo} · {row.createdAt.toLocaleDateString("en-GB", { timeZone: "Africa/Lagos" })}</small></div><strong>{money(Number(row.amount))}</strong><span className="sw-badge">{row.status}</span></article>)}{!rows.length && <p className="sw-empty">No matching payments.</p>}</div>{pager(total)}</>;
  } else if (tab.key === "academics") {
    const [classes, terms] = await Promise.all([prisma.class.findMany({ where: { schoolId }, orderBy: { name: "asc" }, include: { classSubjects: { include: { subject: { select: { name: true } } } } } }), prisma.term.findMany({ where: { schoolId }, orderBy: { createdAt: "desc" } })]);
    content = <><h2>Classes & sessions</h2><p>Expand a class to inspect assigned subjects. Academic configuration remains in the school portal.</p><div className="sw-list">{classes.map(c => <details key={c.id}><summary>{c.name} <span>{c.classSubjects.length} subjects</span></summary><p>{c.classSubjects.map(s => s.subject.name).join(" · ") || "No subjects assigned"}</p></details>)}{!classes.length && <p className="sw-empty">No classes configured.</p>}</div><h3>Sessions and terms</h3><div className="sw-list">{terms.map(t => <article className="sw-row" key={t.id}><strong>{t.sessionLabel} · {t.termLabel}</strong><span className="sw-badge">{t.isActive ? "Active" : "Inactive"}</span></article>)}</div></>;
  } else if (tab.key === "settings") content = <><h2>School profile</h2>{permits(context.permissions, "manageSchools") && <details className="sw-status-editor"><summary>Change school status</summary><form action={updateSchoolStatusAction} className="sw-filters"><input type="hidden" name="schoolId" value={schoolId}/><label>School status<select name="status" defaultValue={school.status}>{["ACTIVE", "SUSPENDED", "ARCHIVED"].map(value => <option key={value}>{value}</option>)}</select></label><button>Update status</button></form></details>}<p>Basic school details. Settlement details and academic policies remain in the school’s protected settings workflows.</p><div className="sw-list"><article className="sw-row"><div><strong>{school.name}</strong><small>{school.phone || "No phone"} · {school.addressLine1 || "No address"}</small></div>{canEdit && <SchoolRecordEditor schoolId={schoolId} id={schoolId} kind="school" name={school.name} fields={[{ name: "name", label: "School name", value: school.name, required: true }, { name: "phone", label: "Phone", value: school.phone ?? "" }, { name: "addressLine1", label: "Address", value: school.addressLine1 ?? "" }]}/>}</article></div></>;
  else if (tab.key === "activity") {
    const [rows, total] = await Promise.all([prisma.auditLog.findMany({ where: { schoolId }, take: 25, skip, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, action: true, createdAt: true } }), prisma.auditLog.count({ where: { schoolId } })]);
    content = <><h2>School activity</h2><div className="sw-list">{rows.map(row => <article className="sw-row" key={row.id}><strong>{row.action.replaceAll(".", " ")}</strong><span>{row.createdAt.toLocaleString("en-GB", { timeZone: "Africa/Lagos" })} WAT</span></article>)}{!rows.length && <p className="sw-empty">No activity recorded.</p>}</div>{pager(total)}</>;
  } else {
    const [students, users, classes, activeTerm] = await Promise.all([prisma.student.count({ where: { schoolId } }), prisma.profile.count({ where: { schoolId } }), prisma.class.count({ where: { schoolId } }), prisma.term.findFirst({ where: { schoolId, isActive: true }, select: { sessionLabel: true, termLabel: true } })]);
    content = <><h2>School overview</h2><p>{activeTerm ? `${activeTerm.sessionLabel} · ${activeTerm.termLabel}` : "No active session configured"}</p><div className="sw-metrics">{[["Students", students], ["Staff memberships", users], ["Classes", classes]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div><div className="sw-destinations">{tabs.filter(t => t.key !== "overview" && permits(context.permissions, t.permission)).map(t => <Link href={`${base}?tab=${t.key}`} key={t.key}><strong>{t.label}</strong><span>View {school.name} {t.label.toLowerCase()} →</span></Link>)}</div></>;
  }
  return <div className="school-workspace"><Link href={permits(context.permissions, "schools") ? "/dataroom/schools" : `/dataroom/${tab.permission}`} className="sw-back">← Back to directory</Link><header className="sw-header"><div>{school.logoUrl && <Image width={52} height={52} unoptimized className="sw-school-logo" src={school.logoUrl} alt={`${school.name} logo`}/>}<span>{school.code} · School workspace</span><h1>{school.name}</h1><p>All records and changes below belong to this school.</p></div><div className="sw-header-actions"><span className="sw-badge">{school.status}</span>{ownAdmin && <OpenSchoolPortalButton profileId={ownAdmin.id}/>}</div></header><SchoolTabs items={tabs.filter(t => permits(context.permissions, t.permission)).map(t => ({ key: t.key, label: t.label, href: `${base}?tab=${t.key}`, active: t.key === tab.key }))}/><section className="sw-panel">{query.updated && <p role="status">School status updated.</p>}{content}</section></div>;
}
