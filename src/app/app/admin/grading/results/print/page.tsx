import { redirect } from "next/navigation";

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
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.termId) query.set("termId", params.termId);
  if (params.classId) query.set("classId", params.classId);
  if (params.studentId) query.set("studentId", params.studentId);
  redirect(`/app/print/results?${query.toString()}`);
}
