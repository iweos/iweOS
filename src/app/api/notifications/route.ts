import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return NextResponse.json({ items: [], unreadCount: 0 }, { status: 401 });
  }

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        recipientProfileId: profile.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
      select: {
        id: true,
        title: true,
        message: true,
        href: true,
        isRead: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: {
        recipientProfileId: profile.id,
        isRead: false,
      },
    }),
  ]);

  return NextResponse.json({ items, unreadCount });
}

export async function POST() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: {
      recipientProfileId: profile.id,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
