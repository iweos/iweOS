CREATE TABLE "conduct_sections" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "order_index" INTEGER NOT NULL DEFAULT 1,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conduct_sections_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "conduct_sections_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "conduct_sections_school_id_name_key" ON "conduct_sections"("school_id", "name");
CREATE INDEX "conduct_sections_school_id_idx" ON "conduct_sections"("school_id");
CREATE INDEX "conduct_sections_school_id_order_index_idx" ON "conduct_sections"("school_id", "order_index");

ALTER TABLE "conduct_categories" ADD COLUMN "section_id" UUID;

INSERT INTO "conduct_sections" ("school_id", "name", "order_index", "is_active")
SELECT "school_id", "name", "order_index", "is_active"
FROM "conduct_categories";

UPDATE "conduct_categories" cc
SET "section_id" = cs."id"
FROM "conduct_sections" cs
WHERE cs."school_id" = cc."school_id"
  AND cs."name" = cc."name";

ALTER TABLE "conduct_categories" ALTER COLUMN "section_id" SET NOT NULL;
ALTER TABLE "conduct_categories"
  ADD CONSTRAINT "conduct_categories_section_id_fkey"
  FOREIGN KEY ("section_id") REFERENCES "conduct_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX "conduct_categories_school_id_name_key";
CREATE UNIQUE INDEX "conduct_categories_school_id_section_id_name_key" ON "conduct_categories"("school_id", "section_id", "name");
CREATE INDEX "conduct_categories_section_id_idx" ON "conduct_categories"("section_id");
