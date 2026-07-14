"use server";

import { SchoolStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export async function updateSchoolStatusAction(formData: FormData) {
  const context = await requirePlatformAdmin();
  const schoolId = String(formData.get("schoolId") ?? "");
  const requestedStatus = String(formData.get("status") ?? "");
  if (!schoolId || !Object.values(SchoolStatus).includes(requestedStatus as SchoolStatus)) redirect("/platform/schools?error=Invalid%20school%20status.");

  const status = requestedStatus as SchoolStatus;
  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } });
  if (!school) redirect("/platform/schools?error=School%20not%20found.");
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
  revalidatePath("/platform");
  revalidatePath("/platform/schools");
  revalidatePath(`/platform/schools/${schoolId}`);
  redirect(`/platform/schools/${schoolId}?updated=1`);
}
