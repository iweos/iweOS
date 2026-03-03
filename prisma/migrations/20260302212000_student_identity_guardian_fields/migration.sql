ALTER TABLE "students"
  ADD COLUMN "first_name" TEXT,
  ADD COLUMN "last_name" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "guardian_name" TEXT,
  ADD COLUMN "guardian_phone" TEXT;

UPDATE "students"
SET
  "first_name" = COALESCE(NULLIF(split_part("full_name", ' ', 1), ''), "first_name"),
  "last_name" = COALESCE(NULLIF(btrim(substring("full_name" from position(' ' in "full_name") + 1)), ''), "last_name")
WHERE "full_name" IS NOT NULL AND btrim("full_name") <> '';
