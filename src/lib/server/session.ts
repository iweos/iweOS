import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";
import { prisma } from "@/lib/server/prisma";

export { SESSION_COOKIE_NAME };
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAuthSession(credentialId: string, profileId: string | null) {
  const rawToken = randomBytes(32).toString("base64url");
  const requestHeaders = await headers();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.authSession.create({
    data: {
      credentialId,
      profileId,
      sessionTokenHash: hashToken(rawToken),
      expiresAt,
      ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: requestHeaders.get("user-agent"),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getAuthSession() {
  const rawToken = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;

  const session = await prisma.authSession.findUnique({
    where: { sessionTokenHash: hashToken(rawToken) },
    include: {
      credential: true,
      profile: { include: { school: true } },
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.authSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return session;
}

export async function setSessionProfile(sessionId: string, profileId: string) {
  await prisma.authSession.update({ where: { id: sessionId }, data: { profileId } });
}

export async function destroyAuthSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (rawToken) {
    await prisma.authSession.deleteMany({ where: { sessionTokenHash: hashToken(rawToken) } });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}
