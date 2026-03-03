import { FeeItemType, InvoiceStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";

function toNumber(value: Prisma.Decimal | number | string) {
  return Number(value);
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function parsePaymentIds(raw: string) {
  return Array.from(
    new Set(
      raw
        .split(/[,\n]/g)
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean),
    ),
  );
}

export async function getInvoiceDraftByPaymentIds(paymentIds: string[], schoolId?: string) {
  const students = await prisma.student.findMany({
    where: {
      studentPaymentId: { in: paymentIds },
      ...(schoolId ? { schoolId } : {}),
    },
    include: {
      school: true,
    },
  });

  if (students.length !== paymentIds.length) {
    throw new Error("One or more student payment IDs are invalid.");
  }

  const uniqueSchoolIds = Array.from(new Set(students.map((student) => student.schoolId)));
  if (uniqueSchoolIds.length !== 1) {
    throw new Error("All student payment IDs in one checkout must belong to the same school.");
  }

  const resolvedSchoolId = uniqueSchoolIds[0];
  const school = students[0]?.school;
  if (!school) {
    throw new Error("School not found.");
  }

  const activeTerm = await prisma.term.findFirst({
    where: {
      schoolId: resolvedSchoolId,
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const classNames = Array.from(new Set(students.map((student) => student.className).filter(Boolean))) as string[];
  const schedules = await prisma.feeSchedule.findMany({
    where: {
      schoolId: resolvedSchoolId,
      isActive: true,
      className: { in: classNames },
      ...(activeTerm
        ? {
            sessionLabel: activeTerm.sessionLabel,
            termLabel: activeTerm.termLabel,
          }
        : {}),
    },
    include: {
      items: {
        include: {
          feeItemCatalog: true,
        },
      },
    },
  });

  const scheduleByClass = new Map(schedules.map((row) => [row.className.toLowerCase(), row]));

  const compulsoryCatalogIds = schedules.flatMap((schedule) =>
    schedule.items
      .filter((item) => item.isCompulsory && item.feeItemCatalog.type === FeeItemType.COMPULSORY)
      .map((item) => item.feeItemCatalogId),
  );

  const paidRows =
    compulsoryCatalogIds.length === 0
      ? []
      : await prisma.invoiceLineItem.groupBy({
          by: ["studentId", "feeItemCatalogId"],
          where: {
            schoolId: resolvedSchoolId,
            studentId: { in: students.map((student) => student.id) },
            feeItemCatalogId: { in: compulsoryCatalogIds },
            invoice: {
              status: { in: [InvoiceStatus.PAID, InvoiceStatus.PART_PAID] },
            },
          },
          _sum: { paidAmount: true },
        });

  const paidMap = new Map(
    paidRows.map((row) => [
      `${row.studentId}:${row.feeItemCatalogId}`,
      toNumber(row._sum.paidAmount ?? 0),
    ]),
  );

  const compulsoryLines = students.flatMap((student) => {
    const className = student.className?.toLowerCase();
    if (!className) {
      return [];
    }

    const schedule = scheduleByClass.get(className);
    if (!schedule) {
      return [];
    }

    return schedule.items
      .filter((item) => item.isCompulsory && item.feeItemCatalog.type === FeeItemType.COMPULSORY)
      .map((item) => {
        const paid = paidMap.get(`${student.id}:${item.feeItemCatalogId}`) ?? 0;
        const scheduled = toNumber(item.amount);
        const outstanding = roundCurrency(Math.max(0, scheduled - paid));
        return {
          student,
          catalog: item.feeItemCatalog,
          unitAmount: scheduled,
          paid,
          outstanding,
        };
      })
      .filter((line) => line.outstanding > 0);
  });

  const otherCatalog = await prisma.feeItemCatalog.findMany({
    where: {
      schoolId: resolvedSchoolId,
      type: FeeItemType.OTHER,
      active: true,
    },
    orderBy: [{ priority: "asc" }, { name: "asc" }],
  });

  return {
    school,
    students,
    compulsoryLines,
    otherCatalog,
  };
}

export async function getParentInvoiceDraft(paymentIdsRaw: string) {
  const paymentIds = parsePaymentIds(paymentIdsRaw);
  if (paymentIds.length === 0) {
    return null;
  }

  return getInvoiceDraftByPaymentIds(paymentIds);
}
