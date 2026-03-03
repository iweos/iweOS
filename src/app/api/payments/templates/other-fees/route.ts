import { NextResponse } from "next/server";

export async function GET() {
  const csv = [
    "name,category,amount,allowQuantity,priority,active",
    "Uniform,Store,15000,false,100,true",
    "Exercise Book,Stationery,1200,true,110,true",
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="other-fees-template.csv"',
    },
  });
}
