import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { AuthTokenType } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function appOrigin() {
  if (process.env.AUTH_APP_URL) return process.env.AUTH_APP_URL.replace(/\/$/, "");
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  return host ? `${protocol}://${host}` : "http://localhost:3000";
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
    throw new Error("We could not send the verification email. Please try again.");
  }
}

export async function consumeAccountVerification(rawToken: string) {
  const token = await prisma.authVerificationToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { credential: true },
  });
  if (!token || token.type !== AuthTokenType.VERIFY_EMAIL || token.usedAt || token.expiresAt <= new Date()) return null;

  const matchingProfiles = await prisma.profile.findMany({
    where: {
      email: { equals: token.credential.email, mode: "insensitive" },
      isActive: true,
      authCredential: null,
    },
    select: { id: true },
  });
  const profileId = matchingProfiles.length === 1 ? matchingProfiles[0].id : null;
  await prisma.$transaction([
    prisma.authVerificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
    prisma.authCredential.update({
      where: { id: token.credentialId },
      data: { emailVerifiedAt: new Date(), profileId },
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
    throw new Error("We could not send the password reset email.");
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
