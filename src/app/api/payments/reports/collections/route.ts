import { auth } from "@clerk/nextjs/server";
import { PaymentStatus, ProfileRole } from "@prisma/client";
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

  const payments = await prisma.payment.findMany({
    where: {
      schoolId: profile.schoolId,
      status: PaymentStatus.SUCCESS,
    },
    orderBy: { createdAt: "desc" },
    select: {
      provider: true,
      providerRef: true,
      method: true,
      amount: true,
      createdAt: true,
      invoice: {
        select: {
          invoiceNo: true,
          payerEmail: true,
        },
      },
    },
  });

  const header = "invoiceNo,payerEmail,provider,providerRef,method,amount,createdAt";
  const lines = payments.map((payment) =>
    [
      payment.invoice.invoiceNo,
      payment.invoice.payerEmail ?? "",
      payment.provider,
      payment.providerRef,
      payment.method,
      Number(payment.amount).toFixed(2),
      payment.createdAt.toISOString(),
    ]
      .map(csvEscape)
      .join(","),
  );

  return new NextResponse([header, ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="payments-collections.csv"',
    },
  });
}
