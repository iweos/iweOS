import { prisma } from "@/lib/server/prisma";

export type ResultReadiness = {
  ready: boolean;
  expectedSubjects: number;
  scoredSubjects: number;
  missingSubjectIds: string[];
};

export async function getResultReadinessMap({
  schoolId,
  classId,
  termId,
  studentIds,
}: {
  schoolId: string;
  classId: string;
  termId: string;
  studentIds: string[];
}) {
  const readiness = new Map<string, ResultReadiness>();
  if (studentIds.length === 0) return readiness;

  const [classSubjects, exemptions, scores] = await Promise.all([
    prisma.classSubject.findMany({ where: { schoolId, classId }, select: { subjectId: true } }),
    prisma.studentSubjectExemption.findMany({
      where: { schoolId, classId, studentId: { in: studentIds } },
      select: { studentId: true, subjectId: true },
    }),
    prisma.score.findMany({
      where: { schoolId, classId, termId, studentId: { in: studentIds } },
      select: { studentId: true, subjectId: true },
    }),
  ]);

  const classSubjectIds = new Set(classSubjects.map((item) => item.subjectId));
  const exemptByStudent = new Map<string, Set<string>>();
  const scoredByStudent = new Map<string, Set<string>>();

  for (const exemption of exemptions) {
    const subjects = exemptByStudent.get(exemption.studentId) ?? new Set<string>();
    subjects.add(exemption.subjectId);
    exemptByStudent.set(exemption.studentId, subjects);
  }

  for (const score of scores) {
    if (!classSubjectIds.has(score.subjectId)) continue;
    const subjects = scoredByStudent.get(score.studentId) ?? new Set<string>();
    subjects.add(score.subjectId);
    scoredByStudent.set(score.studentId, subjects);
  }

  for (const studentId of studentIds) {
    const exemptSubjects = exemptByStudent.get(studentId) ?? new Set<string>();
    const scoredSubjects = scoredByStudent.get(studentId) ?? new Set<string>();
    const expectedSubjectIds = classSubjects
      .map((item) => item.subjectId)
      .filter((subjectId) => !exemptSubjects.has(subjectId));
    const missingSubjectIds = expectedSubjectIds.filter((subjectId) => !scoredSubjects.has(subjectId));

    readiness.set(studentId, {
      ready: expectedSubjectIds.length > 0 && missingSubjectIds.length === 0,
      expectedSubjects: expectedSubjectIds.length,
      scoredSubjects: expectedSubjectIds.filter((subjectId) => scoredSubjects.has(subjectId)).length,
      missingSubjectIds,
    });
  }

  return readiness;
}
