"use client";

import { useState } from "react";

type ResultTemplate = "classic_report" | "summary";

export default function ResultTemplatePicker({ initialValue }: { initialValue: string }) {
  const [selected, setSelected] = useState<ResultTemplate>(initialValue === "summary" ? "summary" : "classic_report");
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

  return (
    <fieldset className="settings-template-fieldset">
      <legend className="visually-hidden">Result card template</legend>
      <div className="settings-choice-grid">
        {options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <label className={isSelected ? "is-selected" : ""} key={option.value}>
              <input
                type="radio"
                name="resultTemplate"
                value={option.value}
                checked={isSelected}
                onChange={() => setSelected(option.value)}
              />
              <span className="settings-choice-icon"><i className={option.icon} aria-hidden="true" /></span>
              <div><strong>{option.title}</strong><small>{option.description}</small></div>
              <span className="settings-choice-state" aria-hidden="true">
                <i className={isSelected ? "fas fa-check-circle" : "far fa-circle"} />
                {isSelected ? "Selected" : "Select"}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
