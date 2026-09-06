import type { ReactNode } from "react";
import { BarChart3, GraduationCap, School, ShieldCheck } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const benefits = [
  {
    icon: School,
    title: "One workspace for the whole school",
    description: "Manage sessions, classes, subjects, staff and students without disconnected tools.",
  },
  {
    icon: GraduationCap,
    title: "Give teachers a focused workflow",
    description: "Attendance, grading, conduct and comments stay clear, assigned and easy to complete.",
  },
  {
    icon: BarChart3,
    title: "Turn records into useful results",
    description: "Generate consistent reports, compare performance and share approved results securely.",
  },
  {
    icon: ShieldCheck,
    title: "Keep school access controlled",
    description: "Separate administration and teacher permissions while keeping every school workspace connected.",
  },
] as const;

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page" data-loading-indicator="off">
      <div className="auth-form-side">
        <section className="auth-card">
          <BrandLogo href="/" variant="dark" className="auth-brand" textClassName="auth-brand-text" />
          {children}
        </section>
      </div>

      <aside className="auth-showcase" aria-label="What you can do with iweOS">
        <div className="auth-showcase-glow" aria-hidden="true" />
        <div className="auth-showcase-content">
          <span className="auth-showcase-kicker">Everything your school needs</span>
          <h2>Four things you can run better with iweOS</h2>
          <div className="auth-benefit-list">
            {benefits.map(({ icon: Icon, title, description }) => (
              <div className="auth-benefit" key={title}>
                <span className="auth-benefit-icon"><Icon aria-hidden="true" /></span>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
