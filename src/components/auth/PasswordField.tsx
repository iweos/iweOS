"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordFieldProps = {
  autoComplete: "current-password" | "new-password";
  label: string;
  name: string;
  minLength?: number;
};

export default function PasswordField({ autoComplete, label, name, minLength }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = `auth-${name}`;

  return (
    <label htmlFor={inputId}>
      <span>{label}</span>
      <span className="auth-password-control">
        <input
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          required
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </span>
    </label>
  );
}
