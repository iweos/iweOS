ALTER TABLE "promotion_policies"
ADD COLUMN "required_compulsory_subjects_at_grade" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "required_compulsory_grade_id" UUID;

ALTER TABLE "promotion_policies"
ADD CONSTRAINT "promotion_policies_required_compulsory_grade_id_fkey"
FOREIGN KEY ("required_compulsory_grade_id") REFERENCES "grade_scale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
