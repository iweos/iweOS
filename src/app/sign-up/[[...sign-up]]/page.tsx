import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import PasswordField from "@/components/auth/PasswordField";
import { signUpAction } from "@/lib/server/auth-actions";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  return (
    <main className="auth-page" data-loading-indicator="off">
      <section className="auth-card">
        <BrandLogo href="/" variant="dark" className="auth-brand" textClassName="auth-brand-text" />
        <p className="auth-kicker">Start with iweOS</p>
        <h1>Sign up your school</h1>
        <p className="auth-intro">Create a secure account, then configure your school workspace.</p>
        {error ? <div className="auth-error" role="alert">{error}</div> : null}
        {sent ? <div className="auth-success" role="status">Verification sent to {sent}. Open the email to finish setting up your account.</div> : null}
        {!sent ? <form action={signUpAction} className="auth-form">
          <label><span>Email address</span><input name="email" type="email" autoComplete="email" required /></label>
          <PasswordField label="Password" name="password" autoComplete="new-password" minLength={8} />
          <PasswordField label="Confirm password" name="confirmPassword" autoComplete="new-password" minLength={8} />
          <button type="submit">Create account</button>
        </form> : null}
        <p className="auth-switch">Already have an account? <Link href="/sign-in">Sign in</Link></p>
      </section>
    </main>
  );
}
