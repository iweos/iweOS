export const DATAROOM_MODULES = [
  { key: "overview", label: "Overview", description: "Platform-wide statistics, including collection totals" },
  { key: "schools", label: "Schools", description: "School records, staff, students and school collection summaries" },
  { key: "users", label: "School users", description: "School administrator and teacher directory" },
  { key: "payments", label: "Payments", description: "Platform payment records" },
  { key: "results", label: "Results", description: "Result publication records" },
  { key: "audit", label: "Audit logs", description: "School activity history" },
  { key: "integrity", label: "Account integrity", description: "Review and remove eligible empty school workspaces" },
  { key: "manageSchools", label: "Manage school status", description: "Suspend, archive or reactivate schools (requires Schools)" },
  { key: "manageAccess", label: "Manage Dataroom access", description: "Full access: invite users and change all roles and permissions" },
] as const;
export type DataroomPermission = typeof DATAROOM_MODULES[number]["key"];
export const ALL_DATAROOM_PERMISSIONS = DATAROOM_MODULES.map((item) => item.key);
export function permits(permissions: readonly string[], permission: DataroomPermission) {
  return permissions.includes("manageAccess") || permissions.includes(permission);
}
export function dataroomDestination(permissions: readonly string[]) {
  const routes: [DataroomPermission, string][] = [["overview", "/dataroom"], ["schools", "/dataroom/schools"], ["users", "/dataroom/users"], ["payments", "/dataroom/payments"], ["results", "/dataroom/results"], ["audit", "/dataroom/audit"], ["integrity", "/dataroom/integrity"], ["manageAccess", "/dataroom/access"]];
  return routes.find(([key]) => permits(permissions, key))?.[1] ?? "/app";
}
export function validatePermissions(values: string[]): DataroomPermission[] {
  if (values.some((value) => !ALL_DATAROOM_PERMISSIONS.includes(value as DataroomPermission))) throw new Error("Unknown module permission.");
  const permissions = [...new Set(values)] as DataroomPermission[];
  if (!permissions.length) throw new Error("Select at least one module.");
  if (permissions.includes("manageSchools") && !permissions.includes("schools") && !permissions.includes("manageAccess")) throw new Error("Enable Schools to grant school management.");
  return permissions;
}
