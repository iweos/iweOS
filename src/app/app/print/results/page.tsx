import Link from "next/link";
import PrintButton from "@/components/results/PrintButton";
import ResultSheet from "@/components/results/ResultSheet";
import { requireRole } from "@/lib/server/auth";
import { getStudentResultSheet } from "@/lib/server/results";
import { prisma } from "@/lib/server/prisma";

type PrintResultsSearchParams = {
  termId?: string;
  classId?: string;
  studentId?: string;
};

export default async function AdminResultExportPage({
  searchParams,
}: {
  searchParams: Promise<PrintResultsSearchParams>;
}) {
  const profile = await requireRole("admin");
  const params = await searchParams;

  if (!params.termId || !params.classId) {
    return (
      <main className="container py-4">
        <p className="section-subtle mb-0">Select a term and class first before opening the export view.</p>
      </main>
    );
  }

  const studentIds = params.studentId
    ? [params.studentId]
    : (
        await prisma.enrollment.findMany({
          where: {
            schoolId: profile.schoolId,
            termId: params.termId,
            classId: params.classId,
          },
          orderBy: { student: { fullName: "asc" } },
          select: { studentId: true },
        })
      ).map((item) => item.studentId);

  const resultSheets = (
    await Promise.all(
      studentIds.map((studentId) =>
        getStudentResultSheet({
          schoolId: profile.schoolId,
          termId: params.termId!,
          classId: params.classId!,
          studentId,
        }),
      ),
    )
  ).filter((sheet): sheet is NonNullable<typeof sheet> => Boolean(sheet));

  if (resultSheets.length === 0) {
    return (
      <main className="container py-4">
        <p className="section-subtle mb-0">The selected result could not be generated.</p>
      </main>
    );
  }

  return (
    <main className="container py-4 d-grid gap-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 print-hidden">
        <div className="d-flex flex-column gap-1">
          <p className="fw-semibold mb-0">Export-ready result</p>
          <p className="small text-muted mb-0">Use the browser print dialog to print or save this report to your device as PDF.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link
            href={`/app/admin/grading/results?termId=${params.termId}&classId=${params.classId}${params.studentId ? `&studentId=${params.studentId}` : ""}`}
            className="btn btn-secondary"
          >
            Back to results
          </Link>
          <PrintButton />
        </div>
      </div>
      {resultSheets.map((resultSheet, index) => (
        <div
          key={`${resultSheet.student.id}-${resultSheet.term.id}`}
          className={`result-print-preview ${index > 0 ? "result-print-page-break" : ""}`}
        >
          <ResultSheet data={resultSheet} mode="admin" />
        </div>
      ))}
    </main>
  );
}

