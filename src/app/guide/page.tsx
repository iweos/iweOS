import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

const quickStartCards = [
  {
    icon: "fas fa-school",
    title: "Create school account",
    body: "Sign up, complete the school profile, upload logo/signature, and confirm the school identity before inviting staff.",
  },
  {
    icon: "fas fa-sitemap",
    title: "Build academic structure",
    body: "Set up sessions, sub-sessions, classes, subjects, assessment templates, grade scales, and conduct structure.",
  },
  {
    icon: "fas fa-users-cog",
    title: "Assign staff and students",
    body: "Add teachers, link accounts, assign classes, import students, enroll them, and keep statuses accurate.",
  },
  {
    icon: "fas fa-file-signature",
    title: "Run results end-to-end",
    body: "Capture attendance, comments, conduct, scores, publish results, export PDFs, and share secure result links.",
  },
];

const sections = [
  {
    id: "overview",
    title: "Overview",
    subtitle: "What iweOS handles today",
    bullets: [
      "Admin, teacher, and public payment workflows in one app.",
      "Academic setup, grading, conduct, attendance, comments, results, and promotion logic.",
      "PDF result export, shareable result links, and notifications for operational changes.",
      "Teacher portal with admin override, analytics, and mobile-aware workflows.",
    ],
  },
  {
    id: "signup",
    title: "1. Sign up and school setup",
    subtitle: "Starting point for a new school",
    bullets: [
      "Sign up from the website using the main CTA.",
      "Complete school profile details in Settings.",
      "Upload school logo and principal signature for results and exported PDFs.",
      "Choose your result template so generated and shared results follow the school’s preferred layout.",
    ],
    actions: [
      { label: "Open Sign up", href: "/sign-up" },
      { label: "Open Settings", href: "/app/admin/settings" },
    ],
    callout: "Suggested screenshot: Settings -> School / Results tab with logo, signature, and template selection.",
  },
  {
    id: "academic-setup",
    title: "2. Academic setup",
    subtitle: "Define the structure the school will operate on",
    bullets: [
      "Create sessions with built-in term/semester bundles or custom sub-session labels.",
      "Create classes and subjects.",
      "Assign subjects to classes.",
      "Define assessment presets and assign the right preset to each term/session segment.",
      "Configure conduct sections and sub-categories.",
      "Set grade scales and promotion rules.",
    ],
    actions: [
      { label: "Sessions", href: "/app/admin/terms" },
      { label: "Classes", href: "/app/admin/classes" },
      { label: "Subjects", href: "/app/admin/subjects" },
      { label: "Grading", href: "/app/admin/grading" },
    ],
    callout: "Suggested screenshots: Sessions setup, Assessment Types, Conduct, and Promotion Rules.",
  },
  {
    id: "teachers",
    title: "3. Teachers and assignments",
    subtitle: "Get staff into the correct workspace",
    bullets: [
      "Add teachers from the admin side.",
      "Link already-signed-up teachers manually when needed.",
      "Promote selected teachers to admin where appropriate.",
      "Assign teachers to classes so the teacher portal only shows the correct students and workflows.",
      "Use Teacher Portal from admin to audit or assist from the teacher point of view.",
    ],
    actions: [
      { label: "Teachers", href: "/app/admin/teachers" },
      { label: "Teacher Classes", href: "/app/admin/assignments/teacher-classes" },
      { label: "Teacher Portal", href: "/app/teacher/dashboard" },
    ],
    callout: "Recommended screenshot: teacher class assignment screen and the admin override teacher portal banner.",
  },
  {
    id: "students",
    title: "4. Students and enrollment",
    subtitle: "Populate the school with active student records",
    bullets: [
      "Add students one-by-one or import in bulk through CSV/pasted rows.",
      "Edit student details, upload student pictures, and maintain statuses.",
      "Use status correctly: active, inactive, graduated, suspended, withdrawn.",
      "Enroll students by class and term, including bulk enroll for active registered students.",
      "Teachers only see active students in their grading flows.",
    ],
    actions: [
      { label: "Add Students", href: "/app/admin/students/add" },
      { label: "Manage Students", href: "/app/admin/students/manage" },
      { label: "Enrollments", href: "/app/admin/assignments/enrollments" },
    ],
    callout: "Suggested screenshot: Add Students import page and the enrollment summary/term selector.",
  },
  {
    id: "teacher-workflows",
    title: "5. Teacher workflows",
    subtitle: "What teachers do every day",
    bullets: [
      "Attendance: enter times school opened, present, and absent for each student.",
      "Grade Entry: enter assessment values with autosave and live row status.",
      "Conduct: score a selected student against conduct categories.",
      "Comment: add class teacher comments per student.",
      "Students: compare student performance against class averages and subject positions.",
      "Results: review result-oriented records from the teacher side.",
    ],
    actions: [
      { label: "Teacher Attendance", href: "/app/teacher/attendance" },
      { label: "Teacher Grade Entry", href: "/app/teacher/grade-entry" },
      { label: "Teacher Conduct", href: "/app/teacher/conduct" },
      { label: "Teacher Comment", href: "/app/teacher/comment" },
    ],
    callout: "Suggested screenshots: one teacher row in attendance, grade entry, and the student analytics page.",
  },
  {
    id: "results",
    title: "6. Results, export, and sharing",
    subtitle: "Turn recorded school data into report cards",
    bullets: [
      "Admin reviews generated result sheets per student or per class.",
      "Publish, unpublish, or keep results in draft.",
      "Open the dedicated export route for clean document rendering.",
      "Download PDF, print, or share the PDF to supported apps on mobile.",
      "Use secure result links for student-facing result access.",
      "Results include logo, student image, attendance, conduct, comments, analytics, and performance charting.",
    ],
    actions: [
      { label: "Results Center", href: "/app/admin/grading/results" },
      { label: "Teacher Results", href: "/app/teacher/results" },
    ],
    callout: "Suggested screenshots: result preview, export route, and shared result page.",
  },
  {
    id: "payments",
    title: "7. Payments",
    subtitle: "Fee operations and reconciliation",
    bullets: [
      "Configure fee schedules and fee items.",
      "Generate invoices and line items.",
      "Track transactions, reports, reconciliation, imports, and payment settings.",
      "Public payment flow allows fee payment by student payment ID.",
    ],
    actions: [
      { label: "Payment Overview", href: "/app/admin/payments" },
      { label: "Pay Fees", href: "/pay" },
    ],
    callout: "Suggested screenshots: payment overview, invoices, reconciliation, and parent pay flow.",
  },
  {
    id: "notifications",
    title: "8. Notifications and operational awareness",
    subtitle: "Use the bell panel for school updates",
    bullets: [
      "Admins receive notifications for key changes such as student imports.",
      "Teachers receive notifications when they are assigned to classes or when admin updates affect their class.",
      "Notifications currently cover student imports, class assignment changes, result publication changes, and admin attendance/comment changes.",
      "Unread items appear in the bell dropdown and can link the user back to the affected workflow.",
    ],
    actions: [
      { label: "Admin Dashboard", href: "/app/admin/dashboard" },
      { label: "Teacher Dashboard", href: "/app/teacher/dashboard" },
    ],
    callout: "Suggested screenshot: bell dropdown showing recent unread actions.",
  },
  {
    id: "operations",
    title: "9. Ongoing operations",
    subtitle: "What to maintain as the school grows",
    bullets: [
      "Update result templates and school assets as branding changes.",
      "Keep promotion rules aligned with school policy.",
      "Review mobile workflows regularly for teachers and admins.",
      "Use the guide as a living handbook whenever new modules are released.",
    ],
    actions: [
      { label: "Promotion Rules", href: "/app/admin/settings/promotion-rules" },
      { label: "Settings", href: "/app/admin/settings" },
    ],
    callout: "If you want live screenshots inside this guide, the next pass needs either uploaded screenshots from you or a curated list of pages you want captured.",
  },
];

export default function GuidePage() {
  return (
    <div className="guide-page">
      <section className="guide-hero">
        <div className="guide-hero-inner">
          <div className="guide-hero-copy">
            <p className="guide-kicker">Product Guide</p>
            <h1>School setup guide for ìwéOS</h1>
            <p>
              A navigable walkthrough for onboarding a new school, configuring academic workflows, enabling teachers,
              and moving all the way to published and shared results.
            </p>
            <div className="guide-hero-actions">
              <Link href="/sign-up" className="btn btn-primary">
                Start with Sign up
              </Link>
              <Link href="/app/admin/settings" className="btn btn-outline-secondary">
                Open Settings
              </Link>
            </div>
          </div>
          <div className="guide-hero-brand">
            <BrandLogo href="/" variant="dark" className="guide-brand-mark" textClassName="guide-brand-text" />
            <div className="guide-hero-stat-grid">
              <div className="guide-hero-stat">
                <strong>9</strong>
                <span>Core setup stages</span>
              </div>
              <div className="guide-hero-stat">
                <strong>3</strong>
                <span>Main user modes</span>
              </div>
              <div className="guide-hero-stat">
                <strong>1</strong>
                <span>Living handbook</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="guide-quickstart">
        <div className="guide-quickstart-grid">
          {quickStartCards.map((card) => (
            <article key={card.title} className="guide-quick-card">
              <span className="guide-quick-icon" aria-hidden="true">
                <i className={card.icon} />
              </span>
              <h2>{card.title}</h2>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="guide-body">
        <aside className="guide-nav">
          <div className="guide-nav-card">
            <p className="guide-nav-label">Jump to section</p>
            <nav aria-label="Guide navigation">
              <ul>
                {sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.title}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        <div className="guide-sections">
          {sections.map((section) => (
            <article key={section.id} id={section.id} className="guide-section-card">
              <div className="guide-section-head">
                <p className="guide-section-kicker">{section.subtitle}</p>
                <h2>{section.title}</h2>
              </div>

              <ul className="guide-checklist">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>
                    <span className="guide-check-icon" aria-hidden="true">
                      <i className="fas fa-check" />
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="guide-actions">
                {section.actions?.map((action) => (
                  <Link key={`${section.id}-${action.href}`} href={action.href} className="guide-action-link">
                    {action.label}
                    <i className="fas fa-arrow-right" aria-hidden="true" />
                  </Link>
                ))}
              </div>

              <div className="guide-callout">
                <i className="fas fa-image" aria-hidden="true" />
                <p>{section.callout}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
