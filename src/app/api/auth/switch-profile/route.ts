import { ProfileRole, SchoolStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAuthSession, setSessionProfile } from "@/lib/server/session";
import { prisma } from "@/lib/server/prisma";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const payload = (await request.json().catch(() => null)) as { profileId?: string } | null;
  if (!payload?.profileId) return NextResponse.json({ error: "Select a school workspace." }, { status: 400 });

  const profile = await prisma.profile.findFirst({
    where: {
      id: payload.profileId,
      credentialId: session.credentialId,
      isActive: true,
      school: { status: SchoolStatus.ACTIVE },
    },
    select: { id: true, role: true },
  });
  if (!profile) return NextResponse.json({ error: "You do not have access to that school." }, { status: 403 });

  await setSessionProfile(session.id, profile.id);
  return NextResponse.json({
    destination: profile.role === ProfileRole.ADMIN ? "/app/admin/dashboard" : "/app/teacher/dashboard",
  });
}
