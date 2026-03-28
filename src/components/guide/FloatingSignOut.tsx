"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useState } from "react";

export default function FloatingSignOut() {
  const { signOut } = useClerk();
  const { sessionId } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("iweos:pending-indicator", {
        detail: { durationMs: 9000 },
      }),
    );

    setIsSigningOut(true);
    const signOutPromise = sessionId ? signOut({ sessionId, redirectUrl: "/sign-in" }) : signOut({ redirectUrl: "/sign-in" });
    void signOutPromise.catch(() => {
      setIsSigningOut(false);
    });
  }

  return (
    <button type="button" className="floating-signout-button" onClick={handleSignOut} disabled={isSigningOut} aria-label="Sign out">
      <i className="fas fa-sign-out-alt" aria-hidden="true" />
      <span className="floating-signout-label">{isSigningOut ? "Signing out..." : "Sign out"}</span>
    </button>
  );
}
