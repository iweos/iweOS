import { InvoiceStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { allocatePaymentAcrossLines } from "@/lib/server/payments/allocation";

const EPSILON = 0.000001;

function decimalToNumber(value: Prisma.Decimal | number | string) {
  return Number(value);
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export type CheckoutPayload = {
  paymentId: string;
  providerRef: string;
};

export type WebhookPayload = {
  providerRef: string;
  status: "success" | "failed";
  method?: PaymentMethod;
  amount?: number;
  raw?: unknown;
};

export interface PaymentService {
  createCheckout(payload: CheckoutPayload): Promise<{ checkoutUrl: string }>;
  handleWebhook(payload: WebhookPayload): Promise<void>;
}

class MockPayService implements PaymentService {
  async createCheckout(payload: CheckoutPayload) {
    return {
      checkoutUrl: `/pay/checkout/${payload.paymentId}`,
    };
  }

  async handleWebhook(payload: WebhookPayload) {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { provider: "mockpay", providerRef: payload.providerRef },
        include: {
          invoice: true,
        },
      });

      if (!payment) {
        return;
      }

      if (payment.status === PaymentStatus.SUCCESS && payload.status === "success") {
        return;
      }

      if (payload.status === "failed") {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            method: payload.method ?? payment.method,
            payloadJson: payload.raw as Prisma.InputJsonValue,
          },
        });

        if (payment.invoice.status === InvoiceStatus.PENDING) {
          await tx.invoice.update({
            where: { id: payment.invoiceId },
            data: { status: InvoiceStatus.FAILED },
          });
        }

        await tx.auditLog.create({
          data: {
            schoolId: payment.schoolId,
            action: "payment.failed",
            entityType: "payment",
            entityId: payment.id,
            metaJson: payload.raw as Prisma.InputJsonValue,
          },
        });
        return;
      }

      const rawAmount = payload.amount ?? decimalToNumber(payment.amount);
      const paymentAmount = roundCurrency(rawAmount);

      if (paymentAmount <= 0) {
        throw new Error("Payment amount must be greater than zero.");
      }

      const invoice = await tx.invoice.findFirst({
        where: {
          id: payment.invoiceId,
          schoolId: payment.schoolId,
        },
        include: {
          lineItems: {
            where: { schoolId: payment.schoolId },
          },
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found for payment.");
      }

      if (invoice.status !== InvoiceStatus.PENDING && invoice.status !== InvoiceStatus.PART_PAID) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.SUCCESS,
            method: payload.method ?? payment.method,
            payloadJson: payload.raw as Prisma.InputJsonValue,
          },
        });
        return;
      }

      const allocation = allocatePaymentAcrossLines({
        paymentAmount,
        processingFeeAmount: decimalToNumber(invoice.processingFee),
        lines: invoice.lineItems.map((line) => ({
          id: line.id,
          name: line.name,
          mustPayFull: line.mustPayFull,
          remainingAmount: decimalToNumber(line.remainingAmount),
          allocationOrder: line.allocationOrder,
        })),
      });

      if (allocation.unallocatedAmount > EPSILON) {
        throw new Error("Payment amount has an unallocated remainder.");
      }

      for (const row of allocation.allocations) {
        const line = invoice.lineItems.find((item) => item.id === row.lineItemId);
        if (!line) {
          continue;
        }

        const nextPaid = roundCurrency(decimalToNumber(line.paidAmount) + row.appliedAmount);
        const nextRemaining = roundCurrency(
          Math.max(0, decimalToNumber(line.remainingAmount) - row.appliedAmount),
        );

        await tx.invoiceLineItem.update({
          where: { id: line.id },
          data: {
            paidAmount: nextPaid,
            remainingAmount: nextRemaining,
          },
        });

        await tx.ledgerEntry.create({
          data: {
            schoolId: payment.schoolId,
            studentId: line.studentId,
            invoiceId: invoice.id,
            lineItemId: line.id,
            paymentId: payment.id,
            type: "PAYMENT",
            amount: row.appliedAmount,
          },
        });
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          method: payload.method ?? payment.method,
          amount: paymentAmount,
          payloadJson: payload.raw as Prisma.InputJsonValue,
        },
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: allocation.status,
        },
      });

      await tx.auditLog.create({
        data: {
          schoolId: payment.schoolId,
          action: "payment.success",
          entityType: "payment",
          entityId: payment.id,
          metaJson: {
            providerRef: payload.providerRef,
            invoiceId: invoice.id,
            appliedAmount: allocation.lineAmountApplied,
            processingFee: decimalToNumber(invoice.processingFee),
          } as Prisma.InputJsonValue,
        },
      });
    });
  }
}

const mockPayService = new MockPayService();

export function getPaymentService(provider: string): PaymentService {
  if (provider === "mockpay") {
    return mockPayService;
  }
  throw new Error(`Unsupported payment provider: ${provider}`);
}
