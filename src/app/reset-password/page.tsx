import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import PasswordField from "@/components/auth/PasswordField";
import { resetPasswordAction } from "@/lib/server/auth-actions";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token = "", error } = await searchParams;
  return (
    <main className="auth-page" data-loading-indicator="off">
      <section className="auth-card">
        <BrandLogo href="/" variant="dark" className="auth-brand" textClassName="auth-brand-text" />
        <p className="auth-kicker">Account recovery</p>
        <h1>Choose a new password</h1>
        <p className="auth-intro">Use at least eight characters. Existing sign-in sessions will be closed for security.</p>
        {error ? <div className="auth-error" role="alert">{error}</div> : null}
        {token ? <form action={resetPasswordAction} className="auth-form">
          <input name="token" type="hidden" value={token} />
          <PasswordField label="New password" name="password" autoComplete="new-password" minLength={8} />
          <PasswordField label="Confirm new password" name="confirmPassword" autoComplete="new-password" minLength={8} />
          <button type="submit">Reset password</button>
        </form> : <div className="auth-error" role="alert">This reset link is incomplete. Request a new one.</div>}
        <p className="auth-switch"><Link href="/forgot-password">Request another link</Link></p>
      </section>
    </main>
  );
}
