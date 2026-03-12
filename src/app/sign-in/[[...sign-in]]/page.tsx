import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center p-6" data-loading-indicator="off">
      <SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/app" signUpUrl="/sign-up" />
    </main>
  );
}
