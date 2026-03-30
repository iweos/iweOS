import localFont from "next/font/local";
import DocLayout from "@/components/guide/docs/DocLayout";
import type { DocPage, DocsTab, SidebarGroup } from "@/components/guide/docs/types";

const hornbill = localFont({
  src: "../../../public/fonts/Hornbill-Regular.otf",
  variable: "--font-guide-hornbill",
  display: "swap",
});

const tabs: DocsTab[] = [
  { id: "product", label: "Product", blurb: "Guides and workflows for schools using iweOS." },
  { id: "api", label: "API", blurb: "Auth, payloads, and developer integration references." },
  { id: "help", label: "Help Center", blurb: "Support articles, rollout tips, and troubleshooting." },
  { id: "changelog", label: "Changelog", blurb: "What changed recently across the platform." },
];

const groups: SidebarGroup[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    items: [
      { id: "welcome", title: "Welcome", pageId: "welcome" },
      { id: "quickstart", title: "Quickstart", pageId: "quickstart" },
      { id: "concepts", title: "Concepts", pageId: "concepts" },
    ],
  },
  {
    id: "api-reference",
    title: "API",
    items: [
      {
        id: "authentication",
        title: "Authentication",
        children: [{ id: "auth-tokens", title: "Auth tokens", pageId: "auth-tokens" }],
      },
      {
        id: "resources",
        title: "Core resources",
        children: [{ id: "users-resource", title: "Users", pageId: "users-resource" }],
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    items: [
      { id: "security-overview", title: "Overview", pageId: "security-overview" },
      { id: "security-policies", title: "Policies", pageId: "security-policies" },
    ],
  },
  {
    id: "support",
    title: "Help Center",
    items: [
      { id: "help-home", title: "Support Home", pageId: "help-home" },
      { id: "onboarding-rollout", title: "Onboarding & rollout", pageId: "onboarding-rollout" },
    ],
  },
  {
    id: "updates",
    title: "Changelog",
    items: [{ id: "latest-updates", title: "Latest updates", pageId: "latest-updates" }],
  },
];

const pages: DocPage[] = [
  {
    id: "welcome",
    tab: "product",
    title: "Welcome to iweOS Docs",
    description:
      "The operating manual for schools using iweOS. Start here to set up the school, onboard teachers, manage students, publish results, and keep day-to-day workflows running cleanly.",
    kind: "guide",
    badge: "Guide",
    cards: [
      {
        id: "card-setup",
        title: "School setup",
        description: "Configure identity, branding, and the result template before the school goes live.",
        icon: "school",
        hrefLabel: "Open quickstart",
        pageId: "quickstart",
      },
      {
        id: "card-security",
        title: "Security and access",
        description: "Understand login, roles, notifications, and how admin override behaves.",
        icon: "shield",
        hrefLabel: "Review policies",
        pageId: "security-overview",
      },
      {
        id: "card-api",
        title: "API reference",
        description: "Browse auth tokens, request examples, and response structure for integrations.",
        icon: "api",
        hrefLabel: "View API docs",
        pageId: "auth-tokens",
      },
      {
        id: "card-results",
        title: "Result workflows",
        description: "Move from grading to result publishing, PDF export, and secure sharing.",
        icon: "docs",
        hrefLabel: "Read concepts",
        pageId: "concepts",
      },
      {
        id: "card-payments",
        title: "Payments and collections",
        description: "Set fee schedules, issue invoices, and use the public payment flow.",
        icon: "payments",
        hrefLabel: "Open help center",
        pageId: "help-home",
      },
      {
        id: "card-rollout",
        title: "Team rollout",
        description: "Get principals, admins, and teachers aligned with a simple rollout plan.",
        icon: "users",
        hrefLabel: "See rollout guide",
        pageId: "onboarding-rollout",
      },
    ],
    sections: [
      {
        id: "what-you-can-do",
        eyebrow: "Overview",
        title: "What iweOS is designed to handle",
        body: [
          "iweOS helps schools run academic workflows and parent-facing payment workflows inside one operating system. The product is strongest when the school sets up sessions, classes, teacher assignments, assessment structures, and result publishing before teachers start entering data.",
          "From that point, teachers can work inside scoped portals for attendance, comments, conduct, grade entry, and student analytics, while admins stay in control of grading policy, result publishing, promotion, payments, and configuration.",
        ],
      },
      {
        id: "recommended-rollout",
        eyebrow: "Recommended path",
        title: "Recommended rollout order",
        bullets: [
          "Complete school settings, logo, principal signature, and result template first.",
          "Create sessions and sub-sessions, then classes, subjects, and grade scales.",
          "Add teachers, assign them to classes, and confirm they can access the teacher portal.",
          "Import students, clean statuses, then enroll them into the right term and class.",
          "Assign term-specific assessment schemes before score entry begins.",
          "Publish results only after attendance, comments, conduct, and grading are reviewed.",
        ],
      },
    ],
    helpfulPrompt: "Did this welcome guide help you orient the product quickly?",
  },
  {
    id: "quickstart",
    tab: "product",
    title: "Quickstart",
    description:
      "A practical setup path for a school starting fresh on iweOS, from sign-up to live teacher activity.",
    kind: "guide",
    badge: "Getting Started",
    cards: [
      {
        id: "q1",
        title: "Settings first",
        description: "Add school name, logo, principal signature, and choose the result template.",
        icon: "rocket",
        pageId: "concepts",
      },
      {
        id: "q2",
        title: "Academic structure",
        description: "Create sessions, classes, subjects, and assessment schemes before teachers begin.",
        icon: "student",
        pageId: "concepts",
      },
      {
        id: "q3",
        title: "Support teachers",
        description: "Link teachers, assign classes, and let them verify attendance and grading pages.",
        icon: "users",
        pageId: "onboarding-rollout",
      },
    ],
    sections: [
      {
        id: "step-1",
        eyebrow: "Step 1",
        title: "Create the school workspace",
        body: [
          "Start by signing up the school and opening Settings. This is where branding, result template selection, and signature assets should be completed. Getting these done early prevents result export and PDF issues later.",
        ],
      },
      {
        id: "step-2",
        eyebrow: "Step 2",
        title: "Build the academic model",
        bullets: [
          "Create a session and generate its sub-sessions or terms.",
          "Create classes and subjects.",
          "Assign subjects to classes.",
          "Set grade scales, conduct sections, and promotion rules.",
          "Attach the right assessment preset to each term.",
        ],
      },
      {
        id: "step-3",
        eyebrow: "Step 3",
        title: "Populate teachers and students",
        body: [
          "Teachers should be added, linked to real sign-ins, and assigned to classes. Students can then be created manually or in bulk. iweOS now blocks duplicate student names in the same class so the directory stays clean.",
        ],
      },
      {
        id: "step-4",
        eyebrow: "Step 4",
        title: "Go live with teacher workflows",
        body: [
          "Once attendance, comment, conduct, and grade entry are available, teachers can work inside their own portal. Admins can still enter through Teacher Portal when support or override is needed, but the day-to-day flow should stay teacher-owned.",
        ],
      },
    ],
    helpfulPrompt: "Did this quickstart make the initial setup sequence clear?",
  },
  {
    id: "concepts",
    tab: "product",
    title: "Core concepts",
    description:
      "The key concepts behind sessions, assessment templates, teacher workflows, results, promotion, and payments inside iweOS.",
    kind: "doc",
    badge: "Concepts",
    sections: [
      {
        id: "sessions",
        eyebrow: "Academic model",
        title: "Sessions drive the school year",
        body: [
          "iweOS treats a session as the parent container for terms, semesters, or custom sub-sessions. This matters because assessment structures, result publishing, attendance, and promotion all need a stable academic period to attach to.",
        ],
      },
      {
        id: "assessment-schemes",
        eyebrow: "Grading model",
        title: "Assessment templates are fixed per term",
        body: [
          "Assessment presets stay reusable, but each term receives a fixed snapshot. That protects historical grading when one term uses 2 CA + Exam and another uses 3 CA + Exam.",
        ],
        codeBlocks: [
          {
            language: "json",
            caption: "Example of a term-specific assessment snapshot.",
            code: `{
  "term": "2025/2026 First Term",
  "template": "2 CA + Exam",
  "items": [
    { "name": "CA1", "maxScore": 20 },
    { "name": "CA2", "maxScore": 20 },
    { "name": "Exam", "maxScore": 60 }
  ]
}`,
          },
        ],
      },
      {
        id: "results",
        eyebrow: "Publishing model",
        title: "Results move through draft, published, and shared states",
        body: [
          "Result views exist inside admin review pages, export pages, and shared student links. Publication status controls whether the shared result is reachable. The export page is isolated from the admin shell so PDFs are generated as documents, not dashboards.",
        ],
      },
      {
        id: "operations",
        eyebrow: "Operations",
        title: "Notifications and payments are operational layers",
        body: [
          "Notifications keep admins and teachers informed about class-level changes, while the payments area handles invoices, collections, reports, and public fee payment. These are operational systems that sit alongside academic workflows rather than inside them.",
        ],
      },
    ],
    helpfulPrompt: "Did these concepts make the platform model easier to understand?",
  },
  {
    id: "auth-tokens",
    tab: "api",
    title: "Auth tokens",
    description:
      "Use publishable and server-side keys correctly when integrating against iweOS-authenticated surfaces or protected routes.",
    kind: "doc",
    badge: "API Reference",
    endpoints: [
      { method: "GET", label: "Fetch profile context", anchorId: "overview" },
      { method: "POST", label: "Exchange session token", anchorId: "token-shape" },
      { method: "PATCH", label: "Refresh metadata", anchorId: "examples" },
    ],
    sections: [
      {
        id: "overview",
        eyebrow: "Overview",
        title: "Token usage rules",
        body: [
          "iweOS uses Clerk for authentication, so token usage should respect your environment configuration and deployment mode. Keep publishable keys in the client and secret keys on the server only.",
        ],
      },
      {
        id: "token-shape",
        eyebrow: "Attributes",
        title: "Expected token payload shape",
        body: [
          "A typical server-consumed token should resolve the user, role, and school context. Metadata should stay minimal and should not duplicate large profile records that can be fetched from the database.",
        ],
        codeBlocks: [
          {
            language: "json",
            caption: "Illustrative token claims shape.",
            code: `{
  "sub": "user_123",
  "role": "teacher",
  "schoolId": "sch_456",
  "permissions": ["grade-entry:write", "attendance:write"]
}`,
          },
        ],
      },
      {
        id: "examples",
        eyebrow: "Examples",
        title: "Server example",
        codeBlocks: [
          {
            language: "ts",
            caption: "A simple server-side token consumption example.",
            code: `import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId, sessionClaims } = await auth();

  return Response.json({
    userId,
    role: sessionClaims?.role,
    schoolId: sessionClaims?.schoolId,
  });
}`,
          },
        ],
      },
    ],
    helpfulPrompt: "Was this auth token reference useful?",
  },
  {
    id: "users-resource",
    tab: "api",
    title: "Users",
    description:
      "Reference patterns for working with admin and teacher user records, profile resolution, and school-scoped queries.",
    kind: "doc",
    badge: "API Reference",
    endpoints: [
      { method: "GET", label: "List users", anchorId: "list-users" },
      { method: "POST", label: "Create teacher invite", anchorId: "teacher-invite" },
      { method: "PATCH", label: "Update user role", anchorId: "role-update" },
    ],
    sections: [
      {
        id: "list-users",
        eyebrow: "Overview",
        title: "User records stay school-scoped",
        body: [
          "iweOS resolves profiles by school context. Admins and teachers belong to a school, and teacher workflows should always stay scoped to assigned classes or the active override session.",
        ],
      },
      {
        id: "teacher-invite",
        eyebrow: "Examples",
        title: "Teacher invite payload",
        codeBlocks: [
          {
            language: "json",
            caption: "Example payload for a teacher creation flow.",
            code: `{
  "fullName": "Adaeze Okafor",
  "email": "adaeze@example.com",
  "role": "TEACHER",
  "schoolId": "sch_456"
}`,
          },
        ],
      },
      {
        id: "role-update",
        eyebrow: "Notes",
        title: "Role updates should sync metadata",
        body: [
          "When a teacher is promoted to admin or demoted back, the database role and Clerk public metadata need to stay aligned. iweOS already tries to sync those metadata updates so the sign-in experience stays consistent.",
        ],
      },
    ],
    helpfulPrompt: "Did this user reference answer what you needed?",
  },
  {
    id: "security-overview",
    tab: "api",
    title: "Security overview",
    description:
      "A high-level explanation of role boundaries, admin override, result publication controls, and operational safety inside iweOS.",
    kind: "doc",
    badge: "Security",
    sections: [
      {
        id: "roles",
        eyebrow: "Roles",
        title: "Admins and teachers do not share the same surface",
        body: [
          "The admin area controls structure, policy, payments, and publication. The teacher portal controls attendance, comments, conduct, grade entry, and student analytics. Admin override exists for support, but it should not replace real teacher workflow ownership.",
        ],
      },
      {
        id: "publication-guard",
        eyebrow: "Results",
        title: "Publication status controls access",
        body: [
          "Shared result links only work when a student result is published. Draft or unpublished results are intentionally unavailable to protect incomplete or withdrawn output from being shared prematurely.",
        ],
      },
      {
        id: "data-safety",
        eyebrow: "Operational safety",
        title: "Status and duplication checks matter",
        body: [
          "Only active students should appear in teacher scoring flows. Duplicate student names in the same class are now blocked at the server layer to reduce directory pollution and repeated academic records.",
        ],
      },
    ],
    helpfulPrompt: "Did this security overview cover the boundaries clearly?",
  },
  {
    id: "security-policies",
    tab: "api",
    title: "Policies",
    description:
      "Recommended internal policies for school admins rolling out iweOS to teachers and support staff.",
    kind: "doc",
    badge: "Security",
    sections: [
      {
        id: "policy-baseline",
        eyebrow: "Recommended",
        title: "Baseline policy set",
        bullets: [
          "Limit admin accounts to staff who genuinely need structural control.",
          "Use teacher accounts for day-to-day data entry instead of shared admin logins.",
          "Publish results only after comment, conduct, and attendance review is complete.",
          "Treat school logo and principal signature changes as controlled settings changes.",
          "Review notification activity when major data operations are completed.",
        ],
      },
    ],
    helpfulPrompt: "Did these policy suggestions feel practical for a real school rollout?",
  },
  {
    id: "help-home",
    tab: "help",
    title: "Help Center",
    description:
      "Find setup help, troubleshooting, and rollout guidance for admins, teachers, and support leads.",
    kind: "help",
    heroTitle: "How can we help your school today?",
    heroDescription:
      "Use the guide like a support center: search a workflow, jump into a category, or use the in-app tour to orient staff inside the live workspace.",
    cards: [
      {
        id: "help-card-1",
        title: "Set up a school",
        description: "Use this when a new school is signing up and needs a clean initial rollout path.",
        icon: "rocket",
        pageId: "quickstart",
      },
      {
        id: "help-card-2",
        title: "Fix result issues",
        description: "Understand attendance, comments, signatures, result templates, and PDF/export behavior.",
        icon: "docs",
        pageId: "concepts",
      },
      {
        id: "help-card-3",
        title: "Support teachers",
        description: "Help teachers with attendance, comments, grade entry, conduct, and analytics.",
        icon: "users",
        pageId: "onboarding-rollout",
      },
      {
        id: "help-card-4",
        title: "Understand security",
        description: "Review access boundaries, publication rules, and profile handling expectations.",
        icon: "shield",
        pageId: "security-overview",
      },
    ],
    helpfulPrompt: "Did this help center landing point you to the right article?",
  },
  {
    id: "onboarding-rollout",
    tab: "help",
    title: "Onboarding and rollout",
    description:
      "A practical rollout pattern for bringing admins, principals, and teachers onto iweOS without confusion.",
    kind: "guide",
    badge: "Help Center",
    sections: [
      {
        id: "admins-first",
        eyebrow: "Phase 1",
        title: "Train the school admin first",
        body: [
          "Before teachers start using the platform, the admin should understand settings, sessions, grading configuration, teacher linking, student management, result publication, and payments. That person becomes the internal champion for the school.",
        ],
      },
      {
        id: "teachers-second",
        eyebrow: "Phase 2",
        title: "Onboard teachers by workflow, not by feature list",
        bullets: [
          "Show Attendance first.",
          "Then show Grade Entry and how autosave behaves.",
          "Then Conduct, Comment, and Student analytics.",
          "Leave result publishing to admins, but show teachers how results use the data they enter.",
        ],
      },
      {
        id: "tour-usage",
        eyebrow: "Phase 3",
        title: "Use the in-app tour as reinforcement",
        body: [
          "The in-app footer lets staff reopen the guided tour when they need a reminder. That makes it easier to train once and let people self-serve later instead of repeatedly explaining the whole product from scratch.",
        ],
      },
    ],
    helpfulPrompt: "Would this rollout guide help you onboard a real school team?",
  },
  {
    id: "latest-updates",
    tab: "changelog",
    title: "Latest updates",
    description:
      "A product-focused changelog highlighting the most relevant recent additions across grading, results, payments, operations, and documentation.",
    kind: "changelog",
    badge: "Changelog",
    sections: [
      {
        id: "result-improvements",
        eyebrow: "Results",
        title: "Result exports and sharing improved",
        bullets: [
          "Dedicated export routes no longer inherit the admin shell.",
          "PDF download and mobile sharing flows were added.",
          "Result templates now support logos, student photos, and principal signatures.",
          "Performance vs class average charts were added to result views.",
        ],
      },
      {
        id: "teacher-quality",
        eyebrow: "Teacher workflow",
        title: "Autosave flows became safer",
        bullets: [
          "Grade entry no longer overwrites another in-progress field when one save completes.",
          "Attendance and comments now save on blur like grade entry.",
          "Inactive, withdrawn, or non-active students are excluded from teacher scoring flows.",
        ],
      },
      {
        id: "operations-quality",
        eyebrow: "Operations",
        title: "Operational visibility improved",
        bullets: [
          "Bell notifications now reflect real events instead of static items.",
          "Duplicate students in the same class are blocked at the server layer.",
          "Guide and in-app help are being rebuilt into a stronger documentation experience.",
        ],
      },
    ],
    helpfulPrompt: "Did this changelog make recent product movement easy to understand?",
  },
];

export default function GuidePage() {
  return (
    <div className={hornbill.variable}>
      <DocLayout tabs={tabs} groups={groups} pages={pages} />
    </div>
  );
}
