import Link from "next/link";
import localFont from "next/font/local";
import BrandLogo from "@/components/BrandLogo";
import GuideDocsClient from "@/components/guide/GuideDocsClient";

const hornbill = localFont({
  src: "../../../public/fonts/Hornbill-Regular.otf",
  variable: "--font-guide-hornbill",
  display: "swap",
});

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

const quickTopics = [
  {
    title: "School setup",
    description: "Create the school identity, configure settings, and prepare branding for results.",
    href: "#getting-started",
    icon: "fas fa-school",
  },
  {
    title: "Academic structure",
    description: "Set up sessions, classes, subjects, assessments, conduct, and grading policy.",
    href: "#academic-structure",
    icon: "fas fa-sitemap",
  },
  {
    title: "Teachers and assignments",
    description: "Add staff, link accounts, and assign the right teachers to the right classes.",
    href: "#teachers-and-assignments",
    icon: "fas fa-chalkboard-teacher",
  },
  {
    title: "Students and enrollment",
    description: "Import students, update their records, and enroll them by class and term.",
    href: "#students-and-enrollment",
    icon: "fas fa-user-graduate",
  },
  {
    title: "Results and exports",
    description: "Generate, publish, export, and share result documents.",
    href: "#results-and-sharing",
    icon: "fas fa-file-alt",
  },
  {
    title: "Payments",
    description: "Manage invoices, reconciliation, transactions, reports, and public fee payment.",
    href: "#payments",
    icon: "fas fa-wallet",
  },
];

export default function GuidePage() {
  return (
    <div className={`guide-docs-page ${hornbill.variable}`}>
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
      <GuideDocsClient sections={sections} quickTopics={quickTopics} />
    </div>
  );
}
