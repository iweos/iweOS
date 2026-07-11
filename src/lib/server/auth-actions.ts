"use server";

import argon2 from "argon2";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/server/prisma";
import { createAuthSession, destroyAuthSession } from "@/lib/server/session";
import { sendAccountVerification } from "@/lib/server/auth-email";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function authRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
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

  await prisma.authCredential.update({ where: { id: credential.id }, data: { lastLoginAt: new Date() } });
  await createAuthSession(credential.id, credential.profileId);
  redirect(credential.profileId ? "/app" : "/onboarding");
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
