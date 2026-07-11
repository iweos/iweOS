CREATE TYPE "AuthTokenType" AS ENUM ('VERIFY_EMAIL', 'PASSWORD_RESET', 'ACCOUNT_CLAIM');

CREATE TABLE "auth_credentials" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "profile_id" UUID,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "email_verified_at" TIMESTAMPTZ(6),
  "last_login_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "auth_credentials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "credential_id" UUID NOT NULL,
  "profile_id" UUID,
  "session_token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_verification_tokens" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "credential_id" UUID NOT NULL,
  "token_hash" TEXT NOT NULL,
  "type" "AuthTokenType" NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "used_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auth_verification_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_credentials_profile_id_key" ON "auth_credentials"("profile_id");
CREATE UNIQUE INDEX "auth_credentials_email_key" ON "auth_credentials"("email");
CREATE UNIQUE INDEX "auth_sessions_session_token_hash_key" ON "auth_sessions"("session_token_hash");
CREATE INDEX "auth_sessions_credential_id_idx" ON "auth_sessions"("credential_id");
CREATE INDEX "auth_sessions_profile_id_idx" ON "auth_sessions"("profile_id");
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions"("expires_at");
CREATE UNIQUE INDEX "auth_verification_tokens_token_hash_key" ON "auth_verification_tokens"("token_hash");
CREATE INDEX "auth_verification_tokens_credential_id_type_idx" ON "auth_verification_tokens"("credential_id", "type");
CREATE INDEX "auth_verification_tokens_expires_at_idx" ON "auth_verification_tokens"("expires_at");

ALTER TABLE "auth_credentials" ADD CONSTRAINT "auth_credentials_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "auth_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "auth_verification_tokens" ADD CONSTRAINT "auth_verification_tokens_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "auth_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
