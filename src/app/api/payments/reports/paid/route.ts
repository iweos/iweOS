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
      status: InvoiceStatus.PAID,
    },
    orderBy: { createdAt: "desc" },
    select: {
      invoiceNo: true,
      payerEmail: true,
      total: true,
      createdAt: true,
    },
  });

  const header = "invoiceNo,payerEmail,total,createdAt";
  const lines = invoices.map((invoice) =>
    [invoice.invoiceNo, invoice.payerEmail ?? "", Number(invoice.total).toFixed(2), invoice.createdAt.toISOString()]
      .map(csvEscape)
      .join(","),
  );

  return new NextResponse([header, ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="payments-paid-list.csv"',
    },
  });
}
