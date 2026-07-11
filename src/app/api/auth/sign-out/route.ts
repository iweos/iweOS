import { NextResponse } from "next/server";
import { destroyAuthSession } from "@/lib/server/session";

export async function POST(request: Request) {
  await destroyAuthSession();
  return NextResponse.redirect(new URL("/sign-in", request.url), 303);
}
