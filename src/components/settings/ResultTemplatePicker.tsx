"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateResultTemplateAction } from "@/lib/server/admin-actions";

type ResultTemplate = "classic_report" | "summary";

export default function ResultTemplatePicker({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<ResultTemplate>(initialValue === "summary" ? "summary" : "classic_report");
  const [saved, setSaved] = useState<ResultTemplate>(selected);
  const [message, setMessage] = useState("Template changes save automatically.");
  const [isPending, startTransition] = useTransition();
  const options: Array<{ value: ResultTemplate; title: string; description: string; icon: string }> = [
    {
      value: "classic_report",
      title: "Classic report card",
      description: "Full academic report with conduct, attendance, performance chart, comments, and signatures.",
      icon: "fas fa-table",
    },
    {
      value: "summary",
      title: "Simple summary",
      description: "A lighter result sheet focused on scores and overall student performance.",
      icon: "fas fa-list-alt",
    },
  ];

  function selectTemplate(nextTemplate: ResultTemplate) {
    if (isPending || nextTemplate === saved) return;

    const previousTemplate = saved;
    setSelected(nextTemplate);
    setMessage("Saving template...");

    startTransition(async () => {
      const result = await updateResultTemplateAction(nextTemplate);
      if (!result.success) {
        setSelected(previousTemplate);
        setMessage(result.message);
        return;
      }

      setSaved(nextTemplate);
      setMessage(result.message);
      router.refresh();
    });
  }

  return (
    <fieldset className="settings-template-fieldset">
      <legend className="visually-hidden">Result card template</legend>
      <div className="settings-choice-grid">
        {options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <label className={isSelected ? "is-selected" : ""} key={option.value} data-settings-autosave>
              <input
                type="radio"
                name="resultTemplate"
                value={option.value}
                checked={isSelected}
                disabled={isPending}
                onChange={() => selectTemplate(option.value)}
              />
              <span className={`settings-template-preview is-${option.value}`} aria-hidden="true">
                <i className="template-preview-logo" />
                <i className="template-preview-heading" />
                <i className="template-preview-line" />
                <i className="template-preview-line short" />
                <i className="template-preview-grid" />
              </span>
              <div className="settings-choice-copy">
                <span className="settings-choice-icon"><i className={option.icon} aria-hidden="true" /></span>
                <span><strong>{option.title}</strong><small>{option.description}</small></span>
              </div>
              <span className="settings-choice-state" aria-hidden="true">
                <i className={isSelected ? "fas fa-check-circle" : "far fa-circle"} />
                {isSelected ? "Selected" : "Select"}
              </span>
            </label>
          );
        })}
      </div>
      <p className={`settings-template-status ${isPending ? "is-saving" : saved === selected ? "is-saved" : "is-error"}`} role="status" aria-live="polite">
        <i className={isPending ? "fas fa-circle-notch fa-spin" : saved === selected ? "fas fa-check-circle" : "fas fa-exclamation-circle"} aria-hidden="true" />
        {message}
      </p>
    </fieldset>
  );
}
