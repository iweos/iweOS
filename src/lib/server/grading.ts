import type { GradeScale } from "@prisma/client";

type WeightedScoreItem = {
  score: number;
  weight: number;
};

export function calculateWeightedTotal(items: WeightedScoreItem[]) {
  const weighted = items.reduce((sum, item) => sum + item.score * item.weight, 0) / 100;
  return Number(weighted.toFixed(2));
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
