"use client";

type TabOption<T extends string> = {
  label: string;
  value: T;
};

type TabsProps<T extends string> = {
  value: T;
  options: ReadonlyArray<TabOption<T>>;
  onChange: (value: T) => void;
  className?: string;
};

export default function Tabs<T extends string>({ value, options, onChange, className = "" }: TabsProps<T>) {
  return (
    <div className={`btn-group ${className}`.trim()} role="group" aria-label="Tabs">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`btn ${active ? "btn-primary" : "btn-secondary"}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
