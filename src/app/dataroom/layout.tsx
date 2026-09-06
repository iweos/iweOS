import DataroomShell from "@/components/dataroom/DataroomShell";
import { getAccountWorkspaceOptions, requirePlatformAdmin } from "@/lib/server/auth";
import "./dataroom.css";

export default async function DataroomLayout({ children }: { children: React.ReactNode }) {
  const context = await requirePlatformAdmin();
  const { options } = await getAccountWorkspaceOptions();
  const schoolOptions = options.filter((option) => option.role === "Admin");

  return (
    <DataroomShell
      email={context.email}
      currentProfileId={context.activeProfile?.id}
      schoolOptions={schoolOptions}
    >
      {children}
    </DataroomShell>
  );
}
