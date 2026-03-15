ALTER TABLE "assessment_templates"
  ADD COLUMN "term_id" UUID,
  ADD COLUMN "source_template_id" UUID,
  ADD COLUMN "is_preset" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "assessment_templates"
  ADD CONSTRAINT "assessment_templates_term_id_fkey"
  FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "assessment_templates_term_id_key" ON "assessment_templates"("term_id");
CREATE INDEX "assessment_templates_school_id_is_preset_idx" ON "assessment_templates"("school_id", "is_preset");
CREATE INDEX "assessment_templates_source_template_id_idx" ON "assessment_templates"("source_template_id");
