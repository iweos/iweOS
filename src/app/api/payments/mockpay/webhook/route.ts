import { NextResponse } from "next/server";
import { PaymentMethod } from "@prisma/client";
import { getPaymentService } from "@/lib/server/payments/service";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      providerRef?: string;
      status?: "success" | "failed";
      method?: string;
      amount?: number;
    };

    if (!payload.providerRef || !payload.status) {
      return NextResponse.json({ error: "providerRef and status are required." }, { status: 400 });
    }

    const method = (payload.method ?? "other").toLowerCase();

    await getPaymentService("mockpay").handleWebhook({
      providerRef: payload.providerRef,
      status: payload.status,
      amount: payload.amount,
      method:
        method === "card"
          ? PaymentMethod.CARD
          : method === "transfer"
            ? PaymentMethod.TRANSFER
            : method === "bank"
              ? PaymentMethod.BANK
              : PaymentMethod.OTHER,
      raw: payload,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook handling failed." },
      { status: 400 },
    );
  }
}
