"use client";

import type { FormEvent, ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { useFormStatus } from "react-dom";

type SettingsFormContextValue = {
  dirty: boolean;
};

const SettingsFormContext = createContext<SettingsFormContextValue>({ dirty: false });

export function SettingsForm({
  formAction,
  children,
  encType,
}: {
  formAction: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  encType?: "multipart/form-data";
}) {
  const [dirty, setDirty] = useState(false);

  function markDirty(event: FormEvent<HTMLFormElement>) {
    if ((event.target as HTMLElement).closest("[data-settings-autosave]")) return;
    setDirty(true);
  }

  return (
    <SettingsFormContext.Provider value={{ dirty }}>
      <form action={formAction} className="settings-form" encType={encType} onChange={markDirty} onInput={markDirty}>
        {children}
      </form>
    </SettingsFormContext.Provider>
  );
}

export function SettingsSaveBar({ label, note }: { label: string; note: string }) {
  const { dirty } = useContext(SettingsFormContext);
  const { pending } = useFormStatus();

  return (
    <footer className={`settings-save-bar ${dirty || pending ? "is-visible" : ""}`} aria-live="polite">
      <span>
        <i className={pending ? "fas fa-circle-notch fa-spin" : dirty ? "fas fa-circle" : "fas fa-check-circle"} aria-hidden="true" />
        {pending ? "Saving changes..." : dirty ? "You have unsaved changes" : note}
      </span>
      <button className="btn btn-primary" type="submit" disabled={!dirty || pending} aria-busy={pending}>
        <i className={pending ? "fas fa-circle-notch fa-spin" : "fas fa-check"} aria-hidden="true" />
        {pending ? "Saving..." : label}
      </button>
    </footer>
  );
}
