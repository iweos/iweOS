import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { requestPasswordResetAction } from "@/lib/server/auth-actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  return (
    <main className="auth-page" data-loading-indicator="off">
      <section className="auth-card">
        <BrandLogo href="/" variant="dark" className="auth-brand" textClassName="auth-brand-text" />
        <p className="auth-kicker">Account recovery</p>
        <h1>Forgot password?</h1>
        <p className="auth-intro">Enter your verified email and we will send a secure reset link.</p>
        {error ? <div className="auth-error" role="alert">{error}</div> : null}
        {sent ? <div className="auth-success" role="status">If an iweOS account uses that email, a reset link has been sent. Check your inbox and spam folder.</div> : null}
        {!sent ? <form action={requestPasswordResetAction} className="auth-form">
          <label><span>Email address</span><input name="email" type="email" autoComplete="email" required /></label>
          <button type="submit">Send reset link</button>
        </form> : null}
        <p className="auth-switch"><Link href="/sign-in">Back to sign in</Link></p>
      </section>
    </main>
  );
}
