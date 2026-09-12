"use server";

import { SchoolStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/server/auth";
import { schoolCountSelect, verifyRemovableGeneratedSchool } from "@/lib/server/account-integrity";
import { prisma } from "@/lib/server/prisma";

export async function updateSchoolStatusAction(formData: FormData) {
  const context = await requirePlatformAdmin();
  const schoolId = String(formData.get("schoolId") ?? "");
  const requestedStatus = String(formData.get("status") ?? "");
  if (!schoolId || !Object.values(SchoolStatus).includes(requestedStatus as SchoolStatus)) redirect("/dataroom/schools?error=Invalid%20school%20status.");

  const status = requestedStatus as SchoolStatus;
  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } });
  if (!school) redirect("/dataroom/schools?error=School%20not%20found.");
  await prisma.$transaction([
    prisma.school.update({ where: { id: schoolId }, data: { status } }),
    prisma.auditLog.create({
      data: {
        schoolId,
        userId: context.activeProfile?.id,
        action: "platform.school_status_updated",
        entityType: "School",
        entityId: schoolId,
        metaJson: { status, schoolName: school.name, platformAdminEmail: context.email },
      },
    }),
  ]);
  revalidatePath("/dataroom");
  revalidatePath("/dataroom/schools");
  revalidatePath(`/dataroom/schools/${schoolId}`);
  redirect(`/dataroom/schools/${schoolId}?updated=1`);
}

export async function removeEmptyGeneratedSchoolAction(formData: FormData) {
  const context = await requirePlatformAdmin();
  const schoolId = String(formData.get("schoolId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  if (!schoolId || !profileId) redirect("/dataroom/integrity?status=error&message=Invalid%20cleanup%20request.");

  const auditedCandidate = await verifyRemovableGeneratedSchool(schoolId, profileId);
  if (!auditedCandidate) {
    redirect("/dataroom/integrity?status=error&message=This%20workspace%20is%20not%20safe%20to%20remove.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const school = await tx.school.findUnique({
        where: { id: schoolId },
        include: { _count: { select: schoolCountSelect } },
      });
      const generatedProfile = await tx.profile.findFirst({
        where: { id: profileId, schoolId, role: "ADMIN" },
        select: { id: true, email: true },
      });
      if (!school || !generatedProfile || school._count.profiles !== 1) {
        throw new Error("The workspace changed after review, so cleanup was stopped.");
      }

      const expectedName = `${generatedProfile.email.trim().toLowerCase().split("@")[0]}'s school`;
      const operationalData = Object.entries(school._count).some(
        ([key, count]) => key !== "profiles" && Number(count) > 0,
      );
      const teacherElsewhere = await tx.profile.findFirst({
        where: {
          schoolId: { not: schoolId },
          email: { equals: generatedProfile.email, mode: "insensitive" },
          role: "TEACHER",
          isActive: true,
        },
        select: { schoolId: true },
      });
      if (school.name.trim().toLowerCase() !== expectedName || operationalData || !teacherElsewhere) {
        throw new Error("The workspace no longer meets the guarded cleanup rules.");
      }

      await tx.authSession.updateMany({ where: { profileId }, data: { profileId: null } });
      await tx.assessmentType.deleteMany({ where: { schoolId } });
      await tx.assessmentTemplate.deleteMany({ where: { schoolId } });
      await tx.gradeScale.deleteMany({ where: { schoolId } });
      await tx.gradingSetting.deleteMany({ where: { schoolId } });
      await tx.profile.delete({ where: { id: profileId } });
      await tx.school.delete({ where: { id: schoolId } });
      await tx.auditLog.create({
        data: {
          schoolId: teacherElsewhere.schoolId,
          userId: context.activeProfile?.id,
          action: "platform.empty_generated_school_removed",
          entityType: "School",
          entityId: schoolId,
          metaJson: {
            removedSchoolName: school.name,
            accountEmail: generatedProfile.email,
            platformAdminEmail: context.email,
          },
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove this workspace.";
    redirect(`/dataroom/integrity?status=error&message=${encodeURIComponent(message)}`);
  }

  revalidatePath("/dataroom");
  revalidatePath("/dataroom/schools");
  revalidatePath("/dataroom/users");
  revalidatePath("/dataroom/audit");
  revalidatePath("/dataroom/integrity");
  redirect("/dataroom/integrity?status=success&message=Empty%20generated%20workspace%20removed%20safely.");
}
