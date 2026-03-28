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
