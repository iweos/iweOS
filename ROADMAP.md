# Roadmap

## Payments Module Merge
- [x] Extend Prisma schema for payments domain (catalog, schedule, invoices, payments, ledger, audit logs).
- [x] Add migration SQL for payment tables and school/student payment fields.
- [x] Add school payment settings (processing fee, currency, settlement fields).
- [x] Add student payment ID support (`school.code-studentCode`) and expose in admin student table.
- [x] Build payment allocation engine with deterministic order and partial-payment constraints.
- [x] Add idempotent mock payment webhook processing.
- [x] Add parent payment flow (`/pay` -> checkout -> success receipt view).
- [x] Add admin Payments section pages (overview, invoices, transactions, reconciliation, imports, reports, settings).
- [x] Add CSV import templates and import actions for students, compulsory fees, and other fees.
- [x] Add CSV report exports for paid list, debtors, and collections.
- [x] Integrate payment KPIs into existing admin dashboard.
- [x] Add unit tests for part-payment allocation behavior.
- [x] Update README documentation.

## Follow-up (Optional)
- [ ] Plug real payment provider (Paystack/Stripe) into `PaymentService` abstraction.
- [ ] Add production email provider + PDF generation in payment success pipeline.
