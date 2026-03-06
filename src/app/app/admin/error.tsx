"use client";

import Button from "@/components/admin/ui/Button";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";

type AdminErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const SCHEMA_MISMATCH_PATTERN =
  /(P2021|P2022|column .* does not exist|table .* does not exist|schema is out of sync|Unknown argument `(firstName|lastName|address|guardianName|guardianPhone|guardianEmail|gender)`)/i;

const MISSING_DATABASE_URL_PATTERN = /Environment variable not found: DATABASE_URL/i;

export default function AdminErrorPage({ error, reset }: AdminErrorPageProps) {
  const message = error?.message ?? "";
  const isSchemaMismatch = SCHEMA_MISMATCH_PATTERN.test(message);
  const isMissingDatabaseUrl = MISSING_DATABASE_URL_PATTERN.test(message);

  let title = "Admin Page Error";
  let description = "Something failed while loading this admin page. Retry, and if it keeps failing, check server logs.";

  if (isSchemaMismatch) {
    title = "Database Schema Out Of Sync";
    description =
      "Run npm run prisma:generate && npm run prisma:migrate, redeploy, and ensure production points to the migrated database.";
  } else if (isMissingDatabaseUrl) {
    title = "Missing DATABASE_URL";
    description = "Set DATABASE_URL in your deployment environment, redeploy, and run migrations on that database.";
  }

  return (
    <Section>
      <PageHeader title={title} subtitle={description} />
      <Card>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <Button variant="primary" onClick={reset}>
            Retry
          </Button>
          <a
            href="/app/admin/dashboard"
            className="btn btn-secondary"
          >
            Back to Dashboard
          </a>
        </div>
        {error?.digest ? (
          <p className="mt-3 small text-muted">
            Error digest: <code>{error.digest}</code>
          </p>
        ) : null}
      </Card>
    </Section>
  );
}
