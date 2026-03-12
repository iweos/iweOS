import type { NextRequest } from "next/server";

type ClerkKeyMode = "test" | "live" | "missing" | "unknown";

const DIAGNOSTIC_FLAG = "__iweosClerkDiagnosticsLogged";

function detectKeyMode(key: string | undefined): ClerkKeyMode {
  if (!key) {
    return "missing";
  }
  if (key.startsWith("pk_test_") || key.startsWith("sk_test_")) {
    return "test";
  }
  if (key.startsWith("pk_live_") || key.startsWith("sk_live_")) {
    return "live";
  }
  return "unknown";
}

function normalizeHost(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const candidate = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    return new URL(candidate).host;
  } catch {
    return trimmed;
  }
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname.endsWith(".local");
}

export function logClerkServerDiagnosticsOnce(req: NextRequest) {
  const state = globalThis as Record<string, unknown>;
  if (state[DIAGNOSTIC_FLAG] === true) {
    return;
  }
  state[DIAGNOSTIC_FLAG] = true;

  const publishableKeyMode = detectKeyMode(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const secretKeyMode = detectKeyMode(process.env.CLERK_SECRET_KEY);
  const requestHost = req.nextUrl.host;
  const localHost = isLocalHost(req.nextUrl.hostname);

  const diagnostic = {
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    vercelEnv: process.env.VERCEL_ENV ?? "unknown",
    requestHost,
    isLocalHost: localHost,
    publishableKeyMode,
    secretKeyMode,
    signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? null,
    signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? null,
    afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ?? null,
    afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL ?? null,
    clerkDomainHost: normalizeHost(process.env.CLERK_DOMAIN),
    clerkProxyHost: normalizeHost(process.env.CLERK_PROXY_URL),
    clerkFrontendApiHost: normalizeHost(process.env.CLERK_FRONTEND_API),
    clerkFapiHost: normalizeHost(process.env.CLERK_FAPI),
  };

  const keyModeMismatch =
    publishableKeyMode !== "missing" && secretKeyMode !== "missing" && publishableKeyMode !== secretKeyMode;
  const suspiciousProdKeyMode = !localHost && (publishableKeyMode === "test" || secretKeyMode === "test");

  if (keyModeMismatch || suspiciousProdKeyMode) {
    console.error("[auth][clerk] Configuration warning", {
      ...diagnostic,
      keyModeMismatch,
      suspiciousProdKeyMode,
    });
    return;
  }

  if (process.env.CLERK_AUTH_DEBUG === "1") {
    console.info("[auth][clerk] Configuration diagnostics", diagnostic);
  }
}
