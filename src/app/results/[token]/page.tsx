import ResultSheet from "@/components/results/ResultSheet";
import { getPublishedResultSheetByToken } from "@/lib/server/results";

export default async function SharedResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resultSheet = await getPublishedResultSheetByToken(token);

  if (!resultSheet) {
    return (
      <main className="container py-5">
        <section className="card card-body">
          <p className="section-kicker">Results</p>
          <h1 className="section-title">Result unavailable</h1>
          <p className="section-subtle mb-0">
            This result link is invalid or the school has not published the result yet.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="container py-4">
      <ResultSheet data={resultSheet} mode="public" />
    </main>
  );
}
