import "server-only";
import { prisma } from "@/lib/server/prisma";
import { getResultReadinessMap } from "@/lib/server/result-readiness";
import { RESULT_STATES, trackedResultState } from "@/lib/result-tracking";

// Enrollment is the denominator; publication records are optional, not the roster.
export async function schoolResultTracking(schoolId: string, termId: string, classId?: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { schoolId, termId, ...(classId ? { classId } : {}), student: { schoolId, status: "active" }, class: { schoolId }, term: { schoolId } },
    select: { studentId: true, classId: true, student: { select: { fullName: true, studentCode: true } }, class: { select: { name: true } } },
    orderBy: [{ student: { fullName: "asc" } }, { studentId: "asc" }],
  });
  const publications = await prisma.resultPublication.findMany({ where: { schoolId, termId }, select: { studentId: true, status: true } });
  const publicationMap = new Map(publications.map(p => [p.studentId, p.status]));
  const grouped = new Map<string, typeof enrollments>();
  for (const enrollment of enrollments) grouped.set(enrollment.classId, [...(grouped.get(enrollment.classId) ?? []), enrollment]);
  const students = new Map<string, { id: string; name: string; code: string; classes: string[]; ready: boolean; scored: number; expected: number }>();
  // Bound database concurrency and reuse the exact publication-readiness policy.
  for (const [groupClassId, roster] of grouped) {
    const readiness = await getResultReadinessMap({ schoolId, termId, classId: groupClassId, studentIds: roster.map(e => e.studentId) });
    for (const enrollment of roster) {
      const item = readiness.get(enrollment.studentId)!;
      const row = students.get(enrollment.studentId) ?? { id: enrollment.studentId, name: enrollment.student.fullName, code: enrollment.student.studentCode, classes: [], ready: true, scored: 0, expected: 0 };
      row.classes.push(enrollment.class.name);
      row.ready = row.ready && item.ready;
      row.scored += item.scoredSubjects;
      row.expected += item.expectedSubjects;
      students.set(row.id, row);
    }
  }
  const rows = [...students.values()].map(row => ({ ...row, state: trackedResultState(publicationMap.get(row.id), row.ready, row.scored) }));
  const counts = Object.fromEntries(RESULT_STATES.map(state => [state, rows.filter(row => row.state === state).length])) as Record<typeof RESULT_STATES[number], number>;
  return { rows, counts, total: rows.length };
}
