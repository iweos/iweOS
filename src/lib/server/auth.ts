import { clerkClient, auth, currentUser } from "@clerk/nextjs/server";
import { Prisma, ProfileRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/server/prisma";
import type { AppRole } from "@/types";

type ProfileWithSchool = Prisma.ProfileGetPayload<{
  include: { school: true };
}>;

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

type AuthIdentity = {
  userId: string;
  primaryEmail: string;
  emails: string[];
  fullName: string;
};

const DEFAULT_GRADE_SCALE = [
  { gradeLetter: "A", minScore: 70, maxScore: 100, orderIndex: 1 },
  { gradeLetter: "B", minScore: 60, maxScore: 69, orderIndex: 2 },
  { gradeLetter: "C", minScore: 50, maxScore: 59, orderIndex: 3 },
  { gradeLetter: "D", minScore: 45, maxScore: 49, orderIndex: 4 },
  { gradeLetter: "E", minScore: 40, maxScore: 44, orderIndex: 5 },
  { gradeLetter: "F", minScore: 0, maxScore: 39, orderIndex: 6 },
] as const;

function baseSchoolCode(value: string) {
  const sanitized = value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 8);

  return sanitized || "SCHOOL";
}

async function generateUniqueSchoolCode(seed: string) {
  const base = baseSchoolCode(seed);
  for (let index = 0; index < 12; index += 1) {
    const suffix = String(Math.floor(Math.random() * 900 + 100));
    const candidate = `${base}-${suffix}`;
    const exists = await prisma.school.findUnique({
      where: { code: candidate },
      select: { id: true },
    });
    if (!exists) {
      return candidate;
    }
  }

  return `${base}-${Date.now().toString().slice(-6)}`;
}

function toAppRole(role: ProfileRole): AppRole {
  return role === ProfileRole.ADMIN ? "admin" : "teacher";
}

async function recoverAdminIfMissing(profile: ProfileWithSchool): Promise<ProfileWithSchool> {
  if (profile.role === ProfileRole.ADMIN) {
    return profile;
  }

  const adminCount = await prisma.profile.count({
    where: {
      schoolId: profile.schoolId,
      role: ProfileRole.ADMIN,
    },
  });

  if (adminCount > 0) {
    return profile;
  }

  const promoted = await prisma.profile.update({
    where: { id: profile.id },
    data: { role: ProfileRole.ADMIN },
    include: { school: true },
  });

  await syncMetadataIfPossible(promoted.clerkUserId, "admin", promoted.schoolId);
  return promoted;
}

async function syncMetadataIfPossible(clerkUserId: string | null, role: AppRole, schoolId: string) {
  if (!clerkUserId) {
    return;
  }

  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        role,
        schoolId,
      },
    });
  } catch {
    // Metadata sync failures should not block core DB auth flow.
  }
}

export async function getCurrentProfile(clerkUserId?: string): Promise<ProfileWithSchool | null> {
  const resolvedClerkUserId = clerkUserId ?? (await auth()).userId;
  if (!resolvedClerkUserId) {
    return null;
  }

  const profile = await prisma.profile.findUnique({
    where: { clerkUserId: resolvedClerkUserId },
    include: { school: true },
  });

  return profile;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function resolveAuthIdentity(): Promise<AuthIdentity> {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const primaryRaw =
    user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress;
  const allEmails = Array.from(
    new Set(
      user.emailAddresses
        .map((entry) => entry.emailAddress)
        .filter(Boolean)
        .map(normalizeEmail),
    ),
  );
  const primaryEmail = primaryRaw ? normalizeEmail(primaryRaw) : allEmails[0];

  if (!primaryEmail) {
    throw new Error("Authenticated Clerk user has no email address.");
  }
  if (allEmails.length === 0) {
    allEmails.push(primaryEmail);
  }

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || primaryEmail.split("@")[0] || "User";

  return { userId, primaryEmail, emails: allEmails, fullName };
}

async function findPendingProfilesByEmails(emails: string[]): Promise<ProfileWithSchool[]> {
  if (emails.length === 0) {
    return [];
  }

  return prisma.profile.findMany({
    where: {
      clerkUserId: null,
      isActive: true,
      OR: emails.map((email) => ({
        email: { equals: email, mode: "insensitive" },
      })),
    },
    include: { school: true },
    orderBy: { createdAt: "desc" },
  });
}

async function reassignClerkUserLink(
  currentProfileId: string,
  targetProfile: ProfileWithSchool,
  userId: string,
  fullName: string,
) {
  if (currentProfileId === targetProfile.id) {
    return targetProfile;
  }

  return prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { id: currentProfileId },
      data: { clerkUserId: null },
    });

    return tx.profile.update({
      where: { id: targetProfile.id },
      data: {
        clerkUserId: userId,
        fullName,
      },
      include: { school: true },
    });
  });
}

export async function getPendingInviteProfilesForAuthenticatedUser(): Promise<PendingInviteProfile[]> {
  const { emails } = await resolveAuthIdentity();
  const pendingProfiles = await findPendingProfilesByEmails(emails);
  return pendingProfiles.map((profile) => ({
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

export async function ensureProfileForAuthenticatedUser(preferredProfileId?: string): Promise<ProfileWithSchool> {
  const { userId, primaryEmail, emails, fullName } = await resolveAuthIdentity();
  const existingByClerkId = await getCurrentProfile(userId);
  const pendingProfiles = await findPendingProfilesByEmails(emails);

  if (existingByClerkId) {
    const recovered = await recoverAdminIfMissing(existingByClerkId);

    if (pendingProfiles.length > 0) {
      const selectedPendingProfile =
        preferredProfileId
          ? pendingProfiles.find((profile) => profile.id === preferredProfileId) ?? null
          : null;

      if (selectedPendingProfile) {
        const relinkedProfile = await reassignClerkUserLink(recovered.id, selectedPendingProfile, userId, fullName);
        await syncMetadataIfPossible(relinkedProfile.clerkUserId, toAppRole(relinkedProfile.role), relinkedProfile.schoolId);
        return relinkedProfile;
      }

      if (!recovered.isActive) {
        if (pendingProfiles.length === 1) {
          const relinkedProfile = await reassignClerkUserLink(recovered.id, pendingProfiles[0], userId, fullName);
          await syncMetadataIfPossible(relinkedProfile.clerkUserId, toAppRole(relinkedProfile.role), relinkedProfile.schoolId);
          return relinkedProfile;
        }
        redirect("/onboarding");
      }

      // If the currently linked profile is teacher but an active admin invite exists,
      // prioritize the admin invite so login lands on admin access as expected.
      if (recovered.role === ProfileRole.TEACHER) {
        const pendingAdminProfile = pendingProfiles.find((profile) => profile.role === ProfileRole.ADMIN) ?? null;
        if (pendingAdminProfile) {
          const relinkedProfile = await reassignClerkUserLink(recovered.id, pendingAdminProfile, userId, fullName);
          await syncMetadataIfPossible(relinkedProfile.clerkUserId, toAppRole(relinkedProfile.role), relinkedProfile.schoolId);
          return relinkedProfile;
        }
      }
    }

    await syncMetadataIfPossible(
      recovered.clerkUserId,
      toAppRole(recovered.role),
      recovered.schoolId,
    );
    return recovered;
  }

  if (pendingProfiles.length > 0) {
    const selectedPendingProfile =
      preferredProfileId
        ? pendingProfiles.find((profile) => profile.id === preferredProfileId) ?? null
        : pendingProfiles.length === 1
          ? pendingProfiles[0]
          : null;

    if (!selectedPendingProfile) {
      redirect("/onboarding");
    }

    const linkedProfile = await prisma.profile.update({
      where: { id: selectedPendingProfile.id },
      data: {
        clerkUserId: userId,
        fullName,
      },
      include: { school: true },
    });

    await syncMetadataIfPossible(linkedProfile.clerkUserId, toAppRole(linkedProfile.role), linkedProfile.schoolId);
    return linkedProfile;
  }

  let profile: ProfileWithSchool | undefined;
  try {
    const schoolCode = await generateUniqueSchoolCode(fullName);
    profile = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name: `${fullName}'s School`,
          code: schoolCode,
        },
      });

      const createdProfile = await tx.profile.create({
        data: {
          clerkUserId: userId,
          schoolId: school.id,
          role: ProfileRole.ADMIN,
          fullName,
          email: primaryEmail,
        },
        include: { school: true },
      });

      await tx.gradingSetting.create({
        data: {
          schoolId: school.id,
        },
      });

      const onboardingTx = tx as unknown as {
        assessmentTemplate?: {
          create: (args: {
            data: { schoolId: string; name: string; isActive: boolean };
            select: { id: true };
          }) => Promise<{ id: string }>;
        };
        assessmentType?: {
          createMany: (args: {
            data: Array<{ schoolId: string; templateId: string; name: string; weight: number; orderIndex: number }>;
          }) => Promise<unknown>;
        };
      };

      if (onboardingTx.assessmentTemplate && onboardingTx.assessmentType) {
        const template = await onboardingTx.assessmentTemplate.create({
          data: {
            schoolId: school.id,
            name: "Default",
            isActive: true,
          },
          select: { id: true },
        });

        await onboardingTx.assessmentType.createMany({
          data: [
            { schoolId: school.id, templateId: template.id, name: "CA1", weight: 20, orderIndex: 1 },
            { schoolId: school.id, templateId: template.id, name: "CA2", weight: 20, orderIndex: 2 },
            { schoolId: school.id, templateId: template.id, name: "EXAM", weight: 60, orderIndex: 3 },
          ],
        });
      }

      await tx.gradeScale.createMany({
        data: DEFAULT_GRADE_SCALE.map((grade) => ({
          ...grade,
          schoolId: school.id,
        })),
      });

      return createdProfile;
    });
  } catch (error) {
    // Concurrent onboarding requests can race on unique clerk_user_id.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await getCurrentProfile(userId);
      if (existing) {
        await syncMetadataIfPossible(existing.clerkUserId, toAppRole(existing.role), existing.schoolId);
        return existing;
      }
    }
    throw error;
  }

  if (!profile) {
    throw new Error("Profile could not be initialized.");
  }

  await syncMetadataIfPossible(profile.clerkUserId, toAppRole(profile.role), profile.schoolId);
  return profile;
}

export async function requireProfile(): Promise<ProfileWithSchool> {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const profile = await getCurrentProfile(userId);
  if (!profile) {
    redirect("/onboarding");
  }

  const recovered = await recoverAdminIfMissing(profile);

  if (!recovered.isActive) {
    throw new Error("Your account has been deactivated.");
  }

  return recovered;
}

export async function requireRole(role: AppRole): Promise<ProfileWithSchool> {
  const profile = await requireProfile();
  const profileRole = toAppRole(profile.role);

  if (profileRole !== role) {
    redirect(profileRole === "admin" ? "/app/admin/dashboard" : "/app/teacher/dashboard");
  }

  return profile;
}

type TeacherOption = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
};

type TeacherPortalMode = "teacher" | "admin_override" | "admin_as_teacher";

export async function requireTeacherPortalContext(teacherProfileId?: string) {
  const actorProfile = await requireProfile();

  if (actorProfile.role === ProfileRole.TEACHER) {
    return {
      actorProfile,
      effectiveTeacherProfile: actorProfile,
      mode: "teacher" as TeacherPortalMode,
      teacherOptions: [] as TeacherOption[],
    };
  }

  const teacherOptions = await prisma.profile.findMany({
    where: {
      schoolId: actorProfile.schoolId,
      role: ProfileRole.TEACHER,
    },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      isActive: true,
    },
  });

  if (!teacherProfileId) {
    return {
      actorProfile,
      effectiveTeacherProfile: actorProfile,
      mode: "admin_override" as TeacherPortalMode,
      teacherOptions,
    };
  }

  const selectedTeacher = await prisma.profile.findFirst({
    where: {
      id: teacherProfileId,
      schoolId: actorProfile.schoolId,
      role: ProfileRole.TEACHER,
    },
    include: { school: true },
  });

  if (!selectedTeacher) {
    throw new Error("Selected teacher does not exist in this school.");
  }

  return {
    actorProfile,
    effectiveTeacherProfile: selectedTeacher,
    mode: "admin_as_teacher" as TeacherPortalMode,
    teacherOptions,
  };
}
