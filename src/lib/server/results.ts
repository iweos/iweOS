import type { GradeScale, ResultPublication, ResultPublicationStatus } from "@prisma/client";
import { getGradeForTotal } from "@/lib/server/grading";
import { prisma } from "@/lib/server/prisma";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return null;
  }
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

export type ResultSheetData = {
  school: {
    id: string;
    name: string;
    code: string;
    logoUrl: string | null;
  };
  term: {
    id: string;
    sessionLabel: string;
    termLabel: string;
  };
  class: {
    id: string;
    name: string;
  };
  student: {
    id: string;
    studentCode: string;
    fullName: string;
    className: string | null;
    gender: string | null;
  };
  publication: {
    status: ResultPublicationStatus;
    shareToken: string | null;
    publishedAt: string | null;
  } | null;
  summary: {
    subjectsOffered: number;
    average: number;
    grade: string;
    position: string;
    classAverage: number;
    highestAverage: number;
    lowestAverage: number;
  };
  assessmentColumns: string[];
  rows: Array<{
    subjectId: string;
    subjectName: string;
    values: Record<string, number>;
    total: number;
    grade: string;
    subjectPosition: string;
    classAverage: number;
  }>;
  conductSections: Array<{
    sectionId: string;
    sectionName: string;
    items: Array<{
      categoryId: string;
      categoryName: string;
      score: number;
      maxScore: number;
    }>;
  }>;
};

export async function getStudentResultSheet(params: {
  schoolId: string;
  termId: string;
  classId: string;
  studentId: string;
}): Promise<ResultSheetData | null> {
  const [school, term, klass, student, gradeScale, publication, assessmentTemplate, studentConducts, allScores] =
    await Promise.all([
      prisma.school.findUnique({
        where: { id: params.schoolId },
        select: { id: true, name: true, code: true, logoUrl: true },
      }),
      prisma.term.findFirst({
        where: { id: params.termId, schoolId: params.schoolId },
        select: { id: true, sessionLabel: true, termLabel: true },
      }),
      prisma.class.findFirst({
        where: { id: params.classId, schoolId: params.schoolId },
        select: { id: true, name: true },
      }),
      prisma.student.findFirst({
        where: { id: params.studentId, schoolId: params.schoolId },
        select: {
          id: true,
          studentCode: true,
          fullName: true,
          className: true,
          gender: true,
        },
      }),
      prisma.gradeScale.findMany({
        where: { schoolId: params.schoolId },
        orderBy: { orderIndex: "asc" },
      }),
      prisma.resultPublication.findUnique({
        where: {
          studentId_termId: {
            studentId: params.studentId,
            termId: params.termId,
          },
        },
      }),
      prisma.assessmentTemplate.findFirst({
        where: {
          schoolId: params.schoolId,
          termId: params.termId,
          isPreset: false,
        },
        select: {
          types: {
            where: { isActive: true },
            orderBy: { orderIndex: "asc" },
            select: { id: true, name: true, orderIndex: true },
          },
        },
      }),
      prisma.studentConduct.findMany({
        where: {
          schoolId: params.schoolId,
          termId: params.termId,
          classId: params.classId,
          studentId: params.studentId,
        },
        orderBy: [{ conductCategory: { section: { orderIndex: "asc" } } }, { conductCategory: { orderIndex: "asc" } }],
        select: {
          score: true,
          conductCategory: {
            select: {
              id: true,
              name: true,
              maxScore: true,
              section: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.score.findMany({
        where: {
          schoolId: params.schoolId,
          termId: params.termId,
          classId: params.classId,
        },
        orderBy: [{ subject: { name: "asc" } }, { student: { fullName: "asc" } }],
        select: {
          studentId: true,
          subjectId: true,
          total: true,
          grade: true,
          assessmentValues: {
            select: {
              value: true,
              assessmentType: {
                select: {
                  name: true,
                  orderIndex: true,
                },
              },
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

  if (!school || !term || !klass || !student) {
    return null;
  }

  const assessmentColumns =
    assessmentTemplate?.types.map((item) => item.name) ??
    Array.from(
      new Set(
        allScores
          .flatMap((row) =>
            row.assessmentValues
              .slice()
              .sort((a, b) => a.assessmentType.orderIndex - b.assessmentType.orderIndex)
              .map((item) => item.assessmentType.name),
          )
          .filter(Boolean),
      ),
    );

  const classScoresByStudent = new Map<string, typeof allScores>();
  for (const score of allScores) {
    const bucket = classScoresByStudent.get(score.studentId) ?? [];
    bucket.push(score);
    classScoresByStudent.set(score.studentId, bucket);
  }

  const classAverages = Array.from(classScoresByStudent.entries()).map(([studentId, scores]) => ({
    studentId,
    average: average(scores.map((item) => toNumber(item.total))),
  }));

  classAverages.sort((a, b) => b.average - a.average);
  const selectedStudentAverage = classAverages.find((item) => item.studentId === student.id)?.average ?? 0;
  const overallPositionIndex = classAverages.findIndex((item) => item.studentId === student.id);
  const position = overallPositionIndex === -1 ? "-" : `${overallPositionIndex + 1} / ${classAverages.length}`;
  const classAverage = average(classAverages.map((item) => item.average));
  const highestAverage = classAverages[0]?.average ?? 0;
  const lowestAverage = classAverages[classAverages.length - 1]?.average ?? 0;

  const studentRows = (classScoresByStudent.get(student.id) ?? []).map((score) => {
    const subjectScores = allScores
      .filter((item) => item.subjectId === score.subjectId)
      .sort((a, b) => toNumber(b.total) - toNumber(a.total));
    const subjectPositionIndex = subjectScores.findIndex((item) => item.studentId === student.id);
    const subjectAverage = average(subjectScores.map((item) => toNumber(item.total)));

    return {
      subjectId: score.subject.id,
      subjectName: score.subject.name,
      values: Object.fromEntries(
        assessmentColumns.map((column) => [
          column,
          toNumber(score.assessmentValues.find((item) => item.assessmentType.name === column)?.value ?? 0),
        ]),
      ),
      total: toNumber(score.total),
      grade: score.grade ?? (gradeScale.length > 0 ? getGradeForTotal(toNumber(score.total), gradeScale) : "-"),
      subjectPosition: subjectPositionIndex === -1 ? "-" : `${subjectPositionIndex + 1} / ${subjectScores.length}`,
      classAverage: subjectAverage,
    };
  });

  const conductSectionMap = new Map<
    string,
    {
      sectionId: string;
      sectionName: string;
      items: Array<{
        categoryId: string;
        categoryName: string;
        score: number;
        maxScore: number;
      }>;
    }
  >();

  for (const item of studentConducts) {
    const existing = conductSectionMap.get(item.conductCategory.section.id) ?? {
      sectionId: item.conductCategory.section.id,
      sectionName: item.conductCategory.section.name,
      items: [],
    };
    existing.items.push({
      categoryId: item.conductCategory.id,
      categoryName: item.conductCategory.name,
      score: toNumber(item.score),
      maxScore: item.conductCategory.maxScore,
    });
    conductSectionMap.set(existing.sectionId, existing);
  }

  return {
    school,
    term,
    class: klass,
    student,
    publication: publication
      ? {
          status: publication.status,
          shareToken: publication.shareToken,
          publishedAt: formatDate(publication.publishedAt),
        }
      : null,
    summary: {
      subjectsOffered: studentRows.length,
      average: selectedStudentAverage,
      grade: gradeScale.length > 0 ? getGradeForTotal(selectedStudentAverage, gradeScale) : "-",
      position,
      classAverage,
      highestAverage,
      lowestAverage,
    },
    assessmentColumns,
    rows: studentRows,
    conductSections: Array.from(conductSectionMap.values()),
  };
}

export async function getPublishedResultSheetByToken(token: string): Promise<ResultSheetData | null> {
  const publication = await prisma.resultPublication.findUnique({
    where: { shareToken: token },
    select: {
      schoolId: true,
      studentId: true,
      termId: true,
      classId: true,
      status: true,
    },
  });

  if (!publication || publication.status !== "PUBLISHED") {
    return null;
  }

  return getStudentResultSheet({
    schoolId: publication.schoolId,
    studentId: publication.studentId,
    termId: publication.termId,
    classId: publication.classId,
  });
}

export function buildResultSharePath(token: string) {
  return `/results/${token}`;
}

export function buildResultPublicationPayload(
  publication: ResultPublication | null,
  token?: string,
): {
  status: ResultPublicationStatus;
  shareToken: string;
} {
  if (publication) {
    return {
      status: publication.status,
      shareToken: publication.shareToken,
    };
  }

  return {
    status: "DRAFT",
    shareToken: token ?? crypto.randomUUID(),
  };
}
