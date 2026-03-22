"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { Prisma, ProfileRole, ResultPublicationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/server/auth";
import { isPrismaSchemaMismatchError, schemaSyncMessage } from "@/lib/server/prisma-errors";
import { prisma } from "@/lib/server/prisma";
import { evaluatePromotionCandidates, mapStoredPromotionPolicy, resolvePromotionPolicy } from "@/lib/server/promotion";
import { buildResultPublicationPayload } from "@/lib/server/results";
import { storeUploadedImage } from "@/lib/server/uploads";
import {
  assessmentTemplateActivateSchema,
  assessmentTemplateSchema,
  assessmentTypeSchema,
  classSchema,
  classSubjectBatchSchema,
  classSubjectAssignmentSchema,
  conductCategorySchema,
  conductSectionSchema,
  enrollmentBulkSchema,
  enrollmentSchema,
  gradeScaleSchema,
  promotionPolicySchema,
  promotionPolicySelectionSchema,
  resultPublicationSchema,
  schoolSchema,
  sessionBundleSchema,
  studentBulkSchema,
  studentSchema,
  studentUpdateSchema,
  subjectSchema,
  teacherAssignmentSchema,
  teacherSchema,
  termAssessmentTemplateSchema,
  promotionActionSchema,
  termSchema,
} from "@/lib/validation/schemas";

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function resolveUploadedImage(
  formData: FormData,
  options: {
    fileKey: string;
    valueKey: string;
    currentValue?: string;
    folder: string[];
    fileStem: string;
  },
) {
  const uploadedFile = formData.get(options.fileKey);
  if (uploadedFile instanceof File && uploadedFile.size > 0) {
    return storeUploadedImage({
      file: uploadedFile,
      folder: options.folder,
      fileStem: options.fileStem,
    });
  }

  const directValue = formValue(formData, options.valueKey);
  if (directValue) {
    return directValue;
  }

  return options.currentValue ?? "";
}

function redirectSubjectsStatus(status: "success" | "error", message: string): never {
  const query = new URLSearchParams({
    status,
    message,
  });
  redirect(`/app/admin/subjects?${query.toString()}`);
}

function redirectEnrollmentsStatus(status: "success" | "error", message: string): never {
  const query = new URLSearchParams({
    status,
    message,
  });
  redirect(`/app/admin/assignments/enrollments?${query.toString()}`);
}

function redirectPromotionStatus(
  status: "success" | "error",
  message: string,
  options?: {
    sessionLabel?: string;
    sourceClassId?: string;
    targetSessionLabel?: string;
    targetClassId?: string;
  },
): never {
  const query = new URLSearchParams({
    status,
    message,
  });

  if (options?.sessionLabel) {
    query.set("sessionLabel", options.sessionLabel);
  }
  if (options?.sourceClassId) {
    query.set("sourceClassId", options.sourceClassId);
  }
  if (options?.targetSessionLabel) {
    query.set("targetSessionLabel", options.targetSessionLabel);
  }
  if (options?.targetClassId) {
    query.set("targetClassId", options.targetClassId);
  }

  redirect(`/app/admin/grading/promotion?${query.toString()}`);
}

function redirectPromotionRulesStatus(status: "success" | "error", message: string, options?: { ruleId?: string }): never {
  const query = new URLSearchParams({
    status,
    message,
  });
  if (options?.ruleId) {
    query.set("ruleId", options.ruleId);
  }
  redirect(`/app/admin/settings/promotion-rules?${query.toString()}`);
}

function redirectResultsStatus(
  status: "success" | "error",
  message: string,
  options?: {
    termId?: string;
    classId?: string;
    studentId?: string;
  },
): never {
  const query = new URLSearchParams({
    status,
    message,
  });

  if (options?.termId) {
    query.set("termId", options.termId);
  }
  if (options?.classId) {
    query.set("classId", options.classId);
  }
  if (options?.studentId) {
    query.set("studentId", options.studentId);
  }

  redirect(`/app/admin/grading/results?${query.toString()}`);
}

function redirectTeachersStatus(status: "success" | "error", message: string, options?: { editTeacherId?: string }): never {
  const query = new URLSearchParams({
    status,
    message,
  });

  if (options?.editTeacherId) {
    query.set("editTeacherId", options.editTeacherId);
  }

  redirect(`/app/admin/teachers?${query.toString()}`);
}

function revalidateAdminPages() {
  revalidatePath("/app/admin/dashboard");
  revalidatePath("/app/admin/settings");
  revalidatePath("/app/admin/settings/promotion-rules");
  revalidatePath("/app/admin/school");
  revalidatePath("/app/admin/teachers");
  revalidatePath("/app/admin/classes");
  revalidatePath("/app/admin/students");
  revalidatePath("/app/admin/students/add");
  revalidatePath("/app/admin/students/manage");
  revalidatePath("/app/admin/subjects");
  revalidatePath("/app/admin/terms");
  revalidatePath("/app/admin/assignments");
  revalidatePath("/app/admin/assignments/teacher-classes");
  revalidatePath("/app/admin/assignments/class-subjects");
  revalidatePath("/app/admin/assignments/enrollments");
  revalidatePath("/app/admin/grading");
  revalidatePath("/app/admin/grading/assessment-types");
  revalidatePath("/app/admin/grading/grade-entry");
  revalidatePath("/app/admin/grading/conduct");
  revalidatePath("/app/admin/grading/grades");
  revalidatePath("/app/admin/grading/promotion");
  revalidatePath("/app/admin/grading/results");
  revalidatePath("/app/admin/grading/results/print");
  revalidatePath("/app/print/results");
  revalidatePath("/app/admin/grading-settings");
  revalidatePath("/app/admin/payments");
  revalidatePath("/app/admin/payments/invoices");
  revalidatePath("/app/admin/payments/transactions");
  revalidatePath("/app/admin/payments/reconciliation");
  revalidatePath("/app/admin/payments/imports");
  revalidatePath("/app/admin/payments/reports");
  revalidatePath("/app/admin/payments/settings");
  revalidatePath("/pay");
  revalidatePath("/app/teacher/dashboard");
  revalidatePath("/app/teacher/conduct");
  revalidatePath("/app/teacher/grade-entry");
  revalidatePath("/app/teacher/results");
  revalidatePath("/results");
}

async function syncRoleMetadata(clerkUserId: string | null, role: ProfileRole, schoolId: string) {
  if (!clerkUserId) {
    return;
  }

  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        role: role === ProfileRole.ADMIN ? "admin" : "teacher",
        schoolId,
      },
    });
  } catch {
    // Metadata sync failures should not block DB role updates.
  }
}

function toStudentPaymentId(schoolCode: string, studentCode: string) {
  return `${schoolCode}-${studentCode}`.toUpperCase();
}

function isLegacyStudentSchemaError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientValidationError &&
    /Unknown argument `(firstName|lastName|address|guardianName|guardianPhone)`/.test(error.message)
  );
}

function studentSchemaSyncError() {
  return new Error(schemaSyncMessage("Student"));
}

function assessmentSchemaSyncError() {
  return new Error(schemaSyncMessage("Assessment type"));
}

function conductSchemaSyncError() {
  return new Error(schemaSyncMessage("Conduct"));
}

const TERM_BUNDLE_LABELS = {
  three_terms: ["First Term", "Second Term", "Third Term"],
  two_semesters: ["1st Semester", "2nd Semester"],
} as const;

async function clonePresetTemplateToTermSnapshot(
  tx: Prisma.TransactionClient,
  {
    schoolId,
    termId,
    presetTemplateId,
  }: {
    schoolId: string;
    termId: string;
    presetTemplateId: string;
  },
) {
  const [term, presetTemplate, existingSnapshot] = await Promise.all([
    tx.term.findFirst({
      where: {
        id: termId,
        schoolId,
      },
      select: {
        id: true,
        sessionLabel: true,
        termLabel: true,
      },
    }),
    tx.assessmentTemplate.findFirst({
      where: {
        id: presetTemplateId,
        schoolId,
        isPreset: true,
      },
      include: {
        types: {
          orderBy: { orderIndex: "asc" },
        },
      },
    }),
    tx.assessmentTemplate.findFirst({
      where: {
        schoolId,
        termId,
        isPreset: false,
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!term) {
    throw new Error("Term not found.");
  }

  if (!presetTemplate) {
    throw new Error("Assessment preset not found.");
  }

  if (presetTemplate.types.length === 0) {
    throw new Error("Selected assessment preset has no assessment items.");
  }

  if (existingSnapshot) {
    const usedInScores = await tx.scoreAssessmentValue.findFirst({
      where: {
        schoolId,
        assessmentType: {
          templateId: existingSnapshot.id,
        },
      },
      select: { id: true },
    });

    if (usedInScores) {
      throw new Error("This term already has saved score records, so its assessment structure can no longer be changed.");
    }

    await tx.assessmentTemplate.delete({
      where: { id: existingSnapshot.id },
    });
  }

  const snapshotTemplate = await tx.assessmentTemplate.create({
    data: {
      schoolId,
      termId: term.id,
      sourceTemplateId: presetTemplate.id,
      name: `${term.sessionLabel} ${term.termLabel} - ${presetTemplate.name}`,
      isPreset: false,
      isActive: false,
    },
    select: {
      id: true,
    },
  });

  await tx.assessmentType.createMany({
    data: presetTemplate.types.map((type) => ({
      schoolId,
      templateId: snapshotTemplate.id,
      name: type.name,
      weight: type.weight,
      orderIndex: type.orderIndex,
      isActive: type.isActive,
    })),
  });

  return snapshotTemplate.id;
}

function parseCustomSessionLabels(raw: string) {
  return raw
    .split(/\r?\n|,/g)
    .map((label) => label.trim())
    .filter(Boolean);
}

function schoolNameToken(schoolName: string) {
  const cleanedWords = schoolName
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .split(/\s+/g)
    .filter(Boolean);

  if (cleanedWords.length >= 2) {
    return cleanedWords
      .slice(0, 4)
      .map((word) => word[0])
      .join("");
  }

  const single = cleanedWords[0] ?? "SCH";
  return single.slice(0, 4);
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === "\"") {
      if (inQuotes && line[i + 1] === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function hasStudentHeader(parts: string[]) {
  if (parts.length < 2) {
    return false;
  }

  const first = (parts[0] ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const second = (parts[1] ?? "").toLowerCase().replace(/[^a-z]/g, "");
  return first.includes("firstname") && second.includes("lastname");
}

function parseStudentGender(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return "";
  }
  if (normalized === "male" || normalized === "m") {
    return "male";
  }
  if (normalized === "female" || normalized === "f") {
    return "female";
  }
  return null;
}

export async function updateSchoolAction(formData: FormData) {
  const profile = await requireRole("admin");
  const resolvedLogoUrl = await resolveUploadedImage(formData, {
    fileKey: "logoFile",
    valueKey: "logoUrl",
    currentValue: formValue(formData, "currentLogoUrl"),
    folder: ["schools", profile.schoolId],
    fileStem: "school-logo",
  });

  const parsed = schoolSchema.safeParse({
    name: formValue(formData, "name"),
    code: formValue(formData, "code") || undefined,
    country: formValue(formData, "country"),
    logoUrl: resolvedLogoUrl,
    addressLine1: formValue(formData, "addressLine1"),
    addressLine2: formValue(formData, "addressLine2"),
    city: formValue(formData, "city"),
    state: formValue(formData, "state"),
    postalCode: formValue(formData, "postalCode"),
    phone: formValue(formData, "phone"),
    website: formValue(formData, "website"),
    resultTemplate: formValue(formData, "resultTemplate") || "classic_report",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid school payload.");
  }

  if (parsed.data.code) {
    const codeTaken = await prisma.school.findFirst({
      where: {
        code: { equals: parsed.data.code, mode: "insensitive" },
        id: { not: profile.schoolId },
      },
      select: { id: true },
    });

    if (codeTaken) {
      throw new Error("School code is already in use.");
    }
  }

  await prisma.$transaction([
    prisma.school.update({
      where: { id: profile.schoolId },
      data: {
        name: parsed.data.name,
        code: parsed.data.code?.toUpperCase(),
        country: parsed.data.country || null,
        logoUrl: parsed.data.logoUrl || null,
        addressLine1: parsed.data.addressLine1 || null,
        addressLine2: parsed.data.addressLine2 || null,
        city: parsed.data.city || null,
        state: parsed.data.state || null,
        postalCode: parsed.data.postalCode || null,
        phone: parsed.data.phone || null,
        website: parsed.data.website || null,
      },
    }),
    prisma.gradingSetting.upsert({
      where: { schoolId: profile.schoolId },
      create: {
        schoolId: profile.schoolId,
        resultTemplate: parsed.data.resultTemplate,
      },
      update: {
        resultTemplate: parsed.data.resultTemplate,
      },
    }),
  ]);

  revalidateAdminPages();
}

export async function addTeacherAction(formData: FormData) {
  const profile = await requireRole("admin");

  const parsed = teacherSchema.safeParse({
    fullName: formValue(formData, "fullName"),
    email: formValue(formData, "email").toLowerCase(),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid teacher payload.");
  }

  const existing = await prisma.profile.findFirst({
    where: {
      schoolId: profile.schoolId,
      email: { equals: parsed.data.email, mode: "insensitive" },
    },
  });

  if (existing) {
    if (existing.role === ProfileRole.ADMIN) {
      throw new Error("This email belongs to an admin account and cannot be converted to teacher.");
    }

    await prisma.profile.update({
      where: { id: existing.id },
      data: {
        fullName: parsed.data.fullName,
        role: ProfileRole.TEACHER,
        isActive: true,
      },
    });
  } else {
    await prisma.profile.create({
      data: {
        schoolId: profile.schoolId,
        role: ProfileRole.TEACHER,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
      },
    });
  }

  revalidateAdminPages();
}

export async function updateTeacherAction(formData: FormData) {
  const actor = await requireRole("admin");
  const teacherId = formValue(formData, "teacherId");

  const parsed = teacherSchema.safeParse({
    fullName: formValue(formData, "fullName"),
    email: formValue(formData, "email").toLowerCase(),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid teacher payload.");
  }

  const teacher = await prisma.profile.findFirst({
    where: {
      id: teacherId,
      schoolId: actor.schoolId,
      role: ProfileRole.TEACHER,
    },
  });

  if (!teacher) {
    throw new Error("Teacher not found.");
  }

  const emailTaken = await prisma.profile.findFirst({
    where: {
      schoolId: actor.schoolId,
      id: { not: teacher.id },
      email: { equals: parsed.data.email, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (emailTaken) {
    throw new Error("Another profile in this school already uses that email.");
  }

  await prisma.profile.update({
    where: { id: teacher.id },
    data: {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
    },
  });

  revalidateAdminPages();
}

export async function toggleTeacherStatusAction(formData: FormData) {
  const profile = await requireRole("admin");
  const teacherId = formValue(formData, "teacherId");

  const teacher = await prisma.profile.findFirst({
    where: {
      id: teacherId,
      schoolId: profile.schoolId,
      role: ProfileRole.TEACHER,
    },
  });

  if (!teacher) {
    throw new Error("Teacher not found.");
  }

  await prisma.profile.update({
    where: { id: teacher.id },
    data: { isActive: !teacher.isActive },
  });

  revalidateAdminPages();
}

export async function deleteTeacherAction(formData: FormData) {
  const actor = await requireRole("admin");
  const teacherId = formValue(formData, "teacherId");

  const teacher = await prisma.profile.findFirst({
    where: {
      id: teacherId,
      schoolId: actor.schoolId,
      role: ProfileRole.TEACHER,
    },
  });

  if (!teacher) {
    throw new Error("Teacher not found.");
  }

  const [assignmentCount, scoreCount] = await Promise.all([
    prisma.teacherClassAssignment.count({
      where: {
        schoolId: actor.schoolId,
        teacherProfileId: teacher.id,
      },
    }),
    prisma.score.count({
      where: {
        schoolId: actor.schoolId,
        teacherProfileId: teacher.id,
      },
    }),
  ]);

  if (assignmentCount > 0 || scoreCount > 0) {
    throw new Error("Cannot delete teacher with existing assignments or score records. Deactivate instead.");
  }

  await prisma.profile.delete({
    where: { id: teacher.id },
  });

  revalidateAdminPages();
}

export async function manualLinkTeacherAccountAction(formData: FormData) {
  const actor = await requireRole("admin");
  const teacherId = formValue(formData, "teacherId");
  try {
    const teacher = await prisma.profile.findFirst({
      where: {
        id: teacherId,
        schoolId: actor.schoolId,
        role: ProfileRole.TEACHER,
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found.");
    }

    const normalizedEmail = teacher.email.trim().toLowerCase();
    const client = await clerkClient();
    const users = await client.users.getUserList({
      emailAddress: [normalizedEmail],
      limit: 10,
    });

    const clerkUser = users.data.find((user) =>
      user.emailAddresses.some((entry) => entry.emailAddress.trim().toLowerCase() === normalizedEmail),
    );

    if (!clerkUser) {
      throw new Error("No signed-up account found for this email yet.");
    }

    const existingLink = await prisma.profile.findUnique({
      where: { clerkUserId: clerkUser.id },
      select: { id: true, schoolId: true, email: true },
    });

    let updated: {
      clerkUserId: string | null;
      role: ProfileRole;
      schoolId: string;
      fullName: string;
    };

    if (existingLink && existingLink.id !== teacher.id) {
      if (existingLink.schoolId !== actor.schoolId) {
        throw new Error("This account is already linked to another school profile.");
      }

      if (existingLink.email.trim().toLowerCase() !== normalizedEmail) {
        throw new Error(`This account is already linked to ${existingLink.email} in this school.`);
      }

      updated = await prisma.$transaction(async (tx) => {
        await tx.profile.update({
          where: { id: existingLink.id },
          data: { clerkUserId: null },
        });

        return tx.profile.update({
          where: { id: teacher.id },
          data: {
            clerkUserId: clerkUser.id,
            isActive: true,
          },
        });
      });
    } else {
      updated = await prisma.profile.update({
        where: { id: teacher.id },
        data: {
          clerkUserId: clerkUser.id,
          isActive: true,
        },
      });
    }

    await syncRoleMetadata(updated.clerkUserId, updated.role, updated.schoolId);
    revalidateAdminPages();
    redirectTeachersStatus("success", `${updated.fullName} has been linked successfully.`, { editTeacherId: teacherId });
  } catch (error) {
    redirectTeachersStatus(
      "error",
      error instanceof Error ? error.message : "Unable to link this teacher account right now.",
      { editTeacherId: teacherId },
    );
  }
}

export async function setProfileRoleAction(formData: FormData) {
  const actor = await requireRole("admin");
  const profileId = formValue(formData, "profileId");
  const targetRoleRaw = formValue(formData, "targetRole").toLowerCase();

  const targetRole =
    targetRoleRaw === "admin"
      ? ProfileRole.ADMIN
      : targetRoleRaw === "teacher"
        ? ProfileRole.TEACHER
        : null;

  if (!targetRole) {
    throw new Error("Invalid target role.");
  }

  const target = await prisma.profile.findFirst({
    where: {
      id: profileId,
      schoolId: actor.schoolId,
    },
  });

  if (!target) {
    throw new Error("User not found.");
  }

  if (target.role === targetRole) {
    return;
  }

  if (target.role === ProfileRole.ADMIN && targetRole === ProfileRole.TEACHER) {
    if (target.id === actor.id) {
      throw new Error("You cannot remove your own admin privileges from this page.");
    }

    const otherAdmins = await prisma.profile.count({
      where: {
        schoolId: actor.schoolId,
        role: ProfileRole.ADMIN,
        id: { not: target.id },
      },
    });

    if (otherAdmins === 0) {
      throw new Error("At least one admin must remain.");
    }
  }

  const updated = await prisma.profile.update({
    where: { id: target.id },
    data: { role: targetRole },
  });

  await syncRoleMetadata(updated.clerkUserId, updated.role, updated.schoolId);
  revalidateAdminPages();
}

export async function createClassAction(formData: FormData) {
  const profile = await requireRole("admin");
  const parsed = classSchema.safeParse({ name: formValue(formData, "name") });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid class payload.");
  }

  await prisma.class.create({
    data: {
      schoolId: profile.schoolId,
      name: parsed.data.name,
    },
  });

  revalidateAdminPages();
}

export async function deleteClassAction(formData: FormData) {
  const profile = await requireRole("admin");
  const classId = formValue(formData, "classId");

  await prisma.class.deleteMany({
    where: {
      id: classId,
      schoolId: profile.schoolId,
    },
  });

  revalidateAdminPages();
}

export async function createStudentAction(formData: FormData) {
  const profile = await requireRole("admin");
  const resolvedPhotoUrl = await resolveUploadedImage(formData, {
    fileKey: "photoFile",
    valueKey: "photoUrl",
    folder: ["students", profile.schoolId],
    fileStem: `student-${formValue(formData, "studentCode") || "new"}`,
  });

  const parsed = studentSchema.safeParse({
    studentCode: formValue(formData, "studentCode"),
    firstName: formValue(formData, "firstName"),
    lastName: formValue(formData, "lastName"),
    className: formValue(formData, "className"),
    address: formValue(formData, "address"),
    guardianName: formValue(formData, "guardianName"),
    guardianPhone: formValue(formData, "guardianPhone"),
    guardianEmail: formValue(formData, "guardianEmail"),
    status: formValue(formData, "status") || "active",
    gender: formValue(formData, "gender"),
    photoUrl: resolvedPhotoUrl,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid student payload.");
  }

  const school = await prisma.school.findUnique({
    where: { id: profile.schoolId },
    select: { code: true },
  });

  if (!school) {
    throw new Error("School not found.");
  }

  const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();

  try {
    await prisma.student.create({
      data: {
        schoolId: profile.schoolId,
        studentCode: parsed.data.studentCode,
        studentPaymentId: toStudentPaymentId(school.code, parsed.data.studentCode),
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        fullName,
        className: parsed.data.className || null,
        address: parsed.data.address || null,
        guardianName: parsed.data.guardianName || null,
        guardianPhone: parsed.data.guardianPhone || null,
        guardianEmail: parsed.data.guardianEmail || null,
        status: parsed.data.status,
        gender: parsed.data.gender || null,
        photoUrl: parsed.data.photoUrl || null,
      },
    });
  } catch (error) {
    if (isLegacyStudentSchemaError(error) || isPrismaSchemaMismatchError(error)) {
      throw studentSchemaSyncError();
    }
    throw error;
  }

  revalidateAdminPages();
}

export async function createStudentsBulkAction(formData: FormData) {
  const profile = await requireRole("admin");
  const uploadedFile = formData.get("studentCsv");
  const uploadedCsvText =
    uploadedFile instanceof File && uploadedFile.size > 0 ? await uploadedFile.text() : "";

  const parsed = studentBulkSchema.safeParse({
    studentRows: uploadedCsvText || formValue(formData, "studentRows"),
    enrollmentYear: formValue(formData, "enrollmentYear"),
    className: formValue(formData, "className"),
    status: formValue(formData, "status") || "active",
    gender: formValue(formData, "gender"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid student bulk payload.");
  }

  const rowText = parsed.data.studentRows || "";
  const lines = rowText
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error("Upload a CSV file or enter at least one student row.");
  }

  const dataLines = hasStudentHeader(parseCsvLine(lines[0])) ? lines.slice(1) : lines;

  if (dataLines.length === 0) {
    throw new Error("The CSV file does not contain any student rows.");
  }

  const studentsToCreate = dataLines.map((row) => {
    const parts = parseCsvLine(row);
    const firstName = parts[0] ?? "";
    const rawLastName = parts[1] ?? "";
    const inferredLastName =
      !rawLastName && firstName.includes(" ")
        ? firstName
            .split(/\s+/)
            .slice(1)
            .join(" ")
        : rawLastName;
    const normalizedFirstName =
      !rawLastName && firstName.includes(" ") ? firstName.split(/\s+/)[0] ?? "" : firstName;
    const lastName = inferredLastName;

    if (!normalizedFirstName || !lastName) {
      throw new Error("Each row must include: First Name, Last Name.");
    }

    const guardianEmail = parts[5] ?? "";
    if (guardianEmail) {
      const emailCheck = /\S+@\S+\.\S+/.test(guardianEmail);
      if (!emailCheck) {
        throw new Error(`Invalid guardian email for ${normalizedFirstName} ${lastName}.`);
      }
    }

    const parsedGender = parseStudentGender(parts[6] ?? "");
    if (parsedGender === null) {
      throw new Error(`Invalid gender for ${normalizedFirstName} ${lastName}. Use Male or Female.`);
    }

    return {
      firstName: normalizedFirstName,
      lastName,
      address: parts[2] || "",
      guardianName: parts[3] || "",
      guardianPhone: parts[4] || "",
      guardianEmail,
      gender: parsedGender,
    };
  });

  const school = await prisma.school.findUnique({
    where: { id: profile.schoolId },
    select: { id: true, code: true, name: true },
  });

  if (!school) {
    throw new Error("School not found.");
  }

  const token = schoolNameToken(school.name);
  const prefix = `${token}-${parsed.data.enrollmentYear}-`;

  let existing: Array<{ studentCode: string }> = [];
  try {
    existing = await prisma.student.findMany({
      where: {
        schoolId: profile.schoolId,
        studentCode: {
          startsWith: prefix,
        },
      },
      select: { studentCode: true },
    });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      throw studentSchemaSyncError();
    }
    throw error;
  }

  let serial = existing.reduce((max, row) => {
    const match = row.studentCode.match(new RegExp(`^${prefix}(\\d{4})$`));
    if (!match) {
      return max;
    }
    const value = Number.parseInt(match[1] ?? "0", 10);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);

  await prisma.$transaction(async (tx) => {
    for (const row of studentsToCreate) {
      // Retry serial in case of a concurrent create clash.
      for (;;) {
        serial += 1;
        const generatedCode = `${prefix}${serial.toString().padStart(4, "0")}`;
        const fullName = `${row.firstName} ${row.lastName}`.trim();

        try {
          await tx.student.create({
            data: {
              schoolId: profile.schoolId,
              studentCode: generatedCode,
              studentPaymentId: toStudentPaymentId(school.code, generatedCode),
              firstName: row.firstName,
              lastName: row.lastName,
              fullName,
              className: parsed.data.className || null,
              address: row.address || null,
              guardianName: row.guardianName || null,
              guardianPhone: row.guardianPhone || null,
              guardianEmail: row.guardianEmail || null,
              status: parsed.data.status,
              gender: row.gender || parsed.data.gender || null,
            },
          });
          break;
        } catch (error) {
          if (isLegacyStudentSchemaError(error)) {
            throw studentSchemaSyncError();
          }
          if (isPrismaSchemaMismatchError(error)) {
            throw studentSchemaSyncError();
          }
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            continue;
          }
          throw error;
        }
      }
    }
  });

  revalidateAdminPages();
}

export async function deleteStudentAction(formData: FormData) {
  const profile = await requireRole("admin");
  const studentId = formValue(formData, "studentId");

  try {
    await prisma.student.deleteMany({
      where: {
        id: studentId,
        schoolId: profile.schoolId,
      },
    });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      throw studentSchemaSyncError();
    }
    throw error;
  }

  revalidateAdminPages();
}

export async function updateStudentAction(formData: FormData) {
  const profile = await requireRole("admin");
  const studentId = formValue(formData, "studentId");
  const resolvedPhotoUrl = await resolveUploadedImage(formData, {
    fileKey: "photoFile",
    valueKey: "photoUrl",
    currentValue: formValue(formData, "currentPhotoUrl"),
    folder: ["students", profile.schoolId],
    fileStem: `student-${studentId || "record"}`,
  });

  const parsed = studentUpdateSchema.safeParse({
    studentId,
    firstName: formValue(formData, "firstName"),
    lastName: formValue(formData, "lastName"),
    className: formValue(formData, "className"),
    address: formValue(formData, "address"),
    guardianName: formValue(formData, "guardianName"),
    guardianPhone: formValue(formData, "guardianPhone"),
    guardianEmail: formValue(formData, "guardianEmail"),
    status: formValue(formData, "status") || "active",
    gender: formValue(formData, "gender"),
    photoUrl: resolvedPhotoUrl,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid student update payload.");
  }

  const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();

  try {
    const result = await prisma.student.updateMany({
      where: {
        id: parsed.data.studentId,
        schoolId: profile.schoolId,
      },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        fullName,
        className: parsed.data.className || null,
        address: parsed.data.address || null,
        guardianName: parsed.data.guardianName || null,
        guardianPhone: parsed.data.guardianPhone || null,
        guardianEmail: parsed.data.guardianEmail || null,
        status: parsed.data.status,
        gender: parsed.data.gender || null,
        photoUrl: parsed.data.photoUrl || null,
      },
    });

    if (result.count === 0) {
      throw new Error("Student record not found.");
    }
  } catch (error) {
    if (isLegacyStudentSchemaError(error)) {
      throw studentSchemaSyncError();
    }
    if (isPrismaSchemaMismatchError(error)) {
      throw studentSchemaSyncError();
    }
    throw error;
  }

  revalidateAdminPages();
}

export async function createSubjectAction(formData: FormData) {
  const profile = await requireRole("admin");
  const parsed = subjectSchema.safeParse({ name: formValue(formData, "name") });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid subject payload.");
  }

  await prisma.subject.create({
    data: {
      schoolId: profile.schoolId,
      name: parsed.data.name,
    },
  });

  revalidateAdminPages();
}

export async function addSubjectsToClassAction(formData: FormData) {
  const profile = await requireRole("admin");
  const parsed = classSubjectBatchSchema.safeParse({
    classId: formValue(formData, "classId"),
    subjectList: formValue(formData, "subjectList"),
  });

  if (!parsed.success) {
    redirectSubjectsStatus("error", parsed.error.issues[0]?.message ?? "Invalid subject assignment payload.");
  }

  let klass: Awaited<ReturnType<typeof prisma.class.findFirst>> = null;

  try {
    klass = await prisma.class.findFirst({
      where: {
        id: parsed.data.classId,
        schoolId: profile.schoolId,
      },
    });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      redirectSubjectsStatus("error", schemaSyncMessage("Subject"));
    }
    redirectSubjectsStatus("error", "Unable to verify the selected class right now. Please try again.");
  }

  if (!klass) {
    redirectSubjectsStatus("error", "Selected class does not belong to your school.");
  }

  const subjectNames = Array.from(
    new Map(
      parsed.data.subjectList
        .split(/\n|,/g)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((name) => [name.toLowerCase(), name]),
    ).values(),
  );

  if (subjectNames.length === 0) {
    redirectSubjectsStatus("error", "Enter at least one valid subject name.");
  }

  try {
    const existingSubjects =
      subjectNames.length > 0
        ? await prisma.subject.findMany({
            where: {
              schoolId: profile.schoolId,
              OR: subjectNames.map((name) => ({
                name: { equals: name, mode: "insensitive" },
              })),
            },
            select: { id: true, name: true },
          })
        : [];

    const subjectsByName = new Map(
      existingSubjects.map((subject) => [subject.name.toLowerCase(), subject]),
    );

    for (const name of subjectNames) {
      const normalized = name.toLowerCase();
      let subject = subjectsByName.get(normalized);

      if (!subject) {
        subject = await prisma.subject.create({
          data: {
            schoolId: profile.schoolId,
            name,
          },
          select: { id: true, name: true },
        });

        subjectsByName.set(normalized, subject);
      }

      await prisma.classSubject.upsert({
        where: {
          classId_subjectId: {
            classId: klass.id,
            subjectId: subject.id,
          },
        },
        update: {},
        create: {
          schoolId: profile.schoolId,
          classId: klass.id,
          subjectId: subject.id,
        },
      });
    }
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      redirectSubjectsStatus("error", schemaSyncMessage("Subject"));
    }
    redirectSubjectsStatus("error", "Could not add subjects right now. Please retry.");
  }

  revalidateAdminPages();
  redirectSubjectsStatus(
    "success",
    `Added ${subjectNames.length} subject${subjectNames.length === 1 ? "" : "s"} to ${klass.name}.`,
  );
}

export async function deleteSubjectAction(formData: FormData) {
  const profile = await requireRole("admin");
  const subjectId = formValue(formData, "subjectId");

  await prisma.subject.deleteMany({
    where: {
      id: subjectId,
      schoolId: profile.schoolId,
    },
  });

  revalidateAdminPages();
}

export async function createTermAction(formData: FormData) {
  const profile = await requireRole("admin");
  const parsed = termSchema.safeParse({
    sessionLabel: formValue(formData, "sessionLabel"),
    termLabel: formValue(formData, "termLabel"),
    isActive: formValue(formData, "isActive") === "on",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid term payload.");
  }

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isActive) {
      await tx.term.updateMany({
        where: { schoolId: profile.schoolId },
        data: { isActive: false },
      });
    }

    await tx.term.create({
      data: {
        schoolId: profile.schoolId,
        sessionLabel: parsed.data.sessionLabel,
        termLabel: parsed.data.termLabel,
        isActive: parsed.data.isActive,
      },
    });
  });

  revalidateAdminPages();
}

export async function createSessionBundleAction(formData: FormData) {
  const profile = await requireRole("admin");
  const parsed = sessionBundleSchema.safeParse({
    sessionLabel: formValue(formData, "sessionLabel"),
    structure: formValue(formData, "structure"),
    customLabels: formValue(formData, "customLabels"),
    setFirstActive: formValue(formData, "setFirstActive") === "on",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid academic session payload.");
  }

  const sessionLabel = parsed.data.sessionLabel;
  const termLabels =
    parsed.data.structure === "custom"
      ? parseCustomSessionLabels(parsed.data.customLabels ?? "")
      : Array.from(TERM_BUNDLE_LABELS[parsed.data.structure]);

  await prisma.$transaction(async (tx) => {
    const activePresetTemplate = await tx.assessmentTemplate.findFirst({
      where: {
        schoolId: profile.schoolId,
        isPreset: true,
        isActive: true,
      },
      select: {
        id: true,
        types: {
          take: 1,
          select: { id: true },
        },
      },
    });

    const existingTerms = await tx.term.findMany({
      where: {
        schoolId: profile.schoolId,
        sessionLabel,
        termLabel: { in: termLabels },
      },
      select: {
        id: true,
        termLabel: true,
      },
    });

    if (parsed.data.setFirstActive) {
      await tx.term.updateMany({
        where: { schoolId: profile.schoolId },
        data: { isActive: false },
      });
    }

    const existingByLabel = new Map(existingTerms.map((term) => [term.termLabel, term]));

    for (const [index, termLabel] of termLabels.entries()) {
      const shouldBeActive = parsed.data.setFirstActive && index === 0;
      const existing = existingByLabel.get(termLabel);

      if (existing) {
        if (shouldBeActive) {
          await tx.term.update({
            where: { id: existing.id },
            data: { isActive: true },
          });
        }
        continue;
      }

      await tx.term.create({
        data: {
          schoolId: profile.schoolId,
          sessionLabel,
          termLabel,
          isActive: shouldBeActive,
        },
        select: {
          id: true,
        },
      }).then(async (createdTerm) => {
        if (activePresetTemplate && activePresetTemplate.types.length > 0) {
          await clonePresetTemplateToTermSnapshot(tx, {
            schoolId: profile.schoolId,
            termId: createdTerm.id,
            presetTemplateId: activePresetTemplate.id,
          });
        }
      });
    }
  });

  revalidateAdminPages();
}

export async function setActiveTermAction(formData: FormData) {
  const profile = await requireRole("admin");
  const termId = formValue(formData, "termId");

  await prisma.$transaction(async (tx) => {
    await tx.term.updateMany({
      where: { schoolId: profile.schoolId },
      data: { isActive: false },
    });

    await tx.term.updateMany({
      where: {
        id: termId,
        schoolId: profile.schoolId,
      },
      data: { isActive: true },
    });
  });

  revalidateAdminPages();
}

export async function deleteTermAction(formData: FormData) {
  const profile = await requireRole("admin");
  const termId = formValue(formData, "termId");

  await prisma.term.deleteMany({
    where: {
      id: termId,
      schoolId: profile.schoolId,
    },
  });

  revalidateAdminPages();
}

export async function assignTeacherToClassAction(formData: FormData) {
  const profile = await requireRole("admin");

  const parsed = teacherAssignmentSchema.safeParse({
    teacherProfileId: formValue(formData, "teacherProfileId"),
    classId: formValue(formData, "classId"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid assignment payload.");
  }

  const [teacher, klass] = await Promise.all([
    prisma.profile.findFirst({
      where: {
        id: parsed.data.teacherProfileId,
        schoolId: profile.schoolId,
        role: ProfileRole.TEACHER,
      },
    }),
    prisma.class.findFirst({
      where: {
        id: parsed.data.classId,
        schoolId: profile.schoolId,
      },
    }),
  ]);

  if (!teacher || !klass) {
    throw new Error("Teacher or class not found in this school.");
  }

  await prisma.teacherClassAssignment.upsert({
    where: {
      teacherProfileId_classId: {
        teacherProfileId: teacher.id,
        classId: klass.id,
      },
    },
    update: {},
    create: {
      schoolId: profile.schoolId,
      teacherProfileId: teacher.id,
      classId: klass.id,
    },
  });

  revalidateAdminPages();
}

export async function removeTeacherClassAssignmentAction(formData: FormData) {
  const profile = await requireRole("admin");
  const assignmentId = formValue(formData, "assignmentId");

  await prisma.teacherClassAssignment.deleteMany({
    where: {
      id: assignmentId,
      schoolId: profile.schoolId,
    },
  });

  revalidateAdminPages();
}

export async function assignSubjectToClassAction(formData: FormData) {
  const profile = await requireRole("admin");

  const parsed = classSubjectAssignmentSchema.safeParse({
    classId: formValue(formData, "classId"),
    subjectId: formValue(formData, "subjectId"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid class-subject payload.");
  }

  const [klass, subject] = await Promise.all([
    prisma.class.findFirst({
      where: {
        id: parsed.data.classId,
        schoolId: profile.schoolId,
      },
    }),
    prisma.subject.findFirst({
      where: {
        id: parsed.data.subjectId,
        schoolId: profile.schoolId,
      },
    }),
  ]);

  if (!klass || !subject) {
    throw new Error("Class or subject not found in this school.");
  }

  await prisma.classSubject.upsert({
    where: {
      classId_subjectId: {
        classId: klass.id,
        subjectId: subject.id,
      },
    },
    update: {},
    create: {
      schoolId: profile.schoolId,
      classId: klass.id,
      subjectId: subject.id,
    },
  });

  revalidateAdminPages();
}

export async function removeClassSubjectAction(formData: FormData) {
  const profile = await requireRole("admin");
  const classSubjectId = formValue(formData, "classSubjectId");

  await prisma.classSubject.deleteMany({
    where: {
      id: classSubjectId,
      schoolId: profile.schoolId,
    },
  });

  revalidateAdminPages();
}

export async function enrollStudentAction(formData: FormData) {
  const profile = await requireRole("admin");

  const parsed = enrollmentSchema.safeParse({
    studentId: formValue(formData, "studentId"),
    classId: formValue(formData, "classId"),
    termId: formValue(formData, "termId"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid enrollment payload.");
  }

  let successMessage = "";

  try {
    const [student, klass, term] = await Promise.all([
      prisma.student.findFirst({ where: { id: parsed.data.studentId, schoolId: profile.schoolId } }),
      prisma.class.findFirst({ where: { id: parsed.data.classId, schoolId: profile.schoolId } }),
      prisma.term.findFirst({ where: { id: parsed.data.termId, schoolId: profile.schoolId } }),
    ]);

    if (!student || !klass || !term) {
      throw new Error("Student, class, or term not found in this school.");
    }

    await prisma.enrollment.upsert({
      where: {
        studentId_classId_termId: {
          studentId: student.id,
          classId: klass.id,
          termId: term.id,
        },
      },
      update: {},
      create: {
        schoolId: profile.schoolId,
        studentId: student.id,
        classId: klass.id,
        termId: term.id,
      },
    });

    revalidateAdminPages();
    successMessage = `${student.fullName} enrolled into ${klass.name} for ${term.sessionLabel} ${term.termLabel}.`;
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      throw studentSchemaSyncError();
    }
    if (error instanceof Error) {
      redirectEnrollmentsStatus("error", error.message);
    }
    throw error;
  }

  redirectEnrollmentsStatus("success", successMessage);
}

export async function bulkEnrollStudentsByClassAction(formData: FormData) {
  const profile = await requireRole("admin");

  const parsed = enrollmentBulkSchema.safeParse({
    classId: formValue(formData, "classId"),
    termId: formValue(formData, "termId"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid bulk enrollment payload.");
  }

  let successMessage = "";

  try {
    const [klass, term] = await Promise.all([
      prisma.class.findFirst({
        where: {
          id: parsed.data.classId,
          schoolId: profile.schoolId,
        },
      }),
      prisma.term.findFirst({
        where: {
          id: parsed.data.termId,
          schoolId: profile.schoolId,
        },
      }),
    ]);

    if (!klass || !term) {
      throw new Error("Class or term not found in this school.");
    }

    const eligibleStudents = await prisma.student.findMany({
      where: {
        schoolId: profile.schoolId,
        status: "active",
        className: {
          equals: klass.name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (eligibleStudents.length === 0) {
      throw new Error(`No active students are currently registered under ${klass.name}.`);
    }

    const studentIds = eligibleStudents.map((student) => student.id);
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        schoolId: profile.schoolId,
        classId: klass.id,
        termId: term.id,
        studentId: { in: studentIds },
      },
      select: { studentId: true },
    });

    const existingStudentIds = new Set(existingEnrollments.map((enrollment) => enrollment.studentId));
    const studentsToCreate = eligibleStudents.filter((student) => !existingStudentIds.has(student.id));
    const alreadyEnrolledCount = eligibleStudents.length - studentsToCreate.length;

    if (studentsToCreate.length > 0) {
      await prisma.enrollment.createMany({
        data: studentsToCreate.map((student) => ({
          schoolId: profile.schoolId,
          studentId: student.id,
          classId: klass.id,
          termId: term.id,
        })),
        skipDuplicates: true,
      });
    }

    revalidateAdminPages();
    if (studentsToCreate.length === 0) {
      successMessage = `No new enrollments for ${klass.name} in ${term.sessionLabel} ${term.termLabel}. ${alreadyEnrolledCount} student${alreadyEnrolledCount === 1 ? " was" : "s were"} already enrolled.`;
    } else if (alreadyEnrolledCount === 0) {
      successMessage = `${studentsToCreate.length} active student${studentsToCreate.length === 1 ? "" : "s"} newly enrolled into ${klass.name} for ${term.sessionLabel} ${term.termLabel}.`;
    } else {
      successMessage = `${studentsToCreate.length} active student${studentsToCreate.length === 1 ? "" : "s"} newly enrolled into ${klass.name} for ${term.sessionLabel} ${term.termLabel}. ${alreadyEnrolledCount} student${alreadyEnrolledCount === 1 ? " was" : "s were"} already enrolled.`;
    }
  } catch (error) {
    if (error instanceof Error && !isPrismaSchemaMismatchError(error)) {
      redirectEnrollmentsStatus("error", error.message);
    }
    if (isPrismaSchemaMismatchError(error)) {
      throw studentSchemaSyncError();
    }
    throw error;
  }

  redirectEnrollmentsStatus("success", successMessage);
}

export async function removeEnrollmentAction(formData: FormData) {
  const profile = await requireRole("admin");
  const enrollmentId = formValue(formData, "enrollmentId");
  let successMessage = "";

  try {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        schoolId: profile.schoolId,
      },
      include: {
        student: { select: { fullName: true } },
        class: { select: { name: true } },
        term: { select: { sessionLabel: true, termLabel: true } },
      },
    });

    if (!enrollment) {
      throw new Error("Enrollment record not found.");
    }

    await prisma.enrollment.delete({
      where: { id: enrollment.id },
    });

    revalidateAdminPages();
    successMessage = `${enrollment.student.fullName} removed from ${enrollment.class.name} for ${enrollment.term.sessionLabel} ${enrollment.term.termLabel}.`;
  } catch (error) {
    if (error instanceof Error && !isPrismaSchemaMismatchError(error)) {
      redirectEnrollmentsStatus("error", error.message);
    }
    if (isPrismaSchemaMismatchError(error)) {
      throw studentSchemaSyncError();
    }
    throw error;
  }

  redirectEnrollmentsStatus("success", successMessage);
}

export async function setResultPublicationStatusAction(formData: FormData) {
  const profile = await requireRole("admin");
  const termId = formValue(formData, "termId");
  const classId = formValue(formData, "classId");
  const studentIds = formData
    .getAll("studentIds")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const primaryStudentId = studentIds[0] ?? "";

  const parsed = resultPublicationSchema.safeParse({
    studentIds,
    termId,
    classId,
    status: formValue(formData, "status"),
  });

  if (!parsed.success) {
    redirectResultsStatus("error", parsed.error.issues[0]?.message ?? "Invalid result publication payload.", {
      termId,
      classId,
      studentId: primaryStudentId,
    });
  }

  try {
    const [students, term, klass, existingPublications] = await Promise.all([
      prisma.student.findMany({
        where: {
          id: { in: parsed.data.studentIds },
          schoolId: profile.schoolId,
        },
        select: { id: true, fullName: true },
      }),
      prisma.term.findFirst({
        where: { id: parsed.data.termId, schoolId: profile.schoolId },
        select: { id: true, sessionLabel: true, termLabel: true },
      }),
      prisma.class.findFirst({
        where: { id: parsed.data.classId, schoolId: profile.schoolId },
        select: { id: true, name: true },
      }),
      prisma.resultPublication.findMany({
        where: {
          termId: parsed.data.termId,
          studentId: { in: parsed.data.studentIds },
        },
      }),
    ]);

    if (students.length !== parsed.data.studentIds.length || !term || !klass) {
      throw new Error("One or more selected students, the class, or the term could not be found for this result.");
    }

    const scoredStudents = await prisma.score.groupBy({
      where: {
        schoolId: profile.schoolId,
        studentId: { in: parsed.data.studentIds },
        termId: parsed.data.termId,
        classId: parsed.data.classId,
      },
      by: ["studentId"],
    });

    if (scoredStudents.length === 0) {
      throw new Error("The selected students have no score rows yet for the selected term and class.");
    }

    const scoredStudentIds = new Set(scoredStudents.map((item) => item.studentId));
    const targetStudents = students.filter((student) => scoredStudentIds.has(student.id));

    if (targetStudents.length === 0) {
      throw new Error("None of the selected students have score rows yet for the selected term and class.");
    }

    const existingPublicationMap = new Map(existingPublications.map((item) => [item.studentId, item]));
    const nextStatus =
      parsed.data.status === "PUBLISHED"
        ? ResultPublicationStatus.PUBLISHED
        : parsed.data.status === "UNPUBLISHED"
          ? ResultPublicationStatus.UNPUBLISHED
          : ResultPublicationStatus.DRAFT;

    await prisma.$transaction(async (tx) => {
      for (const student of targetStudents) {
        const basePublication = buildResultPublicationPayload(existingPublicationMap.get(student.id) ?? null);
        await tx.resultPublication.upsert({
          where: {
            studentId_termId: {
              studentId: student.id,
              termId: parsed.data.termId,
            },
          },
          update: {
            classId: parsed.data.classId,
            status: nextStatus,
            publishedByProfileId: nextStatus === ResultPublicationStatus.PUBLISHED ? profile.id : null,
            publishedAt: nextStatus === ResultPublicationStatus.PUBLISHED ? new Date() : null,
          },
          create: {
            schoolId: profile.schoolId,
            studentId: student.id,
            termId: parsed.data.termId,
            classId: parsed.data.classId,
            shareToken: basePublication.shareToken,
            status: nextStatus,
            publishedByProfileId: nextStatus === ResultPublicationStatus.PUBLISHED ? profile.id : null,
            publishedAt: nextStatus === ResultPublicationStatus.PUBLISHED ? new Date() : null,
          },
        });
      }
    });

    revalidateAdminPages();
    const statusLabel =
      nextStatus === ResultPublicationStatus.PUBLISHED
        ? "published"
        : nextStatus === ResultPublicationStatus.UNPUBLISHED
          ? "unpublished"
          : "set to draft";
    const skippedCount = parsed.data.studentIds.length - targetStudents.length;
    const baseMessage =
      targetStudents.length === 1
        ? `${targetStudents[0].fullName} result ${statusLabel} for ${term.sessionLabel} ${term.termLabel}.`
        : `${targetStudents.length} student results ${statusLabel} for ${term.sessionLabel} ${term.termLabel}.`;
    redirectResultsStatus(
      "success",
      skippedCount > 0 ? `${baseMessage} ${skippedCount} selected student(s) were skipped because they do not have saved scores yet.` : baseMessage,
      {
        termId: parsed.data.termId,
        classId: parsed.data.classId,
        studentId: targetStudents[0]?.id ?? primaryStudentId,
      },
    );
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      throw studentSchemaSyncError();
    }

    redirectResultsStatus("error", error instanceof Error ? error.message : "Unable to update result publication right now.", {
      termId,
      classId,
      studentId: primaryStudentId,
    });
  }
}

export async function upsertPromotionPolicyAction(formData: FormData) {
  const profile = await requireRole("admin");
  const compulsorySubjectIds = formData
    .getAll("compulsorySubjectIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

  const parsed = promotionPolicySchema.safeParse({
    id: formValue(formData, "id") || undefined,
    name: formValue(formData, "name"),
    minimumPassedSubjects: formValue(formData, "minimumPassedSubjects"),
    minimumAverage: formValue(formData, "minimumAverage"),
    passGradeId: formValue(formData, "passGradeId") || undefined,
    requiredCompulsorySubjectsAtGrade: formValue(formData, "requiredCompulsorySubjectsAtGrade"),
    requiredCompulsoryGradeId: formValue(formData, "requiredCompulsoryGradeId") || undefined,
    allowManualOverride: formValue(formData, "allowManualOverride") !== "off",
    setActive: formValue(formData, "setActive") === "on",
    compulsorySubjectIds,
  });

  if (!parsed.success) {
    redirectPromotionRulesStatus("error", parsed.error.issues[0]?.message ?? "Invalid promotion rules.");
  }

  try {
    const [passGrade, requiredCompulsoryGrade, validSubjects] = await Promise.all([
      parsed.data.passGradeId
        ? prisma.gradeScale.findFirst({
            where: {
              id: parsed.data.passGradeId,
              schoolId: profile.schoolId,
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      parsed.data.requiredCompulsoryGradeId
        ? prisma.gradeScale.findFirst({
            where: {
              id: parsed.data.requiredCompulsoryGradeId,
              schoolId: profile.schoolId,
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      parsed.data.compulsorySubjectIds.length > 0
        ? prisma.subject.findMany({
            where: {
              schoolId: profile.schoolId,
              id: { in: parsed.data.compulsorySubjectIds },
            },
            select: { id: true },
          })
        : Promise.resolve([]),
    ]);

    if (parsed.data.passGradeId && !passGrade) {
      throw new Error("Selected pass grade was not found for this school.");
    }
    if (parsed.data.requiredCompulsoryGradeId && !requiredCompulsoryGrade) {
      throw new Error("Selected compulsory grade target was not found for this school.");
    }

    if (validSubjects.length !== parsed.data.compulsorySubjectIds.length) {
      throw new Error("One or more compulsory subjects are invalid for this school.");
    }

    if (parsed.data.id) {
      const existingPolicy = await prisma.promotionPolicy.findFirst({
        where: {
          id: parsed.data.id,
          schoolId: profile.schoolId,
        },
        select: { id: true },
      });

      if (!existingPolicy) {
        throw new Error("Promotion rule not found.");
      }
    }

    await prisma.$transaction(async (tx) => {
      if (parsed.data.setActive) {
        await tx.promotionPolicy.updateMany({
          where: {
            schoolId: profile.schoolId,
          },
          data: {
            isActive: false,
          },
        });
      }

      const policy = parsed.data.id
        ? await tx.promotionPolicy.update({
            where: {
              id: parsed.data.id,
            },
            data: {
              name: parsed.data.name,
              isActive: parsed.data.setActive,
              minimumPassedSubjects: parsed.data.minimumPassedSubjects,
              minimumAverage: parsed.data.minimumAverage,
              passGradeId: parsed.data.passGradeId || null,
              requiredCompulsorySubjectsAtGrade: parsed.data.requiredCompulsorySubjectsAtGrade,
              requiredCompulsoryGradeId: parsed.data.requiredCompulsoryGradeId || null,
              allowManualOverride: parsed.data.allowManualOverride,
            },
            select: { id: true },
          })
        : await tx.promotionPolicy.create({
            data: {
              schoolId: profile.schoolId,
              name: parsed.data.name,
              isActive: parsed.data.setActive,
              minimumPassedSubjects: parsed.data.minimumPassedSubjects,
              minimumAverage: parsed.data.minimumAverage,
              passGradeId: parsed.data.passGradeId || null,
              requiredCompulsorySubjectsAtGrade: parsed.data.requiredCompulsorySubjectsAtGrade,
              requiredCompulsoryGradeId: parsed.data.requiredCompulsoryGradeId || null,
              allowManualOverride: parsed.data.allowManualOverride,
            },
            select: { id: true },
          });

      if (!parsed.data.setActive) {
        const hasActive = await tx.promotionPolicy.count({
          where: {
            schoolId: profile.schoolId,
            isActive: true,
          },
        });
        if (hasActive === 0) {
          await tx.promotionPolicy.update({
            where: { id: policy.id },
            data: { isActive: true },
          });
        }
      }

      await tx.promotionPolicySubject.deleteMany({
        where: {
          policyId: policy.id,
        },
      });

      if (parsed.data.compulsorySubjectIds.length > 0) {
        await tx.promotionPolicySubject.createMany({
          data: parsed.data.compulsorySubjectIds.map((subjectId) => ({
            schoolId: profile.schoolId,
            policyId: policy.id,
            subjectId,
          })),
          skipDuplicates: true,
        });
      }
    });

    revalidateAdminPages();
    redirectPromotionRulesStatus("success", `Promotion rule "${parsed.data.name}" saved.`, { ruleId: parsed.data.id || undefined });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      throw studentSchemaSyncError();
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectPromotionRulesStatus("error", "A promotion rule with this name already exists.", {
        ruleId: parsed.data.id || undefined,
      });
    }

    redirectPromotionRulesStatus("error", error instanceof Error ? error.message : "Unable to save promotion rules right now.", {
      ruleId: parsed.data.id || undefined,
    });
  }
}

export async function activatePromotionPolicyAction(formData: FormData) {
  const profile = await requireRole("admin");
  const parsed = promotionPolicySelectionSchema.safeParse({
    policyId: formValue(formData, "policyId"),
  });

  if (!parsed.success) {
    redirectPromotionRulesStatus("error", parsed.error.issues[0]?.message ?? "Invalid promotion rule selection.");
  }

  try {
    const target = await prisma.promotionPolicy.findFirst({
      where: {
        id: parsed.data.policyId,
        schoolId: profile.schoolId,
      },
      select: { id: true, name: true },
    });

    if (!target) {
      throw new Error("Promotion rule not found.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.promotionPolicy.updateMany({
        where: { schoolId: profile.schoolId },
        data: { isActive: false },
      });
      await tx.promotionPolicy.update({
        where: { id: target.id },
        data: { isActive: true },
      });
    });

    revalidateAdminPages();
    redirectPromotionRulesStatus("success", `"${target.name}" is now the active promotion rule.`, { ruleId: target.id });
  } catch (error) {
    redirectPromotionRulesStatus("error", error instanceof Error ? error.message : "Unable to activate this promotion rule.");
  }
}

export async function deletePromotionPolicyAction(formData: FormData) {
  const profile = await requireRole("admin");
  const parsed = promotionPolicySelectionSchema.safeParse({
    policyId: formValue(formData, "policyId"),
  });

  if (!parsed.success) {
    redirectPromotionRulesStatus("error", parsed.error.issues[0]?.message ?? "Invalid promotion rule selection.");
  }

  try {
    const target = await prisma.promotionPolicy.findFirst({
      where: {
        id: parsed.data.policyId,
        schoolId: profile.schoolId,
      },
      select: { id: true, name: true, isActive: true },
    });

    if (!target) {
      throw new Error("Promotion rule not found.");
    }

    const count = await prisma.promotionPolicy.count({
      where: { schoolId: profile.schoolId },
    });

    if (count <= 1) {
      throw new Error("At least one promotion rule must remain.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.promotionPolicySubject.deleteMany({
        where: { policyId: target.id },
      });
      await tx.promotionPolicy.delete({
        where: { id: target.id },
      });

      if (target.isActive) {
        const fallback = await tx.promotionPolicy.findFirst({
          where: { schoolId: profile.schoolId },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });

        if (fallback) {
          await tx.promotionPolicy.update({
            where: { id: fallback.id },
            data: { isActive: true },
          });
        }
      }
    });

    revalidateAdminPages();
    redirectPromotionRulesStatus("success", `"${target.name}" has been deleted.`);
  } catch (error) {
    redirectPromotionRulesStatus("error", error instanceof Error ? error.message : "Unable to delete this promotion rule.");
  }
}

export async function promoteStudentsAction(formData: FormData) {
  const profile = await requireRole("admin");
  const sourceSessionLabel = formValue(formData, "sourceSessionLabel");
  const sourceClassId = formValue(formData, "sourceClassId");
  const targetSessionLabel = formValue(formData, "targetSessionLabel");
  const targetClassId = formValue(formData, "targetClassId");
  const studentIds = formData
    .getAll("studentIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

  const parsed = promotionActionSchema.safeParse({
    sourceSessionLabel,
    sourceClassId,
    targetSessionLabel,
    targetClassId,
    studentIds,
  });

  if (!parsed.success) {
    redirectPromotionStatus("error", parsed.error.issues[0]?.message ?? "Invalid promotion payload.", {
      sessionLabel: sourceSessionLabel,
      sourceClassId,
      targetSessionLabel,
      targetClassId,
    });
  }

  try {
    const [sourceClass, targetClass, sourceSessionTerms, targetSessionTerms] = await Promise.all([
      prisma.class.findFirst({
        where: {
          id: parsed.data.sourceClassId,
          schoolId: profile.schoolId,
        },
        select: { id: true, name: true },
      }),
      prisma.class.findFirst({
        where: {
          id: parsed.data.targetClassId,
          schoolId: profile.schoolId,
        },
        select: { id: true, name: true },
      }),
      prisma.term.findMany({
        where: {
          schoolId: profile.schoolId,
          sessionLabel: parsed.data.sourceSessionLabel,
        },
        select: { id: true },
      }),
      prisma.term.findMany({
        where: {
          schoolId: profile.schoolId,
          sessionLabel: parsed.data.targetSessionLabel,
        },
        orderBy: { createdAt: "asc" },
        select: { id: true, sessionLabel: true, termLabel: true },
      }),
    ]);

    if (!sourceClass) {
      throw new Error("Source class not found.");
    }
    if (!targetClass) {
      throw new Error("Target class not found.");
    }
    if (sourceSessionTerms.length === 0) {
      throw new Error("Source session not found.");
    }
    if (targetSessionTerms.length === 0) {
      throw new Error("Target session has no sub-sessions yet.");
    }
    if (parsed.data.sourceSessionLabel === parsed.data.targetSessionLabel) {
      throw new Error("Promotion must move students into a different session.");
    }

    const targetTerm = targetSessionTerms[0];

    const eligibleEnrollments = await prisma.enrollment.findMany({
      where: {
        schoolId: profile.schoolId,
        classId: parsed.data.sourceClassId,
        termId: {
          in: sourceSessionTerms.map((term) => term.id),
        },
        studentId: {
          in: parsed.data.studentIds,
        },
      },
      select: { studentId: true },
    });

    const eligibleStudentIds = Array.from(new Set(eligibleEnrollments.map((row) => row.studentId)));
    if (eligibleStudentIds.length === 0) {
      throw new Error("None of the selected students belong to the chosen source class and session.");
    }

    const [gradeScale, promotionPolicy] = await Promise.all([
      prisma.gradeScale.findMany({
        where: { schoolId: profile.schoolId },
        orderBy: { orderIndex: "asc" },
      }),
      prisma.promotionPolicy.findFirst({
        where: { schoolId: profile.schoolId, isActive: true },
        select: {
          minimumPassedSubjects: true,
          minimumAverage: true,
          passGradeId: true,
          requiredCompulsorySubjectsAtGrade: true,
          requiredCompulsoryGradeId: true,
          allowManualOverride: true,
          compulsorySubjects: {
            select: {
              subjectId: true,
            },
          },
        },
      }),
    ]);

    const effectivePolicy = resolvePromotionPolicy(
      mapStoredPromotionPolicy(promotionPolicy),
      gradeScale,
    );

    const [subjects, selectedScores, students] = await Promise.all([
      prisma.subject.findMany({
        where: { schoolId: profile.schoolId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.score.findMany({
        where: {
          schoolId: profile.schoolId,
          classId: parsed.data.sourceClassId,
          termId: {
            in: sourceSessionTerms.map((term) => term.id),
          },
          studentId: {
            in: eligibleStudentIds,
          },
        },
        select: {
          studentId: true,
          subjectId: true,
          termId: true,
          total: true,
        },
      }),
      prisma.student.findMany({
        where: {
          schoolId: profile.schoolId,
          id: {
            in: eligibleStudentIds,
          },
        },
        select: {
          id: true,
          studentCode: true,
          fullName: true,
          status: true,
        },
      }),
    ]);

    const evaluatedRows = evaluatePromotionCandidates({
      students,
      scores: selectedScores.map((score) => ({
        studentId: score.studentId,
        subjectId: score.subjectId,
        termId: score.termId,
        total: Number(score.total),
      })),
      sessionTermCount: sourceSessionTerms.length,
      gradeScale,
      policy: effectivePolicy,
      subjects,
    });

    const noScoreRows = evaluatedRows.filter((row) => row.annualAverage === null);
    if (noScoreRows.length > 0) {
      const blockedNames = noScoreRows
        .slice(0, 3)
        .map((row) => row.fullName)
        .join(", ");
      throw new Error(
        `${blockedNames}${noScoreRows.length > 3 ? " and others" : ""} have no annual scores yet, so they cannot be promoted from this screen.`,
      );
    }

    if (!effectivePolicy.allowManualOverride) {
      const ineligibleSelected = evaluatedRows.filter((row) => eligibleStudentIds.includes(row.studentId) && !row.isEligible);
      if (ineligibleSelected.length > 0) {
        const blockedNames = ineligibleSelected
          .slice(0, 3)
          .map((row) => row.fullName)
          .join(", ");
        throw new Error(
          `${blockedNames}${ineligibleSelected.length > 3 ? " and others" : ""} do not meet this school's promotion rules, and manual override is turned off.`,
        );
      }
    }

    const existingTargetEnrollments = await prisma.enrollment.findMany({
      where: {
        schoolId: profile.schoolId,
        classId: parsed.data.targetClassId,
        termId: targetTerm.id,
        studentId: {
          in: eligibleStudentIds,
        },
      },
      select: { studentId: true },
    });

    const alreadyEnrolledIds = new Set(existingTargetEnrollments.map((row) => row.studentId));
    const studentsToEnroll = eligibleStudentIds.filter((studentId) => !alreadyEnrolledIds.has(studentId));

    await prisma.$transaction(async (tx) => {
      await tx.student.updateMany({
        where: {
          schoolId: profile.schoolId,
          id: { in: eligibleStudentIds },
        },
        data: {
          className: targetClass.name,
          status: "active",
        },
      });

      if (studentsToEnroll.length > 0) {
        await tx.enrollment.createMany({
          data: studentsToEnroll.map((studentId) => ({
            schoolId: profile.schoolId,
            studentId,
            classId: parsed.data.targetClassId,
            termId: targetTerm.id,
          })),
          skipDuplicates: true,
        });
      }
    });

    revalidateAdminPages();

    const alreadyEnrolledCount = eligibleStudentIds.length - studentsToEnroll.length;
    const successMessage =
      alreadyEnrolledCount === 0
        ? `${eligibleStudentIds.length} student${eligibleStudentIds.length === 1 ? "" : "s"} promoted into ${targetClass.name} for ${targetTerm.sessionLabel} ${targetTerm.termLabel}.`
        : `${studentsToEnroll.length} student${studentsToEnroll.length === 1 ? "" : "s"} newly promoted into ${targetClass.name} for ${targetTerm.sessionLabel}. They were enrolled into ${targetTerm.termLabel}. ${alreadyEnrolledCount} student${alreadyEnrolledCount === 1 ? " was" : "s were"} already there.`;

    redirectPromotionStatus("success", successMessage, {
      sessionLabel: parsed.data.sourceSessionLabel,
      sourceClassId: parsed.data.sourceClassId,
      targetSessionLabel: parsed.data.targetSessionLabel,
      targetClassId: parsed.data.targetClassId,
    });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      throw studentSchemaSyncError();
    }

    redirectPromotionStatus("error", error instanceof Error ? error.message : "Unable to complete promotion right now.", {
      sessionLabel: sourceSessionLabel,
      sourceClassId,
      targetSessionLabel,
      targetClassId,
    });
  }
}

export async function upsertAssessmentTemplateAction(formData: FormData) {
  const profile = await requireRole("admin");

  const parsed = assessmentTemplateSchema.safeParse({
    id: formValue(formData, "id") || undefined,
    name: formValue(formData, "name"),
    setActive: formValue(formData, "setActive") === "on",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid assessment template payload.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existingTemplateCount = await tx.assessmentTemplate.count({
        where: { schoolId: profile.schoolId, isPreset: true },
      });

      let templateId = parsed.data.id;

      if (templateId) {
        const existingTemplate = await tx.assessmentTemplate.findFirst({
          where: {
            id: templateId,
            schoolId: profile.schoolId,
            isPreset: true,
          },
          select: { id: true },
        });

        if (!existingTemplate) {
          throw new Error("Assessment template not found.");
        }

        await tx.assessmentTemplate.update({
          where: { id: templateId },
          data: { name: parsed.data.name },
        });
      } else {
        const created = await tx.assessmentTemplate.create({
          data: {
            schoolId: profile.schoolId,
            name: parsed.data.name,
            isPreset: true,
          },
          select: { id: true },
        });
        templateId = created.id;
      }

      if (!templateId) {
        throw new Error("Assessment template could not be saved.");
      }

      const shouldActivate = parsed.data.setActive || existingTemplateCount === 0;
      if (shouldActivate) {
        await tx.assessmentTemplate.updateMany({
          where: { schoolId: profile.schoolId, isPreset: true },
          data: { isActive: false },
        });
        await tx.assessmentTemplate.update({
          where: { id: templateId },
          data: { isActive: true },
        });
      }
    });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      throw assessmentSchemaSyncError();
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("This assessment template name already exists.");
    }

    throw error;
  }

  revalidateAdminPages();
}

export async function setActiveAssessmentTemplateAction(formData: FormData) {
  const profile = await requireRole("admin");
  const parsed = assessmentTemplateActivateSchema.safeParse({
    templateId: formValue(formData, "templateId"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid template selection.");
  }

  try {
    const template = await prisma.assessmentTemplate.findFirst({
      where: {
        id: parsed.data.templateId,
        schoolId: profile.schoolId,
        isPreset: true,
      },
      select: { id: true },
    });

    if (!template) {
      throw new Error("Assessment template not found.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.assessmentTemplate.updateMany({
        where: { schoolId: profile.schoolId, isPreset: true },
        data: { isActive: false },
      });
      await tx.assessmentTemplate.update({
        where: { id: template.id },
        data: { isActive: true },
      });
    });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      throw assessmentSchemaSyncError();
    }
    throw error;
  }

  revalidateAdminPages();
}

export async function deleteAssessmentTemplateAction(formData: FormData) {
  const profile = await requireRole("admin");
  const parsed = assessmentTemplateActivateSchema.safeParse({
    templateId: formValue(formData, "templateId"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid template selection.");
  }

  try {
    const [template, templateCount, usedInScores] = await Promise.all([
      prisma.assessmentTemplate.findFirst({
        where: {
          id: parsed.data.templateId,
          schoolId: profile.schoolId,
          isPreset: true,
        },
        select: { id: true, isActive: true },
      }),
      prisma.assessmentTemplate.count({
        where: { schoolId: profile.schoolId, isPreset: true },
      }),
      prisma.scoreAssessmentValue.findFirst({
        where: {
          schoolId: profile.schoolId,
          assessmentType: {
            templateId: parsed.data.templateId,
          },
        },
        select: { id: true },
      }),
    ]);

    if (!template) {
      throw new Error("Assessment template not found.");
    }

    if (templateCount <= 1) {
      throw new Error("At least one assessment template must remain.");
    }

    if (usedInScores) {
      throw new Error("This template has score records and cannot be deleted.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.assessmentTemplate.delete({
        where: { id: template.id },
      });

      if (!template.isActive) {
        return;
      }

      const fallback = await tx.assessmentTemplate.findFirst({
        where: { schoolId: profile.schoolId, isPreset: true },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (!fallback) {
        return;
      }

      await tx.assessmentTemplate.update({
        where: { id: fallback.id },
        data: { isActive: true },
      });
    });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      throw assessmentSchemaSyncError();
    }
    throw error;
  }

  revalidateAdminPages();
}

export async function assignAssessmentTemplateToTermAction(formData: FormData) {
  const profile = await requireRole("admin");
  const parsed = termAssessmentTemplateSchema.safeParse({
    termId: formValue(formData, "termId"),
    templateId: formValue(formData, "templateId"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid term assessment assignment.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existingTermScores = await tx.score.findFirst({
        where: {
          schoolId: profile.schoolId,
          termId: parsed.data.termId,
        },
        select: { id: true },
      });

      if (existingTermScores) {
        throw new Error("This term already has saved scores, so its assessment setup cannot be changed.");
      }

      await clonePresetTemplateToTermSnapshot(tx, {
        schoolId: profile.schoolId,
        termId: parsed.data.termId,
        presetTemplateId: parsed.data.templateId,
      });
    });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      throw assessmentSchemaSyncError();
    }
    throw error;
  }

  revalidateAdminPages();
}

export async function upsertAssessmentTypeAction(formData: FormData) {
  const profile = await requireRole("admin");

  const parsed = assessmentTypeSchema.safeParse({
    id: formValue(formData, "id") || undefined,
    templateId: formValue(formData, "templateId"),
    name: formValue(formData, "name"),
    weight: formValue(formData, "weight"),
    orderIndex: formValue(formData, "orderIndex"),
    isActive: formValue(formData, "isActive") !== "off",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid assessment type payload.");
  }

  let existingTemplate: { id: string } | null = null;
  let existing: Array<{ id: string; weight: number; isActive: boolean }> = [];
  try {
    existingTemplate = await prisma.assessmentTemplate.findFirst({
      where: {
        id: parsed.data.templateId,
        schoolId: profile.schoolId,
        isPreset: true,
      },
      select: { id: true },
    });

    if (!existingTemplate) {
      throw new Error("Assessment template not found.");
    }

    existing = await prisma.assessmentType.findMany({
      where: {
        schoolId: profile.schoolId,
        templateId: parsed.data.templateId,
      },
      select: {
        id: true,
        weight: true,
        isActive: true,
      },
    });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      throw assessmentSchemaSyncError();
    }
    throw error;
  }

  const currentTotal = existing
    .filter((item) => item.id !== parsed.data.id && item.isActive)
    .reduce((sum, item) => sum + item.weight, 0);

  if (parsed.data.isActive && currentTotal + parsed.data.weight > 100) {
    throw new Error("Total active assessment score allocation cannot exceed 100.");
  }

  if (parsed.data.id) {
    try {
      const target = await prisma.assessmentType.findFirst({
        where: {
          id: parsed.data.id,
          schoolId: profile.schoolId,
        },
        select: { id: true, templateId: true },
      });

      if (!target) {
        throw new Error("Assessment type not found.");
      }

      if (target.templateId !== parsed.data.templateId) {
        throw new Error("Assessment type cannot be moved across templates.");
      }

      await prisma.assessmentType.update({
        where: { id: target.id },
        data: {
          name: parsed.data.name,
          weight: parsed.data.weight,
          orderIndex: parsed.data.orderIndex,
          isActive: parsed.data.isActive,
        },
      });
    } catch (error) {
      if (isPrismaSchemaMismatchError(error)) {
        throw assessmentSchemaSyncError();
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("This assessment name already exists in the selected template.");
      }

      throw error;
    }
  } else {
    try {
      await prisma.assessmentType.create({
        data: {
          schoolId: profile.schoolId,
          templateId: parsed.data.templateId,
          name: parsed.data.name,
          weight: parsed.data.weight,
          orderIndex: parsed.data.orderIndex,
          isActive: parsed.data.isActive,
        },
      });
    } catch (error) {
      if (isPrismaSchemaMismatchError(error)) {
        throw assessmentSchemaSyncError();
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("This assessment name already exists in the selected template.");
      }

      throw error;
    }
  }

  revalidateAdminPages();
}

export async function deleteAssessmentTypeAction(formData: FormData) {
  const profile = await requireRole("admin");
  const id = formValue(formData, "id");

  try {
    const assessmentType = await prisma.assessmentType.findFirst({
      where: {
        id,
        schoolId: profile.schoolId,
        template: {
          isPreset: true,
        },
      },
      select: { id: true },
    });

    if (!assessmentType) {
      throw new Error("Assessment type not found.");
    }

    const usage = await prisma.scoreAssessmentValue.findFirst({
      where: {
        schoolId: profile.schoolId,
        assessmentTypeId: id,
      },
      select: { id: true },
    });

    if (usage) {
      throw new Error("This assessment type has score records and cannot be deleted.");
    }

    await prisma.assessmentType.deleteMany({
      where: {
        id: assessmentType.id,
        schoolId: profile.schoolId,
      },
    });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      throw assessmentSchemaSyncError();
    }
    throw error;
  }

  revalidateAdminPages();
}

export async function upsertGradeScaleAction(formData: FormData) {
  const profile = await requireRole("admin");

  const parsed = gradeScaleSchema.safeParse({
    id: formValue(formData, "id") || undefined,
    gradeLetter: formValue(formData, "gradeLetter").toUpperCase(),
    minScore: formValue(formData, "minScore"),
    maxScore: formValue(formData, "maxScore"),
    orderIndex: formValue(formData, "orderIndex"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid grade scale payload.");
  }

  if (parsed.data.minScore > parsed.data.maxScore) {
    throw new Error("Minimum score cannot be greater than maximum score.");
  }

  if (parsed.data.id) {
    await prisma.gradeScale.updateMany({
      where: {
        id: parsed.data.id,
        schoolId: profile.schoolId,
      },
      data: {
        gradeLetter: parsed.data.gradeLetter,
        minScore: parsed.data.minScore,
        maxScore: parsed.data.maxScore,
        orderIndex: parsed.data.orderIndex,
      },
    });
  } else {
    await prisma.gradeScale.upsert({
      where: {
        schoolId_gradeLetter: {
          schoolId: profile.schoolId,
          gradeLetter: parsed.data.gradeLetter,
        },
      },
      update: {
        minScore: parsed.data.minScore,
        maxScore: parsed.data.maxScore,
        orderIndex: parsed.data.orderIndex,
      },
      create: {
        schoolId: profile.schoolId,
        gradeLetter: parsed.data.gradeLetter,
        minScore: parsed.data.minScore,
        maxScore: parsed.data.maxScore,
        orderIndex: parsed.data.orderIndex,
      },
    });
  }

  revalidateAdminPages();
}

export async function deleteGradeScaleAction(formData: FormData) {
  const profile = await requireRole("admin");
  const id = formValue(formData, "id");

  await prisma.gradeScale.deleteMany({
    where: {
      id,
      schoolId: profile.schoolId,
    },
  });

  revalidateAdminPages();
}

export async function upsertConductCategoryAction(formData: FormData) {
  const profile = await requireRole("admin");
  const parsed = conductCategorySchema.safeParse({
    id: formValue(formData, "id") || undefined,
    sectionId: formValue(formData, "sectionId"),
    name: formValue(formData, "name"),
    maxScore: formValue(formData, "maxScore"),
    orderIndex: formValue(formData, "orderIndex"),
    isActive: formValue(formData, "isActive") !== "off",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid conduct category payload.");
  }

  try {
    if (parsed.data.id) {
      await prisma.conductCategory.updateMany({
        where: {
          id: parsed.data.id,
          schoolId: profile.schoolId,
        },
        data: {
          sectionId: parsed.data.sectionId,
          name: parsed.data.name,
          maxScore: parsed.data.maxScore,
          orderIndex: parsed.data.orderIndex,
          isActive: parsed.data.isActive,
        },
      });
    } else {
      await prisma.conductCategory.create({
        data: {
          schoolId: profile.schoolId,
          sectionId: parsed.data.sectionId,
          name: parsed.data.name,
          maxScore: parsed.data.maxScore,
          orderIndex: parsed.data.orderIndex,
          isActive: parsed.data.isActive,
        },
      });
    }
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      throw conductSchemaSyncError();
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("This conduct category already exists.");
    }
    throw error;
  }

  revalidateAdminPages();
}

export async function upsertConductSectionAction(formData: FormData) {
  const profile = await requireRole("admin");
  const parsed = conductSectionSchema.safeParse({
    id: formValue(formData, "id") || undefined,
    name: formValue(formData, "name"),
    orderIndex: formValue(formData, "orderIndex"),
    isActive: formValue(formData, "isActive") !== "off",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid conduct category payload.");
  }

  try {
    if (parsed.data.id) {
      await prisma.conductSection.updateMany({
        where: {
          id: parsed.data.id,
          schoolId: profile.schoolId,
        },
        data: {
          name: parsed.data.name,
          orderIndex: parsed.data.orderIndex,
          isActive: parsed.data.isActive,
        },
      });
    } else {
      await prisma.conductSection.create({
        data: {
          schoolId: profile.schoolId,
          name: parsed.data.name,
          orderIndex: parsed.data.orderIndex,
          isActive: parsed.data.isActive,
        },
      });
    }
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      throw conductSchemaSyncError();
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("This conduct category already exists.");
    }
    throw error;
  }

  revalidateAdminPages();
}

export async function deleteConductSectionAction(formData: FormData) {
  const profile = await requireRole("admin");
  const id = formValue(formData, "id");

  try {
    const categoryCount = await prisma.conductCategory.count({
      where: {
        schoolId: profile.schoolId,
        sectionId: id,
      },
    });

    if (categoryCount > 0) {
      throw new Error("Delete or move the sub-categories in this conduct category first.");
    }

    await prisma.conductSection.deleteMany({
      where: {
        id,
        schoolId: profile.schoolId,
      },
    });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      throw conductSchemaSyncError();
    }
    throw error;
  }

  revalidateAdminPages();
}

export async function deleteConductCategoryAction(formData: FormData) {
  const profile = await requireRole("admin");
  const id = formValue(formData, "id");

  try {
    const usage = await prisma.studentConduct.findFirst({
      where: {
        schoolId: profile.schoolId,
        conductCategoryId: id,
      },
      select: { id: true },
    });

    if (usage) {
      throw new Error("This conduct category already has saved conduct records and cannot be deleted.");
    }

    await prisma.conductCategory.deleteMany({
      where: {
        id,
        schoolId: profile.schoolId,
      },
    });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      throw conductSchemaSyncError();
    }
    throw error;
  }

  revalidateAdminPages();
}
