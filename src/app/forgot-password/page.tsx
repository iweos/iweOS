import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import { requestPasswordResetAction } from "@/lib/server/auth-actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  return (
    <AuthShell>
        <h1>Reset your password.</h1>
        <p className="auth-intro">We&apos;ll send a secure reset link to your verified email.</p>
        {error ? <div className="auth-error" role="alert">{error}</div> : null}
        {sent ? <div className="auth-success" role="status">If an iweOS account uses that email, a reset link has been sent. Check your inbox and spam folder.</div> : null}
        {!sent ? <form action={requestPasswordResetAction} className="auth-form">
          <label><span className="sr-only">Email address</span><input name="email" type="email" autoComplete="email" placeholder="Your email" required /></label>
          <AuthSubmitButton idleLabel="Send reset link" pendingLabel="Sending..." />
        </form> : null}
        <p className="auth-switch"><Link href="/sign-in">Back to sign in</Link></p>
    </AuthShell>
  );
}
