import { getDataroomAccess } from "@/lib/server/dataroom-access";
import { dataroomDestination } from "@/lib/dataroom-permissions";
import { platformAdminEmailAllowed } from "@/lib/server/platform-owner";
export { platformAdminEmailAllowed } from "@/lib/server/platform-owner";
import { PlatformRole, Prisma, ProfileRole, SchoolStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/server/prisma";
import { getAuthPortalPreference, getAuthSession, setSessionProfile } from "@/lib/server/session";
import type { AppRole, SchoolAccessOption } from "@/types";

type ProfileWithSchool = Prisma.ProfileGetPayload<{ include: { school: true } }>;

type PendingInviteProfile = {
  id: string;
  role: ProfileRole;
  fullName: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  schoolId: string;
  schoolName: string;
};

const DEFAULT_GRADE_SCALE = [
  { gradeLetter: "A", minScore: 70, maxScore: 100, orderIndex: 1 },
  { gradeLetter: "B", minScore: 60, maxScore: 69, orderIndex: 2 },
  { gradeLetter: "C", minScore: 50, maxScore: 59, orderIndex: 3 },
  { gradeLetter: "D", minScore: 45, maxScore: 49, orderIndex: 4 },
  { gradeLetter: "E", minScore: 40, maxScore: 44, orderIndex: 5 },
  { gradeLetter: "F", minScore: 0, maxScore: 39, orderIndex: 6 },
] as const;


function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function baseSchoolCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 8) || "SCHOOL";
}

async function generateUniqueSchoolCode(seed: string) {
  const base = baseSchoolCode(seed);
  for (let index = 0; index < 12; index += 1) {
    const candidate = `${base}-${Math.floor(Math.random() * 900 + 100)}`;
    if (!(await prisma.school.findUnique({ where: { code: candidate }, select: { id: true } }))) return candidate;
  }
  return `${base}-${Date.now().toString().slice(-6)}`;
}

function toAppRole(role: ProfileRole): AppRole {
  return role === ProfileRole.ADMIN ? "admin" : "teacher";
}

export async function getCurrentProfile(): Promise<ProfileWithSchool | null> {
  const session = await getAuthSession();
  if (!session?.profile || session.profile.school.status !== SchoolStatus.ACTIVE) return null;
  return session.profile;
}



export async function claimProfilesForCredential(credentialId: string, email: string) {
  const normalizedEmail = normalizeEmail(email);
  await prisma.$executeRaw`
    UPDATE "profiles"
    SET "credential_id" = ${credentialId}::uuid
    WHERE "credential_id" IS NULL
      AND "is_active" = TRUE
      AND LOWER(BTRIM("email")) = ${normalizedEmail}
  `;
}

async function findAvailableProfiles(credentialId: string, email: string) {
  await claimProfilesForCredential(credentialId, email);
  return prisma.profile.findMany({
    where: {
      credentialId,
      isActive: true,
      school: { status: SchoolStatus.ACTIVE },
    },
    include: { school: true },
    orderBy: [{ school: { name: "asc" } }, { role: "asc" }],
  });
}

export async function getAccountWorkspaceOptions(): Promise<{
  options: SchoolAccessOption[];
  platformAdmin: boolean;
}> {
  const session = await getAuthSession();
  if (!session) redirect("/sign-in");
  const profiles = await findAvailableProfiles(session.credentialId, session.credential.email);
  return {
    options: profiles.map((profile) => ({
      profileId: profile.id,
      schoolId: profile.schoolId,
      schoolName: profile.school.name,
      role: profile.role === ProfileRole.ADMIN ? "Admin" : "Teacher",
    })),
    platformAdmin:
      Boolean(await getDataroomAccess(session.credential)),
  };
}

export async function getPendingInviteProfilesForAuthenticatedUser(): Promise<PendingInviteProfile[]> {
  const session = await getAuthSession();
  if (!session) redirect("/sign-in");
  const availableProfiles = await findAvailableProfiles(session.credentialId, session.credential.email);
  return availableProfiles.map((profile) => ({
    id: profile.id,
    role: profile.role,
    fullName: profile.fullName,
    email: profile.email,
    isActive: profile.isActive,
    createdAt: profile.createdAt,
    schoolId: profile.schoolId,
    schoolName: profile.school.name,
  }));
}

async function createSchoolWorkspace({
  credentialId,
  email,
  fullName,
  schoolName,
}: {
  credentialId: string;
  email: string;
  fullName: string;
  schoolName: string;
}) {
  const normalizedSchoolName = schoolName.trim().replace(/\s+/g, " ").slice(0, 120);
  if (normalizedSchoolName.length < 2) throw new Error("Enter a valid school name.");
  const schoolCode = await generateUniqueSchoolCode(normalizedSchoolName);
  return prisma.$transaction(async (tx) => {
    const school = await tx.school.create({ data: { name: normalizedSchoolName, code: schoolCode } });
    const createdProfile = await tx.profile.create({
      data: { schoolId: school.id, credentialId, role: ProfileRole.ADMIN, fullName, email },
      include: { school: true },
    });
    await tx.gradingSetting.create({ data: { schoolId: school.id } });
    const template = await tx.assessmentTemplate.create({
      data: { schoolId: school.id, name: "Default", isActive: true },
      select: { id: true },
    });
    await tx.assessmentType.createMany({
      data: [
        { schoolId: school.id, templateId: template.id, name: "CA1", weight: 20, orderIndex: 1 },
        { schoolId: school.id, templateId: template.id, name: "CA2", weight: 20, orderIndex: 2 },
        { schoolId: school.id, templateId: template.id, name: "EXAM", weight: 60, orderIndex: 3 },
      ],
    });
    await tx.gradeScale.createMany({ data: DEFAULT_GRADE_SCALE.map((grade) => ({ ...grade, schoolId: school.id })) });
    return createdProfile;
  });
}

export async function createAdditionalSchoolForAuthenticatedUser(schoolName: string) {
  const session = await getAuthSession();
  if (!session) throw new Error("Authentication required.");
  const [profiles, linkedStudent] = await Promise.all([
    findAvailableProfiles(session.credentialId, session.credential.email),
    prisma.student.findFirst({
      where: {
        guardianEmail: { equals: session.credential.email, mode: "insensitive" },
        school: { status: SchoolStatus.ACTIVE },
      },
      select: { id: true },
    }),
  ]);
  if (profiles.length > 0 && !profiles.some((profile) => profile.role === ProfileRole.ADMIN)) {
    throw new Error("Only a school administrator can create another school workspace.");
  }
  if (profiles.length === 0 && linkedStudent) {
    throw new Error("Student Portal accounts cannot create school workspaces.");
  }
  const fullName = session.profile?.fullName || session.credential.email.split("@")[0] || "School Admin";
  const profile = await createSchoolWorkspace({
    credentialId: session.credentialId,
    email: session.credential.email,
    fullName,
    schoolName,
  });
  await setSessionProfile(session.id, profile.id);
  return profile;
}

export async function ensureProfileForAuthenticatedUser(preferredProfileId?: string): Promise<ProfileWithSchool> {
  const session = await getAuthSession();
  if (!session) redirect("/sign-in");
  if (session.profile) return session.profile;

  const pendingProfiles = await findAvailableProfiles(session.credentialId, session.credential.email);
  const selected = preferredProfileId
    ? pendingProfiles.find((profile) => profile.id === preferredProfileId)
    : pendingProfiles.length === 1
      ? pendingProfiles[0]
      : null;

  if (pendingProfiles.length > 0 && !selected) redirect("/onboarding");

  if (selected) {
    await setSessionProfile(session.id, selected.id);
    return selected;
  }

  redirect("/onboarding");
}

export async function requireProfile(): Promise<ProfileWithSchool> {
  const session = await getAuthSession();
  if (!session) redirect("/sign-in");
  if (!session.profile) redirect("/onboarding");
  const profile = session.profile;
  if (!profile.isActive) throw new Error("Your account has been deactivated.");
  if (profile.school.status !== SchoolStatus.ACTIVE) redirect("/sign-in?error=This%20school%20workspace%20is%20not%20currently%20active.");
  return profile;
}

export async function requirePlatformAdmin() {
  const session = await getAuthSession();
  if (!session) redirect("/sign-in");

  let platformRole = session.credential.platformRole;
  if (platformRole !== PlatformRole.PLATFORM_ADMIN && platformAdminEmailAllowed(session.credential.email)) {
    const credential = await prisma.authCredential.update({
      where: { id: session.credentialId },
      data: { platformRole: PlatformRole.PLATFORM_ADMIN },
      select: { platformRole: true },
    });
    platformRole = credential.platformRole;
  }
  if (platformRole !== PlatformRole.PLATFORM_ADMIN) redirect("/app");

  return {
    credentialId: session.credentialId,
    email: session.credential.email,
    activeProfile: session.profile,
  };
}

export async function requireRole(role: AppRole): Promise<ProfileWithSchool> {
  const profile = await requireProfile();
  const profileRole = toAppRole(profile.role);
  if (profileRole !== role) redirect(profileRole === "admin" ? "/app/admin/dashboard" : "/app/teacher/dashboard");
  return profile;
}

type TeacherOption = { id: string; fullName: string; email: string; isActive: boolean };
type TeacherPortalMode = "teacher" | "admin_override" | "admin_as_teacher";

export async function requireTeacherPortalContext(teacherProfileId?: string) {
  const actorProfile = await requireProfile();
  if (actorProfile.role === ProfileRole.TEACHER) {
    return { actorProfile, effectiveTeacherProfile: actorProfile, mode: "teacher" as TeacherPortalMode, teacherOptions: [] as TeacherOption[] };
  }
  const teacherOptions = await prisma.profile.findMany({
    where: { schoolId: actorProfile.schoolId, role: ProfileRole.TEACHER },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, email: true, isActive: true },
  });
  if (!teacherProfileId) {
    return { actorProfile, effectiveTeacherProfile: actorProfile, mode: "admin_override" as TeacherPortalMode, teacherOptions };
  }
  const selectedTeacher = await prisma.profile.findFirst({
    where: { id: teacherProfileId, schoolId: actorProfile.schoolId, role: ProfileRole.TEACHER },
    include: { school: true },
  });
  if (!selectedTeacher) throw new Error("Selected teacher does not exist in this school.");
  return { actorProfile, effectiveTeacherProfile: selectedTeacher, mode: "admin_as_teacher" as TeacherPortalMode, teacherOptions };
}

export async function getAuthenticatedDestination(): Promise<string | null> {
  const session = await getAuthSession();
  if (!session) return null;

  const preferredPortal = await getAuthPortalPreference();
  if (preferredPortal === "student") {
    const linkedStudent = await prisma.student.findFirst({
      where: {
        guardianEmail: { equals: session.credential.email, mode: "insensitive" },
        school: { status: SchoolStatus.ACTIVE },
      },
      select: { id: true },
    });
    if (linkedStudent) return "/student";
  }

  const dataroomAccess = await getDataroomAccess(session.credential);
  if (dataroomAccess) return dataroomDestination(dataroomAccess.permissions);

  if (session.profile?.isActive && session.profile.school.status === SchoolStatus.ACTIVE) {
    return session.profile.role === ProfileRole.ADMIN ? "/app/admin/dashboard" : "/app/teacher/dashboard";
  }

  const profiles = await findAvailableProfiles(session.credentialId, session.credential.email);
  if (profiles.length === 1) {
    await setSessionProfile(session.id, profiles[0].id);
    return profiles[0].role === ProfileRole.ADMIN ? "/app/admin/dashboard" : "/app/teacher/dashboard";
  }

  return "/onboarding";
}

export async function requireStudentPortal() {
  const session = await getAuthSession();
  if (!session) redirect("/sign-in?portal=student");
  const students = await prisma.student.findMany({
    where: {
      guardianEmail: { equals: session.credential.email, mode: "insensitive" },
      school: { status: SchoolStatus.ACTIVE },
    },
    include: {
      school: { select: { id: true, name: true, code: true } },
      resultPublications: {
        where: { status: "PUBLISHED" },
        include: { term: { select: { sessionLabel: true, termLabel: true } }, class: { select: { name: true } } },
        orderBy: { publishedAt: "desc" },
      },
    },
    orderBy: [{ school: { name: "asc" } }, { fullName: "asc" }],
  });
  if (students.length === 0) redirect("/sign-in?portal=student&error=No%20student%20record%20is%20linked%20to%20this%20account.");
  return { email: session.credential.email, students };
}
