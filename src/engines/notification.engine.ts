import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../utils/errors';
import { NotificationType, NotificationStatus, UserRole } from '../config/constants';
import logger from '../utils/logger';
import { config } from '../config';

const prisma = new PrismaClient();

export interface NotificationCreateParams {
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  scheduleId?: string;
  metadata?: Record<string, unknown>;
}

export interface ReminderParams {
  organizationId: string;
  scheduleId: string;
  reminderMinutes?: number;
}

export interface RenewalReminderParams {
  organizationId: string;
  enrollmentId: string;
  studentId: string;
  remainingHours: number;
  remainingDays: number;
}

export async function createNotification(
  params: NotificationCreateParams
) {
  const notification = await prisma.notification.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId,
      type: params.type,
      title: params.title,
      content: params.content,
      scheduleId: params.scheduleId,
      metadata: params.metadata,
      status: NotificationStatus.PENDING,
    },
    include: {
      user: {
        select: {
          id: true,
          realName: true,
          phone: true,
          role: true,
        },
      },
    },
  });

  logger.info('通知创建成功', {
    notificationId: notification.id,
    userId: params.userId,
    type: params.type,
  });

  return notification;
}

export async function createScheduleReminder(
  params: ReminderParams
): Promise<Array<{ notificationId: string; userId: string; status: NotificationStatus }>> {
  const { organizationId, scheduleId, reminderMinutes = 60 } = params;

  const schedule = await prisma.schedule.findFirst({
    where: {
      id: scheduleId,
      organizationId,
    },
    include: {
      course: true,
      teacher: true,
      classroom: true,
      attendances: {
        include: {
          student: {
            select: {
              id: true,
              realName: true,
              phone: true,
              studentProfile: true,
            },
          },
        },
      },
    },
  });

  if (!schedule) {
    throw new NotFoundError('课表不存在');
  }

  const results: Array<{ notificationId: string; userId: string; status: NotificationStatus }> = [];

  const reminderTime = `${reminderMinutes}分钟后`;
  const dateStr = schedule.date.toISOString().slice(0, 10);

  const teacherNotification = await createNotification({
    organizationId,
    userId: schedule.teacherId,
    type: NotificationType.SCHEDULE_REMINDER,
    title: '课程提醒',
    content: `您的课程「${schedule.course.name}」将于${reminderTime}开始。\n时间：${dateStr} ${schedule.startTime}-${schedule.endTime}\n教室：${schedule.classroom?.name || '待定'}`,
    scheduleId,
    metadata: {
      courseName: schedule.course.name,
      date: dateStr,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      classroom: schedule.classroom?.name,
      teacherName: schedule.teacher.realName,
      reminderMinutes,
    },
  });

  results.push({
    notificationId: teacherNotification.id,
    userId: schedule.teacherId,
    status: teacherNotification.status,
  });

  for (const attendance of schedule.attendances) {
    const studentNotification = await createNotification({
      organizationId,
      userId: attendance.studentId,
      type: NotificationType.SCHEDULE_REMINDER,
      title: '课程提醒',
      content: `您的课程「${schedule.course.name}」将于${reminderTime}开始。\n时间：${dateStr} ${schedule.startTime}-${schedule.endTime}\n老师：${schedule.teacher.realName}\n教室：${schedule.classroom?.name || '待定'}`,
      scheduleId,
      metadata: {
        courseName: schedule.course.name,
        date: dateStr,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        teacherName: schedule.teacher.realName,
        classroom: schedule.classroom?.name,
        studentName: attendance.student.realName,
        reminderMinutes,
      },
    });

    results.push({
      notificationId: studentNotification.id,
      userId: attendance.studentId,
      status: studentNotification.status,
    });

    if (attendance.student.studentProfile?.parentId) {
      const parentNotification = await createNotification({
        organizationId,
        userId: attendance.student.studentProfile.parentId,
        type: NotificationType.SCHEDULE_REMINDER,
        title: '孩子课程提醒',
        content: `您的孩子「${attendance.student.realName}」的课程「${schedule.course.name}」将于${reminderTime}开始。\n时间：${dateStr} ${schedule.startTime}-${schedule.endTime}\n老师：${schedule.teacher.realName}\n教室：${schedule.classroom?.name || '待定'}`,
        scheduleId,
        metadata: {
          courseName: schedule.course.name,
          date: dateStr,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          teacherName: schedule.teacher.realName,
          classroom: schedule.classroom?.name,
          studentName: attendance.student.realName,
          reminderMinutes,
        },
      });

      results.push({
        notificationId: parentNotification.id,
        userId: attendance.student.studentProfile.parentId,
        status: parentNotification.status,
      });
    }
  }

  logger.info('课前提醒发送完成', {
    scheduleId,
    organizationId,
    totalNotifications: results.length,
  });

  return results;
}

export async function createAttendanceNotice(
  organizationId: string,
  attendanceId: string
) {
  const attendance = await prisma.attendance.findFirst({
    where: {
      id: attendanceId,
      organizationId,
    },
    include: {
      student: {
        include: {
          studentProfile: true,
        },
      },
      schedule: {
        include: {
          course: true,
          teacher: true,
        },
      },
      consumption: true,
    },
  });

  if (!attendance) {
    throw new NotFoundError('考勤记录不存在');
  }

  const statusMap: Record<string, string> = {
    PRESENT: '已出勤',
    LATE: '迟到',
    LEAVE_EARLY: '早退',
    ABSENT: '缺勤',
    LEAVE: '请假',
    MAKEUP: '补课',
  };

  const dateStr = attendance.schedule.date.toISOString().slice(0, 10);
  const statusText = statusMap[attendance.status] || attendance.status;

  const results: Array<{ notificationId: string; userId: string }> = [];

  const studentNotification = await createNotification({
    organizationId,
    userId: attendance.studentId,
    type: NotificationType.ATTENDANCE_NOTICE,
    title: '考勤通知',
    content: `您的课程「${attendance.schedule.course.name}」考勤已记录。\n时间：${dateStr} ${attendance.schedule.startTime}-${attendance.schedule.endTime}\n状态：${statusText}\n${attendance.notes ? `备注：${attendance.notes}` : ''}`,
    scheduleId: attendance.scheduleId,
    metadata: {
      courseName: attendance.schedule.course.name,
      date: dateStr,
      startTime: attendance.schedule.startTime,
      endTime: attendance.schedule.endTime,
      teacherName: attendance.schedule.teacher.realName,
      status: attendance.status,
      statusText,
      notes: attendance.notes,
      hasConsumption: !!attendance.consumption,
      hoursConsumed: attendance.consumption?.hoursConsumed ? Number(attendance.consumption.hoursConsumed) : undefined,
    },
  });

  results.push({
    notificationId: studentNotification.id,
    userId: attendance.studentId,
  });

  if (attendance.student.studentProfile?.parentId) {
    const parentNotification = await createNotification({
      organizationId,
      userId: attendance.student.studentProfile.parentId,
      type: NotificationType.ATTENDANCE_NOTICE,
      title: '孩子考勤通知',
      content: `您的孩子「${attendance.student.realName}」的课程「${attendance.schedule.course.name}」考勤已记录。\n时间：${dateStr} ${attendance.schedule.startTime}-${attendance.schedule.endTime}\n状态：${statusText}\n${attendance.notes ? `备注：${attendance.notes}` : ''}`,
      scheduleId: attendance.scheduleId,
      metadata: {
        courseName: attendance.schedule.course.name,
        date: dateStr,
        startTime: attendance.schedule.startTime,
        endTime: attendance.schedule.endTime,
        teacherName: attendance.schedule.teacher.realName,
        studentName: attendance.student.realName,
        status: attendance.status,
        statusText,
        notes: attendance.notes,
        hasConsumption: !!attendance.consumption,
        hoursConsumed: attendance.consumption?.hoursConsumed?.toNumber(),
      },
    });

    results.push({
      notificationId: parentNotification.id,
      userId: attendance.student.studentProfile.parentId,
    });
  }

  logger.info('考勤通知发送完成', {
    attendanceId,
    organizationId,
    totalNotifications: results.length,
  });

  return results;
}

export async function createRenewalReminder(
  params: RenewalReminderParams
) {
  const { organizationId, enrollmentId, studentId, remainingHours, remainingDays } = params;

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      organizationId,
      studentId,
    },
    include: {
      student: {
        include: {
          studentProfile: true,
        },
      },
      course: true,
      coursePackage: true,
    },
  });

  if (!enrollment) {
    throw new NotFoundError('报名记录不存在');
  }

  const results: Array<{ notificationId: string; userId: string }> = [];

  let reason = '';
  if (remainingHours <= 5) {
    reason = `课时剩余不足（剩余 ${remainingHours} 课时）`;
  }
  if (remainingDays <= 14) {
    reason += reason ? '、' : '';
    reason += `有效期即将到期（剩余 ${remainingDays} 天）`;
  }

  const studentNotification = await createNotification({
    organizationId,
    userId: studentId,
    type: NotificationType.RENEWAL_REMINDER,
    title: '续费提醒',
    content: `您的课程「${enrollment.course.name}」${reason}，请及时续费。\n剩余课时：${remainingHours} 课时\n有效期至：${enrollment.endDate.toISOString().slice(0, 10)}`,
    metadata: {
      courseName: enrollment.course.name,
      packageName: enrollment.coursePackage?.name,
      remainingHours,
      remainingDays,
      totalHours: enrollment.totalHours,
      usedHours: enrollment.usedHours,
      endDate: enrollment.endDate.toISOString().slice(0, 10),
    },
  });

  results.push({
    notificationId: studentNotification.id,
    userId: studentId,
  });

  if (enrollment.student.studentProfile?.parentId) {
    const parentNotification = await createNotification({
      organizationId,
      userId: enrollment.student.studentProfile.parentId,
      type: NotificationType.RENEWAL_REMINDER,
      title: '孩子续费提醒',
      content: `您的孩子「${enrollment.student.realName}」的课程「${enrollment.course.name}」${reason}，请及时续费。\n剩余课时：${remainingHours} 课时\n有效期至：${enrollment.endDate.toISOString().slice(0, 10)}`,
      metadata: {
        courseName: enrollment.course.name,
        packageName: enrollment.coursePackage?.name,
        studentName: enrollment.student.realName,
        remainingHours,
        remainingDays,
        totalHours: enrollment.totalHours,
        usedHours: enrollment.usedHours,
        endDate: enrollment.endDate.toISOString().slice(0, 10),
      },
    });

    results.push({
      notificationId: parentNotification.id,
      userId: enrollment.student.studentProfile.parentId,
    });
  }

  logger.info('续费提醒发送完成', {
    enrollmentId,
    organizationId,
    totalNotifications: results.length,
  });

  return results;
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  const notification = await prisma.notification.update({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      status: NotificationStatus.READ,
      readAt: new Date(),
    },
  });

  logger.info('通知已标记为已读', { notificationId, userId });

  return notification;
}

export async function getUserNotifications(
  userId: string,
  organizationId: string,
  options: {
    status?: NotificationStatus;
    type?: NotificationType;
    page?: number;
    pageSize?: number;
    unreadFirst?: boolean;
  } = {}
) {
  const {
    status,
    type,
    page = 1,
    pageSize = 20,
    unreadFirst = true,
  } = options;

  const where: Record<string, unknown> = {
    userId,
    organizationId,
  };

  if (status) {
    where.status = status;
  }

  if (type) {
    where.type = type;
  }

  const total = await prisma.notification.count({ where });

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: unreadFirst
      ? [
          { status: 'asc' },
          { createdAt: 'desc' },
        ]
      : [{ createdAt: 'desc' }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      schedule: {
        include: {
          course: true,
          teacher: true,
          classroom: true,
        },
      },
    },
  });

  const unreadCount = await prisma.notification.count({
    where: {
      userId,
      organizationId,
      status: NotificationStatus.PENDING,
    },
  });

  return {
    notifications,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    unreadCount,
  };
}

export class NotificationEngine {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createNotification(params: NotificationCreateParams) {
    return createNotification(params);
  }

  async createScheduleReminder(params: ReminderParams) {
    return createScheduleReminder(params);
  }

  async createAttendanceNotice(organizationId: string, attendanceId: string) {
    return createAttendanceNotice(organizationId, attendanceId);
  }

  async createRenewalReminder(params: RenewalReminderParams) {
    return createRenewalReminder(params);
  }

  async markAsRead(notificationId: string, userId: string) {
    return markNotificationAsRead(notificationId, userId);
  }

  async getUserNotifications(
    userId: string,
    organizationId: string,
    options?: Parameters<typeof getUserNotifications>[2]
  ) {
    return getUserNotifications(userId, organizationId, options);
  }
}

export const notificationEngine = new NotificationEngine();

export default {
  createNotification,
  createScheduleReminder,
  createAttendanceNotice,
  createRenewalReminder,
  markNotificationAsRead,
  getUserNotifications,
  NotificationEngine,
  notificationEngine,
};
