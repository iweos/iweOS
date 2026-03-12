-- Create assessment templates to group assessment type sets (e.g. 3test: CA1/CA2/CA3/Exam)
CREATE TABLE "assessment_templates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assessment_templates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assessment_templates_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "assessment_templates_school_id_name_key" ON "assessment_templates"("school_id", "name");
CREATE INDEX "assessment_templates_school_id_idx" ON "assessment_templates"("school_id");
CREATE INDEX "assessment_templates_school_id_is_active_idx" ON "assessment_templates"("school_id", "is_active");

ALTER TABLE "assessment_types" ADD COLUMN "template_id" UUID;

-- Ensure each school has a default template.
INSERT INTO "assessment_templates" ("school_id", "name", "is_active")
SELECT s."id", 'Default', true
FROM "schools" s
WHERE NOT EXISTS (
  SELECT 1
  FROM "assessment_templates" t
  WHERE t."school_id" = s."id"
);

-- Backfill existing assessment type rows into the default template.
UPDATE "assessment_types" at
SET "template_id" = t."id"
FROM "assessment_templates" t
WHERE t."school_id" = at."school_id"
  AND t."name" = 'Default'
  AND at."template_id" IS NULL;

ALTER TABLE "assessment_types" ALTER COLUMN "template_id" SET NOT NULL;

ALTER TABLE "assessment_types"
  ADD CONSTRAINT "assessment_types_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "assessment_templates"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "assessment_types" DROP CONSTRAINT IF EXISTS "assessment_types_school_id_name_key";
ALTER TABLE "assessment_types"
  ADD CONSTRAINT "assessment_types_school_id_template_id_name_key"
  UNIQUE ("school_id", "template_id", "name");

CREATE INDEX "assessment_types_template_id_idx" ON "assessment_types"("template_id");
