-- Assessment types are reusable inside presets and term snapshots. The legacy
-- school/name index incorrectly prevents the same assessment name per template.
ALTER TABLE "assessment_types"
  DROP CONSTRAINT IF EXISTS "assessment_types_school_id_name_key";

DROP INDEX IF EXISTS "assessment_types_school_id_name_key";

CREATE UNIQUE INDEX IF NOT EXISTS "assessment_types_school_id_template_id_name_key"
  ON "assessment_types"("school_id", "template_id", "name");
