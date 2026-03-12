import type { GradeScale } from "@prisma/client";

type ScoreItem = {
  score: number;
};

export function calculateAssessmentTotal(items: ScoreItem[]) {
  const total = items.reduce((sum, item) => sum + item.score, 0);
  return Number(total.toFixed(2));
}

export function getGradeForTotal(total: number, scale: GradeScale[]) {
  const matched = scale
    .slice()
    .sort((a, b) => b.minScore - a.minScore)
    .find((item) => total >= item.minScore && total <= item.maxScore);

  return matched?.gradeLetter ?? "F";
}

export function toSafeNumber(input: unknown, fallback = 0) {
  if (typeof input === "number" && Number.isFinite(input)) {
    return input;
  }

  if (typeof input === "string") {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}
