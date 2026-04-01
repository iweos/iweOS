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

const howToGuides = [
  {
    id: "how-to-sign-up-school",
    title: "How to sign up as a school",
    description: "Create the school workspace and complete the setup path that turns a fresh sign-up into a live operational account.",
    icon: "school",
    bullets: [
      "Open the public sign-up page and create the school account with the official school contact details.",
      "Confirm the admin sign-in, then complete the school profile under Settings.",
      "Upload the school logo and principal signature before sharing the workspace with staff.",
      "Choose the active result template so report exports are consistent from the beginning.",
      "Use the guide and in-app tour to orient the first school admin after sign-up.",
    ],
  },
  {
    id: "how-to-set-up-grading",
    title: "How to set up grading system",
    description: "Configure the grading foundation before teachers begin entering any scores.",
    icon: "docs",
    bullets: [
      "Create the grade scale first so totals map cleanly to grades and remarks.",
      "Set up assessment presets such as 2 CA + Exam or 3 CA + Exam.",
      "Assign the right assessment scheme to each term so grading stays term-specific.",
      "Set up conduct categories and sub-categories if the school uses psychomotor or affective scoring.",
      "Review promotion rules early so the annual result logic matches the school policy.",
    ],
  },
  {
    id: "how-to-add-student",
    title: "How to add student to school",
    description: "Create students one by one or in bulk while keeping the directory clean and searchable.",
    icon: "student",
    bullets: [
      "Go to Students and choose manual add or bulk import.",
      "Use complete names, status, class reference, and student codes where available.",
      "Upload a student photo during edit if the school wants it on result sheets.",
      "Check duplicate warnings carefully because iweOS now blocks repeated student names in the same class.",
      "Verify that newly added students appear in the directory before enrollment and grading begin.",
    ],
  },
  {
    id: "how-to-enroll-student",
    title: "How to add student to class (Enroll)",
    description: "Attach students to the right class and session so teacher workflows and results stay accurate.",
    icon: "student",
    bullets: [
      "Open Enrollments under Assignments and select the target session or term.",
      "Pick the correct class before choosing students.",
      "Use enrollment to control which active students appear in teacher flows.",
      "Recheck inactive or withdrawn students so they are not mistakenly enrolled for active grading.",
      "Confirm the enrollment count after saving so class totals match reality.",
    ],
  },
  {
    id: "how-to-manage-students",
    title: "How to manage students",
    description: "Use the student directory to update identity, status, class information, and student photos over time.",
    icon: "users",
    bullets: [
      "Use filters to narrow the directory by class and status.",
      "Open the profile view before editing so you can confirm the exact student record.",
      "Change status carefully between active, inactive, suspended, withdrawn, and graduated.",
      "Update guardian details and photos when result output or contact data needs correction.",
      "Use edits instead of duplicate re-entry when a student already exists in the system.",
    ],
  },
  {
    id: "how-to-add-teachers",
    title: "How to add teachers",
    description: "Create teacher profiles, link sign-ins, and prepare them for class assignments.",
    icon: "users",
    bullets: [
      "Add the teacher record with the correct email first.",
      "Link the teacher to the sign-up account after they register.",
      "Confirm the profile role is teacher and the account is active.",
      "Use notifications to confirm that newly linked teachers are aware of assignment changes.",
      "Support teachers through the teacher portal instead of giving them shared admin access.",
    ],
  },
  {
    id: "how-to-add-subjects",
    title: "How to add subjects",
    description: "Create subjects in a way that makes class assignment, grading, and reporting easier later.",
    icon: "docs",
    bullets: [
      "Create subjects once with clear naming that matches the school report style.",
      "Review subject spelling before teachers start grading to avoid duplicate subject variants.",
      "Add all core and optional subjects before class-subject assignment begins.",
      "Check that subjects needed for promotion rules exist exactly as expected.",
    ],
  },
  {
    id: "how-to-assign-teacher-class",
    title: "How to assign teacher to class",
    description: "Assign teachers so the teacher portal only shows the classes and data they are meant to handle.",
    icon: "users",
    bullets: [
      "Open Teacher Classes under Assignments.",
      "Pick the teacher, class, and session context carefully.",
      "Verify the assignment on the teacher side after saving.",
      "Use notifications to confirm the teacher received the change.",
      "Keep admin override for support only, not as the normal way teachers work.",
    ],
  },
  {
    id: "how-to-add-grades",
    title: "How to add grades",
    description: "Set the grade scale that converts totals into readable academic outcomes.",
    icon: "docs",
    bullets: [
      "Open Grading and create the school grade scale.",
      "Define score boundaries clearly from A through F.",
      "Confirm that the grade key matches what the school already uses on report cards.",
      "Check results after setup to confirm totals map into the intended grade bands.",
    ],
  },
  {
    id: "how-to-add-conduct",
    title: "How to add conduct",
    description: "Build conduct categories and sub-categories that teachers can score student by student.",
    icon: "book",
    bullets: [
      "Create the main conduct category first, such as Psychomotor or Affective.",
      "Add sub-categories like Handwriting, Neatness, or Punctuality under each category.",
      "Set a max score for each sub-category so teachers know the valid range.",
      "Review the conduct layout on the teacher portal before the term goes live.",
    ],
  },
  {
    id: "how-to-add-session",
    title: "How to add session",
    description: "Set up the school year and create its terms, semesters, or custom sub-sessions.",
    icon: "compass",
    bullets: [
      "Open Academic Setup and create the new session label, such as 2025/2026.",
      "Choose three terms, two semesters, or a custom structure.",
      "If using custom mode, enter each sub-session label carefully and avoid duplicates.",
      "Mark the right sub-session active before teachers start entering data.",
    ],
  },
  {
    id: "how-to-add-assessment",
    title: "How to add assessment",
    description: "Create assessment presets and attach them to terms so teachers always see the correct grading columns.",
    icon: "flask",
    bullets: [
      "Create the reusable assessment preset under Assessment Types.",
      "Assign that preset to the target term so the app creates a fixed term snapshot.",
      "Do not start teacher score entry until the correct term scheme is attached.",
      "Use a different preset next term if the school changes from one CA pattern to another.",
    ],
  },
  {
    id: "how-to-use-results",
    title: "How to use result",
    description: "Review, publish, export, and share results in the clean admin flow without mixing up preview pages and document pages.",
    icon: "docs",
    bullets: [
      "Open Results under Grading and filter by term, class, and student.",
      "Review the result preview before changing its publication status.",
      "Use draft, published, and unpublished states deliberately so shared links only expose approved results.",
      "Open the export route for clean print, PDF download, and mobile sharing.",
      "Use class export when you need multiple result sheets in one document flow.",
    ],
  },
] as const;

const trickGuides = [
  {
    id: "tricks-one-click",
    title: "One click: what it does",
    description: "A quick explanation of one-click actions that save time in the live workspace.",
    icon: "sparkles",
    bullets: [
      "Single-click filters refresh the page context without requiring manual load buttons.",
      "One-click export routes open clean document pages instead of dashboard shells.",
      "One-click status changes on results let admins move records between draft, published, and unpublished states quickly.",
      "One-click bell notifications keep users aware of major updates without hunting through pages.",
    ],
  },
  {
    id: "tricks-two-click",
    title: "Two click: what it does",
    description: "The fastest two-step moves staff use most often when operating iweOS day to day.",
    icon: "sparkles",
    bullets: [
      "Pick a class, then a student to open focused conduct and analytics flows without huge tables.",
      "Choose a term, then a scheme to lock the grading structure for that session period.",
      "Open the teacher portal from admin, then return with Back to Administration when support is complete.",
      "Select students, then apply a result status in bulk to update a whole result batch faster.",
    ],
  },
  {
    id: "tricks-power-tips",
    title: "Other iweOS tricks",
    description: "Operational habits and platform shortcuts that keep the school team moving smoothly.",
    icon: "help",
    bullets: [
      "Autosave works best when teachers enter a field and move forward naturally instead of waiting on each save.",
      "Use student status carefully because only active students should remain visible in teacher scoring flows.",
      "Keep the result route, print route, and shared route separate so exported documents stay clean.",
      "Reopen the in-app tour anytime from the footer when onboarding a new teacher or school admin.",
    ],
  },
] as const;

const groups: SidebarGroup[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    items: [
      { id: "welcome", title: "Welcome", icon: "sparkles", pageId: "welcome" },
      { id: "quickstart", title: "Quickstart", icon: "compass", pageId: "quickstart" },
      { id: "concepts", title: "Concepts", icon: "book", pageId: "concepts" },
    ],
  },
  {
    id: "api-reference",
    title: "API",
    items: [
      {
        id: "authentication",
        title: "Authentication",
        icon: "key",
        children: [{ id: "auth-tokens", title: "Auth tokens", icon: "key", pageId: "auth-tokens" }],
      },
      {
        id: "resources",
        title: "Core resources",
        icon: "flask",
        children: [{ id: "users-resource", title: "Users", icon: "flask", pageId: "users-resource" }],
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    items: [
      { id: "security-overview", title: "Overview", icon: "shield", pageId: "security-overview" },
      { id: "security-policies", title: "Policies", icon: "shield", pageId: "security-policies" },
    ],
  },
  {
    id: "how-to",
    title: "How-To",
    items: [
      {
        id: "how-to-manage-school",
        title: "Manage School",
        icon: "school",
        children: [
          { id: "how-to-sign-up-school-link", title: "Sign up as a school", icon: "school", pageId: "how-to-sign-up-school" },
          { id: "how-to-add-session-link", title: "Add session", icon: "compass", pageId: "how-to-add-session" },
          { id: "how-to-set-up-grading-link", title: "Set up grading system", icon: "docs", pageId: "how-to-set-up-grading" },
          { id: "how-to-add-grades-link", title: "Add grades", icon: "docs", pageId: "how-to-add-grades" },
          { id: "how-to-add-conduct-link", title: "Add conduct", icon: "book", pageId: "how-to-add-conduct" },
          { id: "how-to-add-assessment-link", title: "Add assessment", icon: "flask", pageId: "how-to-add-assessment" },
        ],
      },
      {
        id: "how-to-manage-teacher",
        title: "Manage Teacher",
        icon: "users",
        children: [
          { id: "how-to-add-teachers-link", title: "Add teachers", icon: "users", pageId: "how-to-add-teachers" },
          {
            id: "how-to-assign-teacher-class-link",
            title: "Assign teacher to class",
            icon: "users",
            pageId: "how-to-assign-teacher-class",
          },
        ],
      },
      {
        id: "how-to-manage-student",
        title: "Manage Student",
        icon: "student",
        children: [
          { id: "how-to-add-student-link", title: "Add student to school", icon: "student", pageId: "how-to-add-student" },
          { id: "how-to-manage-students-link", title: "Manage students", icon: "users", pageId: "how-to-manage-students" },
        ],
      },
      {
        id: "how-to-manage-class",
        title: "Manage Class",
        icon: "compass",
        children: [
          { id: "how-to-enroll-student-link", title: "Add student to class", icon: "student", pageId: "how-to-enroll-student" },
          { id: "how-to-add-subjects-link", title: "Add subjects", icon: "docs", pageId: "how-to-add-subjects" },
        ],
      },
      {
        id: "how-to-use-result-group",
        title: "Use Result",
        icon: "docs",
        children: [{ id: "how-to-use-results-link", title: "Use result", icon: "docs", pageId: "how-to-use-results" }],
      },
    ],
  },
  {
    id: "tricks",
    title: "iweOS Tricks",
    items: [
      {
        id: "tricks-group",
        title: "Smart shortcuts",
        icon: "sparkles",
        children: trickGuides.map((guide) => ({
          id: `${guide.id}-link`,
          title: guide.title,
          icon: "sparkles",
          pageId: guide.id,
        })),
      },
    ],
  },
  {
    id: "support",
    title: "Help Center",
    items: [
      { id: "help-home", title: "Support Home", icon: "help", pageId: "help-home" },
      { id: "onboarding-rollout", title: "Onboarding & rollout", icon: "help", pageId: "onboarding-rollout" },
    ],
  },
  {
    id: "updates",
    title: "Changelog",
    items: [{ id: "latest-updates", title: "Latest updates", icon: "sparkles", pageId: "latest-updates" }],
  },
];

const pages: DocPage[] = [
  {
    id: "welcome",
    tab: "product",
    title: "Welcome to iweOS Guide",
    description:
      "The operating manual for schools using iweOS. Start here to set up the school, onboard teachers, manage students, publish results, and keep day-to-day workflows running cleanly.",
    kind: "guide",
    badge: "Guide",
    infographics: [
      {
        id: "welcome-workflow",
        title: "How schools typically go live on iweOS",
        description:
          "This is the cleanest rollout sequence we keep seeing work well: set identity first, then academics, then people, then result publication.",
        tone: "amber",
        imageSrc: "/images/iweos-features-concept.svg",
        imageAlt: "iweOS product overview illustration",
        items: [
          { label: "Stage 1", value: "School setup", note: "Logo, signature, result template, branding." },
          { label: "Stage 2", value: "Academic model", note: "Sessions, classes, subjects, grading, promotion." },
          { label: "Stage 3", value: "Team rollout", note: "Teachers linked, assigned, and trained by workflow." },
          { label: "Stage 4", value: "Student operations", note: "Students imported, enrolled, scored, and reviewed." },
        ],
      },
    ],
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
    infographics: [
      {
        id: "quickstart-timeline",
        title: "Quickstart at a glance",
        description:
          "Use this as the minimum launch checklist when onboarding a new school onto the platform.",
        tone: "emerald",
        items: [
          { label: "0-1 day", value: "Settings complete", note: "School profile, logo, signature, template." },
          { label: "Day 1", value: "Academic setup", note: "Sessions, classes, subjects, grade scale, conduct." },
          { label: "Day 2", value: "People onboarded", note: "Teachers linked, students imported, enrollments checked." },
          { label: "Day 3", value: "Teacher go-live", note: "Attendance, comments, grade entry, conduct, results." },
        ],
      },
    ],
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
    infographics: [
      {
        id: "concepts-lifecycle",
        title: "Result lifecycle inside iweOS",
        description:
          "Results are not just printed documents. They are the end of a chain that starts from teacher-owned entries and ends with controlled publication and sharing.",
        tone: "slate",
        items: [
          { label: "Input", value: "Attendance + comment", note: "Teachers feed operational context into the result." },
          { label: "Academic", value: "Scores + conduct", note: "Term-fixed assessment schemes keep data stable." },
          { label: "Review", value: "Admin result center", note: "Preview, status control, publication checks." },
          { label: "Output", value: "Print + PDF + share", note: "Document route, mobile sharing, secure links." },
        ],
      },
    ],
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
    infographics: [
      {
        id: "support-summary",
        title: "Where schools usually need help first",
        description:
          "These are the most common support surfaces during rollout and the first few active academic cycles.",
        tone: "amber",
        items: [
          { label: "Setup", value: "Branding", note: "Logo, signatures, template, school identity." },
          { label: "Academic", value: "Assessments", note: "Term structure, schemes, grades, promotion rules." },
          { label: "Teachers", value: "Autosave flows", note: "Attendance, comments, grade entry, conduct." },
          { label: "Results", value: "Publishing", note: "Preview, PDF, sharing, and public link status." },
        ],
      },
    ],
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
      {
        id: "help-card-5",
        title: "How-To library",
        description: "Open step-by-step task guides for sign-up, grading, enrollment, teachers, and assessments.",
        icon: "docs",
        pageId: "how-to-sign-up-school",
      },
      {
        id: "help-card-6",
        title: "iweOS tricks",
        description: "Learn the small workflow shortcuts that make the platform feel faster in daily use.",
        icon: "bot",
        pageId: "tricks-one-click",
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
        id: "subject-exemptions-and-catalog-editing",
        eyebrow: "Academics",
        timestamp: "Apr 1, 2026 · 11:55 AM WAT",
        timelineGroup: "Today",
        title: "Subject editing and student subject exemptions were added",
        body: [
          "iweOS now supports a cleaner elective workflow for schools where not every student in a class offers every class subject. This update also improves subject maintenance from the admin side so schools can correct subject names without deleting and recreating them.",
        ],
        bullets: [
          "Admins can now edit existing subjects directly from the Subject Catalog instead of deleting and recreating them.",
          "Duplicate subject names are blocked during editing so the subject list stays clean and consistent.",
          "A new student subject exemption flow was added so admins and teachers can exempt a student from a subject the student does not offer.",
          "Teachers can now use Grade Entry to mark a student as exempt for the selected subject, and admins can do the same through admin override in the teacher portal.",
          "Exempted subjects no longer appear as zero-scored rows in result calculations, so they do not unfairly reduce student averages, grades, or rankings.",
          "Teacher analytics, teacher results, admin results, exported PDFs, and shared result documents now stay aligned with the same exemption rule.",
        ],
      },
      {
        id: "result-improvements",
        eyebrow: "Results",
        timestamp: "Mar 31, 2026 · 8:40 PM WAT",
        timelineGroup: "Today",
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
        timestamp: "Mar 31, 2026 · 6:15 PM WAT",
        timelineGroup: "Today",
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
        timestamp: "Mar 30, 2026 · 9:10 PM WAT",
        timelineGroup: "Yesterday",
        title: "Operational visibility improved",
        bullets: [
          "Bell notifications now reflect real events instead of static items.",
          "Duplicate students in the same class are blocked at the server layer.",
          "Guide and in-app help are being rebuilt into a stronger documentation experience.",
        ],
      },
      {
        id: "docs-evolution",
        eyebrow: "Documentation",
        timestamp: "Mar 28, 2026 · 4:30 PM WAT",
        timelineGroup: "Earlier",
        title: "Guide experience became more product-oriented",
        bullets: [
          "The guide was rebuilt into a documentation-style workspace with sidebar navigation and search.",
          "Hornbill typography, infographics, and a changelog view were introduced to make updates easier to track.",
          "Public navigation was split into dedicated pages so product, pricing, payments, and help content are easier to browse.",
        ],
      },
    ],
    helpfulPrompt: "Did this changelog make recent product movement easy to understand?",
  },
  ...howToGuides.map((guide) => ({
    id: guide.id,
    tab: "help" as const,
    title: guide.title,
    description: guide.description,
    kind: "guide" as const,
    badge: "How-To",
    sections: [
      {
        id: `${guide.id}-overview`,
        eyebrow: "Outcome",
        title: "What this task should accomplish",
        body: [
          guide.description,
          "Use this guide as the operational checklist for the task. It is written to keep setup steps, ownership, and validation clear for school admins and support leads.",
        ],
      },
      {
        id: `${guide.id}-steps`,
        eyebrow: "Checklist",
        title: "Recommended steps",
        bullets: [...guide.bullets],
      },
      {
        id: `${guide.id}-verify`,
        eyebrow: "Validation",
        title: "What to verify before moving on",
        bullets: [
          "Confirm the change appears in the correct admin page after save.",
          "If the task affects teachers, verify that the teacher portal reflects the new setup.",
          "If the task affects results, check at least one result preview before the school starts live usage.",
        ],
      },
    ],
    helpfulPrompt: `Did this ${guide.title.toLowerCase()} guide help you complete the task?`,
  })),
  ...trickGuides.map((guide) => ({
    id: guide.id,
    tab: "help" as const,
    title: guide.title,
    description: guide.description,
    kind: "guide" as const,
    badge: "iweOS Tricks",
    sections: [
      {
        id: `${guide.id}-overview`,
        eyebrow: "What it means",
        title: "How this trick helps in daily use",
        body: [
          guide.description,
          "These are not separate features to configure. They are the small workflow behaviors that make iweOS faster and easier once staff understand them.",
        ],
      },
      {
        id: `${guide.id}-details`,
        eyebrow: "Examples",
        title: "What to watch for",
        bullets: [...guide.bullets],
      },
    ],
    helpfulPrompt: `Was this ${guide.title.toLowerCase()} note useful?`,
  })),
];

export default function GuidePage() {
  return (
    <div className={hornbill.variable}>
      <DocLayout tabs={tabs} groups={groups} pages={pages} />
    </div>
  );
}
