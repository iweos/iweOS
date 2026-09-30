import { getAuthenticatedDestination } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { consumeAccountVerification } from "@/lib/server/auth-email";
import { createAuthSession, parseAuthPortal, setAuthPortalPreference } from "@/lib/server/session";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string; portal?: string }> }) {
  const { token, portal: rawPortal } = await searchParams;
  const portal = parseAuthPortal(rawPortal);
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
    if (portal) await setAuthPortalPreference(portal);
  } catch (error) {
    console.error("[auth] Account verified but session creation failed", error);
    redirect("/sign-in?verified=1");
  }
  redirect(await getAuthenticatedDestination() ?? "/onboarding");
}
