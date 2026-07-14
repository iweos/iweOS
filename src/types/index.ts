export type AppRole = "admin" | "teacher";

export type SchoolAccessOption = {
  profileId: string;
  schoolId: string;
  schoolName: string;
  role: "Admin" | "Teacher";
};

export type GradeBand = {
  gradeLetter: string;
  minScore: number;
  maxScore: number;
  orderIndex: number;
};
