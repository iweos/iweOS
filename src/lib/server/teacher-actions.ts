"use server";

import { ProfileRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calculateAssessmentTotal, getGradeForTotal } from "@/lib/server/grading";
import { requireTeacherPortalContext } from "@/lib/server/auth";
import { isPrismaSchemaMismatchError } from "@/lib/server/prisma-errors";
import { prisma } from "@/lib/server/prisma";
import { scoreValueSchema } from "@/lib/validation/schemas";

export type SaveStudentScoresInput = {
  teacherProfileId?: string;
  termId: string;
  classId: string;
  subjectId: string;
  studentId: string;
  scores: Array<{
    assessmentTypeId: string;
    value: string | number;
  }>;
};

export type SaveStudentScoresResult =
  | {
      ok: true;
      message: string;
      total: number;
      grade: string;
      values: Record<string, string>;
    }
  | {
      ok: false;
      message: string;
    };

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseScoreOrZero(raw: FormDataEntryValue | null) {
  const parsed = scoreValueSchema.safeParse(raw ?? "0");
  if (!parsed.success) {
    return 0;
  }

  return parsed.data;
}

function buildGradeEntryRedirectPath(formData: FormData, status: "success" | "error", message: string) {
  const params = new URLSearchParams();
  const teacherProfileId = formValue(formData, "teacherProfileId");
  const termId = formValue(formData, "termId");
  const classId = formValue(formData, "classId");
  const subjectId = formValue(formData, "subjectId");

  if (teacherProfileId) {
    params.set("teacherProfileId", teacherProfileId);
  }
  if (termId) {
    params.set("termId", termId);
  }
  if (classId) {
    params.set("classId", classId);
  }
  if (subjectId) {
    params.set("subjectId", subjectId);
  }

  params.set("status", status);
  params.set("message", message);

  return `/app/teacher/grade-entry?${params.toString()}`;
}

function parseNumberishScoreOrZero(raw: string | number | null | undefined) {
  const parsed = scoreValueSchema.safeParse(raw ?? "0");
  if (!parsed.success) {
    return 0;
  }

  return parsed.data;
}

export async function saveStudentScoresAction(input: SaveStudentScoresInput): Promise<SaveStudentScoresResult> {
  try {
    const requestedTeacherId = input.teacherProfileId?.trim() || undefined;
    const context = await requireTeacherPortalContext(requestedTeacherId);
    const actorProfile = context.actorProfile;
    const termId = input.termId.trim();
    const classId = input.classId.trim();
    const subjectId = input.subjectId.trim();
    const studentId = input.studentId.trim();

    if (!termId || !classId || !subjectId || !studentId) {
      return { ok: false, message: "Term, class, subject, and student are required." };
    }

    const assignmentPromise =
      context.mode === "admin_override"
        ? Promise.resolve({ id: "admin-override" })
        : prisma.teacherClassAssignment.findFirst({
            where: {
              schoolId: actorProfile.schoolId,
              teacherProfileId: context.effectiveTeacherProfile.id,
              classId,
            },
          });

    const [assignment, term, classSubject, gradeScale, assessmentTypes, enrollment] = await Promise.all([
      assignmentPromise,
      prisma.term.findFirst({
        where: {
          id: termId,
          schoolId: actorProfile.schoolId,
        },
      }),
      prisma.classSubject.findFirst({
        where: {
          schoolId: actorProfile.schoolId,
          classId,
          subjectId,
        },
      }),
      prisma.gradeScale.findMany({
        where: { schoolId: actorProfile.schoolId },
        orderBy: { orderIndex: "asc" },
      }),
      prisma.assessmentType.findMany({
        where: {
          schoolId: actorProfile.schoolId,
          isActive: true,
          template: {
            isActive: true,
          },
        },
        orderBy: { orderIndex: "asc" },
      }),
      prisma.enrollment.findFirst({
        where: {
          schoolId: actorProfile.schoolId,
          studentId,
          classId,
          termId,
        },
        select: { id: true },
      }),
    ]);

    if (!assignment) {
      return { ok: false, message: "Selected teacher is not assigned to this class." };
    }
    if (!term) {
      return { ok: false, message: "Selected term does not belong to your school." };
    }
    if (!classSubject) {
      return { ok: false, message: "Selected subject is not assigned to this class." };
    }
    if (!enrollment) {
      return { ok: false, message: "This student is not enrolled for the selected class and term." };
    }
    if (gradeScale.length === 0) {
      return { ok: false, message: "Grade scale is not configured." };
    }
    if (assessmentTypes.length === 0) {
      return { ok: false, message: "Assessment types are not configured." };
    }

    const submittedValueMap = new Map(input.scores.map((item) => [item.assessmentTypeId, item.value]));
    const assessmentInputs = assessmentTypes.map((assessment) => {
      const value = parseNumberishScoreOrZero(submittedValueMap.get(assessment.id));
      if (value > assessment.weight) {
        throw new Error(`${assessment.name} cannot exceed ${assessment.weight}.`);
      }
      return {
        name: assessment.name,
        assessmentTypeId: assessment.id,
        value,
        weight: assessment.weight,
      };
    });

    const weightTotal = assessmentInputs.reduce((sum, item) => sum + item.weight, 0);
    if (weightTotal !== 100) {
      return { ok: false, message: "Active assessment max scores must add up to exactly 100 before saving scores." };
    }

    const total = calculateAssessmentTotal(assessmentInputs.map((item) => ({ score: item.value })));
    const grade = getGradeForTotal(total, gradeScale);
    const valueByName = new Map(assessmentInputs.map((item) => [item.name.trim().toUpperCase(), item.value]));
    const ca1 = valueByName.get("CA1") ?? assessmentInputs[0]?.value ?? 0;
    const ca2 = valueByName.get("CA2") ?? assessmentInputs[1]?.value ?? 0;
    const exam = valueByName.get("EXAM") ?? assessmentInputs[assessmentInputs.length - 1]?.value ?? 0;

    await prisma.$transaction(async (tx) => {
      const score = await tx.score.upsert({
        where: {
          studentId_subjectId_termId: {
            studentId,
            subjectId,
            termId,
          },
        },
        update: {
          schoolId: actorProfile.schoolId,
          classId,
          teacherProfileId:
            context.mode === "admin_override" && actorProfile.role === ProfileRole.ADMIN
              ? actorProfile.id
              : context.effectiveTeacherProfile.id,
          ca1,
          ca2,
          exam,
          total,
          grade,
        },
        create: {
          schoolId: actorProfile.schoolId,
          termId,
          classId,
          studentId,
          subjectId,
          teacherProfileId:
            context.mode === "admin_override" && actorProfile.role === ProfileRole.ADMIN
              ? actorProfile.id
              : context.effectiveTeacherProfile.id,
          ca1,
          ca2,
          exam,
          total,
          grade,
        },
      });

      for (const item of assessmentInputs) {
        await tx.scoreAssessmentValue.upsert({
          where: {
            scoreId_assessmentTypeId: {
              scoreId: score.id,
              assessmentTypeId: item.assessmentTypeId,
            },
          },
          update: {
            schoolId: actorProfile.schoolId,
            value: item.value,
          },
          create: {
            schoolId: actorProfile.schoolId,
            scoreId: score.id,
            assessmentTypeId: item.assessmentTypeId,
            value: item.value,
          },
        });
      }
    });

    revalidatePath("/app/teacher/dashboard");
    revalidatePath("/app/teacher/grade-entry");
    revalidatePath("/app/teacher/results");

    return {
      ok: true,
      message: "Scores saved successfully.",
      total,
      grade,
      values: Object.fromEntries(assessmentInputs.map((item) => [item.assessmentTypeId, item.value.toString()])),
    };
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return {
        ok: false,
        message: "Score setup is not yet available in production. Run the latest Prisma migration on the production database, then redeploy.",
      };
    }

    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to save this row right now.",
    };
  }
}

export async function saveScoresAction(formData: FormData) {
  try {
    const requestedTeacherId = formValue(formData, "teacherProfileId") || undefined;
    const context = await requireTeacherPortalContext(requestedTeacherId);
    const actorProfile = context.actorProfile;

    const termId = formValue(formData, "termId");
    const classId = formValue(formData, "classId");
    const subjectId = formValue(formData, "subjectId");

    if (!termId || !classId || !subjectId) {
      throw new Error("Term, class, and subject are required.");
    }

    const assignmentPromise =
      context.mode === "admin_override"
        ? Promise.resolve({ id: "admin-override" })
        : prisma.teacherClassAssignment.findFirst({
            where: {
              schoolId: actorProfile.schoolId,
              teacherProfileId: context.effectiveTeacherProfile.id,
              classId,
            },
          });

    const [assignment, term, classSubject, gradeScale, assessmentTypes] = await Promise.all([
      assignmentPromise,
      prisma.term.findFirst({
        where: {
          id: termId,
          schoolId: actorProfile.schoolId,
        },
      }),
      prisma.classSubject.findFirst({
        where: {
          schoolId: actorProfile.schoolId,
          classId,
          subjectId,
        },
      }),
      prisma.gradeScale.findMany({
        where: { schoolId: actorProfile.schoolId },
        orderBy: { orderIndex: "asc" },
      }),
      prisma.assessmentType.findMany({
        where: {
          schoolId: actorProfile.schoolId,
          isActive: true,
          template: {
            isActive: true,
          },
        },
        orderBy: { orderIndex: "asc" },
      }),
    ]);

    if (!assignment) {
      throw new Error("Selected teacher is not assigned to this class.");
    }

    if (!term) {
      throw new Error("Selected term does not belong to your school.");
    }

    if (!classSubject) {
      throw new Error("Selected subject is not assigned to this class.");
    }

    if (gradeScale.length === 0) {
      throw new Error("Grade scale is not configured.");
    }

    if (assessmentTypes.length === 0) {
      throw new Error("Assessment types are not configured.");
    }

    const weightTotal = assessmentTypes.reduce((sum, item) => sum + item.weight, 0);
    if (weightTotal !== 100) {
      throw new Error("Active assessment max scores must add up to exactly 100 before saving scores.");
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        schoolId: actorProfile.schoolId,
        classId,
        termId,
      },
      select: {
        studentId: true,
      },
    });

    if (enrollments.length === 0) {
      throw new Error("No enrolled students were found for this class and term.");
    }

    await prisma.$transaction(async (tx) => {
      for (const row of enrollments) {
        const assessmentInputs = assessmentTypes.map((assessment) => {
          const value = parseScoreOrZero(formData.get(`score_${row.studentId}_${assessment.id}`));
          if (value > assessment.weight) {
            throw new Error(`${assessment.name} cannot exceed ${assessment.weight}.`);
          }
          return {
            name: assessment.name,
            assessmentTypeId: assessment.id,
            value,
            weight: assessment.weight,
          };
        });

        const total = calculateAssessmentTotal(assessmentInputs.map((item) => ({ score: item.value })));
        const grade = getGradeForTotal(total, gradeScale);
        const valueByName = new Map(assessmentInputs.map((item) => [item.name.trim().toUpperCase(), item.value]));
        const ca1 = valueByName.get("CA1") ?? assessmentInputs[0]?.value ?? 0;
        const ca2 = valueByName.get("CA2") ?? assessmentInputs[1]?.value ?? 0;
        const exam = valueByName.get("EXAM") ?? assessmentInputs[assessmentInputs.length - 1]?.value ?? 0;

        const score = await tx.score.upsert({
          where: {
            studentId_subjectId_termId: {
              studentId: row.studentId,
              subjectId,
              termId,
            },
          },
          update: {
            schoolId: actorProfile.schoolId,
            classId,
            teacherProfileId:
              context.mode === "admin_override" && actorProfile.role === ProfileRole.ADMIN
                ? actorProfile.id
                : context.effectiveTeacherProfile.id,
            ca1,
            ca2,
            exam,
            total,
            grade,
          },
          create: {
            schoolId: actorProfile.schoolId,
            termId,
            classId,
            studentId: row.studentId,
            subjectId,
            teacherProfileId:
              context.mode === "admin_override" && actorProfile.role === ProfileRole.ADMIN
                ? actorProfile.id
                : context.effectiveTeacherProfile.id,
            ca1,
            ca2,
            exam,
            total,
            grade,
          },
        });

        for (const item of assessmentInputs) {
          await tx.scoreAssessmentValue.upsert({
            where: {
              scoreId_assessmentTypeId: {
                scoreId: score.id,
                assessmentTypeId: item.assessmentTypeId,
              },
            },
            update: {
              schoolId: actorProfile.schoolId,
              value: item.value,
            },
            create: {
              schoolId: actorProfile.schoolId,
              scoreId: score.id,
              assessmentTypeId: item.assessmentTypeId,
              value: item.value,
            },
          });
        }
      }
    });

    revalidatePath("/app/teacher/dashboard");
    revalidatePath("/app/teacher/grade-entry");
    revalidatePath("/app/teacher/results");
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      redirect(
        buildGradeEntryRedirectPath(
          formData,
          "error",
          "Score setup is not yet available in production. Run the latest Prisma migration on the production database, then redeploy.",
        ),
      );
    }

    const message = error instanceof Error ? error.message : "Unable to save scores right now.";
    redirect(buildGradeEntryRedirectPath(formData, "error", message));
  }

  redirect(buildGradeEntryRedirectPath(formData, "success", "Scores saved successfully."));
}
