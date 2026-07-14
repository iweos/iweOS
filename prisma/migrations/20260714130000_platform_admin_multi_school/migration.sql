CREATE TYPE "PlatformRole" AS ENUM ('platform_admin');
CREATE TYPE "SchoolStatus" AS ENUM ('active', 'suspended', 'archived');

ALTER TABLE "schools"
ADD COLUMN "status" "SchoolStatus" NOT NULL DEFAULT 'active';

ALTER TABLE "profiles"
ADD COLUMN "credential_id" UUID;

UPDATE "profiles" AS profile
SET "credential_id" = credential."id"
FROM "auth_credentials" AS credential
WHERE credential."profile_id" = profile."id";

ALTER TABLE "auth_credentials"
ADD COLUMN "platform_role" "PlatformRole";

CREATE INDEX "profiles_credential_id_idx" ON "profiles"("credential_id");
CREATE INDEX "schools_status_idx" ON "schools"("status");

ALTER TABLE "profiles"
ADD CONSTRAINT "profiles_credential_id_fkey"
FOREIGN KEY ("credential_id") REFERENCES "auth_credentials"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Keep auth_credentials.profile_id during the expand phase so the currently
-- deployed application remains compatible until this release is live.
