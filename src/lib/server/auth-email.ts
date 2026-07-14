import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { AuthTokenType, SchoolStatus } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function appOrigin() {
  if (process.env.NODE_ENV === "production") return "https://iweos.sirfitech.io";
  if (process.env.AUTH_APP_URL) return process.env.AUTH_APP_URL.replace(/\/$/, "");
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

async function resendFailure(response: Response, fallback: string) {
  const details = await response.text();
  console.error(`[auth-email] Resend rejected the request (${response.status})`, details.slice(0, 800));
  const normalized = details.toLowerCase();
  if (normalized.includes("domain") && normalized.includes("not verified")) {
    return "The verification email domain is not approved in Resend yet. Verify the AUTH_EMAIL_FROM domain and try again.";
  }
  if (response.status === 401 || normalized.includes("api key")) {
    return "The email service key was rejected. Check RESEND_API_KEY in Vercel and try again.";
  }
  if (response.status === 422 || normalized.includes("from address")) {
    return "The verification sender address is not approved. Check AUTH_EMAIL_FROM in Vercel and verify its domain in Resend.";
  }
  if (response.status === 429) return "The email service is temporarily rate-limited. Wait a moment and try again.";
  return fallback;
}

export async function sendAccountVerification(credentialId: string, email: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Account email delivery is not configured yet.");

  const rawToken = randomBytes(32).toString("base64url");
  await prisma.authVerificationToken.deleteMany({
    where: { credentialId, type: AuthTokenType.VERIFY_EMAIL, usedAt: null },
  });
  await prisma.authVerificationToken.create({
    data: {
      credentialId,
      tokenHash: hashToken(rawToken),
      type: AuthTokenType.VERIFY_EMAIL,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    },
  });

  const verifyUrl = `${await appOrigin()}/verify-email?token=${encodeURIComponent(rawToken)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Verify your iweOS account",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px"><h1 style="color:#245332">Verify your iweOS account</h1><p>Use the button below to confirm your email and securely connect your school profile.</p><p style="margin:28px 0"><a href="${verifyUrl}" style="background:#2f6b3f;color:#fff;text-decoration:none;padding:13px 20px;border-radius:9px;font-weight:700">Verify account</a></p><p>This link expires in 30 minutes. If you did not request it, you can ignore this email.</p></div>`,
    }),
  });
  if (!response.ok) {
    await prisma.authVerificationToken.deleteMany({ where: { credentialId, tokenHash: hashToken(rawToken) } });
    throw new Error(await resendFailure(response, "We could not send the verification email. Please try again."));
  }
}

export async function consumeAccountVerification(rawToken: string) {
  const token = await prisma.authVerificationToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { credential: true },
  });
  if (!token || token.type !== AuthTokenType.VERIFY_EMAIL || token.expiresAt <= new Date()) return null;

  // A verified token remains retryable until expiry if the first redirect was
  // interrupted after verification but before its session could be created.
  if (token.usedAt) {
    if (!token.credential.emailVerifiedAt) return null;
    const profiles = await prisma.profile.findMany({
      where: { credentialId: token.credentialId, isActive: true, school: { status: SchoolStatus.ACTIVE } },
      select: { id: true },
    });
    return { credentialId: token.credentialId, profileId: profiles.length === 1 ? profiles[0].id : null };
  }

  await prisma.profile.updateMany({
    where: {
      email: { equals: token.credential.email, mode: "insensitive" },
      isActive: true,
      credentialId: null,
    },
    data: { credentialId: token.credentialId },
  });
  const matchingProfiles = await prisma.profile.findMany({
    where: { credentialId: token.credentialId, isActive: true, school: { status: SchoolStatus.ACTIVE } },
    select: { id: true },
  });
  const profileId = matchingProfiles.length === 1 ? matchingProfiles[0].id : null;
  await prisma.$transaction([
    prisma.authVerificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
    prisma.authCredential.update({
      where: { id: token.credentialId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);
  return { credentialId: token.credentialId, profileId };
}

export async function sendPasswordReset(credentialId: string, email: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Account email delivery is not configured yet.");

  const rawToken = randomBytes(32).toString("base64url");
  await prisma.authVerificationToken.deleteMany({
    where: { credentialId, type: AuthTokenType.PASSWORD_RESET, usedAt: null },
  });
  await prisma.authVerificationToken.create({
    data: {
      credentialId,
      tokenHash: hashToken(rawToken),
      type: AuthTokenType.PASSWORD_RESET,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    },
  });

  const resetUrl = `${await appOrigin()}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Reset your iweOS password",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px"><h1 style="color:#245332">Reset your iweOS password</h1><p>Use the button below to choose a new password for your account.</p><p style="margin:28px 0"><a href="${resetUrl}" style="background:#2f6b3f;color:#fff;text-decoration:none;padding:13px 20px;border-radius:9px;font-weight:700">Reset password</a></p><p>This link expires in 30 minutes. If you did not request it, you can ignore this email.</p></div>`,
    }),
  });
  if (!response.ok) {
    await prisma.authVerificationToken.deleteMany({ where: { credentialId, tokenHash: hashToken(rawToken) } });
    throw new Error(await resendFailure(response, "We could not send the password reset email."));
  }
}

export async function consumePasswordReset(rawToken: string, passwordHash: string) {
  const token = await prisma.authVerificationToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });
  if (!token || token.type !== AuthTokenType.PASSWORD_RESET || token.usedAt || token.expiresAt <= new Date()) return false;

  await prisma.$transaction([
    prisma.authVerificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
    prisma.authCredential.update({ where: { id: token.credentialId }, data: { passwordHash } }),
    prisma.authSession.deleteMany({ where: { credentialId: token.credentialId } }),
  ]);
  return true;
}
