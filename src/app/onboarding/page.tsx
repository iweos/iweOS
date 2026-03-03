import { ProfileRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { ensureProfileForAuthenticatedUser } from "@/lib/server/auth";

export default async function OnboardingPage() {
  const profile = await ensureProfileForAuthenticatedUser();

  redirect(profile.role === ProfileRole.ADMIN ? "/app/admin/dashboard" : "/app/teacher/dashboard");
}
