export type AppRole = "admin" | "teacher";

export type GradeBand = {
  gradeLetter: string;
  minScore: number;
  maxScore: number;
  orderIndex: number;
};
