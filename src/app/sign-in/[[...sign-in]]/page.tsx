import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import PasswordField from "@/components/auth/PasswordField";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import { signInAction } from "@/lib/server/auth-actions";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string; reset?: string; verified?: string }> }) {
  const { error, reset, verified } = await searchParams;
  return (
    <main className="auth-page" data-loading-indicator="off">
      <section className="auth-card">
        <BrandLogo href="/" variant="dark" className="auth-brand" textClassName="auth-brand-text" />
        <p className="auth-kicker">School workspace</p>
        <h1>Welcome back</h1>
        <p className="auth-intro">Sign in to manage your school, classes and results.</p>
        {error ? <div className="auth-error" role="alert">{error}</div> : null}
        {reset ? <div className="auth-success" role="status">Password updated. Sign in with your new password.</div> : null}
        {verified ? <div className="auth-success" role="status">Account verified. Sign in to continue.</div> : null}
        <form action={signInAction} className="auth-form">
          <label><span>Email address</span><input name="email" type="email" autoComplete="email" required /></label>
          <PasswordField label="Password" name="password" autoComplete="current-password" />
          <Link className="auth-forgot" href="/forgot-password">Forgot password?</Link>
          <AuthSubmitButton idleLabel="Sign in" pendingLabel="Signing in..." />
        </form>
        <p className="auth-switch">New to iweOS? <Link href="/sign-up">Sign up your school</Link></p>
      </section>
    </main>
  );
}
