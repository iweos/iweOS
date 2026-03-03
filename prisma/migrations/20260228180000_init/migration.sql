CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "ProfileRole" AS ENUM ('admin', 'teacher');

CREATE TABLE "schools" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "country" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "profiles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "clerk_user_id" TEXT,
  "school_id" UUID NOT NULL,
  "role" "ProfileRole" NOT NULL,
  "full_name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "profiles_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "profiles_clerk_user_id_key" ON "profiles"("clerk_user_id");
CREATE INDEX "profiles_school_id_idx" ON "profiles"("school_id");
CREATE INDEX "profiles_school_id_email_idx" ON "profiles"("school_id", "email");
CREATE INDEX "profiles_school_id_role_idx" ON "profiles"("school_id", "role");

CREATE TABLE "classes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "classes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "classes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "classes_school_id_idx" ON "classes"("school_id");
CREATE INDEX "classes_school_id_name_idx" ON "classes"("school_id", "name");

CREATE TABLE "terms" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "session_label" TEXT NOT NULL,
  "term_label" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "terms_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "terms_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "terms_school_id_idx" ON "terms"("school_id");
CREATE INDEX "terms_school_id_is_active_idx" ON "terms"("school_id", "is_active");

CREATE TABLE "students" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_code" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "gender" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "students_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "students_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "students_school_id_student_code_key" ON "students"("school_id", "student_code");
CREATE INDEX "students_school_id_idx" ON "students"("school_id");

CREATE TABLE "subjects" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "subjects_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subjects_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "subjects_school_id_idx" ON "subjects"("school_id");
CREATE INDEX "subjects_school_id_name_idx" ON "subjects"("school_id", "name");

CREATE TABLE "class_subjects" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "class_id" UUID NOT NULL,
  "subject_id" UUID NOT NULL,
  CONSTRAINT "class_subjects_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "class_subjects_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "class_subjects_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "class_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "class_subjects_class_id_subject_id_key" ON "class_subjects"("class_id", "subject_id");
CREATE INDEX "class_subjects_school_id_idx" ON "class_subjects"("school_id");
CREATE INDEX "class_subjects_class_id_idx" ON "class_subjects"("class_id");

CREATE TABLE "enrollments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "class_id" UUID NOT NULL,
  "term_id" UUID NOT NULL,
  CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "enrollments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "enrollments_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "enrollments_student_id_class_id_term_id_key" ON "enrollments"("student_id", "class_id", "term_id");
CREATE INDEX "enrollments_school_id_idx" ON "enrollments"("school_id");
CREATE INDEX "enrollments_term_id_idx" ON "enrollments"("term_id");
CREATE INDEX "enrollments_class_id_idx" ON "enrollments"("class_id");

CREATE TABLE "teacher_class_assignments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "teacher_profile_id" UUID NOT NULL,
  "class_id" UUID NOT NULL,
  CONSTRAINT "teacher_class_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "teacher_class_assignments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "teacher_class_assignments_teacher_profile_id_fkey" FOREIGN KEY ("teacher_profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "teacher_class_assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "teacher_class_assignments_teacher_profile_id_class_id_key" ON "teacher_class_assignments"("teacher_profile_id", "class_id");
CREATE INDEX "teacher_class_assignments_school_id_idx" ON "teacher_class_assignments"("school_id");
CREATE INDEX "teacher_class_assignments_class_id_idx" ON "teacher_class_assignments"("class_id");
CREATE INDEX "teacher_class_assignments_teacher_profile_id_idx" ON "teacher_class_assignments"("teacher_profile_id");

CREATE TABLE "grading_settings" (
  "school_id" UUID NOT NULL,
  "ca1_weight" INTEGER NOT NULL DEFAULT 20,
  "ca2_weight" INTEGER NOT NULL DEFAULT 20,
  "exam_weight" INTEGER NOT NULL DEFAULT 60,
  CONSTRAINT "grading_settings_pkey" PRIMARY KEY ("school_id"),
  CONSTRAINT "grading_settings_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "grade_scale" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "grade_letter" TEXT NOT NULL,
  "min_score" INTEGER NOT NULL,
  "max_score" INTEGER NOT NULL,
  "order_index" INTEGER NOT NULL,
  CONSTRAINT "grade_scale_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "grade_scale_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "grade_scale_school_id_grade_letter_key" ON "grade_scale"("school_id", "grade_letter");
CREATE INDEX "grade_scale_school_id_idx" ON "grade_scale"("school_id");
CREATE INDEX "grade_scale_school_id_min_score_max_score_idx" ON "grade_scale"("school_id", "min_score", "max_score");

CREATE TABLE "scores" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "term_id" UUID NOT NULL,
  "class_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "subject_id" UUID NOT NULL,
  "teacher_profile_id" UUID NOT NULL,
  "ca1" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "ca2" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "exam" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "total" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "grade" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "scores_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "scores_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "scores_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "scores_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "scores_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "scores_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "scores_teacher_profile_id_fkey" FOREIGN KEY ("teacher_profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "scores_student_id_subject_id_term_id_key" ON "scores"("student_id", "subject_id", "term_id");
CREATE INDEX "scores_school_id_idx" ON "scores"("school_id");
CREATE INDEX "scores_term_id_idx" ON "scores"("term_id");
CREATE INDEX "scores_class_id_idx" ON "scores"("class_id");
CREATE INDEX "scores_teacher_profile_id_idx" ON "scores"("teacher_profile_id");

CREATE OR REPLACE FUNCTION set_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_scores_updated_at
BEFORE UPDATE ON "scores"
FOR EACH ROW
EXECUTE FUNCTION set_scores_updated_at();
