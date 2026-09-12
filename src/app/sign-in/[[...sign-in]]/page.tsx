import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap, School, ShieldCheck } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import PasswordField from "@/components/auth/PasswordField";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import { activateInvitedAccountAction, beginSignInAction, signInAction } from "@/lib/server/auth-actions";
import { getAuthenticatedDestination } from "@/lib/server/auth";
import { parseAuthPortal, type AuthPortal } from "@/lib/server/session";

type SignInStep = "password" | "activate" | "unassigned" | "verification";

const portalDetails: Record<AuthPortal, { label: string; description: string }> = {
  admin: { label: "School Admin", description: "Manage your school workspace" },
  teacher: { label: "Teacher", description: "Open assigned teaching tools" },
  student: { label: "Student Portal", description: "View linked student records" },
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string; reset?: string; verified?: string; email?: string; step?: SignInStep; portal?: string }> }) {
  const destination = await getAuthenticatedDestination().catch((error) => {
    console.error("[auth][sign-in] Failed to resolve existing session", error);
    return null;
  });
  if (destination) redirect(destination);

  const { error, reset, verified, email = "", step, portal: rawPortal } = await searchParams;
  const portal = parseAuthPortal(rawPortal);
  const safeEmail = /^\S+@\S+\.\S+$/.test(email) ? email.toLowerCase() : "";
  const portalLabel = portal ? portalDetails[portal].label : null;
  return (
    <AuthShell>
        <h1>{step === "activate" ? `Activate your ${portalLabel} account.` : portal ? `Sign in as ${portalLabel}.` : "Choose your iweOS portal."}</h1>
        <p className="auth-intro">
          {step === "activate"
            ? "This email is already linked to an eligible school record. Create your password to continue."
            : portal
              ? "Enter your email and we’ll find the right school workspace."
              : "Select where you want to work today."}
        </p>
        {error ? <div className="auth-error" role="alert">{error}</div> : null}
        {reset ? <div className="auth-success" role="status">Password updated. Sign in with your new password.</div> : null}
        {verified ? <div className="auth-success" role="status">Account verified. Sign in to continue.</div> : null}
        {step === "verification" && safeEmail ? (
          <div className="auth-success" role="status">Verification sent to {safeEmail}. Open the email to finish activating your account.</div>
        ) : null}
        {!portal ? (
          <nav className="auth-portal-grid" aria-label="Choose a portal">
            <Link href="/sign-in?portal=admin"><School /><span><strong>School Admin</strong><small>Manage or create a school</small></span></Link>
            <Link href="/sign-in?portal=teacher"><ShieldCheck /><span><strong>Teacher</strong><small>Use your assigned school</small></span></Link>
            <Link href="/sign-in?portal=student"><GraduationCap /><span><strong>Student Portal</strong><small>View linked student records</small></span></Link>
          </nav>
        ) : null}
        {portal && (!step || !safeEmail) ? (
          <form action={beginSignInAction} className="auth-form">
            <input name="portal" type="hidden" value={portal} />
            <label><span className="sr-only">Email address</span><input name="email" type="email" autoComplete="email" placeholder="Your email" required autoFocus /></label>
            <AuthSubmitButton idleLabel="Continue" pendingLabel="Checking account..." />
            <Link className="auth-forgot" href="/sign-in">Choose another portal</Link>
          </form>
        ) : null}
        {portal && step === "password" && safeEmail ? (
          <form action={signInAction} className="auth-form">
            <div className="auth-email-summary"><span>{safeEmail}</span><Link href={`/sign-in?portal=${portal}`}>Change</Link></div>
            <input name="email" type="hidden" value={safeEmail} />
            <input name="portal" type="hidden" value={portal} />
            <PasswordField label="Password" name="password" autoComplete="current-password" placeholder="Your password" />
            <AuthSubmitButton idleLabel="Sign in" pendingLabel="Signing in..." />
            <Link className="auth-forgot" href="/forgot-password">Forgot password?</Link>
          </form>
        ) : null}
        {portal && step === "activate" && safeEmail ? (
          <form action={activateInvitedAccountAction} className="auth-form">
            <div className="auth-email-summary"><span>{safeEmail}</span><Link href={`/sign-in?portal=${portal}`}>Change</Link></div>
            <input name="email" type="hidden" value={safeEmail} />
            <input name="portal" type="hidden" value={portal} />
            <PasswordField label="Password" name="password" autoComplete="new-password" minLength={8} placeholder="Create a password" />
            <PasswordField label="Confirm password" name="confirmPassword" autoComplete="new-password" minLength={8} placeholder="Confirm your password" />
            <AuthSubmitButton idleLabel="Activate account" pendingLabel="Creating account..." />
          </form>
        ) : null}
        {portal && step === "unassigned" && safeEmail ? (
          <div className="auth-unassigned">
            <div className="auth-email-summary"><span>{safeEmail}</span><Link href={`/sign-in?portal=${portal}`}>Change</Link></div>
            <p>{portal === "student" ? "No active student record uses this guardian email. Ask the school to update the student's guardian email." : portal === "teacher" ? "No active teacher assignment was found. Ask the school administrator to add this email before your first login." : "No school administrator account was found. Create a school-owner account to set up a new school."}</p>
            {portal === "admin" ? <Link className="auth-secondary-action" href={`/sign-up?email=${encodeURIComponent(safeEmail)}`}>Create a school workspace</Link> : null}
            <Link className="auth-forgot" href="/sign-in">Choose another portal</Link>
          </div>
        ) : null}
        {portal === "admin" && !step ? <p className="auth-switch">Setting up a new school? <Link href="/sign-up">Create a school account</Link></p> : null}
        <nav className="auth-page-links" aria-label="Authentication navigation">
          <Link href="/">Go to home</Link>
          <span aria-hidden="true" />
          <Link href="/sign-up">Sign up as School Admin</Link>
        </nav>
    </AuthShell>
  );
}
