import { redirect } from "next/navigation";
import { consumeAccountVerification } from "@/lib/server/auth-email";
import { createAuthSession } from "@/lib/server/session";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) redirect("/sign-in?error=Verification%20link%20is%20missing.");
  let verified: Awaited<ReturnType<typeof consumeAccountVerification>>;
  try {
    verified = await consumeAccountVerification(token);
  } catch (error) {
    console.error("[auth] Account verification failed", error);
    redirect("/sign-in?error=We%20could%20not%20verify%20this%20account.%20Please%20try%20the%20link%20again.");
  }
  if (!verified) redirect("/sign-in?error=Verification%20link%20is%20invalid%20or%20expired.");
  try {
    await createAuthSession(verified.credentialId, verified.profileId);
  } catch (error) {
    console.error("[auth] Account verified but session creation failed", error);
    redirect("/sign-in?error=Account%20verified.%20Please%20sign%20in%20to%20continue.");
  }
  redirect(verified.profileId ? "/app" : "/onboarding");
}
