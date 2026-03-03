import { NextResponse } from "next/server";

export async function GET() {
  const csv = [
    "studentCode,firstName,lastName,className,address,guardianName,guardianPhone,guardianEmail,status",
    "ADM001,John,Doe,JSS 1,12 Main St,Mary Doe,08012345678,parent@example.com,active",
    "ADM002,Jane,Doe,JSS 2,14 Main St,Michael Doe,08012345679,parent2@example.com,active",
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="students-template.csv"',
    },
  });
}
