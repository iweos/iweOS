"use server";

import crypto from "node:crypto";
import { FeeItemType, InvoiceStatus, PaymentMethod, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { getInvoiceDraftByPaymentIds } from "@/lib/server/payments/queries";
import { getPaymentService } from "@/lib/server/payments/service";
import {
  feeCatalogSchema,
  feeScheduleSchema,
  parentInvoiceCreateSchema,
  paymentSettingsSchema,
} from "@/lib/validation/schemas";

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function toNumber(value: Prisma.Decimal | number | string) {
  return Number(value);
}

function boolFromValue(value: string) {
  return ["true", "1", "yes", "on"].includes(value.toLowerCase());
}

function revalidatePaymentPages() {
  revalidatePath("/app/admin/dashboard");
  revalidatePath("/app/admin/settings");
  revalidatePath("/app/admin/payments");
  revalidatePath("/app/admin/payments/invoices");
  revalidatePath("/app/admin/payments/transactions");
  revalidatePath("/app/admin/payments/reconciliation");
  revalidatePath("/app/admin/payments/imports");
  revalidatePath("/app/admin/payments/reports");
  revalidatePath("/app/admin/payments/settings");
  revalidatePath("/pay");
}

function parseCsv(content: string) {
  const lines = content
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [] as Record<string, string>[];
  }

  const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((item) => item.trim());
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });
}

export async function updatePaymentSettingsAction(formData: FormData) {
  const profile = await requireRole("admin");
  const parsed = paymentSettingsSchema.safeParse({
    processingFeePercent: formValue(formData, "processingFeePercent"),
    currency: formValue(formData, "currency").toUpperCase(),
    settlementBankName: formValue(formData, "settlementBankName"),
    settlementAccountName: formValue(formData, "settlementAccountName"),
    settlementAccountNumber: formValue(formData, "settlementAccountNumber"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid payment settings payload.");
  }

  await prisma.school.update({
    where: { id: profile.schoolId },
    data: {
      processingFeePercent: parsed.data.processingFeePercent,
      currency: parsed.data.currency,
      settlementBankName: parsed.data.settlementBankName || null,
      settlementAccountName: parsed.data.settlementAccountName || null,
      settlementAccountNumber: parsed.data.settlementAccountNumber || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      schoolId: profile.schoolId,
      userId: profile.id,
      action: "payments.settings.updated",
      entityType: "school",
      entityId: profile.schoolId,
    },
  });

  revalidatePaymentPages();
}

export async function upsertFeeCatalogAction(formData: FormData) {
  const profile = await requireRole("admin");

  const parsed = feeCatalogSchema.safeParse({
    type: formValue(formData, "type"),
    name: formValue(formData, "name"),
    category: formValue(formData, "category"),
    amount: formValue(formData, "amount"),
    allowQuantity: formValue(formData, "allowQuantity") === "on",
    active: formValue(formData, "active") !== "off",
    priority: formValue(formData, "priority"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid fee item payload.");
  }

  const existingId = formValue(formData, "id");
  if (existingId) {
    await prisma.feeItemCatalog.updateMany({
      where: {
        id: existingId,
        schoolId: profile.schoolId,
      },
      data: {
        name: parsed.data.name,
        category: parsed.data.category || null,
        amount: parsed.data.amount,
        allowQuantity: parsed.data.allowQuantity,
        active: parsed.data.active,
        priority: parsed.data.priority,
      },
    });
  } else {
    await prisma.feeItemCatalog.upsert({
      where: {
        schoolId_type_name: {
          schoolId: profile.schoolId,
          type: parsed.data.type,
          name: parsed.data.name,
        },
      },
      update: {
        category: parsed.data.category || null,
        amount: parsed.data.amount,
        allowQuantity: parsed.data.allowQuantity,
        active: parsed.data.active,
        priority: parsed.data.priority,
      },
      create: {
        schoolId: profile.schoolId,
        type: parsed.data.type,
        name: parsed.data.name,
        category: parsed.data.category || null,
        amount: parsed.data.amount,
        allowQuantity: parsed.data.allowQuantity,
        active: parsed.data.active,
        priority: parsed.data.priority,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      schoolId: profile.schoolId,
      userId: profile.id,
      action: "payments.fee_catalog.upserted",
      entityType: "fee_item_catalog",
      metaJson: {
        type: parsed.data.type,
        name: parsed.data.name,
      } as Prisma.InputJsonValue,
    },
  });

  revalidatePaymentPages();
}

export async function deleteFeeCatalogAction(formData: FormData) {
  const profile = await requireRole("admin");
  const id = formValue(formData, "id");

  await prisma.feeItemCatalog.deleteMany({
    where: {
      id,
      schoolId: profile.schoolId,
    },
  });

  await prisma.auditLog.create({
    data: {
      schoolId: profile.schoolId,
      userId: profile.id,
      action: "payments.fee_catalog.deleted",
      entityType: "fee_item_catalog",
      entityId: id || null,
    },
  });

  revalidatePaymentPages();
}

export async function upsertFeeScheduleAction(formData: FormData) {
  const profile = await requireRole("admin");

  const parsed = feeScheduleSchema.safeParse({
    className: formValue(formData, "className"),
    sessionLabel: formValue(formData, "sessionLabel"),
    termLabel: formValue(formData, "termLabel"),
    feeItemCatalogId: formValue(formData, "feeItemCatalogId"),
    amount: formValue(formData, "amount"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid fee schedule payload.");
  }

  const catalog = await prisma.feeItemCatalog.findFirst({
    where: {
      id: parsed.data.feeItemCatalogId,
      schoolId: profile.schoolId,
      type: FeeItemType.COMPULSORY,
    },
  });

  if (!catalog) {
    throw new Error("Compulsory fee item not found.");
  }

  await prisma.$transaction(async (tx) => {
    const schedule = await tx.feeSchedule.upsert({
      where: {
        schoolId_className_sessionLabel_termLabel: {
          schoolId: profile.schoolId,
          className: parsed.data.className,
          sessionLabel: parsed.data.sessionLabel,
          termLabel: parsed.data.termLabel,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        schoolId: profile.schoolId,
        className: parsed.data.className,
        sessionLabel: parsed.data.sessionLabel,
        termLabel: parsed.data.termLabel,
        isActive: true,
      },
    });

    await tx.feeScheduleItem.upsert({
      where: {
        feeScheduleId_feeItemCatalogId: {
          feeScheduleId: schedule.id,
          feeItemCatalogId: catalog.id,
        },
      },
      update: {
        amount: parsed.data.amount,
        isCompulsory: true,
      },
      create: {
        schoolId: profile.schoolId,
        feeScheduleId: schedule.id,
        feeItemCatalogId: catalog.id,
        amount: parsed.data.amount,
        isCompulsory: true,
      },
    });
  });

  await prisma.auditLog.create({
    data: {
      schoolId: profile.schoolId,
      userId: profile.id,
      action: "payments.fee_schedule.upserted",
      entityType: "fee_schedule",
      metaJson: {
        className: parsed.data.className,
        sessionLabel: parsed.data.sessionLabel,
        termLabel: parsed.data.termLabel,
        feeItemCatalogId: parsed.data.feeItemCatalogId,
      } as Prisma.InputJsonValue,
    },
  });

  revalidatePaymentPages();
}

export async function deleteFeeScheduleItemAction(formData: FormData) {
  const profile = await requireRole("admin");
  const id = formValue(formData, "id");

  await prisma.feeScheduleItem.deleteMany({
    where: {
      id,
      schoolId: profile.schoolId,
    },
  });

  await prisma.auditLog.create({
    data: {
      schoolId: profile.schoolId,
      userId: profile.id,
      action: "payments.fee_schedule_item.deleted",
      entityType: "fee_schedule_item",
      entityId: id || null,
    },
  });

  revalidatePaymentPages();
}

export async function createParentInvoiceAction(formData: FormData) {
  const parsed = parentInvoiceCreateSchema.safeParse({
    schoolId: formValue(formData, "schoolId"),
    payerEmail: formValue(formData, "payerEmail"),
    paymentIds: formValue(formData, "paymentIds"),
    amountToPay: formValue(formData, "amountToPay"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid checkout payload.");
  }

  const draft = await getInvoiceDraftByPaymentIds(parsed.data.paymentIds, parsed.data.schoolId);
  if (draft.compulsoryLines.length === 0) {
    throw new Error("No outstanding compulsory fees found for the selected students.");
  }

  const otherSelections: Array<{
    studentId: string;
    catalogId: string;
    qty: number;
  }> = [];

  for (const student of draft.students) {
    for (const other of draft.otherCatalog) {
      const selected = formValue(formData, `other_${student.id}_${other.id}`) === "on";
      if (!selected) {
        continue;
      }

      const qtyRaw = formValue(formData, `other_qty_${student.id}_${other.id}`) || "1";
      const qty = Math.max(1, Number.parseInt(qtyRaw, 10) || 1);

      otherSelections.push({
        studentId: student.id,
        catalogId: other.id,
        qty: other.allowQuantity ? qty : 1,
      });
    }
  }

  const compulsoryLineItems = draft.compulsoryLines.map((line) => ({
    schoolId: draft.school.id,
    studentId: line.student.id,
    feeItemCatalogId: line.catalog.id,
    feeType: FeeItemType.COMPULSORY,
    name: line.catalog.name,
    category: line.catalog.category,
    unitAmount: line.outstanding,
    qty: 1,
    lineTotal: line.outstanding,
    mustPayFull: false,
    paidAmount: 0,
    remainingAmount: line.outstanding,
    allocationOrder: line.catalog.priority,
  }));

  const otherById = new Map(draft.otherCatalog.map((row) => [row.id, row]));
  const otherLineItems = otherSelections.map((selection) => {
    const item = otherById.get(selection.catalogId);
    if (!item) {
      throw new Error("Selected optional item was not found.");
    }

    const lineTotal = roundCurrency(toNumber(item.amount) * selection.qty);
    return {
      schoolId: draft.school.id,
      studentId: selection.studentId,
      feeItemCatalogId: item.id,
      feeType: FeeItemType.OTHER,
      name: item.name,
      category: item.category,
      unitAmount: toNumber(item.amount),
      qty: selection.qty,
      lineTotal,
      mustPayFull: true,
      paidAmount: 0,
      remainingAmount: lineTotal,
      allocationOrder: item.priority,
    };
  });

  const lineItems = [...compulsoryLineItems, ...otherLineItems];
  const subtotal = roundCurrency(lineItems.reduce((sum, row) => sum + row.lineTotal, 0));
  const processingFee = roundCurrency((subtotal * draft.school.processingFeePercent) / 100);
  const total = roundCurrency(subtotal + processingFee);
  const selectedOtherTotal = roundCurrency(otherLineItems.reduce((sum, row) => sum + row.lineTotal, 0));

  if (parsed.data.amountToPay < processingFee + selectedOtherTotal) {
    throw new Error("Selected amount cannot partially pay optional items or processing fee.");
  }

  if (parsed.data.amountToPay > total) {
    throw new Error("Selected amount exceeds invoice total.");
  }

  const providerRef = `MOCK-${crypto.randomUUID()}`;
  const invoiceNo = `INV-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

  const result = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        schoolId: draft.school.id,
        invoiceNo,
        status: InvoiceStatus.PENDING,
        currency: draft.school.currency,
        subtotal,
        processingFee,
        total,
        payerEmail: parsed.data.payerEmail,
      },
    });

    await tx.invoiceLineItem.createMany({
      data: lineItems.map((item) => ({
        ...item,
        invoiceId: invoice.id,
      })),
    });

    const createdLineItems = await tx.invoiceLineItem.findMany({
      where: {
        invoiceId: invoice.id,
        schoolId: draft.school.id,
      },
      select: {
        id: true,
        studentId: true,
        lineTotal: true,
      },
    });

    await tx.ledgerEntry.createMany({
      data: createdLineItems.map((line) => ({
        schoolId: draft.school.id,
        studentId: line.studentId,
        invoiceId: invoice.id,
        lineItemId: line.id,
        type: "CHARGE",
        amount: line.lineTotal,
      })),
    });

    const payment = await tx.payment.create({
      data: {
        schoolId: draft.school.id,
        invoiceId: invoice.id,
        provider: "mockpay",
        providerRef,
        status: "INITIATED",
        amount: parsed.data.amountToPay,
        method: PaymentMethod.OTHER,
        payloadJson: {
          payerEmail: parsed.data.payerEmail,
          paymentIds: parsed.data.paymentIds,
        } as Prisma.InputJsonValue,
      },
    });

    await tx.auditLog.create({
      data: {
        schoolId: draft.school.id,
        action: "payment.initiated",
        entityType: "payment",
        entityId: payment.id,
        metaJson: {
          invoiceId: invoice.id,
          amountToPay: parsed.data.amountToPay,
          payerEmail: parsed.data.payerEmail,
        } as Prisma.InputJsonValue,
      },
    });

    return { paymentId: payment.id, providerRef };
  });

  revalidatePaymentPages();
  const checkout = await getPaymentService("mockpay").createCheckout({
    paymentId: result.paymentId,
    providerRef: result.providerRef,
  });
  redirect(checkout.checkoutUrl);
}

export async function completeMockPaymentAction(formData: FormData) {
  const paymentId = formValue(formData, "paymentId");
  const method = formValue(formData, "method").toLowerCase();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: true,
    },
  });

  if (!payment) {
    throw new Error("Payment not found.");
  }

  await getPaymentService("mockpay").handleWebhook({
    providerRef: payment.providerRef,
    status: "success",
    method:
      method === "card"
        ? PaymentMethod.CARD
        : method === "transfer"
          ? PaymentMethod.TRANSFER
          : method === "bank"
            ? PaymentMethod.BANK
            : PaymentMethod.OTHER,
    amount: toNumber(payment.amount),
    raw: {
      mode: "manual-mock-checkout",
      paymentId: payment.id,
    },
  });

  revalidatePaymentPages();
  redirect(`/pay/success?invoice=${payment.invoiceId}`);
}

export async function importStudentsCsvAction(formData: FormData) {
  const profile = await requireRole("admin");
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("CSV file is required.");
  }

  const content = await file.text();
  const rows = parseCsv(content);
  if (rows.length === 0) {
    throw new Error("CSV has no data rows.");
  }

  const school = await prisma.school.findUnique({
    where: { id: profile.schoolId },
    select: { code: true },
  });
  if (!school) {
    throw new Error("School not found.");
  }

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const studentCode = (row.studentcode ?? row.student_code ?? "").trim();
      const firstName = (row.firstname ?? row.first_name ?? "").trim();
      const lastName = (row.lastname ?? row.last_name ?? "").trim();
      const fallbackFullName = (row.fullname ?? row.full_name ?? "").trim();
      const resolvedFirstName = firstName || fallbackFullName.split(/\s+/)[0] || "";
      const resolvedLastName =
        lastName ||
        fallbackFullName
          .split(/\s+/)
          .slice(1)
          .join(" ") ||
        "";

      if (!studentCode || !resolvedFirstName || !resolvedLastName) {
        continue;
      }

      const className = (row.classname ?? row.class_name ?? "").trim();
      const address = (row.address ?? "").trim();
      const guardianName = (row.guardianname ?? row.guardian_name ?? "").trim();
      const guardianPhone = (row.guardianphone ?? row.guardian_phone ?? "").trim();
      const guardianEmail = (row.guardianemail ?? row.guardian_email ?? "").trim();
      const status = (row.status ?? "active").trim().toLowerCase();

      await tx.student.upsert({
        where: {
          schoolId_studentCode: {
            schoolId: profile.schoolId,
            studentCode,
          },
        },
        update: {
          firstName: resolvedFirstName,
          lastName: resolvedLastName,
          fullName: `${resolvedFirstName} ${resolvedLastName}`.trim(),
          className: className || null,
          address: address || null,
          guardianName: guardianName || null,
          guardianPhone: guardianPhone || null,
          guardianEmail: guardianEmail || null,
          status: status || "active",
          studentPaymentId: `${school.code}-${studentCode}`.toUpperCase(),
        },
        create: {
          schoolId: profile.schoolId,
          studentCode,
          studentPaymentId: `${school.code}-${studentCode}`.toUpperCase(),
          firstName: resolvedFirstName,
          lastName: resolvedLastName,
          fullName: `${resolvedFirstName} ${resolvedLastName}`.trim(),
          className: className || null,
          address: address || null,
          guardianName: guardianName || null,
          guardianPhone: guardianPhone || null,
          guardianEmail: guardianEmail || null,
          status: status || "active",
        },
      });
    }
  });

  await prisma.auditLog.create({
    data: {
      schoolId: profile.schoolId,
      userId: profile.id,
      action: "payments.import.students",
      entityType: "student",
      metaJson: { rowCount: rows.length } as Prisma.InputJsonValue,
    },
  });

  revalidatePaymentPages();
}

export async function importCompulsoryFeesCsvAction(formData: FormData) {
  const profile = await requireRole("admin");
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("CSV file is required.");
  }

  const rows = parseCsv(await file.text());
  if (rows.length === 0) {
    throw new Error("CSV has no data rows.");
  }

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const className = (row.classname ?? row.class_name ?? "").trim();
      const sessionLabel = (row.sessionlabel ?? row.session_label ?? "").trim();
      const termLabel = (row.termlabel ?? row.term_label ?? "").trim();
      const feeName = (row.feename ?? row.fee_name ?? "").trim();
      const category = (row.category ?? "").trim();
      const amount = Number(row.amount ?? "0");
      const priority = Number(row.priority ?? "100");

      if (!className || !sessionLabel || !termLabel || !feeName || !Number.isFinite(amount)) {
        continue;
      }

      const catalog = await tx.feeItemCatalog.upsert({
        where: {
          schoolId_type_name: {
            schoolId: profile.schoolId,
            type: FeeItemType.COMPULSORY,
            name: feeName,
          },
        },
        update: {
          category: category || null,
          amount,
          active: true,
          priority: Number.isFinite(priority) ? priority : 100,
        },
        create: {
          schoolId: profile.schoolId,
          type: FeeItemType.COMPULSORY,
          name: feeName,
          category: category || null,
          amount,
          active: true,
          priority: Number.isFinite(priority) ? priority : 100,
        },
      });

      const schedule = await tx.feeSchedule.upsert({
        where: {
          schoolId_className_sessionLabel_termLabel: {
            schoolId: profile.schoolId,
            className,
            sessionLabel,
            termLabel,
          },
        },
        update: {
          isActive: true,
        },
        create: {
          schoolId: profile.schoolId,
          className,
          sessionLabel,
          termLabel,
          isActive: true,
        },
      });

      await tx.feeScheduleItem.upsert({
        where: {
          feeScheduleId_feeItemCatalogId: {
            feeScheduleId: schedule.id,
            feeItemCatalogId: catalog.id,
          },
        },
        update: {
          amount,
          isCompulsory: true,
        },
        create: {
          schoolId: profile.schoolId,
          feeScheduleId: schedule.id,
          feeItemCatalogId: catalog.id,
          amount,
          isCompulsory: true,
        },
      });
    }
  });

  await prisma.auditLog.create({
    data: {
      schoolId: profile.schoolId,
      userId: profile.id,
      action: "payments.import.compulsory_fees",
      entityType: "fee_schedule_item",
      metaJson: { rowCount: rows.length } as Prisma.InputJsonValue,
    },
  });

  revalidatePaymentPages();
}

export async function importOtherFeesCsvAction(formData: FormData) {
  const profile = await requireRole("admin");
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("CSV file is required.");
  }

  const rows = parseCsv(await file.text());
  if (rows.length === 0) {
    throw new Error("CSV has no data rows.");
  }

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const name = (row.name ?? "").trim();
      const category = (row.category ?? "").trim();
      const amount = Number(row.amount ?? "0");
      const allowQuantity = boolFromValue(row.allowquantity ?? row.allow_quantity ?? "false");
      const active = !["false", "0", "no", "off"].includes((row.active ?? "true").toLowerCase());
      const priority = Number(row.priority ?? "100");

      if (!name || !Number.isFinite(amount)) {
        continue;
      }

      await tx.feeItemCatalog.upsert({
        where: {
          schoolId_type_name: {
            schoolId: profile.schoolId,
            type: FeeItemType.OTHER,
            name,
          },
        },
        update: {
          category: category || null,
          amount,
          allowQuantity,
          active,
          priority: Number.isFinite(priority) ? priority : 100,
        },
        create: {
          schoolId: profile.schoolId,
          type: FeeItemType.OTHER,
          name,
          category: category || null,
          amount,
          allowQuantity,
          active,
          priority: Number.isFinite(priority) ? priority : 100,
        },
      });
    }
  });

  await prisma.auditLog.create({
    data: {
      schoolId: profile.schoolId,
      userId: profile.id,
      action: "payments.import.other_fees",
      entityType: "fee_item_catalog",
      metaJson: { rowCount: rows.length } as Prisma.InputJsonValue,
    },
  });

  revalidatePaymentPages();
}
