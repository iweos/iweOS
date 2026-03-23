CREATE TABLE "student_attendances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "term_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "times_school_opened" INTEGER NOT NULL DEFAULT 0,
    "times_present" INTEGER NOT NULL DEFAULT 0,
    "times_absent" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_attendances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "student_comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "term_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_comments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "student_attendances_student_id_term_id_key" ON "student_attendances"("student_id", "term_id");
CREATE INDEX "student_attendances_school_id_idx" ON "student_attendances"("school_id");
CREATE INDEX "student_attendances_term_id_idx" ON "student_attendances"("term_id");
CREATE INDEX "student_attendances_class_id_idx" ON "student_attendances"("class_id");

CREATE UNIQUE INDEX "student_comments_student_id_term_id_key" ON "student_comments"("student_id", "term_id");
CREATE INDEX "student_comments_school_id_idx" ON "student_comments"("school_id");
CREATE INDEX "student_comments_term_id_idx" ON "student_comments"("term_id");
CREATE INDEX "student_comments_class_id_idx" ON "student_comments"("class_id");

ALTER TABLE "student_attendances"
ADD CONSTRAINT "student_attendances_school_id_fkey"
FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_attendances"
ADD CONSTRAINT "student_attendances_term_id_fkey"
FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_attendances"
ADD CONSTRAINT "student_attendances_class_id_fkey"
FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_attendances"
ADD CONSTRAINT "student_attendances_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_comments"
ADD CONSTRAINT "student_comments_school_id_fkey"
FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_comments"
ADD CONSTRAINT "student_comments_term_id_fkey"
FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_comments"
ADD CONSTRAINT "student_comments_class_id_fkey"
FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_comments"
ADD CONSTRAINT "student_comments_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
