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
    <div className={`admin-ui-tabs ${className}`}>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`admin-ui-tab ${active ? "admin-ui-tab-active" : ""}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
