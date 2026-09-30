"use server";

import argon2 from "argon2";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { platformAdminEmailAllowed } from "@/lib/server/platform-owner";
import { requireDataroomAccess } from "@/lib/server/dataroom-access";
import { prisma } from "@/lib/server/prisma";
import { sendPasswordReset } from "@/lib/server/auth-email";
import { validatePermissions } from "@/lib/dataroom-permissions";

const userSchema = z.object({ email: z.string().email().max(254), fullName: z.string().min(2).max(120), roleId: z.string().uuid() });
function finish(message: string, error = false): never {
  revalidatePath("/dataroom/access");
  redirect(`/dataroom/access?${error ? "error" : "message"}=${encodeURIComponent(message)}`);
}

export async function saveDataroomRole(form: FormData) {
  const actor = await requireDataroomAccess("manageAccess");
  let failure = "";
  try {
    const name = String(form.get("name") ?? "").trim();
    const id = String(form.get("id") ?? "");
    if (name.length < 2 || name.length > 60) throw new Error("Role name must contain 2–60 characters.");
    if (id && !z.string().uuid().safeParse(id).success) throw new Error("Invalid role.");
    const permissions = validatePermissions(form.getAll("permissions").map(String));
    const ownMembership = await prisma.dataroomMembership.findUnique({ where: { credentialId: actor.credentialId } });
    if (!actor.protected && ownMembership?.roleId === id && !permissions.includes("manageAccess")) throw new Error("You cannot remove your own access-management permission.");
    await prisma.$transaction(async (tx) => {
      const role = id ? await tx.dataroomRole.update({ where: { id }, data: { name, permissions } }) : await tx.dataroomRole.create({ data: { name, permissions } });
      await tx.dataroomAccessLog.create({ data: { actorEmail: actor.email, target: role.name, action: id ? "role.updated" : "role.created", details: { permissions } } });
    });
  } catch (error) { failure = error instanceof Error && !error.message.includes("prisma") ? error.message : "Could not save this role. Check for a duplicate name."; }
  finish(failure || "Role saved.", Boolean(failure));
}

export async function addDataroomUser(form: FormData) {
  const actor = await requireDataroomAccess("manageAccess");
  const parsed = userSchema.safeParse({ email: String(form.get("email") ?? "").trim().toLowerCase(), fullName: String(form.get("fullName") ?? "").trim(), roleId: String(form.get("roleId") ?? "") });
  if (!parsed.success) finish("Enter a name, valid email and role.", true);
  const { email, fullName, roleId } = parsed.data;
  let failure = "";
  let created = false;
  try {
    if (platformAdminEmailAllowed(email)) throw new Error("This account already has protected administrator access.");
    const hash = await argon2.hash(randomBytes(48).toString("base64url"));
    await prisma.$transaction(async (tx) => {
      const existing = await tx.authCredential.findUnique({ where: { email } });
      if (existing?.platformRole) throw new Error("This account already has protected administrator access.");
      const credential = existing ?? await tx.authCredential.create({ data: { email, passwordHash: hash } });
      created = !existing;
      await tx.dataroomMembership.create({ data: { credentialId: credential.id, roleId, fullName } });
      await tx.dataroomAccessLog.create({ data: { actorEmail: actor.email, target: email, action: "user.added", details: { roleId, fullName } } });
    });
  } catch { failure = "Could not add this user. They may already be listed; use their role controls instead."; }
  finish(failure || (created ? "User added. Send a setup email to let them choose their password." : "Existing account added with its password unchanged."), Boolean(failure));
}

export async function updateDataroomUser(form: FormData) {
  const actor = await requireDataroomAccess("manageAccess");
  const credentialId = String(form.get("credentialId") ?? "");
  const roleId = String(form.get("roleId") ?? "");
  const revoke = form.get("operation") === "revoke";
  if (!z.string().uuid().safeParse(credentialId).success || (!revoke && !z.string().uuid().safeParse(roleId).success)) finish("Invalid user or role.", true);
  let failure = "";
  try {
    const target = await prisma.authCredential.findUniqueOrThrow({ where: { id: credentialId } });
    if (target.id === actor.credentialId || target.platformRole || platformAdminEmailAllowed(target.email)) throw new Error("Your own access and protected administrators cannot be changed here.");
    await prisma.$transaction(async (tx) => {
      await tx.dataroomMembership.update({ where: { credentialId }, data: revoke ? { isActive: false } : { roleId, isActive: true } });
      await tx.dataroomAccessLog.create({ data: { actorEmail: actor.email, target: target.email, action: revoke ? "user.revoked" : "user.role_changed", details: { roleId } } });
    });
  } catch { failure = "Could not change access. Your own access and protected administrators cannot be changed here."; }
  finish(failure || (revoke ? "Dataroom access revoked." : "Role assigned and access enabled."), Boolean(failure));
}

export async function sendDataroomSetupEmail(form: FormData) {
  const actor = await requireDataroomAccess("manageAccess");
  const credentialId = String(form.get("credentialId") ?? "");
  if (!z.string().uuid().safeParse(credentialId).success) finish("Invalid user.", true);
  let failure = "";
  try {
    const membership = await prisma.dataroomMembership.findUniqueOrThrow({ where: { credentialId }, include: { credential: true } });
    if (!membership.isActive) throw new Error("Enable this user's access before sending a setup email.");
    await sendPasswordReset(credentialId, membership.credential.email);
    await prisma.dataroomAccessLog.create({ data: { actorEmail: actor.email, target: membership.credential.email, action: "user.setup_email_sent", details: {} } });
  } catch { failure = "Could not send the setup email. Check email configuration and retry; the user record has been retained."; }
  finish(failure || "Password setup email sent. The user must also verify their email when signing in.", Boolean(failure));
}
