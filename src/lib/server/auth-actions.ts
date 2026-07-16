"use server";

import argon2 from "argon2";
import { PlatformRole, SchoolStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/server/prisma";
import { createAuthSession, destroyAuthSession } from "@/lib/server/session";
import { consumePasswordReset, sendAccountVerification, sendPasswordReset } from "@/lib/server/auth-email";
import { claimProfilesForCredential, platformAdminEmailAllowed } from "@/lib/server/auth";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function authRedirect(path: string, message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
}

export async function signInAction(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  if (!email || !password) authRedirect("/sign-in", "Enter your email and password.");

  const credential = await prisma.authCredential.findUnique({ where: { email } });
  if (!credential || !(await argon2.verify(credential.passwordHash, password))) {
    authRedirect("/sign-in", "Email or password is incorrect.");
  }
  if (!credential.emailVerifiedAt) authRedirect("/sign-in", "Verify your email before signing in.");

  await claimProfilesForCredential(credential.id, credential.email);
  const profiles = await prisma.profile.findMany({
    where: { credentialId: credential.id, isActive: true, school: { status: SchoolStatus.ACTIVE } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  const profileId = profiles.length === 1 ? profiles[0].id : null;
  const platformAdmin =
    credential.platformRole === PlatformRole.PLATFORM_ADMIN || platformAdminEmailAllowed(credential.email);

  await prisma.authCredential.update({ where: { id: credential.id }, data: { lastLoginAt: new Date() } });
  await createAuthSession(credential.id, profileId);
  redirect(profileId ? "/app" : platformAdmin && profiles.length === 0 ? "/platform" : "/onboarding");
}

export async function signUpAction(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const confirmPassword = value(formData, "confirmPassword");
  if (!/^\S+@\S+\.\S+$/.test(email)) authRedirect("/sign-up", "Enter a valid email address.");
  if (password.length < 8) authRedirect("/sign-up", "Password must be at least 8 characters.");
  if (password !== confirmPassword) authRedirect("/sign-up", "Passwords do not match.");
  const existingCredential = await prisma.authCredential.findUnique({ where: { email } });
  if (existingCredential) {
    if (!existingCredential.emailVerifiedAt && await argon2.verify(existingCredential.passwordHash, password)) {
      await sendAccountVerification(existingCredential.id, email);
      redirect(`/sign-up?sent=${encodeURIComponent(email)}`);
    }
    authRedirect("/sign-in", "An account already exists for this email. Sign in instead.");
  }

  const credential = await prisma.authCredential.create({
    data: { email, passwordHash: await argon2.hash(password, { type: argon2.argon2id }) },
  });
  try {
    await sendAccountVerification(credential.id, email);
  } catch (error) {
    await prisma.authCredential.delete({ where: { id: credential.id } });
    authRedirect("/sign-up", error instanceof Error ? error.message : "Unable to send verification email.");
  }
  redirect(`/sign-up?sent=${encodeURIComponent(email)}`);
}

export async function signOutAction() {
  await destroyAuthSession();
  redirect("/sign-in");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) authRedirect("/forgot-password", "Enter a valid email address.");

  const credential = await prisma.authCredential.findUnique({ where: { email } });
  if (credential?.emailVerifiedAt) {
    try {
      await sendPasswordReset(credential.id, credential.email);
    } catch (error) {
      console.error("[auth] Failed to send password reset", error);
    }
  }
  redirect("/forgot-password?sent=1");
}

export async function resetPasswordAction(formData: FormData) {
  const token = value(formData, "token");
  const password = value(formData, "password");
  const confirmPassword = value(formData, "confirmPassword");
  if (!token) authRedirect("/reset-password", "Password reset link is missing.");
  if (password.length < 8) authRedirect(`/reset-password?token=${encodeURIComponent(token)}`, "Password must be at least 8 characters.");
  if (password !== confirmPassword) authRedirect(`/reset-password?token=${encodeURIComponent(token)}`, "Passwords do not match.");

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  if (!(await consumePasswordReset(token, passwordHash))) {
    authRedirect("/forgot-password", "Password reset link is invalid or expired. Request a new one.");
  }
  redirect("/sign-in?reset=1");
}
