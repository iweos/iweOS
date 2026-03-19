export type NavItem = {
  label: string;
  href: string;
};

export type Outcome = {
  title: string;
  description: string;
};

export type Feature = {
  title: string;
  description: string;
};

export type WorkStep = {
  title: string;
  description: string;
};

export type RoleTile = {
  role: string;
  summary: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
};

export type TrustItem = {
  title: string;
  description: string;
};

export type Testimonial = {
  quote: string;
  name: string;
  title: string;
  school: string;
};

export type FAQItem = {
  question: string;
  answer: string;
};

export type FooterGroup = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

export const siteName = "ìwéOS";

export const navItems: NavItem[] = [
  { label: "Product", href: "#product" },
  { label: "Grading", href: "#grading" },
  { label: "Payments", href: "#payments" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
];

export const heroContent = {
  heading: "Run your school like an OS.",
  subheading:
    "Grading, results, and school fees in one simple system for admins, teachers, and parents.",
  trustLine:
    "Built for real school workflows: terms, classes, scores, invoices, receipts.",
  primaryCta: { label: "Sign up", href: "/sign-up" },
  secondaryCta: { label: "View product", href: "#product" },
  tertiaryCta: { label: "Pay fees", href: "/pay" },
};

export const gradingPreviewRows = [
  { student: "A. Okonkwo", ca1: 13, ca2: 14, exam: 60, total: 87, grade: "A" },
  { student: "M. Bello", ca1: 10, ca2: 12, exam: 49, total: 71, grade: "B" },
  { student: "E. Mensah", ca1: 8, ca2: 11, exam: 44, total: 63, grade: "C" },
];

export const paymentPreviewLines = [
  { item: "Tuition", amount: "240,000" },
  { item: "Uniform", amount: "35,000" },
  { item: "Books", amount: "48,000" },
  { item: "Total", amount: "323,000" },
];

export const paymentStatuses = ["Paid", "Part-paid", "Outstanding"] as const;

export const outcomes: Outcome[] = [
  {
    title: "Faster results",
    description: "Teachers enter scores once, totals and grades are computed instantly.",
  },
  {
    title: "Cleaner reconciliation",
    description: "Track full and part payments with clear invoice balances and receipts.",
  },
  {
    title: "Less parent back-and-forth",
    description: "Parents pay from a simple ID-based page and get confirmation immediately.",
  },
];

export const gradingFeatures: Feature[] = [
  {
    title: "Role-based access",
    description: "Admins manage structure while teachers only access assigned classes and subjects.",
  },
  {
    title: "Term, class, and subject management",
    description: "Set up academic sessions quickly and keep structures consistent each term.",
  },
  {
    title: "Score entry with auto calculations",
    description: "Capture CA and exam scores with server-calculated totals and grade output.",
  },
  {
    title: "Report sheets and export",
    description: "Generate report sheets and export to PDF or Excel when needed.",
  },
];

export const paymentFeatures: Feature[] = [
  {
    title: "Payment link by Student ID",
    description: "Parents can pay for one or multiple students from a single link flow.",
  },
  {
    title: "Invoice line-items",
    description: "Break down compulsory fees and extras to keep billing transparent.",
  },
  {
    title: "Auto receipts and confirmations",
    description: "Issue receipts immediately and keep a searchable payment trail.",
  },
  {
    title: "Part payment and reconciliation",
    description: "Track outstanding balances accurately and reconcile against invoices.",
  },
];

export const howItWorksSteps: WorkStep[] = [
  {
    title: "School sets up structure",
    description: "Create classes, terms, subjects, and fee items in one admin workspace.",
  },
  {
    title: "Teachers and parents act",
    description: "Teachers record scores while parents pay through a simple payment link.",
  },
  {
    title: "System closes the loop",
    description: "Results and receipts are generated; admins reconcile and export reports.",
  },
];

export const roles: RoleTile[] = [
  {
    role: "Admins",
    summary: "Control structure, approvals, and financial clarity across the school.",
    bullets: [
      "Manage classes, terms, and subjects",
      "Approve workflows and monitor staff actions",
      "Reconcile collections and export reports",
    ],
    ctaLabel: "Admin guide",
    ctaHref: "/docs",
  },
  {
    role: "Teachers",
    summary: "Login securely and submit results quickly for assigned classes.",
    bullets: [
      "Access only assigned classes",
      "Enter scores in a fast, familiar table",
      "Review computed totals and grades",
    ],
    ctaLabel: "Teacher workflow",
    ctaHref: "/docs",
  },
  {
    role: "Parents",
    summary: "Pay with student IDs, receive receipts, and follow balances clearly.",
    bullets: [
      "Pay for one or more children at once",
      "Get receipt and payment confirmation instantly",
      "View part-payment and outstanding balance",
    ],
    ctaLabel: "Parent payments",
    ctaHref: "/pay",
  },
];

export const trustItems: TrustItem[] = [
  {
    title: "Activity logs",
    description: "Track important grading and payment actions with timestamp history.",
  },
  {
    title: "Permission controls",
    description: "Set role boundaries so each user only sees what they should manage.",
  },
  {
    title: "Data backups",
    description: "Protect core school records with regular backup routines.",
  },
];

export const trustStackNote =
  "Built on modern infrastructure focused on reliability, secure access, and day-to-day school operations.";

export const testimonials: Testimonial[] = [
  {
    quote: "Results are out in days, not weeks.",
    name: "A. Nwosu",
    title: "Vice Principal",
    school: "Greenfield College",
  },
  {
    quote: "We stopped chasing teller screenshots.",
    name: "T. Adeyemi",
    title: "Bursar",
    school: "Heritage Schools",
  },
  {
    quote: "Teachers submit scores faster and parents trust the process more.",
    name: "M. Boateng",
    title: "School Administrator",
    school: "Riverside Academy",
  },
];

export const faqs: FAQItem[] = [
  {
    question: "How long does setup take?",
    answer:
      "Most schools complete initial setup in a few days once class structure, subjects, and fee items are ready.",
  },
  {
    question: "Can teachers only see their classes?",
    answer:
      "Yes. Teacher access is tied to assigned classes and subjects, while admin controls school-wide settings.",
  },
  {
    question: "Can parents pay for multiple children at once?",
    answer:
      "Yes. Parents can submit multiple student payment IDs and pay from one flow.",
  },
  {
    question: "Do you support part payments?",
    answer:
      "Yes. Part payments are recorded and outstanding balances remain visible for follow-up.",
  },
  {
    question: "How do receipts and reconciliation work?",
    answer:
      "Receipts are generated after payment confirmation, and admins can reconcile transactions against invoice lines.",
  },
  {
    question: "Can we export results and payment reports?",
    answer:
      "Yes. Export options are available for academic results and payment reporting workflows.",
  },
];

export const footerGroups: FooterGroup[] = [
  {
    title: "Product",
    links: [
      { label: "Grading", href: "#grading" },
      { label: "Payments", href: "#payments" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Sign up", href: "/sign-up" },
      { label: "Get started", href: "/sign-up" },
      { label: "Sign in", href: "/sign-in" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Pay fees", href: "/pay" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Support", href: "mailto:support@iweos.io" },
    ],
  },
];

export const socialLinks = [
  { label: "X", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "YouTube", href: "#" },
];
