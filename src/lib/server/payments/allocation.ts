import type { InvoiceStatus } from "@prisma/client";

export type AllocationLineInput = {
  id: string;
  name: string;
  mustPayFull: boolean;
  remainingAmount: number;
  allocationOrder: number;
};

export type AllocationEntry = {
  lineItemId: string;
  appliedAmount: number;
};

export type AllocationResult = {
  status: Extract<InvoiceStatus, "PAID" | "PART_PAID">;
  allocations: AllocationEntry[];
  lineAmountApplied: number;
  unallocatedAmount: number;
};

const EPSILON = 0.000001;

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function allocatePaymentAcrossLines(params: {
  paymentAmount: number;
  processingFeeAmount: number;
  lines: AllocationLineInput[];
}): AllocationResult {
  const paymentAmount = roundCurrency(params.paymentAmount);
  const processingFeeAmount = roundCurrency(params.processingFeeAmount);

  if (paymentAmount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  if (processingFeeAmount < 0) {
    throw new Error("Processing fee cannot be negative.");
  }

  if (paymentAmount + EPSILON < processingFeeAmount) {
    throw new Error("Payment amount cannot be less than processing fee.");
  }

  const normalizedLines = params.lines
    .map((line) => ({
      ...line,
      remainingAmount: roundCurrency(Math.max(0, line.remainingAmount)),
      allocationOrder: Number.isFinite(line.allocationOrder) ? line.allocationOrder : 999,
    }))
    .filter((line) => line.remainingAmount > EPSILON);

  if (normalizedLines.length === 0) {
    throw new Error("Invoice has no payable line items.");
  }

  const amountForLineItems = roundCurrency(paymentAmount - processingFeeAmount);
  const totalRemaining = roundCurrency(
    normalizedLines.reduce((sum, line) => sum + line.remainingAmount, 0),
  );

  if (amountForLineItems - totalRemaining > EPSILON) {
    throw new Error("Payment amount exceeds invoice outstanding.");
  }

  const requiredFullCoverage = roundCurrency(
    normalizedLines
      .filter((line) => line.mustPayFull)
      .reduce((sum, line) => sum + line.remainingAmount, 0),
  );

  if (amountForLineItems + EPSILON < requiredFullCoverage) {
    throw new Error("Optional/other items must be fully paid before checkout.");
  }

  const byOrder = [...normalizedLines].sort((a, b) => {
    if (a.mustPayFull !== b.mustPayFull) {
      return a.mustPayFull ? -1 : 1;
    }

    if (a.allocationOrder !== b.allocationOrder) {
      return a.allocationOrder - b.allocationOrder;
    }

    return a.name.localeCompare(b.name);
  });

  let remaining = amountForLineItems;
  const allocations: AllocationEntry[] = [];

  for (const line of byOrder) {
    if (remaining <= EPSILON) {
      break;
    }

    const canApply = line.mustPayFull ? line.remainingAmount : Math.min(line.remainingAmount, remaining);
    const applyAmount = roundCurrency(canApply);

    if (applyAmount > EPSILON) {
      allocations.push({
        lineItemId: line.id,
        appliedAmount: applyAmount,
      });
      remaining = roundCurrency(remaining - applyAmount);
    }
  }

  const lineAmountApplied = roundCurrency(allocations.reduce((sum, item) => sum + item.appliedAmount, 0));
  const unallocatedAmount = roundCurrency(amountForLineItems - lineAmountApplied);

  const status: Extract<InvoiceStatus, "PAID" | "PART_PAID"> =
    totalRemaining - lineAmountApplied <= EPSILON ? "PAID" : "PART_PAID";

  return {
    status,
    allocations,
    lineAmountApplied,
    unallocatedAmount,
  };
}
