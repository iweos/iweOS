import { requireDataroomAccess } from "@/lib/server/dataroom-access";
import { platformAdminEmailAllowed } from "@/lib/server/platform-owner";
import { prisma } from "@/lib/server/prisma";
import { addDataroomUser, saveDataroomRole, updateDataroomUser, sendDataroomSetupEmail } from "@/lib/server/dataroom-user-actions";
import AccessWorkspace, { type AccessMember } from "@/components/dataroom/AccessWorkspace";

export default async function DataroomAccessPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const actor = await requireDataroomAccess("manageAccess");
  const params = await searchParams;
  const ownerEmails = ["iyanflex@gmail.com", ...(process.env.PLATFORM_ADMIN_EMAILS ?? "").split(",")].map(email => email.trim().toLowerCase()).filter(Boolean);
  const [roles, memberships, logs, owners] = await Promise.all([
    prisma.dataroomRole.findMany({ orderBy: { name: "asc" } }),
    prisma.dataroomMembership.findMany({ include: { role: true, credential: { select: { email: true, emailVerifiedAt: true, platformRole: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.dataroomAccessLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.authCredential.findMany({ where: { OR: [{ platformRole: "PLATFORM_ADMIN" }, { email: { in: ownerEmails, mode: "insensitive" } }] }, select: { id: true, email: true, emailVerifiedAt: true, profiles: { take: 1, orderBy: { createdAt: "asc" }, select: { fullName: true } } } }),
  ]);
  const members: AccessMember[] = owners.map(owner => ({ id: owner.id, name: owner.profiles[0]?.fullName ?? owner.email.split("@")[0], email: owner.email, roleId: "", roleName: "Administrator", active: true, verified: Boolean(owner.emailVerifiedAt), protected: true }));
  for (const member of memberships) {
    if (members.some(item => item.id === member.credentialId)) continue;
    members.push({ id: member.credentialId, name: member.fullName, email: member.credential.email, roleId: member.roleId, roleName: member.role.name, active: member.isActive, verified: Boolean(member.credential.emailVerifiedAt), protected: Boolean(member.credential.platformRole) || platformAdminEmailAllowed(member.credential.email) });
  }
  return <AccessWorkspace currentId={actor.credentialId} members={members} roles={roles.map(role => ({ id: role.id, name: role.name, permissions: role.permissions }))} logs={logs.map(log => ({ id: log.id, action: log.action, target: log.target, actorEmail: log.actorEmail, date: log.createdAt.toISOString() }))} message={params.message} error={params.error} actions={{ add: addDataroomUser, role: saveDataroomRole, member: updateDataroomUser, email: sendDataroomSetupEmail }} />;
}
