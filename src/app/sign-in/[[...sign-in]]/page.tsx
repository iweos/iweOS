import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { signInAction } from "@/lib/server/auth-actions";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="auth-page" data-loading-indicator="off">
      <section className="auth-card">
        <BrandLogo href="/" variant="dark" className="auth-brand" textClassName="auth-brand-text" />
        <p className="auth-kicker">School workspace</p>
        <h1>Welcome back</h1>
        <p className="auth-intro">Sign in to manage your school, classes and results.</p>
        {error ? <div className="auth-error" role="alert">{error}</div> : null}
        <form action={signInAction} className="auth-form">
          <label><span>Email address</span><input name="email" type="email" autoComplete="email" required /></label>
          <label><span>Password</span><input name="password" type="password" autoComplete="current-password" required /></label>
          <button type="submit">Sign in</button>
        </form>
        <p className="auth-switch">New to iweOS? <Link href="/sign-up">Sign up your school</Link></p>
      </section>
    </main>
  );
}
