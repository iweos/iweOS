import { prisma } from "@/lib/server/prisma";

export function buildStudentSubjectExemptionKey(classId: string, studentId: string, subjectId: string) {
  return `${classId}:${studentId}:${subjectId}`;
}

export function isStudentSubjectExempt(
  exemptionKeys: Set<string>,
  classId: string,
  studentId: string,
  subjectId: string,
) {
  return exemptionKeys.has(buildStudentSubjectExemptionKey(classId, studentId, subjectId));
}

export async function getStudentSubjectExemptionKeySet(options: {
  schoolId: string;
  classId: string;
  studentIds?: string[];
  subjectIds?: string[];
}) {
  const rows = await prisma.studentSubjectExemption.findMany({
    where: {
      schoolId: options.schoolId,
      classId: options.classId,
      ...(options.studentIds && options.studentIds.length > 0 ? { studentId: { in: options.studentIds } } : {}),
      ...(options.subjectIds && options.subjectIds.length > 0 ? { subjectId: { in: options.subjectIds } } : {}),
    },
    select: {
      classId: true,
      studentId: true,
      subjectId: true,
    },
  });

  return new Set(rows.map((row) => buildStudentSubjectExemptionKey(row.classId, row.studentId, row.subjectId)));
}
