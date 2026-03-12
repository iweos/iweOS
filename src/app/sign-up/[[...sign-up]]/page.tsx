import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center p-6" data-loading-indicator="off">
      <SignUp routing="path" path="/sign-up" fallbackRedirectUrl="/onboarding" signInUrl="/sign-in" />
    </main>
  );
}
