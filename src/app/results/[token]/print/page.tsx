import Link from "next/link";
import PrintButton from "@/components/results/PrintButton";
import ResultSheet from "@/components/results/ResultSheet";
import { getPublishedResultSheetByToken } from "@/lib/server/results";

export default async function SharedResultPrintPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resultSheet = await getPublishedResultSheetByToken(token);

  if (!resultSheet) {
    return (
      <main className="container py-5">
        <p className="section-subtle mb-0">This result link is invalid or the school has not published the result yet.</p>
      </main>
    );
  }

  return (
    <main className="container py-4 d-grid gap-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 print-hidden">
        <Link href={`/results/${token}`} className="btn btn-secondary">
          Back to result
        </Link>
        <PrintButton />
      </div>
      <ResultSheet data={resultSheet} mode="public" />
    </main>
  );
}

