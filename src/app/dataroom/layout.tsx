import DataroomShell from "@/components/dataroom/DataroomShell";
import { getAccountWorkspaceOptions } from "@/lib/server/auth";
import { requireDataroomAccess } from "@/lib/server/dataroom-access";
import "./dataroom.css";

export default async function DataroomLayout({ children }: { children: React.ReactNode }) {
  const context = await requireDataroomAccess();
  const { options } = await getAccountWorkspaceOptions();
  const schoolOptions = options.filter((option) => option.role === "Admin");

  return (
    <DataroomShell
      permissions={context.permissions}
      roleName={context.roleName}
      email={context.email}
      currentProfileId={context.activeProfile?.id}
      schoolOptions={schoolOptions}
    >
      {children}
    </DataroomShell>
  );
}
