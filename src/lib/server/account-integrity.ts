import "server-only";

import { ProfileRole } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";

const schoolCountSelect = {
  profiles: true,
  classes: true,
  terms: true,
  students: true,
  subjects: true,
  classSubjects: true,
  enrollments: true,
  teacherClassAssignments: true,
  promotionPolicies: true,
  promotionPolicySubjects: true,
  conductSections: true,
  conductCategories: true,
  scores: true,
  studentConducts: true,
  studentAttendances: true,
  studentComments: true,
  studentSubjectExemptions: true,
  scoreAssessmentValues: true,
  resultPublications: true,
  feeItemCatalogs: true,
  feeSchedules: true,
  feeScheduleItems: true,
  invoices: true,
  invoiceLineItems: true,
  payments: true,
  ledgerEntries: true,
  auditLogs: true,
  notifications: true,
} as const;

const operationalCountKeys = Object.keys(schoolCountSelect).filter((key) => key !== "profiles");

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function generatedSchoolName(email: string) {
  return `${email.split("@")[0]}'s school`;
}

function hasOperationalData(counts: Record<string, number>) {
  return operationalCountKeys.some((key) => Number(counts[key] ?? 0) > 0);
}

export async function scanAccountIntegrity() {
  const allProfiles = await prisma.profile.findMany({
    include: {
      _count: {
        select: {
          teacherClassAssignments: true,
          scores: true,
          studentConducts: true,
          receivedNotifications: true,
          sentNotifications: true,
        },
      },
      school: {
        include: { _count: { select: schoolCountSelect } },
      },
    },
  });

  const profilesByEmail = new Map<string, typeof allProfiles>();
  for (const profile of allProfiles) {
    const key = normalize(profile.email);
    profilesByEmail.set(key, [...(profilesByEmail.get(key) ?? []), profile]);
  }

  const removableGeneratedSchools: Array<{
    email: string;
    profileId: string;
    schoolId: string;
    schoolName: string;
    teacherSchools: Array<{ id: string; name: string }>;
  }> = [];
  const protectedCrossRole: Array<{
    email: string;
    profileId: string;
    schoolId: string;
    schoolName: string;
    teacherSchools: Array<{ id: string; name: string }>;
    reasons: string[];
  }> = [];

  for (const [email, profiles] of profilesByEmail) {
    const activeTeacherProfiles = profiles.filter(
      (profile) => profile.role === ProfileRole.TEACHER && profile.isActive,
    );
    if (!activeTeacherProfiles.length) continue;

    for (const profile of profiles) {
      if (profile.role !== ProfileRole.ADMIN) continue;
      const school = profile.school;
      const teacherSchools = activeTeacherProfiles
        .filter((teacher) => teacher.schoolId !== school.id)
        .map((teacher) => ({ id: teacher.school.id, name: teacher.school.name }));
      if (!teacherSchools.length) continue;

      const looksGenerated = normalize(school.name) === generatedSchoolName(email);
      const onlyProfile = school._count.profiles === 1;
      const empty = !hasOperationalData(school._count);
      const summary = {
        email,
        profileId: profile.id,
        schoolId: school.id,
        schoolName: school.name,
        teacherSchools,
      };

      if (looksGenerated && onlyProfile && empty) {
        removableGeneratedSchools.push(summary);
      } else {
        protectedCrossRole.push({
          ...summary,
          reasons: [
            !looksGenerated && "School name was not automatically generated",
            !onlyProfile && "School contains additional user profiles",
            !empty && "School contains operational records",
          ].filter((reason): reason is string => Boolean(reason)),
        });
      }
    }
  }

  const teacherProfiles = allProfiles.filter((profile) => profile.role === ProfileRole.TEACHER);
  const teacherGroups = new Map<string, typeof teacherProfiles>();
  for (const profile of teacherProfiles) {
    const key = `${profile.schoolId}:${normalize(profile.email)}`;
    teacherGroups.set(key, [...(teacherGroups.get(key) ?? []), profile]);
  }

  const duplicateTeacherGroups = [...teacherGroups.values()]
    .filter((profiles) => profiles.length > 1)
    .map((profiles) => ({
      schoolId: profiles[0].schoolId,
      schoolName: profiles[0].school.name,
      email: normalize(profiles[0].email),
      profiles: profiles.map((profile) => ({
        id: profile.id,
        name: profile.fullName,
        linked: Boolean(profile.credentialId),
        active: profile.isActive,
        dependencies:
          profile._count.teacherClassAssignments +
          profile._count.scores +
          profile._count.studentConducts +
          profile._count.receivedNotifications +
          profile._count.sentNotifications,
      })),
    }));

  return { removableGeneratedSchools, protectedCrossRole, duplicateTeacherGroups };
}

export async function verifyRemovableGeneratedSchool(schoolId: string, profileId: string) {
  const report = await scanAccountIntegrity();
  return report.removableGeneratedSchools.find(
    (candidate) => candidate.schoolId === schoolId && candidate.profileId === profileId,
  );
}

export { schoolCountSelect };
