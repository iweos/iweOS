import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/server/prisma";
import { getAuthSession } from "@/lib/server/session";
import { platformAdminEmailAllowed } from "@/lib/server/platform-owner";
import { ALL_DATAROOM_PERMISSIONS, dataroomDestination, permits, type DataroomPermission } from "@/lib/dataroom-permissions";

export async function getDataroomAccess(credential: { id: string; email: string; platformRole: string | null }) {
  if (platformAdminEmailAllowed(credential.email) || credential.platformRole === "PLATFORM_ADMIN") {
    return { roleName: "Administrator", permissions: [...ALL_DATAROOM_PERMISSIONS], protected: true };
  }
  const membership = await prisma.dataroomMembership.findUnique({ where: { credentialId: credential.id }, include: { role: true } });
  if (!membership?.isActive || !membership.role.permissions.length) return null;
  return { roleName: membership.role.name, permissions: membership.role.permissions, protected: false };
}

export async function requireDataroomAccess(permission?: DataroomPermission) {
  const session = await getAuthSession();
  if (!session?.credential.emailVerifiedAt) redirect("/sign-in?portal=admin");
  const access = await getDataroomAccess(session.credential);
  if (!access) redirect("/app");
  if (permission && !permits(access.permissions, permission)) redirect(dataroomDestination(access.permissions));
  return { ...access, credentialId: session.credentialId, email: session.credential.email, activeProfile: session.profile };
}
