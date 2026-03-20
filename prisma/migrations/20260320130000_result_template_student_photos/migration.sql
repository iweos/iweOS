ALTER TABLE "students"
ADD COLUMN IF NOT EXISTS "photo_url" TEXT;

ALTER TABLE "grading_settings"
ADD COLUMN IF NOT EXISTS "result_template" TEXT NOT NULL DEFAULT 'classic_report';
