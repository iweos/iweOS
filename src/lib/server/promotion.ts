import type { GradeScale } from "@prisma/client";
import { getGradeForTotal } from "@/lib/server/grading";

type StudentInput = {
  id: string;
  studentCode: string;
  fullName: string;
  status: string;
};

type ScoreInput = {
  studentId: string;
  subjectId: string;
  termId: string;
  total: number;
};

type SubjectInput = {
  id: string;
  name: string;
};

type PromotionPolicyInput = {
  minimumPassedSubjects?: number | null;
  minimumAverage?: number | null;
  passGradeId?: string | null;
  requiredCompulsorySubjectsAtGrade?: number | null;
  requiredCompulsoryGradeId?: string | null;
  allowManualOverride?: boolean | null;
  compulsorySubjectIds?: string[];
};

export type EffectivePromotionPolicy = {
  minimumPassedSubjects: number;
  minimumAverage: number;
  passGradeId: string | null;
  passGradeLabel: string;
  passScoreThreshold: number;
  requiredCompulsorySubjectsAtGrade: number;
  requiredCompulsoryGradeId: string | null;
  requiredCompulsoryGradeLabel: string;
  requiredCompulsoryGradeScoreThreshold: number;
  allowManualOverride: boolean;
  compulsorySubjectIds: string[];
};

export type PromotionCandidateRow = {
  studentId: string;
  studentCode: string;
  fullName: string;
  status: string;
  annualAverage: number | null;
  grade: string;
  rank: string;
  termCoverage: number;
  scoreRows: number;
  passedSubjects: number;
  averageMet: boolean;
  compulsoryMet: boolean;
  isEligible: boolean;
  canPromote: boolean;
  eligibilityReason: string;
};

export function getDefaultPromotionPassGrade(gradeScale: GradeScale[]) {
  const rowCoveringFifty = gradeScale.find((item) => 50 >= item.minScore && 50 <= item.maxScore);
  if (rowCoveringFifty) {
    return rowCoveringFifty;
  }

  const sorted = gradeScale.slice().sort((a, b) => a.minScore - b.minScore);
  return sorted.find((item) => item.minScore >= 50) ?? sorted[sorted.length - 1] ?? null;
}

export function resolvePromotionPolicy(
  policy: PromotionPolicyInput | null | undefined,
  gradeScale: GradeScale[],
): EffectivePromotionPolicy {
  const defaultPassGrade = getDefaultPromotionPassGrade(gradeScale);
  const passGrade =
    (policy?.passGradeId ? gradeScale.find((item) => item.id === policy.passGradeId) : null) ?? defaultPassGrade;

  return {
    minimumPassedSubjects: policy?.minimumPassedSubjects ?? 5,
    minimumAverage: Number(policy?.minimumAverage ?? 0),
    passGradeId: passGrade?.id ?? null,
    passGradeLabel: passGrade?.gradeLetter ?? "50+",
    passScoreThreshold: passGrade?.minScore ?? 50,
    requiredCompulsorySubjectsAtGrade: policy?.requiredCompulsorySubjectsAtGrade ?? 0,
    requiredCompulsoryGradeId:
      (policy?.requiredCompulsoryGradeId
        ? gradeScale.find((item) => item.id === policy.requiredCompulsoryGradeId)?.id
        : null) ?? null,
    requiredCompulsoryGradeLabel:
      (policy?.requiredCompulsoryGradeId
        ? gradeScale.find((item) => item.id === policy.requiredCompulsoryGradeId)?.gradeLetter
        : null) ?? "-",
    requiredCompulsoryGradeScoreThreshold:
      (policy?.requiredCompulsoryGradeId
        ? gradeScale.find((item) => item.id === policy.requiredCompulsoryGradeId)?.minScore
        : null) ?? 0,
    allowManualOverride: policy?.allowManualOverride ?? true,
    compulsorySubjectIds: policy?.compulsorySubjectIds ?? [],
  };
}

export function evaluatePromotionCandidates({
  students,
  scores,
  sessionTermCount,
  gradeScale,
  policy,
  subjects,
}: {
  students: StudentInput[];
  scores: ScoreInput[];
  sessionTermCount: number;
  gradeScale: GradeScale[];
  policy: EffectivePromotionPolicy;
  subjects: SubjectInput[];
}): PromotionCandidateRow[] {
  const subjectsById = new Map(subjects.map((subject) => [subject.id, subject.name]));
  const scoresByStudent = new Map<string, ScoreInput[]>();

  for (const score of scores) {
    const bucket = scoresByStudent.get(score.studentId) ?? [];
    bucket.push(score);
    scoresByStudent.set(score.studentId, bucket);
  }

  const rankedRows = students
    .map((student) => {
      const studentScores = scoresByStudent.get(student.id) ?? [];
      const subjectBuckets = new Map<string, number[]>();

      for (const score of studentScores) {
        const subjectValues = subjectBuckets.get(score.subjectId) ?? [];
        subjectValues.push(score.total);
        subjectBuckets.set(score.subjectId, subjectValues);
      }

      const annualSubjectResults = Array.from(subjectBuckets.entries()).map(([subjectId, values]) => {
        const average = values.reduce((sum, value) => sum + value, 0) / values.length;
        return {
          subjectId,
          subjectName: subjectsById.get(subjectId) ?? "Subject",
          average,
          grade: gradeScale.length > 0 ? getGradeForTotal(average, gradeScale) : "-",
          passed: average >= policy.passScoreThreshold,
        };
      });

      const annualAverage =
        annualSubjectResults.length > 0
          ? annualSubjectResults.reduce((sum, item) => sum + item.average, 0) / annualSubjectResults.length
          : null;
      const passedSubjects = annualSubjectResults.filter((item) => item.passed).length;
      const averageMet = annualAverage !== null && annualAverage >= policy.minimumAverage;
      const compulsoryFailures = policy.compulsorySubjectIds
        .map((subjectId) => {
          const result = annualSubjectResults.find((item) => item.subjectId === subjectId);
          return result?.passed ? null : subjectsById.get(subjectId) ?? "Subject";
        })
        .filter((value): value is string => Boolean(value));
      const compulsoryMet = compulsoryFailures.length === 0;
      const compulsorySubjectsAtRequiredGrade = policy.compulsorySubjectIds.reduce((count, subjectId) => {
        const result = annualSubjectResults.find((item) => item.subjectId === subjectId);
        if (result && result.average >= policy.requiredCompulsoryGradeScoreThreshold) {
          return count + 1;
        }
        return count;
      }, 0);
      const compulsoryGradeCountMet =
        policy.requiredCompulsorySubjectsAtGrade === 0 ||
        compulsorySubjectsAtRequiredGrade >= policy.requiredCompulsorySubjectsAtGrade;
      const passedCountMet = passedSubjects >= policy.minimumPassedSubjects;
      const hasAnnualScores = annualAverage !== null;
      const isEligible = hasAnnualScores && passedCountMet && averageMet && compulsoryMet && compulsoryGradeCountMet;

      const reasons: string[] = [];
      if (!hasAnnualScores) {
        reasons.push("No annual scores recorded yet.");
      } else {
        if (!passedCountMet) {
          reasons.push(`Passed ${passedSubjects} subject${passedSubjects === 1 ? "" : "s"}; need ${policy.minimumPassedSubjects}.`);
        }
        if (!averageMet) {
          reasons.push(`Average ${annualAverage.toFixed(1)} is below ${policy.minimumAverage.toFixed(1)}.`);
        }
        if (!compulsoryMet) {
          reasons.push(`Compulsory subjects not passed: ${compulsoryFailures.join(", ")}.`);
        }
        if (!compulsoryGradeCountMet) {
          reasons.push(
            `Only ${compulsorySubjectsAtRequiredGrade} compulsory subject${compulsorySubjectsAtRequiredGrade === 1 ? "" : "s"} reached ${policy.requiredCompulsoryGradeLabel}; need ${policy.requiredCompulsorySubjectsAtGrade}.`,
          );
        }
      }

      return {
        studentId: student.id,
        studentCode: student.studentCode,
        fullName: student.fullName,
        status: student.status,
        annualAverage,
        grade: annualAverage !== null && gradeScale.length > 0 ? getGradeForTotal(annualAverage, gradeScale) : "-",
        termCoverage: new Set(studentScores.map((score) => score.termId)).size,
        scoreRows: studentScores.length,
        passedSubjects,
        averageMet,
        compulsoryMet,
        isEligible,
        canPromote: policy.allowManualOverride || isEligible,
        eligibilityReason: reasons[0] ?? "Meets this school's promotion rules.",
      };
    })
    .sort((a, b) => (b.annualAverage ?? Number.NEGATIVE_INFINITY) - (a.annualAverage ?? Number.NEGATIVE_INFINITY));

  return rankedRows.map((row, index) => ({
    ...row,
    rank: row.annualAverage === null ? "-" : `${index + 1} / ${rankedRows.length}`,
    termCoverage: Math.min(row.termCoverage, sessionTermCount),
  }));
}
