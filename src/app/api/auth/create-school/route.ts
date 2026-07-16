import { NextResponse } from "next/server";
import { createAdditionalSchoolForAuthenticatedUser } from "@/lib/server/auth";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { schoolName?: string } | null;
  const schoolName = payload?.schoolName?.trim() ?? "";
  if (schoolName.length < 2) return NextResponse.json({ error: "Enter a valid school name." }, { status: 400 });

  try {
    const profile = await createAdditionalSchoolForAuthenticatedUser(schoolName);
    return NextResponse.json({ destination: "/app/admin/dashboard", profileId: profile.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create this school right now.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}
