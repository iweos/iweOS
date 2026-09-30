CREATE TABLE "dataroom_roles" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "name" TEXT NOT NULL UNIQUE, "permissions" TEXT[] NOT NULL, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "dataroom_memberships" ("credential_id" UUID PRIMARY KEY REFERENCES "auth_credentials"("id") ON DELETE CASCADE, "role_id" UUID NOT NULL REFERENCES "dataroom_roles"("id") ON DELETE RESTRICT, "full_name" TEXT NOT NULL, "is_active" BOOLEAN NOT NULL DEFAULT TRUE, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "dataroom_memberships_role_id_idx" ON "dataroom_memberships"("role_id");
CREATE TABLE "dataroom_access_logs" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "actor_email" TEXT NOT NULL, "target" TEXT NOT NULL, "action" TEXT NOT NULL, "details" JSONB NOT NULL, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT INTO "dataroom_roles" ("name", "permissions") VALUES
('Administrator', ARRAY['overview','schools','users','payments','results','audit','integrity','manageSchools','manageAccess']),
('Operations', ARRAY['schools','users','results','manageSchools']),
('Finance', ARRAY['payments']),
('Viewer', ARRAY['overview','schools','users','payments','results','audit']);
