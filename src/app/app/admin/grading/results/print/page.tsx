import Link from "next/link";
import PrintButton from "@/components/results/PrintButton";
import ResultSheet from "@/components/results/ResultSheet";
import { requireRole } from "@/lib/server/auth";
import { getStudentResultSheet } from "@/lib/server/results";

type PrintResultsSearchParams = {
  termId?: string;
  classId?: string;
  studentId?: string;
};

export default async function AdminResultPrintPage({
  searchParams,
}: {
  searchParams: Promise<PrintResultsSearchParams>;
}) {
  const profile = await requireRole("admin");
  const params = await searchParams;

  if (!params.termId || !params.classId || !params.studentId) {
    return (
      <main className="container py-4">
        <p className="section-subtle mb-0">Select a term, class, and student first before opening the print view.</p>
      </main>
    );
  }

  const resultSheet = await getStudentResultSheet({
    schoolId: profile.schoolId,
    termId: params.termId,
    classId: params.classId,
    studentId: params.studentId,
  });

  if (!resultSheet) {
    return (
      <main className="container py-4">
        <p className="section-subtle mb-0">The selected result could not be generated.</p>
      </main>
    );
  }

  return (
    <main className="container py-4 d-grid gap-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 print-hidden">
        <Link href={`/app/admin/grading/results?termId=${params.termId}&classId=${params.classId}&studentId=${params.studentId}`} className="btn btn-secondary">
          Back to results
        </Link>
        <PrintButton />
      </div>
      <ResultSheet data={resultSheet} mode="admin" variant="report-card" />
    </main>
  );
}
