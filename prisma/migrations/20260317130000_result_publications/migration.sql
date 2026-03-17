CREATE TYPE "ResultPublicationStatus" AS ENUM ('draft', 'published', 'unpublished');

CREATE TABLE "result_publications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "term_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "status" "ResultPublicationStatus" NOT NULL DEFAULT 'draft',
    "share_token" TEXT NOT NULL,
    "published_by_profile_id" UUID,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "result_publications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "result_publications_share_token_key" ON "result_publications"("share_token");
CREATE UNIQUE INDEX "result_publications_student_id_term_id_key" ON "result_publications"("student_id", "term_id");
CREATE INDEX "result_publications_school_id_idx" ON "result_publications"("school_id");
CREATE INDEX "result_publications_term_id_idx" ON "result_publications"("term_id");
CREATE INDEX "result_publications_class_id_idx" ON "result_publications"("class_id");
CREATE INDEX "result_publications_status_idx" ON "result_publications"("status");

ALTER TABLE "result_publications"
ADD CONSTRAINT "result_publications_school_id_fkey"
FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "result_publications"
ADD CONSTRAINT "result_publications_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "result_publications"
ADD CONSTRAINT "result_publications_term_id_fkey"
FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "result_publications"
ADD CONSTRAINT "result_publications_class_id_fkey"
FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "result_publications"
ADD CONSTRAINT "result_publications_published_by_profile_id_fkey"
FOREIGN KEY ("published_by_profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
