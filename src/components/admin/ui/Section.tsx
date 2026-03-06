import type { ReactNode } from "react";

type SectionProps = {
  className?: string;
  children: ReactNode;
};

export default function Section({ className = "", children }: SectionProps) {
  return <section className={`d-grid gap-3 ${className}`.trim()}>{children}</section>;
}
