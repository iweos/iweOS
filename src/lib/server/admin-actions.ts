"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { Prisma, ProfileRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/server/auth";
import { isPrismaSchemaMismatchError, schemaSyncMessage } from "@/lib/server/prisma-errors";
import { prisma } from "@/lib/server/prisma";
import {
  assessmentTemplateActivateSchema,
  assessmentTemplateSchema,
  assessmentTypeSchema,
  classSchema,
  classSubjectBatchSchema,
  classSubjectAssignmentSchema,
  enrollmentBulkSchema,
  enrollmentSchema,
  gradeScaleSchema,
  schoolSchema,
  studentBulkSchema,
  studentSchema,
  studentUpdateSchema,
  subjectSchema,
  teacherAssignmentSchema,
  teacherSchema,
  termSchema,
} from "@/lib/validation/schemas";

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectSubjectsStatus(status: "success" | "error", message: string): never {
  const query = new URLSearchParams({
    status,
    message,
  });
  redirect(`/app/admin/subjects?${query.toString()}`);
}

function revalidateAdminPages() {
  revalidatePath("/app/admin/dashboard");
  revalidatePath("/app/admin/settings");
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
  revalidatePath("/app/admin/grading/grades");
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
  revalidatePath("/app/teacher/grade-entry");
  revalidatePath("/app/teacher/results");
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
  const parsed = schoolSchema.safeParse({
    name: formValue(formData, "name"),
    code: formValue(formData, "code") || undefined,
    country: formValue(formData, "country"),
    logoUrl: formValue(formData, "logoUrl"),
    addressLine1: formValue(formData, "addressLine1"),
    addressLine2: formValue(formData, "addressLine2"),
    city: formValue(formData, "city"),
    state: formValue(formData, "state"),
    postalCode: formValue(formData, "postalCode"),
    phone: formValue(formData, "phone"),
    website: formValue(formData, "website"),
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

  await prisma.school.update({
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
  });

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

  if (existingLink && existingLink.id !== teacher.id) {
    throw new Error(
      existingLink.schoolId === actor.schoolId
        ? `This account is already linked to ${existingLink.email} in this school.`
        : "This account is already linked to another school profile.",
    );
  }

  const updated = await prisma.profile.update({
    where: { id: teacher.id },
    data: {
      clerkUserId: clerkUser.id,
      isActive: true,
    },
  });

  await syncRoleMetadata(updated.clerkUserId, updated.role, updated.schoolId);
  revalidateAdminPages();
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

  const parsed = studentUpdateSchema.safeParse({
    studentId: formValue(formData, "studentId"),
    firstName: formValue(formData, "firstName"),
    lastName: formValue(formData, "lastName"),
    className: formValue(formData, "className"),
    address: formValue(formData, "address"),
    guardianName: formValue(formData, "guardianName"),
    guardianPhone: formValue(formData, "guardianPhone"),
    guardianEmail: formValue(formData, "guardianEmail"),
    status: formValue(formData, "status") || "active",
    gender: formValue(formData, "gender"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid student update payload.");
  }

  const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();

  try {
    await prisma.student.updateMany({
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
      },
    });
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

  let student: Awaited<ReturnType<typeof prisma.student.findFirst>> = null;
  let klass: Awaited<ReturnType<typeof prisma.class.findFirst>> = null;
  let term: Awaited<ReturnType<typeof prisma.term.findFirst>> = null;

  try {
    [student, klass, term] = await Promise.all([
      prisma.student.findFirst({ where: { id: parsed.data.studentId, schoolId: profile.schoolId } }),
      prisma.class.findFirst({ where: { id: parsed.data.classId, schoolId: profile.schoolId } }),
      prisma.term.findFirst({ where: { id: parsed.data.termId, schoolId: profile.schoolId } }),
    ]);
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      throw studentSchemaSyncError();
    }
    throw error;
  }

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

  let klass: Awaited<ReturnType<typeof prisma.class.findFirst>> = null;
  let term: Awaited<ReturnType<typeof prisma.term.findFirst>> = null;

  try {
    [klass, term] = await Promise.all([
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
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      throw studentSchemaSyncError();
    }
    throw error;
  }

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

  await prisma.$transaction(
    eligibleStudents.map((student) =>
      prisma.enrollment.upsert({
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
      }),
    ),
  );

  revalidateAdminPages();
}

export async function removeEnrollmentAction(formData: FormData) {
  const profile = await requireRole("admin");
  const enrollmentId = formValue(formData, "enrollmentId");

  await prisma.enrollment.deleteMany({
    where: {
      id: enrollmentId,
      schoolId: profile.schoolId,
    },
  });

  revalidateAdminPages();
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
        where: { schoolId: profile.schoolId },
      });

      let templateId = parsed.data.id;

      if (templateId) {
        const existingTemplate = await tx.assessmentTemplate.findFirst({
          where: {
            id: templateId,
            schoolId: profile.schoolId,
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
          where: { schoolId: profile.schoolId },
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
      },
      select: { id: true },
    });

    if (!template) {
      throw new Error("Assessment template not found.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.assessmentTemplate.updateMany({
        where: { schoolId: profile.schoolId },
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
        },
        select: { id: true, isActive: true },
      }),
      prisma.assessmentTemplate.count({
        where: { schoolId: profile.schoolId },
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
        where: { schoolId: profile.schoolId },
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
        id,
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
