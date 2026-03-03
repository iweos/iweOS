CREATE TYPE "FeeItemType" AS ENUM ('compulsory', 'other');
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'pending', 'paid', 'part_paid', 'cancelled', 'failed');
CREATE TYPE "PaymentStatus" AS ENUM ('initiated', 'pending', 'success', 'failed', 'refunded');
CREATE TYPE "PaymentMethod" AS ENUM ('card', 'transfer', 'bank', 'other');
CREATE TYPE "LedgerEntryType" AS ENUM ('charge', 'payment', 'adjustment');

ALTER TABLE "schools"
  ADD COLUMN "code" TEXT,
  ADD COLUMN "logo_url" TEXT,
  ADD COLUMN "processing_fee_percent" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'NGN',
  ADD COLUMN "settlement_bank_name" TEXT,
  ADD COLUMN "settlement_account_name" TEXT,
  ADD COLUMN "settlement_account_number" TEXT;

UPDATE "schools"
SET "code" = COALESCE("code", 'SCH-' || UPPER(SUBSTRING(REPLACE("id"::TEXT, '-', '') FROM 1 FOR 6)))
WHERE "code" IS NULL;

ALTER TABLE "schools"
  ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX "schools_code_key" ON "schools"("code");

ALTER TABLE "students"
  ADD COLUMN "student_payment_id" TEXT,
  ADD COLUMN "class_name" TEXT,
  ADD COLUMN "guardian_email" TEXT,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';

UPDATE "students" s
SET "student_payment_id" = CONCAT(sc."code", '-', s."student_code")
FROM "schools" sc
WHERE sc."id" = s."school_id"
  AND s."student_payment_id" IS NULL;

ALTER TABLE "students"
  ALTER COLUMN "student_payment_id" SET NOT NULL;

CREATE UNIQUE INDEX "students_school_id_student_payment_id_key" ON "students"("school_id", "student_payment_id");
CREATE INDEX "students_school_id_class_name_idx" ON "students"("school_id", "class_name");
CREATE INDEX "students_school_id_student_payment_id_idx" ON "students"("school_id", "student_payment_id");

CREATE TABLE "fee_item_catalog" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "type" "FeeItemType" NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT,
  "amount" NUMERIC(12,2) NOT NULL,
  "allow_quantity" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "fee_item_catalog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fee_item_catalog_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "fee_item_catalog_school_id_type_name_key" ON "fee_item_catalog"("school_id", "type", "name");
CREATE INDEX "fee_item_catalog_school_id_idx" ON "fee_item_catalog"("school_id");
CREATE INDEX "fee_item_catalog_school_id_type_idx" ON "fee_item_catalog"("school_id", "type");
CREATE INDEX "fee_item_catalog_school_id_priority_idx" ON "fee_item_catalog"("school_id", "priority");

CREATE TABLE "fee_schedule" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "class_name" TEXT NOT NULL,
  "session_label" TEXT NOT NULL,
  "term_label" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "fee_schedule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fee_schedule_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "fee_schedule_school_id_class_name_session_label_term_label_key"
  ON "fee_schedule"("school_id", "class_name", "session_label", "term_label");
CREATE INDEX "fee_schedule_school_id_idx" ON "fee_schedule"("school_id");
CREATE INDEX "fee_schedule_school_id_class_name_is_active_idx" ON "fee_schedule"("school_id", "class_name", "is_active");

CREATE TABLE "fee_schedule_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "fee_schedule_id" UUID NOT NULL,
  "fee_item_catalog_id" UUID NOT NULL,
  "amount" NUMERIC(12,2) NOT NULL,
  "is_compulsory" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "fee_schedule_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fee_schedule_items_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "fee_schedule_items_fee_schedule_id_fkey" FOREIGN KEY ("fee_schedule_id") REFERENCES "fee_schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fee_schedule_items_fee_item_catalog_id_fkey" FOREIGN KEY ("fee_item_catalog_id") REFERENCES "fee_item_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "fee_schedule_items_fee_schedule_id_fee_item_catalog_id_key"
  ON "fee_schedule_items"("fee_schedule_id", "fee_item_catalog_id");
CREATE INDEX "fee_schedule_items_school_id_idx" ON "fee_schedule_items"("school_id");
CREATE INDEX "fee_schedule_items_fee_schedule_id_idx" ON "fee_schedule_items"("fee_schedule_id");
CREATE INDEX "fee_schedule_items_fee_item_catalog_id_idx" ON "fee_schedule_items"("fee_item_catalog_id");

CREATE TABLE "invoices" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "invoice_no" TEXT NOT NULL,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'pending',
  "currency" TEXT NOT NULL,
  "subtotal" NUMERIC(12,2) NOT NULL,
  "processing_fee" NUMERIC(12,2) NOT NULL,
  "total" NUMERIC(12,2) NOT NULL,
  "payer_email" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invoices_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "invoices_school_id_invoice_no_key" ON "invoices"("school_id", "invoice_no");
CREATE INDEX "invoices_school_id_idx" ON "invoices"("school_id");
CREATE INDEX "invoices_school_id_status_idx" ON "invoices"("school_id", "status");
CREATE INDEX "invoices_created_at_idx" ON "invoices"("created_at");

CREATE TABLE "invoice_line_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "invoice_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "fee_item_catalog_id" UUID,
  "fee_type" "FeeItemType" NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT,
  "unit_amount" NUMERIC(12,2) NOT NULL,
  "qty" INTEGER NOT NULL DEFAULT 1,
  "line_total" NUMERIC(12,2) NOT NULL,
  "must_pay_full" BOOLEAN NOT NULL DEFAULT false,
  "paid_amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "remaining_amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "allocation_order" INTEGER NOT NULL DEFAULT 999,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invoice_line_items_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "invoice_line_items_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "invoice_line_items_fee_item_catalog_id_fkey" FOREIGN KEY ("fee_item_catalog_id") REFERENCES "fee_item_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "invoice_line_items_school_id_idx" ON "invoice_line_items"("school_id");
CREATE INDEX "invoice_line_items_invoice_id_idx" ON "invoice_line_items"("invoice_id");
CREATE INDEX "invoice_line_items_student_id_idx" ON "invoice_line_items"("student_id");
CREATE INDEX "invoice_line_items_fee_item_catalog_id_idx" ON "invoice_line_items"("fee_item_catalog_id");
CREATE INDEX "invoice_line_items_allocation_order_idx" ON "invoice_line_items"("allocation_order");

CREATE TABLE "payments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "invoice_id" UUID NOT NULL,
  "provider" TEXT NOT NULL,
  "provider_ref" TEXT NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'initiated',
  "amount" NUMERIC(12,2) NOT NULL,
  "method" "PaymentMethod" NOT NULL DEFAULT 'other',
  "payload_json" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "payments_school_id_provider_ref_key" ON "payments"("school_id", "provider_ref");
CREATE INDEX "payments_school_id_idx" ON "payments"("school_id");
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");
CREATE INDEX "payments_school_id_status_idx" ON "payments"("school_id", "status");

CREATE TABLE "ledger_entries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "invoice_id" UUID,
  "line_item_id" UUID,
  "payment_id" UUID,
  "type" "LedgerEntryType" NOT NULL,
  "amount" NUMERIC(12,2) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ledger_entries_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ledger_entries_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ledger_entries_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ledger_entries_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "invoice_line_items"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ledger_entries_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ledger_entries_school_id_idx" ON "ledger_entries"("school_id");
CREATE INDEX "ledger_entries_student_id_idx" ON "ledger_entries"("student_id");
CREATE INDEX "ledger_entries_invoice_id_idx" ON "ledger_entries"("invoice_id");
CREATE INDEX "ledger_entries_line_item_id_idx" ON "ledger_entries"("line_item_id");
CREATE INDEX "ledger_entries_payment_id_idx" ON "ledger_entries"("payment_id");

CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "user_id" UUID,
  "action" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" UUID,
  "meta_json" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "audit_logs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "audit_logs_school_id_idx" ON "audit_logs"("school_id");
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

CREATE OR REPLACE FUNCTION set_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoices_updated_at
BEFORE UPDATE ON "invoices"
FOR EACH ROW
EXECUTE FUNCTION set_invoices_updated_at();

CREATE OR REPLACE FUNCTION set_invoice_line_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_line_items_updated_at
BEFORE UPDATE ON "invoice_line_items"
FOR EACH ROW
EXECUTE FUNCTION set_invoice_line_items_updated_at();

CREATE OR REPLACE FUNCTION set_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON "payments"
FOR EACH ROW
EXECUTE FUNCTION set_payments_updated_at();
