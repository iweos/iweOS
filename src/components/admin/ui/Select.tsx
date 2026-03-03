import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export default function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <select className={`admin-ui-select ${className}`} {...props}>
      {children}
    </select>
  );
}
