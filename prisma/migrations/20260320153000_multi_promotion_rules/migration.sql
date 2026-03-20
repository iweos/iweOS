ALTER TABLE "promotion_policies"
DROP CONSTRAINT IF EXISTS "promotion_policies_school_id_key";

ALTER TABLE "promotion_policies"
ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT 'Default Rule',
ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT false;

UPDATE "promotion_policies"
SET "name" = COALESCE(NULLIF("name", ''), 'Default Rule');

UPDATE "promotion_policies"
SET "is_active" = true
WHERE "id" IN (
  SELECT "id"
  FROM "promotion_policies"
  WHERE "school_id" IS NOT NULL
  ORDER BY "created_at" ASC
);

CREATE UNIQUE INDEX IF NOT EXISTS "promotion_policies_school_id_name_key"
ON "promotion_policies"("school_id", "name");

CREATE INDEX IF NOT EXISTS "promotion_policies_school_id_idx"
ON "promotion_policies"("school_id");

CREATE INDEX IF NOT EXISTS "promotion_policies_school_id_is_active_idx"
ON "promotion_policies"("school_id", "is_active");
