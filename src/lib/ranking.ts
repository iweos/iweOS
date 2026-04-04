function normalizeRankingScore(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN)) {
    return Number.NEGATIVE_INFINITY;
  }

  return Math.round((value as number) * 100) / 100;
}

type RankEntry = {
  id: string;
  score: number | null | undefined;
};

export function buildCompetitionRankMap(entries: RankEntry[]) {
  const sorted = entries
    .slice()
    .sort((left, right) => normalizeRankingScore(right.score) - normalizeRankingScore(left.score));

  const rankMap = new Map<string, number>();
  let previousScore: number | null = null;
  let previousRank = 0;

  sorted.forEach((entry, index) => {
    const score = normalizeRankingScore(entry.score);
    const rank = previousScore !== null && score === previousScore ? previousRank : index + 1;
    rankMap.set(entry.id, rank);
    previousScore = score;
    previousRank = rank;
  });

  return rankMap;
}
