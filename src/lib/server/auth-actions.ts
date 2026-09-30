"use server";

import { getDataroomAccess } from "@/lib/server/dataroom-access";
import { dataroomDestination } from "@/lib/dataroom-permissions";

import argon2 from "argon2";
import { Prisma, ProfileRole, SchoolStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/server/prisma";
import { createAuthSession, destroyAuthSession, getAuthSession, parseAuthPortal, setAuthPortalPreference, setSessionProfile, type AuthPortal } from "@/lib/server/session";
import { consumePasswordReset, sendAccountVerification, sendPasswordReset } from "@/lib/server/auth-email";
import { claimProfilesForCredential, createAdditionalSchoolForAuthenticatedUser } from "@/lib/server/auth";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function authRedirect(path: string, message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
}

function requestedPortal(formData: FormData): AuthPortal {
  return parseAuthPortal(value(formData, "portal")) ?? "teacher";
}

export async function signInAction(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const portal = requestedPortal(formData);
  const passwordStep = `/sign-in?portal=${portal}&step=password&email=${encodeURIComponent(email)}`;
  if (!email || !password) authRedirect(passwordStep, "Enter your email and password.");

  const credential = await prisma.authCredential.findUnique({ where: { email } });
  if (!credential || !(await argon2.verify(credential.passwordHash, password))) {
    authRedirect(passwordStep, "Email or password is incorrect.");
  }
  if (!credential.emailVerifiedAt) {
    try {
      await sendAccountVerification(credential.id, credential.email, portal);
    } catch (error) {
      authRedirect(passwordStep, error instanceof Error ? error.message : "Unable to resend the verification email.");
    }
    redirect(`/sign-in?portal=${portal}&step=verification&email=${encodeURIComponent(email)}`);
  }

  await claimProfilesForCredential(credential.id, credential.email);
  if (portal === "student") {
    const linkedStudent = await prisma.student.findFirst({
      where: {
        guardianEmail: { equals: email, mode: "insensitive" },
        school: { status: SchoolStatus.ACTIVE },
      },
      select: { id: true },
    });
    if (!linkedStudent) authRedirect(`/sign-in?portal=student`, "No student record is linked to this email.");
    await prisma.authCredential.update({ where: { id: credential.id }, data: { lastLoginAt: new Date() } });
    await createAuthSession(credential.id, null);
    await setAuthPortalPreference("student");
    redirect("/student");
  }

  const profileRole = portal === "admin" ? ProfileRole.ADMIN : ProfileRole.TEACHER;
  const profiles = await prisma.profile.findMany({
    where: { credentialId: credential.id, role: profileRole, isActive: true, school: { status: SchoolStatus.ACTIVE } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  const profileId = profiles.length === 1 ? profiles[0].id : null;
  const dataroomAccess = await getDataroomAccess(credential);
  const platformAdmin = Boolean(dataroomAccess);

  if (portal === "teacher" && profiles.length === 0) {
    authRedirect("/sign-in?portal=teacher", "No active teacher assignment was found for this email.");
  }
  if (portal === "admin" && profiles.length === 0 && !platformAdmin) {
    const [otherProfile, linkedStudent] = await Promise.all([
      prisma.profile.findFirst({
        where: { credentialId: credential.id, isActive: true, school: { status: SchoolStatus.ACTIVE } },
        select: { id: true },
      }),
      prisma.student.findFirst({
        where: { guardianEmail: { equals: email, mode: "insensitive" }, school: { status: SchoolStatus.ACTIVE } },
        select: { id: true },
      }),
    ]);
    if (otherProfile || linkedStudent) {
      authRedirect("/sign-in?portal=admin", "This account does not have School Admin access.");
    }
  }

  await prisma.authCredential.update({ where: { id: credential.id }, data: { lastLoginAt: new Date() } });
  await createAuthSession(credential.id, profileId);
  await setAuthPortalPreference(portal);
  redirect(dataroomAccess ? dataroomDestination(dataroomAccess.permissions) : profileId ? "/app" : "/onboarding");
}

export async function beginSignInAction(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const portal = requestedPortal(formData);
  if (!/^\S+@\S+\.\S+$/.test(email)) authRedirect(`/sign-in?portal=${portal}`, "Enter a valid email address.");

  const profileRole = portal === "admin" ? ProfileRole.ADMIN : ProfileRole.TEACHER;
  const [credential, assignedProfile, linkedStudent] = await Promise.all([
    prisma.authCredential.findUnique({ where: { email }, select: { id: true } }),
    portal === "student" ? Promise.resolve(null) : prisma.profile.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        role: profileRole,
        isActive: true,
        school: { status: SchoolStatus.ACTIVE },
      },
      select: { id: true },
    }),
    portal === "student" ? prisma.student.findFirst({
      where: { guardianEmail: { equals: email, mode: "insensitive" }, school: { status: SchoolStatus.ACTIVE } },
      select: { id: true },
    }) : Promise.resolve(null),
  ]);

  const assigned = portal === "student" ? linkedStudent : assignedProfile;
  const canUseExistingCredential = Boolean(credential && (assigned || portal === "admin"));
  const nextStep = canUseExistingCredential ? "password" : assigned ? "activate" : "unassigned";
  redirect(`/sign-in?portal=${portal}&step=${nextStep}&email=${encodeURIComponent(email)}`);
}

export async function activateInvitedAccountAction(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const confirmPassword = value(formData, "confirmPassword");
  const portal = requestedPortal(formData);
  const activationStep = `/sign-in?portal=${portal}&step=activate&email=${encodeURIComponent(email)}`;

  if (!/^\S+@\S+\.\S+$/.test(email)) authRedirect(`/sign-in?portal=${portal}`, "Enter a valid email address.");
  if (password.length < 8) authRedirect(activationStep, "Password must be at least 8 characters.");
  if (password !== confirmPassword) authRedirect(activationStep, "Passwords do not match.");

  const assignedAccount = portal === "student"
    ? await prisma.student.findFirst({
        where: { guardianEmail: { equals: email, mode: "insensitive" }, school: { status: SchoolStatus.ACTIVE } },
        select: { id: true },
      })
    : await prisma.profile.findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
          role: portal === "admin" ? ProfileRole.ADMIN : ProfileRole.TEACHER,
          isActive: true,
          school: { status: SchoolStatus.ACTIVE },
        },
        select: { id: true },
      });
  if (!assignedAccount) authRedirect(`/sign-in?portal=${portal}`, `No active ${portal} assignment was found for this email.`);

  const existingCredential = await prisma.authCredential.findUnique({ where: { email }, select: { id: true } });
  if (existingCredential) redirect(`/sign-in?portal=${portal}&step=password&email=${encodeURIComponent(email)}`);

  let credential;
  try {
    credential = await prisma.authCredential.create({
      data: { email, passwordHash: await argon2.hash(password, { type: argon2.argon2id }) },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(`/sign-in?portal=${portal}&step=password&email=${encodeURIComponent(email)}`);
    }
    throw error;
  }
  try {
    await claimProfilesForCredential(credential.id, email);
    await sendAccountVerification(credential.id, email, portal);
  } catch (error) {
    await prisma.authCredential.delete({ where: { id: credential.id } }).catch(() => undefined);
    authRedirect(activationStep, error instanceof Error ? error.message : "Unable to activate this account.");
  }
  redirect(`/sign-in?portal=${portal}&step=verification&email=${encodeURIComponent(email)}`);
}

export async function createSchoolFromOnboardingAction(formData: FormData) {
  const schoolName = value(formData, "schoolName");
  if (schoolName.length < 2) authRedirect("/onboarding", "Enter a valid school name.");
  try {
    await createAdditionalSchoolForAuthenticatedUser(schoolName);
  } catch (error) {
    authRedirect("/onboarding", error instanceof Error ? error.message : "Unable to create the school workspace.");
  }
  redirect("/app/admin/dashboard");
}

export async function selectWorkspaceAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session) redirect("/sign-in");

  const profileId = value(formData, "profileId");
  const profile = await prisma.profile.findFirst({
    where: {
      id: profileId,
      credentialId: session.credentialId,
      isActive: true,
      school: { status: SchoolStatus.ACTIVE },
    },
    select: { id: true, role: true },
  });
  if (!profile) authRedirect("/onboarding", "That school workspace is no longer available.");

  await setSessionProfile(session.id, profile.id);
  redirect(profile.role === ProfileRole.ADMIN ? "/app/admin/dashboard" : "/app/teacher/dashboard");
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
      await sendAccountVerification(existingCredential.id, email, "admin");
      redirect(`/sign-up?sent=${encodeURIComponent(email)}`);
    }
    authRedirect("/sign-in", "An account already exists for this email. Sign in instead.");
  }

  const credential = await prisma.authCredential.create({
    data: { email, passwordHash: await argon2.hash(password, { type: argon2.argon2id }) },
  });
  try {
    await sendAccountVerification(credential.id, email, "admin");
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
