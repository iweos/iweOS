"use client";

import { useState } from "react";

type PasswordFieldProps = {
  autoComplete: "current-password" | "new-password";
  label: string;
  name: string;
  minLength?: number;
  placeholder?: string;
};

export default function PasswordField({ autoComplete, label, name, minLength, placeholder }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = `auth-${name}`;

  return (
    <label htmlFor={inputId}>
      <span className="sr-only">{label}</span>
      <span className="auth-password-control">
        <input
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          placeholder={placeholder ?? label}
          required
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </span>
    </label>
  );
}
