"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireDataroomAccess } from "@/lib/server/dataroom-access";
import { platformAdminEmailAllowed } from "@/lib/server/platform-owner";
import { prisma } from "@/lib/server/prisma";

export async function updateSchoolRecord(form: FormData): Promise<{ error?: string }> {
  // School-status operators must not gain staff administration through this editor.
  const actor = await requireDataroomAccess("manageAccess");
  const schoolId = String(form.get("schoolId") ?? "");
  const id = String(form.get("id") ?? "");
  const kind = String(form.get("kind") ?? "");
  if (!z.string().uuid().safeParse(schoolId).success || !z.string().uuid().safeParse(id).success) return { error: "Invalid school or record." };
  try {
    await prisma.$transaction(async tx => {
      if (kind === "user") {
        const target = await tx.profile.findFirst({ where: { id, schoolId }, include: { authCredential: { select: { platformRole: true } } } });
        if (!target) throw new Error("Member not found in this school.");
        if (target.credentialId === actor.credentialId || target.authCredential?.platformRole || platformAdminEmailAllowed(target.email)) throw new Error("Your own membership and protected owners cannot be edited here.");
        const data = z.object({ fullName: z.string().trim().min(2).max(120), role: z.enum(["ADMIN", "TEACHER"]), isActive: z.enum(["active", "inactive"]) }).parse(Object.fromEntries(form));
        // Serialize administrator changes to prevent concurrent removal of the last admin.
        await tx.$queryRaw`SELECT id FROM schools WHERE id = ${schoolId}::uuid FOR UPDATE`;
        if (target.role === "ADMIN" && target.isActive && (data.role !== "ADMIN" || data.isActive !== "active") && await tx.profile.count({ where: { schoolId, role: "ADMIN", isActive: true } }) <= 1) throw new Error("Keep at least one active school administrator.");
        await tx.profile.update({ where: { id }, data: { fullName: data.fullName, role: data.role, isActive: data.isActive === "active" } });
      } else if (kind === "student") {
        const data = z.object({ status: z.enum(["active", "inactive", "graduated", "suspended", "withdrawn"]) }).parse(Object.fromEntries(form));
        const result = await tx.student.updateMany({ where: { id, schoolId }, data: { status: data.status } });
        if (result.count !== 1) throw new Error("Student not found in this school.");
      } else if (kind === "school") {
        if (id !== schoolId) throw new Error("School mismatch.");
        const data = z.object({ name: z.string().trim().min(2).max(200), phone: z.string().trim().max(80), addressLine1: z.string().trim().max(200) }).parse(Object.fromEntries(form));
        await tx.school.update({ where: { id: schoolId }, data });
      } else throw new Error("Unsupported change.");
      await tx.auditLog.create({ data: { schoolId, action: `platform.${kind}_updated`, entityType: kind, entityId: id, metaJson: { actorEmail: actor.email, fields: [...form.keys()].filter(key => !["id", "schoolId", "kind"].includes(key)) } } });
    });
  } catch (error) { return { error: error instanceof z.ZodError ? "Check the required fields and try again." : error instanceof Error && !error.message.includes("prisma") ? error.message : "Could not update this record." }; }
  revalidatePath(`/dataroom/schools/${schoolId}`);
  revalidatePath("/app", "layout");
  return {};
}
