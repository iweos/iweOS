import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import PasswordField from "@/components/auth/PasswordField";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import { signUpAction } from "@/lib/server/auth-actions";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  return (
    <AuthShell>
        <h1>Create your iweOS account.</h1>
        <p className="auth-intro">Already have an account? <Link href="/sign-in">Sign in</Link></p>
        {error ? <div className="auth-error" role="alert">{error}</div> : null}
        {sent ? <div className="auth-success" role="status">Verification sent to {sent}. Open the email to finish setting up your account.</div> : null}
        {!sent ? <form action={signUpAction} className="auth-form">
          <label><span className="sr-only">Email address</span><input name="email" type="email" autoComplete="email" placeholder="Your email" required /></label>
          <PasswordField label="Password" name="password" autoComplete="new-password" minLength={8} placeholder="Create a password" />
          <PasswordField label="Confirm password" name="confirmPassword" autoComplete="new-password" minLength={8} placeholder="Confirm your password" />
          <AuthSubmitButton idleLabel="Create account" pendingLabel="Creating account..." />
        </form> : null}
    </AuthShell>
  );
}
