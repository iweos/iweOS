import { NextResponse } from "next/server";

export async function GET() {
  const csv = [
    "className,sessionLabel,termLabel,feeName,category,amount,priority",
    "JSS 1,2025/2026,1st Term,Tuition,Academic,50000,1",
    "JSS 1,2025/2026,1st Term,PTA,Association,5000,3",
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="compulsory-fees-template.csv"',
    },
  });
}
