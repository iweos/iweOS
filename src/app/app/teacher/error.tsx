"use client";

import Button from "@/components/admin/ui/Button";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/ui/Section";

export default function TeacherErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Section>
      <PageHeader title="Teacher Portal Unavailable" subtitle="This workspace could not finish loading. Your saved records are not affected; retry the request or return to the dashboard." />
      <Card>
        <div className="d-flex flex-wrap align-items-center gap-2"><Button variant="primary" onClick={reset}>Retry</Button><a href="/app/teacher/dashboard" className="btn btn-secondary">Teacher Dashboard</a></div>
        {error.digest ? <p className="mt-3 small text-muted">Error digest: <code>{error.digest}</code></p> : null}
      </Card>
    </Section>
  );
}
