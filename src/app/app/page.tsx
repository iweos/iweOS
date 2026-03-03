import { ProfileRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/server/auth";

export default async function AppIndexPage() {
  const profile = await requireProfile();
  redirect(profile.role === ProfileRole.ADMIN ? "/app/admin/dashboard" : "/app/teacher/dashboard");
}
