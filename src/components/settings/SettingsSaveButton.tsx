"use client";

import { useFormStatus } from "react-dom";

export default function SettingsSaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="btn btn-primary" type="submit" disabled={pending} aria-busy={pending}>
      <i className={pending ? "fas fa-circle-notch fa-spin" : "fas fa-check"} aria-hidden="true" />
      {pending ? "Saving changes..." : label}
    </button>
  );
}
