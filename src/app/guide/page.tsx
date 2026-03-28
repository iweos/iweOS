import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

const sections = [
  {
    id: "getting-started",
    title: "Getting Started",
    summary: "Create the school account, complete settings, and set the school identity before inviting staff.",
    bullets: [
      "Sign up the school from the website.",
      "Open Settings and complete school profile details.",
      "Upload school logo and principal signature.",
      "Choose the result template the school will use for result rendering and export.",
    ],
    links: [
      { label: "Sign up", href: "/sign-up" },
      { label: "Settings", href: "/app/admin/settings" },
    ],
    note: "Best screenshot to add here later: Settings tabs with school profile, logo, result template, and principal signature.",
  },
  {
    id: "academic-structure",
    title: "Academic Structure",
    summary: "Build the school structure that powers grading, results, and promotion.",
    bullets: [
      "Create sessions with built-in terms, semesters, or custom sub-sessions.",
      "Create classes and subjects.",
      "Assign subjects to classes.",
      "Create assessment presets and assign them to each term/session segment.",
      "Configure conduct sections, conduct categories, and grade scales.",
      "Set promotion rules in Settings.",
    ],
    links: [
      { label: "Sessions", href: "/app/admin/terms" },
      { label: "Classes", href: "/app/admin/classes" },
      { label: "Subjects", href: "/app/admin/subjects" },
      { label: "Grading", href: "/app/admin/grading" },
    ],
    note: "Recommended screenshots: Sessions, Assessment Type, Conduct, Grades, and Promotion Rules.",
  },
  {
    id: "teachers-and-assignments",
    title: "Teachers and Assignments",
    summary: "Bring teachers in, link their accounts, and connect them to the right classes.",
    bullets: [
      "Add teacher records from the admin side.",
      "Manually link signed-up teachers when needed.",
      "Promote teachers to admin where appropriate.",
      "Assign teachers to classes so their portal stays scoped correctly.",
      "Use Teacher Portal as admin override when you need to inspect or support teacher workflows.",
    ],
    links: [
      { label: "Teachers", href: "/app/admin/teachers" },
      { label: "Teacher-Class", href: "/app/admin/assignments/teacher-classes" },
      { label: "Teacher Portal", href: "/app/teacher/dashboard" },
    ],
    note: "Useful screenshots: teacher table, class assignment page, admin override teacher portal.",
  },
  {
    id: "students-and-enrollment",
    title: "Students and Enrollment",
    summary: "Add students, manage their records, and place them into the right class and term.",
    bullets: [
      "Add students individually or import them in bulk.",
      "Edit student details and upload student photos.",
      "Maintain student statuses accurately: active, inactive, graduated, suspended, withdrawn.",
      "Enroll students manually or in bulk by class and term.",
      "Only active students appear in teacher grading workflows.",
    ],
    links: [
      { label: "Add Students", href: "/app/admin/students/add" },
      { label: "Manage Students", href: "/app/admin/students/manage" },
      { label: "Enrollments", href: "/app/admin/assignments/enrollments" },
    ],
    note: "Useful screenshots: import flow, student profile modal, term-specific enrollment summary.",
  },
  {
    id: "teacher-workflows",
    title: "Teacher Workflows",
    summary: "Teachers record operational data directly inside the class workflows they own.",
    bullets: [
      "Attendance saves per student row with immediate feedback.",
      "Grade Entry autosaves assessment values per row.",
      "Conduct scoring is focused per student with grouped conduct sections.",
      "Comments save inline and feed the result sheet.",
      "Student analytics compare a student against class averages and subject positions.",
    ],
    links: [
      { label: "Attendance", href: "/app/teacher/attendance" },
      { label: "Grade Entry", href: "/app/teacher/grade-entry" },
      { label: "Conduct", href: "/app/teacher/conduct" },
      { label: "Comment", href: "/app/teacher/comment" },
      { label: "Students", href: "/app/teacher/students" },
    ],
    note: "Best screenshots: teacher grade entry row, conduct screen, and student analytics comparison page.",
  },
  {
    id: "results-and-sharing",
    title: "Results and Sharing",
    summary: "Results move from recorded data to published documents, exports, and secure sharing.",
    bullets: [
      "Admins review student and class result views.",
      "Results can be left in draft, published, or unpublished.",
      "Export uses a clean document route outside the admin shell.",
      "Users can print, download PDF, or share PDF to supported apps on mobile.",
      "Shared result links respect publication status and template styling.",
    ],
    links: [
      { label: "Results Center", href: "/app/admin/grading/results" },
      { label: "Teacher Results", href: "/app/teacher/results" },
    ],
    note: "Best screenshots: admin result preview, export page, and public result page.",
  },
  {
    id: "payments",
    title: "Payments",
    summary: "Fee management, public fee payment, and reconciliation stay in one dedicated section.",
    bullets: [
      "Configure fee items and schedules.",
      "Generate invoices and line items.",
      "Track transactions, reconciliation, imports, settings, and payment reports.",
      "Public fee payment works through student payment IDs.",
    ],
    links: [
      { label: "Payments", href: "/app/admin/payments" },
      { label: "Pay Fees", href: "/pay" },
    ],
    note: "Best screenshots: payment overview, invoice list, reconciliation, and public pay page.",
  },
  {
    id: "notifications-and-operations",
    title: "Notifications and Operations",
    summary: "Use notifications and policy tools to keep the school operational as workflows expand.",
    bullets: [
      "Bell notifications show student imports, class assignment changes, result publication changes, and admin attendance/comment updates.",
      "Promotion rules live in Settings and support multiple school-specific policies.",
      "School assets and result templates can be updated as the school evolves.",
      "Use the in-app tour and this guide as the living onboarding manual.",
    ],
    links: [
      { label: "Dashboard", href: "/app/admin/dashboard" },
      { label: "Promotion Rules", href: "/app/admin/settings/promotion-rules" },
      { label: "Guide Tour", href: "/app/admin/dashboard" },
    ],
    note: "Best screenshots: notification dropdown, promotion rules, and the in-app tour overlay.",
  },
];

const quickLinks = [
  { label: "Create school account", href: "#getting-started" },
  { label: "Build academic structure", href: "#academic-structure" },
  { label: "Assign teachers", href: "#teachers-and-assignments" },
  { label: "Import and enroll students", href: "#students-and-enrollment" },
  { label: "Run grading and results", href: "#results-and-sharing" },
  { label: "Configure payments", href: "#payments" },
];

export default function GuidePage() {
  return (
    <div className="guide-docs-page">
      <header className="guide-docs-topbar">
        <div className="guide-docs-topbar-inner">
          <BrandLogo href="/" variant="dark" className="guide-docs-logo" textClassName="guide-docs-logo-text" />
          <div className="guide-docs-topbar-actions">
            <Link href="/sign-up" className="btn btn-primary">
              Sign up
            </Link>
            <Link href="/app/admin/dashboard" className="btn btn-outline-secondary">
              Open App
            </Link>
          </div>
        </div>
      </header>

      <div className="guide-docs-shell">
        <aside className="guide-docs-sidebar">
          <div className="guide-docs-sidebar-card">
            <p className="guide-docs-eyebrow">Setup Guide</p>
            <h1>School setup manual</h1>
            <p className="guide-docs-sidebar-intro">
              A GitBook-style handbook for configuring a school from first sign-up to live grading, payments, results,
              and teacher operations.
            </p>
          </div>

          <div className="guide-docs-sidebar-card">
            <p className="guide-docs-mini-label">Quick start</p>
            <ul className="guide-docs-link-list">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="guide-docs-sidebar-card">
            <p className="guide-docs-mini-label">Need live help?</p>
            <div className="guide-docs-inline-actions">
              <Link href="/sign-in" className="guide-docs-chip">
                Open sign in
              </Link>
              <Link href="/app/admin/dashboard" className="guide-docs-chip">
                Open dashboard
              </Link>
            </div>
          </div>
        </aside>

        <main className="guide-docs-content">
          <section className="guide-docs-intro-block">
            <p className="guide-docs-breadcrumb">Documentation / School onboarding</p>
            <h2>Everything a school needs to go live on ìwéOS</h2>
            <p>
              Use this as the master reference for onboarding, internal training, and rollout support. The in-app tour
              helps with quick orientation; this guide explains the full setup path in order.
            </p>
            <div className="guide-docs-stat-grid">
              <div className="guide-docs-stat">
                <strong>8</strong>
                <span>Core sections</span>
              </div>
              <div className="guide-docs-stat">
                <strong>3</strong>
                <span>Main roles</span>
              </div>
              <div className="guide-docs-stat">
                <strong>1</strong>
                <span>Living handbook</span>
              </div>
            </div>
          </section>

          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="guide-docs-section">
              <div className="guide-docs-section-head">
                <span className="guide-docs-step-pill">{index + 1}</span>
                <div>
                  <p className="guide-docs-section-label">{section.summary}</p>
                  <h3>{section.title}</h3>
                </div>
              </div>

              <ul className="guide-docs-checks">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>
                    <i className="fas fa-check-circle" aria-hidden="true" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="guide-docs-action-row">
                {section.links.map((link) => (
                  <Link key={`${section.id}-${link.href}`} href={link.href} className="guide-docs-link-pill">
                    {link.label}
                    <i className="fas fa-arrow-right" aria-hidden="true" />
                  </Link>
                ))}
              </div>

              <div className="guide-docs-note">
                <i className="fas fa-image" aria-hidden="true" />
                <p>{section.note}</p>
              </div>
            </section>
          ))}
        </main>

        <aside className="guide-docs-rightbar">
          <div className="guide-docs-right-card">
            <p className="guide-docs-mini-label">On this page</p>
            <ul className="guide-docs-outline">
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="guide-docs-right-card">
            <p className="guide-docs-mini-label">Tour and replay</p>
            <p>
              Inside the app shell, users can reopen the guided tour anytime from the fixed footer bar without searching
              for documentation.
            </p>
          </div>

          <div className="guide-docs-right-card">
            <p className="guide-docs-mini-label">Screenshots</p>
            <p>
              To make this guide visual, the next pass can embed real screenshots for the key pages listed in each
              section note.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
