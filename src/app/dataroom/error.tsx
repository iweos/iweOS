"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DataroomError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="dataroom-error" role="alert">
      <span><AlertTriangle /></span><p>Dataroom recovery</p><h1>We could not load this view</h1>
      <div>Your school data has not been changed. Retry the request; if it repeats, use the digest to trace the server event.</div>
      <button type="button" onClick={reset}><RotateCcw /> Retry</button>
      {error.digest ? <small>Error digest: <code>{error.digest}</code></small> : null}
    </section>
  );
}
