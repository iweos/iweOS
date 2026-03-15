CREATE TABLE "promotion_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "minimum_passed_subjects" INTEGER NOT NULL DEFAULT 5,
    "minimum_average" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pass_grade_id" UUID,
    "allow_manual_override" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "promotion_policy_subjects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_policy_subjects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "promotion_policies_school_id_key" ON "promotion_policies"("school_id");
CREATE UNIQUE INDEX "promotion_policy_subjects_policy_id_subject_id_key" ON "promotion_policy_subjects"("policy_id", "subject_id");
CREATE INDEX "promotion_policy_subjects_school_id_idx" ON "promotion_policy_subjects"("school_id");
CREATE INDEX "promotion_policy_subjects_subject_id_idx" ON "promotion_policy_subjects"("subject_id");

ALTER TABLE "promotion_policies"
ADD CONSTRAINT "promotion_policies_school_id_fkey"
FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "promotion_policies"
ADD CONSTRAINT "promotion_policies_pass_grade_id_fkey"
FOREIGN KEY ("pass_grade_id") REFERENCES "grade_scale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "promotion_policy_subjects"
ADD CONSTRAINT "promotion_policy_subjects_school_id_fkey"
FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "promotion_policy_subjects"
ADD CONSTRAINT "promotion_policy_subjects_policy_id_fkey"
FOREIGN KEY ("policy_id") REFERENCES "promotion_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "promotion_policy_subjects"
ADD CONSTRAINT "promotion_policy_subjects_subject_id_fkey"
FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
