import type { ReactNode } from "react";

type SectionProps = {
  className?: string;
  children: ReactNode;
};

export default function Section({ className = "", children }: SectionProps) {
  return <section className={`admin-ui-section ${className}`}>{children}</section>;
}
