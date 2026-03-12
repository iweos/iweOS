"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

function detectPublishableKeyMode(key: string | undefined) {
  if (!key) {
    return "missing";
  }
  if (key.startsWith("pk_test_")) {
    return "test";
  }
  if (key.startsWith("pk_live_")) {
    return "live";
  }
  return "unknown";
}

function toShortId(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  if (value.length <= 12) {
    return value;
  }
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname.endsWith(".local");
}

export default function ClerkDiagnosticsClient() {
  const { isLoaded, isSignedIn, userId, sessionId } = useAuth();
  const hasLoggedBootRef = useRef(false);
  const previousSessionIdRef = useRef<string | null>(null);
  const debugEnabled = process.env.NEXT_PUBLIC_AUTH_DEBUG === "1";

  useEffect(() => {
    if (!debugEnabled || !isLoaded || hasLoggedBootRef.current) {
      return;
    }

    hasLoggedBootRef.current = true;
    const hostname = window.location.hostname;
    console.info("[auth][clerk][client] Runtime diagnostics", {
      host: window.location.host,
      isLocalHost: isLocalHost(hostname),
      publishableKeyMode: detectPublishableKeyMode(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
      signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? null,
      signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? null,
      afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ?? null,
      afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL ?? null,
      isSignedIn,
      userId: toShortId(userId),
      sessionId: toShortId(sessionId),
    });
  }, [debugEnabled, isLoaded, isSignedIn, sessionId, userId]);

  useEffect(() => {
    if (!debugEnabled || !isLoaded) {
      return;
    }

    const previous = previousSessionIdRef.current;
    const current = sessionId ?? null;
    if (!previous && current) {
      console.info("[auth][clerk][client] Session established", {
        userId: toShortId(userId),
        sessionId: toShortId(current),
      });
    } else if (previous && !current) {
      console.info("[auth][clerk][client] Session cleared", {
        userId: toShortId(userId),
        previousSessionId: toShortId(previous),
      });
    } else if (previous && current && previous !== current) {
      console.info("[auth][clerk][client] Session switched", {
        userId: toShortId(userId),
        previousSessionId: toShortId(previous),
        currentSessionId: toShortId(current),
      });
    }

    previousSessionIdRef.current = current;
  }, [debugEnabled, isLoaded, sessionId, userId]);

  return null;
}
