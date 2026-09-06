"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";

type StatusOption = {
  value: string;
  label: string;
};

type ResultStatusSelectProps = {
  action: (formData: FormData) => Promise<void>;
  termId: string;
  classId: string;
  studentId: string;
  value: string;
  options: readonly StatusOption[];
  compact?: boolean;
};

export default function ResultStatusSelect({
  action,
  termId,
  classId,
  studentId,
  value,
  options,
  compact = false,
}: ResultStatusSelectProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="result-status-autosave">
      <input type="hidden" name="studentIds" value={studentId} />
      <input type="hidden" name="termId" value={termId} />
      <input type="hidden" name="classId" value={classId} />
      <select
        name="status"
        className={compact ? "form-select form-select-sm" : "form-select"}
        defaultValue={value}
        aria-label="Result publication status"
        onChange={() => formRef.current?.requestSubmit()}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <StatusFeedback />
    </form>
  );
}

function StatusFeedback() {
  const { pending } = useFormStatus();

  return (
    <span className="result-status-feedback" aria-live="polite">
      {pending ? (
        <>
          <i className="fas fa-circle-notch fa-spin" aria-hidden="true" />
          Saving
        </>
      ) : (
        <>
          <i className="fas fa-check" aria-hidden="true" />
          Saved on selection
        </>
      )}
    </span>
  );
}
