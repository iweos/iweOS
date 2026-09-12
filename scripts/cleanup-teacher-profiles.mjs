import { PrismaClient, ProfileRole } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

const operationalCounts = [
  "classes",
  "terms",
  "students",
  "subjects",
  "classSubjects",
  "enrollments",
  "teacherClassAssignments",
  "promotionPolicies",
  "promotionPolicySubjects",
  "conductSections",
  "conductCategories",
  "scores",
  "studentConducts",
  "studentAttendances",
  "studentComments",
  "studentSubjectExemptions",
  "scoreAssessmentValues",
  "resultPublications",
  "feeItemCatalogs",
  "feeSchedules",
  "feeScheduleItems",
  "invoices",
  "invoiceLineItems",
  "payments",
  "ledgerEntries",
  "auditLogs",
  "notifications",
];

function normalize(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function generatedSchoolName(email) {
  return `${email.split("@")[0]}'s school`;
}

function maskEmail(email) {
  const [local, domain = ""] = email.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}

function hasOperationalData(counts) {
  return operationalCounts.some((key) => Number(counts[key] ?? 0) > 0);
}

async function inspect() {
  const allProfiles = await prisma.profile.findMany({
    include: {
      school: {
        include: {
          _count: {
            select: Object.fromEntries(["profiles", ...operationalCounts].map((key) => [key, true])),
          },
        },
      },
    },
  });

  const removable = [];
  const protectedCrossRole = [];

  const profilesByEmail = new Map();
  for (const profile of allProfiles) {
    const key = normalize(profile.email);
    profilesByEmail.set(key, [...(profilesByEmail.get(key) ?? []), profile]);
  }

  for (const [email, profiles] of profilesByEmail) {
    const activeTeacherProfiles = profiles.filter(
      (profile) => profile.role === ProfileRole.TEACHER && profile.isActive,
    );
    if (activeTeacherProfiles.length === 0) continue;

    for (const profile of profiles) {
      if (profile.role !== ProfileRole.ADMIN) continue;
      const school = profile.school;
      const looksGenerated = normalize(school.name) === generatedSchoolName(email);
      const onlyProfile = school._count.profiles === 1;
      const empty = !hasOperationalData(school._count);
      const teacherElsewhere = activeTeacherProfiles.some((teacher) => teacher.schoolId !== school.id);

      const summary = {
        credentialId: profile.credentialId,
        email: maskEmail(email),
        profileId: profile.id,
        schoolId: school.id,
        schoolName: school.name,
        teacherSchools: activeTeacherProfiles.filter((teacher) => teacher.schoolId !== school.id).map((teacher) => teacher.school.name),
      };

      if (looksGenerated && onlyProfile && empty && teacherElsewhere) removable.push(summary);
      else if (teacherElsewhere) {
        protectedCrossRole.push({
          ...summary,
          reasons: [
            !looksGenerated && "school name was not automatically generated",
            !onlyProfile && "school has additional profiles",
            !empty && "school contains operational records",
          ].filter(Boolean),
        });
      }
    }
  }

  const teacherProfiles = await prisma.profile.findMany({
    where: { role: ProfileRole.TEACHER },
    select: {
      id: true,
      schoolId: true,
      email: true,
      fullName: true,
      credentialId: true,
      school: { select: { name: true } },
      _count: { select: { teacherClassAssignments: true, scores: true, studentConducts: true, receivedNotifications: true, sentNotifications: true } },
    },
  });
  const groups = new Map();
  for (const profile of teacherProfiles) {
    const key = `${profile.schoolId}:${normalize(profile.email)}`;
    groups.set(key, [...(groups.get(key) ?? []), profile]);
  }
  const duplicateTeachers = [...groups.values()]
    .filter((profiles) => profiles.length > 1)
    .map((profiles) => ({
      school: profiles[0].school.name,
      email: maskEmail(profiles[0].email),
      profiles: profiles.map((profile) => ({
        id: profile.id,
        name: profile.fullName,
        linked: Boolean(profile.credentialId),
        dependencies: profile._count,
      })),
      action: "manual review required; academic dependencies are never merged automatically",
    }));

  return { removable, protectedCrossRole, duplicateTeachers };
}

async function removeGeneratedSchool(candidate) {
  await prisma.$transaction(async (tx) => {
    const school = await tx.school.findUnique({
      where: { id: candidate.schoolId },
      include: { _count: { select: Object.fromEntries(["profiles", ...operationalCounts].map((key) => [key, true])) } },
    });
    if (!school || school._count.profiles !== 1 || hasOperationalData(school._count)) {
      throw new Error(`School ${candidate.schoolId} changed after the audit; cleanup stopped.`);
    }

    await tx.authSession.updateMany({ where: { profileId: candidate.profileId }, data: { profileId: null } });
    await tx.assessmentType.deleteMany({ where: { schoolId: candidate.schoolId } });
    await tx.assessmentTemplate.deleteMany({ where: { schoolId: candidate.schoolId } });
    await tx.gradeScale.deleteMany({ where: { schoolId: candidate.schoolId } });
    await tx.gradingSetting.deleteMany({ where: { schoolId: candidate.schoolId } });
    await tx.profile.delete({ where: { id: candidate.profileId } });
    await tx.school.delete({ where: { id: candidate.schoolId } });
  });
}

try {
  const report = await inspect();
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", ...report }, null, 2));
  if (apply) {
    for (const candidate of report.removable) await removeGeneratedSchool(candidate);
    console.log(`Removed ${report.removable.length} empty auto-generated school workspace(s).`);
  } else {
    console.log("Dry run only. Re-run with --apply after reviewing the report.");
  }
} finally {
  await prisma.$disconnect();
}
