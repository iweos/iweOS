import Link from "next/link";
import { PaymentStatus } from "@prisma/client";
import { CircleDollarSign, Search, WalletCards } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

type PageProps = { searchParams: Promise<{ q?: string; status?: string }> };
const money = (value: number, currency = "NGN") => new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

export default async function PlatformPaymentsPage({ searchParams }: PageProps) {
  await requirePlatformAdmin();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = Object.values(PaymentStatus).includes(params.status as PaymentStatus) ? params.status as PaymentStatus : undefined;
  const where = {
    ...(status ? { status } : {}),
    ...(query ? { OR: [
      { providerRef: { contains: query, mode: "insensitive" as const } },
      { invoice: { invoiceNo: { contains: query, mode: "insensitive" as const } } },
      { school: { name: { contains: query, mode: "insensitive" as const } } },
    ] } : {}),
  };
  const [payments, successful, pending, failed] = await Promise.all([
    prisma.payment.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, include: { school: { select: { id: true, name: true, code: true, currency: true } }, invoice: { select: { invoiceNo: true, payerEmail: true } } } }),
    prisma.payment.aggregate({ where: { status: PaymentStatus.SUCCESS }, _sum: { amount: true }, _count: true }),
    prisma.payment.aggregate({ where: { status: { in: [PaymentStatus.INITIATED, PaymentStatus.PENDING] } }, _sum: { amount: true }, _count: true }),
    prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
  ]);

  return <>
    <section className="platform-page-heading"><div><p>Financial operations</p><h1>Payment activity</h1><span>Monitor transaction outcomes and payment volume across schools.</span></div><strong>{successful._count.toLocaleString()} successful</strong></section>
    <section className="platform-mini-stats">
      <article><CircleDollarSign /><span>Successful volume<strong>{money(Number(successful._sum.amount ?? 0))}</strong></span></article>
      <article><WalletCards /><span>Pending volume<strong>{money(Number(pending._sum.amount ?? 0))}</strong><small>{pending._count} transactions</small></span></article>
      <article><span className="platform-alert-mark">!</span><span>Failed payments<strong>{failed.toLocaleString()}</strong></span></article>
    </section>
    <form className="platform-filter-bar" method="get">
      <label><Search /><input type="search" name="q" defaultValue={query} placeholder="Search reference, invoice or school" /></label>
      <select name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{Object.values(PaymentStatus).map((value) => <option value={value} key={value}>{value[0] + value.slice(1).toLowerCase()}</option>)}</select>
      <button type="submit">Apply filters</button>
      {(query || status) ? <Link href="/dataroom/payments">Clear</Link> : null}
    </form>
    <section className="platform-panel platform-data-panel">
      <div className="platform-data-head platform-payments-grid"><span>Transaction</span><span>School</span><span>Amount</span><span>Method</span><span>Status</span><span>Date</span></div>
      <div className="platform-data-list">
        {payments.map((payment) => <Link className="platform-data-row platform-payments-grid" href={`/dataroom/schools/${payment.school.id}`} key={payment.id}>
          <span className="platform-cell"><strong>{payment.providerRef}</strong><small>{payment.invoice.invoiceNo} · {payment.provider}</small></span>
          <span className="platform-cell"><strong>{payment.school.name}</strong><small>{payment.invoice.payerEmail || payment.school.code}</small></span>
          <strong>{money(Number(payment.amount), payment.school.currency)}</strong>
          <span className="platform-capitalize">{payment.method.toLowerCase()}</span>
          <span><i className={`platform-status ${payment.status.toLowerCase()}`}>{payment.status.toLowerCase()}</i></span>
          <span className="platform-date">{payment.createdAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</span>
        </Link>)}
        {!payments.length ? <div className="platform-empty"><WalletCards /><h2>No payments found</h2><p>Adjust your filters and try again.</p></div> : null}
      </div>
    </section>
  </>;
}
