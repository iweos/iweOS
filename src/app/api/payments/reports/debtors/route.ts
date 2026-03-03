import { auth } from "@clerk/nextjs/server";
import { InvoiceStatus, ProfileRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getCurrentProfile } from "@/lib/server/auth";

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getCurrentProfile(userId);
  if (!profile || profile.role !== ProfileRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      schoolId: profile.schoolId,
      status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PART_PAID] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      invoiceNo: true,
      payerEmail: true,
      status: true,
      createdAt: true,
      lineItems: {
        select: {
          remainingAmount: true,
        },
      },
    },
  });

  const header = "invoiceNo,payerEmail,status,outstanding,createdAt";
  const lines = invoices.map((invoice) => {
    const outstanding = invoice.lineItems.reduce((sum, line) => sum + Number(line.remainingAmount), 0);
    return [invoice.invoiceNo, invoice.payerEmail ?? "", invoice.status, outstanding.toFixed(2), invoice.createdAt.toISOString()]
      .map(csvEscape)
      .join(",");
  });

  return new NextResponse([header, ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="payments-debtors.csv"',
    },
  });
}
