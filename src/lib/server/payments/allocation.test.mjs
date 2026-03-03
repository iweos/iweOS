import assert from "node:assert/strict";
import test from "node:test";
import { allocatePaymentAcrossLines } from "./allocation.ts";

test("partial payment allocates only to compulsory items after fully covering OTHER", () => {
  const result = allocatePaymentAcrossLines({
    paymentAmount: 95,
    processingFeeAmount: 5,
    lines: [
      { id: "o1", name: "Uniform", mustPayFull: true, remainingAmount: 40, allocationOrder: 100 },
      { id: "c1", name: "Tuition", mustPayFull: false, remainingAmount: 60, allocationOrder: 1 },
      { id: "c2", name: "Levies", mustPayFull: false, remainingAmount: 60, allocationOrder: 2 },
    ],
  });

  assert.equal(result.status, "PART_PAID");
  assert.deepEqual(result.allocations, [
    { lineItemId: "o1", appliedAmount: 40 },
    { lineItemId: "c1", appliedAmount: 50 },
  ]);
});

test("other items must be paid in full or checkout is blocked", () => {
  assert.throws(() => {
    allocatePaymentAcrossLines({
      paymentAmount: 60,
      processingFeeAmount: 5,
      lines: [
        { id: "o1", name: "Uniform", mustPayFull: true, remainingAmount: 70, allocationOrder: 100 },
        { id: "c1", name: "Tuition", mustPayFull: false, remainingAmount: 60, allocationOrder: 1 },
      ],
    });
  });
});

test("deterministic ordering uses priority then alphabetical", () => {
  const result = allocatePaymentAcrossLines({
    paymentAmount: 65,
    processingFeeAmount: 5,
    lines: [
      { id: "a", name: "PTA", mustPayFull: false, remainingAmount: 30, allocationOrder: 3 },
      { id: "b", name: "Tuition", mustPayFull: false, remainingAmount: 30, allocationOrder: 1 },
      { id: "c", name: "Levies", mustPayFull: false, remainingAmount: 30, allocationOrder: 2 },
    ],
  });

  assert.deepEqual(result.allocations, [
    { lineItemId: "b", appliedAmount: 30 },
    { lineItemId: "c", appliedAmount: 30 },
  ]);
});

test("multiple students in one invoice are allocated deterministically", () => {
  const result = allocatePaymentAcrossLines({
    paymentAmount: 155,
    processingFeeAmount: 5,
    lines: [
      { id: "s1-tuition", name: "Tuition", mustPayFull: false, remainingAmount: 80, allocationOrder: 1 },
      { id: "s2-tuition", name: "Tuition", mustPayFull: false, remainingAmount: 80, allocationOrder: 1 },
    ],
  });

  assert.equal(result.status, "PART_PAID");
  assert.deepEqual(result.allocations, [
    { lineItemId: "s1-tuition", appliedAmount: 80 },
    { lineItemId: "s2-tuition", appliedAmount: 70 },
  ]);
});
