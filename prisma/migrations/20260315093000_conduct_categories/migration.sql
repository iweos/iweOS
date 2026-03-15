CREATE TABLE "conduct_categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "max_score" INTEGER NOT NULL,
  "order_index" INTEGER NOT NULL DEFAULT 1,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conduct_categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "conduct_categories_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "student_conducts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "term_id" UUID NOT NULL,
  "class_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "conduct_category_id" UUID NOT NULL,
  "teacher_profile_id" UUID NOT NULL,
  "score" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_conducts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_conducts_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "student_conducts_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "student_conducts_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "student_conducts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "student_conducts_conduct_category_id_fkey" FOREIGN KEY ("conduct_category_id") REFERENCES "conduct_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "student_conducts_teacher_profile_id_fkey" FOREIGN KEY ("teacher_profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "conduct_categories_school_id_name_key" ON "conduct_categories"("school_id", "name");
CREATE INDEX "conduct_categories_school_id_idx" ON "conduct_categories"("school_id");
CREATE INDEX "conduct_categories_school_id_order_index_idx" ON "conduct_categories"("school_id", "order_index");

CREATE UNIQUE INDEX "student_conducts_student_id_conduct_category_id_term_id_key" ON "student_conducts"("student_id", "conduct_category_id", "term_id");
CREATE INDEX "student_conducts_school_id_idx" ON "student_conducts"("school_id");
CREATE INDEX "student_conducts_term_id_idx" ON "student_conducts"("term_id");
CREATE INDEX "student_conducts_class_id_idx" ON "student_conducts"("class_id");
CREATE INDEX "student_conducts_teacher_profile_id_idx" ON "student_conducts"("teacher_profile_id");
CREATE INDEX "student_conducts_conduct_category_id_idx" ON "student_conducts"("conduct_category_id");
