import Link from "next/link";

type AdminTeacherWorkspaceActionsProps = {
  mode: "teacher" | "admin_override" | "admin_as_teacher";
  backHref?: string;
  sourceLabel?: string;
};

export default function AdminTeacherWorkspaceActions({
  mode,
  backHref = "/app/admin/dashboard",
  sourceLabel,
}: AdminTeacherWorkspaceActionsProps) {
  if (mode === "teacher") {
    return null;
  }

  const label =
    sourceLabel ??
    (mode === "admin_override" ? "Admin override workspace" : "Viewing teacher workspace as admin");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="badge rounded-pill bg-light text-dark border">{label}</span>
      <Link href={backHref} className="btn btn-secondary btn-sm">
        Back to Administration
      </Link>
    </div>
  );
}
