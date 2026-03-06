import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export default function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <select className={`form-select ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}
