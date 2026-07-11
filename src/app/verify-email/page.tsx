import { redirect } from "next/navigation";
import { consumeAccountVerification } from "@/lib/server/auth-email";
import { createAuthSession } from "@/lib/server/session";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) redirect("/sign-in?error=Verification%20link%20is%20missing.");
  const verified = await consumeAccountVerification(token);
  if (!verified) redirect("/sign-in?error=Verification%20link%20is%20invalid%20or%20expired.");
  await createAuthSession(verified.credentialId, verified.profileId);
  redirect(verified.profileId ? "/app" : "/onboarding");
}
