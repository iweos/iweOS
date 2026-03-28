CREATE TABLE "notifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "recipient_profile_id" UUID NOT NULL,
  "actor_profile_id" UUID,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "href" TEXT,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "read_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_school_id_idx" ON "notifications"("school_id");
CREATE INDEX "notifications_recipient_profile_id_is_read_created_at_idx" ON "notifications"("recipient_profile_id", "is_read", "created_at");
CREATE INDEX "notifications_actor_profile_id_idx" ON "notifications"("actor_profile_id");

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_school_id_fkey"
FOREIGN KEY ("school_id") REFERENCES "schools"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_recipient_profile_id_fkey"
FOREIGN KEY ("recipient_profile_id") REFERENCES "profiles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_actor_profile_id_fkey"
FOREIGN KEY ("actor_profile_id") REFERENCES "profiles"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
