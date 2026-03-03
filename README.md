# School Grading + Payments System (Multi-tenant)

Next.js App Router + TypeScript + Tailwind + Clerk auth + Prisma/Postgres.

## Stack and Infra

- **Frontend/App**: Next.js App Router (`src/app`) + Tailwind
- **Auth**: Clerk (`@clerk/nextjs`)
- **DB**: Postgres
- **ORM/DB Layer**: Prisma with singleton client in `src/lib/server/prisma.ts` (same style as 2Settle)
- **Migrations**: Prisma migrations with SQL at `prisma/migrations/*/migration.sql`

## Environment Variables

Create `.env.local` from `.env.example`:

- `DATABASE_URL` - Postgres connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (default `/sign-in`)
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (default `/sign-up`)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` (default `/app`)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` (default `/onboarding`)

## Install and Run

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Payment allocation tests:

```bash
node --test src/lib/server/payments/allocation.test.mjs
```

## Onboarding Flow

1. User signs up via Clerk.
2. User lands on `/onboarding`.
3. App checks for existing profile by `clerk_user_id`.
4. If none:
   - If a teacher profile already exists with matching email and no Clerk link, it links `clerk_user_id`.
   - Otherwise, creates a new school and creates the user as `admin`.
   - Generates a school code used for student payment IDs.
   - Inserts default `grading_settings` (20/20/60).
   - Inserts default grade scale A-F.
5. User is redirected to role route:
   - Admin: `/app/admin/dashboard`
   - Teacher: `/app/teacher/dashboard`

## Multi-tenancy Model

- Every domain table includes `school_id`.
- Server actions and queries are scoped with `profile.schoolId`.
- No client-side DB access.
- Core helper:
  - `getCurrentProfile(clerk_user_id)` in `src/lib/server/auth.ts`
- Parent `/pay` flow enforces a single-school checkout by validating all submitted student payment IDs belong to one `school_id`.

## Role Enforcement

- Middleware (`src/middleware.ts`) protects `/onboarding` and `/app/*`.
- Server guards enforce role and tenancy for all sensitive operations:
  - `requireRole("admin" | "teacher")`
  - `requireProfile()`
- Admin routes: `/app/admin/*`
- Teacher routes: `/app/teacher/*`

## Security Notes

- DB operations are server-side only.
- Inputs are validated with Zod in `src/lib/validation/schemas.ts`.
- Teacher grade save re-checks class assignment + class-subject mapping before write.
- Score totals and grades are computed on server only.
- Score writes use UPSERT with unique key `(student_id, subject_id, term_id)`.
- Assessment type weights are enforced to not exceed 100 in admin configuration and must total 100 for score save.
- Payments webhook handling is idempotent by `provider_ref` + status checks.
- Payment reconciliation enforces: `OTHER` items must be fully covered before any partial allocation to `COMPULSORY` items.
- Sensitive payment changes/imports write `audit_logs`.

## Payments Module

### Admin navigation
- `/app/admin/payments`
- `/app/admin/payments/invoices`
- `/app/admin/payments/transactions`
- `/app/admin/payments/reconciliation`
- `/app/admin/payments/imports`
- `/app/admin/payments/reports`
- `/app/admin/payments/settings`

### Parent flow
- `/pay`: parent enters one or more student payment IDs + payer email.
- Invoice preview includes compulsory outstanding and optional other items.
- Mock checkout at `/pay/checkout/[paymentId]`.
- Success/receipt summary at `/pay/success?invoice=...`.

### CSV imports/templates
- Templates:
  - `/api/payments/templates/students`
  - `/api/payments/templates/compulsory-fees`
  - `/api/payments/templates/other-fees`
- Import actions (admin-only):
  - students
  - compulsory fee schedule rows
  - other fee catalog

### Reports exports
- `/api/payments/reports/paid`
- `/api/payments/reports/debtors`
- `/api/payments/reports/collections`

### Payment provider abstraction
- `src/lib/server/payments/service.ts`
- Current provider: `mockpay` with:
  - checkout URL creation
  - idempotent webhook handling
  - invoice + line-item reconciliation
  - ledger writes

### Current stubs
- Receipt PDF generation is represented by the success/receipt view.
- Receipt email sending is currently placeholder; integrate your mail provider in webhook success path.

## Implemented Routes

- `/` landing
- `/onboarding`
- `/app/admin/dashboard`
- `/app/admin/settings`
- `/app/admin/assignments/teacher-classes`
- `/app/admin/assignments/class-subjects`
- `/app/admin/assignments/enrollments`
- `/app/admin/grading/assessment-types`
- `/app/admin/grading/grades`
- `/app/admin/payments`
- `/app/admin/payments/invoices`
- `/app/admin/payments/transactions`
- `/app/admin/payments/reconciliation`
- `/app/admin/payments/imports`
- `/app/admin/payments/reports`
- `/app/admin/payments/settings`
- `/app/admin/teachers`
- `/app/admin/classes`
- `/app/admin/students`
- `/app/admin/subjects`
- `/app/admin/terms`
- `/app/teacher/dashboard`
- `/app/teacher/grade-entry`
- `/app/teacher/results`
- `/pay`
- `/pay/checkout/[paymentId]`
- `/pay/success`

## Database Artifacts

- Prisma schema: `prisma/schema.prisma`
- Migration SQL: `prisma/migrations/20260228180000_init/migration.sql`
- Migration SQL: `prisma/migrations/20260302113000_school_settings_fields/migration.sql`
- Migration SQL: `prisma/migrations/20260302142000_assessment_types/migration.sql`
- Migration SQL: `prisma/migrations/20260302190000_payments_module/migration.sql`
