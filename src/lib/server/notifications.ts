import { ProfileRole } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";

type NotificationInput = {
  schoolId: string;
  recipientProfileId: string;
  actorProfileId?: string | null;
  title: string;
  message: string;
  href?: string | null;
};

export async function createNotifications(items: NotificationInput[]) {
  if (items.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: items.map((item) => ({
      schoolId: item.schoolId,
      recipientProfileId: item.recipientProfileId,
      actorProfileId: item.actorProfileId ?? null,
      title: item.title,
      message: item.message,
      href: item.href ?? null,
    })),
  });
}

export async function createOrRefreshNotifications(
  items: NotificationInput[],
  options?: {
    dedupeWindowMinutes?: number;
  },
) {
  if (items.length === 0) {
    return;
  }

  const dedupeWindowMinutes = options?.dedupeWindowMinutes ?? 0;
  if (dedupeWindowMinutes <= 0) {
    await createNotifications(items);
    return;
  }

  const cutoff = new Date(Date.now() - dedupeWindowMinutes * 60_000);

  await Promise.all(
    items.map(async (item) => {
      const existing = await prisma.notification.findFirst({
        where: {
          recipientProfileId: item.recipientProfileId,
          title: item.title,
          href: item.href ?? null,
          isRead: false,
          createdAt: {
            gte: cutoff,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
        },
      });

      if (existing) {
        await prisma.notification.update({
          where: { id: existing.id },
          data: {
            actorProfileId: item.actorProfileId ?? null,
            message: item.message,
            createdAt: new Date(),
          },
        });
        return;
      }

      await prisma.notification.create({
        data: {
          schoolId: item.schoolId,
          recipientProfileId: item.recipientProfileId,
          actorProfileId: item.actorProfileId ?? null,
          title: item.title,
          message: item.message,
          href: item.href ?? null,
        },
      });
    }),
  );
}

export async function notifyProfile(params: NotificationInput) {
  await createNotifications([params]);
}

export async function notifyTeachersForClass(params: {
  schoolId: string;
  className?: string | null;
  actorProfileId?: string | null;
  title: string;
  message: string;
  href?: string | null;
}) {
  const className = params.className?.trim();
  if (!className) {
    return;
  }

  const classRecord = await prisma.class.findFirst({
    where: {
      schoolId: params.schoolId,
      name: className,
    },
    select: {
      id: true,
    },
  });

  if (!classRecord) {
    return;
  }

  const teachers = await prisma.teacherClassAssignment.findMany({
    where: {
      schoolId: params.schoolId,
      classId: classRecord.id,
      teacherProfile: {
        is: {
          isActive: true,
          role: ProfileRole.TEACHER,
        },
      },
    },
    select: {
      teacherProfileId: true,
    },
    distinct: ["teacherProfileId"],
  });

  await createNotifications(
    teachers.map((teacher) => ({
      schoolId: params.schoolId,
      recipientProfileId: teacher.teacherProfileId,
      actorProfileId: params.actorProfileId ?? null,
      title: params.title,
      message: params.message,
      href: params.href ?? "/app/teacher/students",
    })),
  );
}

export async function notifyTeachersForClassId(params: {
  schoolId: string;
  classId?: string | null;
  actorProfileId?: string | null;
  title: string;
  message: string;
  href?: string | null;
  dedupeWindowMinutes?: number;
}) {
  const classId = params.classId?.trim();
  if (!classId) {
    return;
  }

  const teachers = await prisma.teacherClassAssignment.findMany({
    where: {
      schoolId: params.schoolId,
      classId,
      teacherProfile: {
        is: {
          isActive: true,
          role: ProfileRole.TEACHER,
        },
      },
    },
    select: {
      teacherProfileId: true,
    },
    distinct: ["teacherProfileId"],
  });

  await createOrRefreshNotifications(
    teachers.map((teacher) => ({
      schoolId: params.schoolId,
      recipientProfileId: teacher.teacherProfileId,
      actorProfileId: params.actorProfileId ?? null,
      title: params.title,
      message: params.message,
      href: params.href ?? "/app/teacher/dashboard",
    })),
    {
      dedupeWindowMinutes: params.dedupeWindowMinutes,
    },
  );
}

export async function notifySchoolAdmins(params: {
  schoolId: string;
  actorProfileId?: string | null;
  title: string;
  message: string;
  href?: string | null;
}) {
  const admins = await prisma.profile.findMany({
    where: {
      schoolId: params.schoolId,
      role: ProfileRole.ADMIN,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  await createNotifications(
    admins.map((admin) => ({
      schoolId: params.schoolId,
      recipientProfileId: admin.id,
      actorProfileId: params.actorProfileId ?? null,
      title: params.title,
      message: params.message,
      href: params.href ?? "/app/admin/dashboard",
    })),
  );
}
