import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import PasswordField from "@/components/auth/PasswordField";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import { signInAction } from "@/lib/server/auth-actions";
import { getAuthenticatedDestination } from "@/lib/server/auth";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string; reset?: string; verified?: string }> }) {
  const destination = await getAuthenticatedDestination().catch((error) => {
    console.error("[auth][sign-in] Failed to resolve existing session", error);
    return null;
  });
  if (destination) redirect(destination);

  const { error, reset, verified } = await searchParams;
  return (
    <AuthShell>
        <h1>Welcome back to iweOS.</h1>
        <p className="auth-intro">First time here? <Link href="/sign-up">Sign up your school</Link></p>
        {error ? <div className="auth-error" role="alert">{error}</div> : null}
        {reset ? <div className="auth-success" role="status">Password updated. Sign in with your new password.</div> : null}
        {verified ? <div className="auth-success" role="status">Account verified. Sign in to continue.</div> : null}
        <form action={signInAction} className="auth-form">
          <label><span className="sr-only">Email address</span><input name="email" type="email" autoComplete="email" placeholder="Your email" required /></label>
          <PasswordField label="Password" name="password" autoComplete="current-password" placeholder="Your password" />
          <AuthSubmitButton idleLabel="Sign in" pendingLabel="Signing in..." />
          <Link className="auth-forgot" href="/forgot-password">Forgot password?</Link>
        </form>
    </AuthShell>
  );
}
