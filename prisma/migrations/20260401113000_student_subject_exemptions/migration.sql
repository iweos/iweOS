CREATE TABLE "student_subject_exemptions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "class_id" UUID NOT NULL,
  "subject_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "student_subject_exemptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_subject_exemptions_student_id_class_id_subject_id_key" UNIQUE ("student_id", "class_id", "subject_id"),
  CONSTRAINT "student_subject_exemptions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "student_subject_exemptions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "student_subject_exemptions_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "student_subject_exemptions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "student_subject_exemptions_school_id_idx" ON "student_subject_exemptions"("school_id");
CREATE INDEX "student_subject_exemptions_class_id_subject_id_idx" ON "student_subject_exemptions"("class_id", "subject_id");
