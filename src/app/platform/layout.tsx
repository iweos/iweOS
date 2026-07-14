import { ProfileRole } from "@prisma/client";
import PlatformShell from "@/components/platform/PlatformShell";
import { requirePlatformAdmin } from "@/lib/server/auth";
import "./platform.css";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const context = await requirePlatformAdmin();
  const schoolPortalHref = context.activeProfile
    ? context.activeProfile.role === ProfileRole.ADMIN
      ? "/app/admin/dashboard"
      : "/app/teacher/dashboard"
    : undefined;

  return <PlatformShell email={context.email} schoolPortalHref={schoolPortalHref}>{children}</PlatformShell>;
}
