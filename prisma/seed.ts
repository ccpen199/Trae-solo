import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addMonths, subDays } from 'date-fns';

const prisma = new PrismaClient();

const UserRole = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
};

const CourseType = {
  ONE_ON_ONE: 'ONE_ON_ONE',
  SMALL_GROUP: 'SMALL_GROUP',
  LARGE_CLASS: 'LARGE_CLASS',
};

const ScheduleStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED',
  CANCELLED: 'CANCELLED',
};

const AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  LEAVE: 'LEAVE',
};

const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
};

async function main() {
  console.log('开始种子数据初始化...');

  const saltRounds = 10;
  const defaultPassword = '123456';
  const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

  const organization = await prisma.organization.upsert({
    where: { id: 'org-001' },
    update: {},
    create: {
      id: 'org-001',
      name: '阳光教育培训中心',
      contactName: '张校长',
      contactPhone: '13800138000',
      address: '北京市朝阳区教育路88号',
      description: '专注于K12教育培训的专业机构',
    },
  });

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: 'user-admin-001',
      organizationId: organization.id,
      username: 'admin',
      passwordHash: passwordHash,
      realName: '系统管理员',
      phone: '13900139000',
      email: 'admin@sunedu.com',
      role: UserRole.ADMIN,
    },
  });

  const teacher1 = await prisma.user.upsert({
    where: { username: 'teacher01' },
    update: {},
    create: {
      id: 'user-teacher-001',
      organizationId: organization.id,
      username: 'teacher01',
      passwordHash: passwordHash,
      realName: '李老师',
      phone: '13900139001',
      email: 'lilaoshi@sunedu.com',
      role: UserRole.TEACHER,
      teacherProfile: {
        create: {
          teacherNo: 'T2024001',
          subjects: JSON.stringify(['数学', '物理']),
          certifications: JSON.stringify(['高级数学教师', '物理竞赛指导师']),
          description: '10年教学经验，擅长初高中数学',
        },
      },
    },
    include: { teacherProfile: true },
  });

  const teacher2 = await prisma.user.upsert({
    where: { username: 'teacher02' },
    update: {},
    create: {
      id: 'user-teacher-002',
      organizationId: organization.id,
      username: 'teacher02',
      passwordHash: passwordHash,
      realName: '王老师',
      phone: '13900139002',
      email: 'wanglaoshi@sunedu.com',
      role: UserRole.TEACHER,
      teacherProfile: {
        create: {
          teacherNo: 'T2024002',
          subjects: JSON.stringify(['英语']),
          certifications: JSON.stringify(['专业八级', '雅思培训师']),
          description: '海归硕士，英语教学专家',
        },
      },
    },
    include: { teacherProfile: true },
  });

  const parent1 = await prisma.user.upsert({
    where: { username: 'parent01' },
    update: {},
    create: {
      id: 'user-parent-001',
      organizationId: organization.id,
      username: 'parent01',
      passwordHash: passwordHash,
      realName: '陈妈妈',
      phone: '13900139101',
      email: 'chenmama@example.com',
      role: UserRole.PARENT,
      parentProfile: {
        create: {
          relation: '母亲',
        },
      },
    },
  });

  const student1 = await prisma.user.upsert({
    where: { username: 'student01' },
    update: {},
    create: {
      id: 'user-student-001',
      organizationId: organization.id,
      username: 'student01',
      passwordHash: passwordHash,
      realName: '陈小明',
      phone: '13900139201',
      email: 'chenxiaoming@example.com',
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          studentNo: 'S2024001',
          grade: '高一',
          school: '北京第一中学',
        },
      },
    },
  });

  const student2 = await prisma.user.upsert({
    where: { username: 'student02' },
    update: {},
    create: {
      id: 'user-student-002',
      organizationId: organization.id,
      username: 'student02',
      passwordHash: passwordHash,
      realName: '张小华',
      phone: '13900139202',
      email: 'zhangxiaohua@example.com',
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          studentNo: 'S2024002',
          grade: '高二',
          school: '北京第二中学',
        },
      },
    },
  });

  const classroom1 = await prisma.classroom.upsert({
    where: { id: 'classroom-001' },
    update: {},
    create: {
      id: 'classroom-001',
      organizationId: organization.id,
      name: '多媒体教室A',
      capacity: 20,
      equipment: JSON.stringify(['投影仪', '白板', '音响系统']),
      description: '主教学区，设备齐全',
    },
  });

  const classroom2 = await prisma.classroom.upsert({
    where: { id: 'classroom-002' },
    update: {},
    create: {
      id: 'classroom-002',
      organizationId: organization.id,
      name: '一对一辅导室B',
      capacity: 2,
      equipment: JSON.stringify(['白板']),
      description: '小型辅导室，适合一对一教学',
    },
  });

  const course1 = await prisma.course.upsert({
    where: { id: 'course-001' },
    update: {},
    create: {
      id: 'course-001',
      organizationId: organization.id,
      name: '高中数学精品班',
      type: CourseType.SMALL_GROUP,
      subject: '数学',
      description: '针对高中数学知识点的系统性辅导',
      defaultDuration: 90,
      defaultPrice: 200,
      maxStudents: 15,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { id: 'course-002' },
    update: {},
    create: {
      id: 'course-002',
      organizationId: organization.id,
      name: '雅思听力冲刺班',
      type: CourseType.LARGE_CLASS,
      subject: '英语',
      description: '雅思考试听力专项训练',
      defaultDuration: 120,
      defaultPrice: 300,
      maxStudents: 30,
    },
  });

  const coursePackage1 = await prisma.coursePackage.upsert({
    where: { id: 'package-001' },
    update: {},
    create: {
      id: 'package-001',
      courseId: course1.id,
      name: '数学40课时包',
      totalHours: 40,
      price: 7200,
      validMonths: 12,
      description: '购买40课时享受9折优惠',
    },
  });

  const coursePackage2 = await prisma.coursePackage.upsert({
    where: { id: 'package-002' },
    update: {},
    create: {
      id: 'package-002',
      courseId: course2.id,
      name: '雅思20课时包',
      totalHours: 20,
      price: 5400,
      validMonths: 6,
      description: '雅思听力专项训练包',
    },
  });

  const enrollment1 = await prisma.enrollment.upsert({
    where: { id: 'enrollment-001' },
    update: {},
    create: {
      id: 'enrollment-001',
      organizationId: organization.id,
      studentId: student1.id,
      courseId: course1.id,
      coursePackageId: coursePackage1.id,
      totalHours: 40,
      remainingHours: 35,
      usedHours: 5,
      startDate: subDays(today, 30),
      endDate: addMonths(today, 11),
      status: 'ACTIVE',
    },
    include: {
      student: true,
      course: true,
    },
  });

  const enrollment2 = await prisma.enrollment.upsert({
    where: { id: 'enrollment-002' },
    update: {},
    create: {
      id: 'enrollment-002',
      organizationId: organization.id,
      studentId: student2.id,
      courseId: course2.id,
      coursePackageId: coursePackage2.id,
      totalHours: 20,
      remainingHours: 18,
      usedHours: 2,
      startDate: subDays(today, 15),
      endDate: addMonths(today, 5),
      status: 'ACTIVE',
    },
    include: {
      student: true,
      course: true,
    },
  });

  const payment1 = await prisma.payment.upsert({
    where: { id: 'payment-001' },
    update: {},
    create: {
      id: 'payment-001',
      organizationId: organization.id,
      enrollmentId: enrollment1.id,
      studentId: student1.id,
      amount: 7200,
      paidAmount: 7200,
      discount: 0,
      paymentMethod: '微信',
      status: PaymentStatus.PAID,
      paidAt: subDays(today, 30),
      notes: '数学40课时包购买',
    },
  });

  const payment2 = await prisma.payment.upsert({
    where: { id: 'payment-002' },
    update: {},
    create: {
      id: 'payment-002',
      organizationId: organization.id,
      enrollmentId: enrollment2.id,
      studentId: student2.id,
      amount: 5400,
      paidAmount: 5400,
      discount: 0,
      paymentMethod: '支付宝',
      status: PaymentStatus.PAID,
      paidAt: subDays(today, 15),
      notes: '雅思20课时包购买',
    },
  });

  const schedule1 = await prisma.schedule.upsert({
    where: { id: 'schedule-001' },
    update: {},
    create: {
      id: 'schedule-001',
      organizationId: organization.id,
      courseId: course1.id,
      teacherId: teacher1.id,
      classroomId: classroom1.id,
      date: yesterday,
      startTime: '09:00',
      endTime: '10:30',
      duration: 90,
      status: ScheduleStatus.FINISHED,
      maxStudents: 15,
      actualStudents: 1,
      notes: '高中数学函数专题',
    },
    include: {
      course: true,
      teacher: true,
      classroom: true,
    },
  });

  const schedule2 = await prisma.schedule.upsert({
    where: { id: 'schedule-002' },
    update: {},
    create: {
      id: 'schedule-002',
      organizationId: organization.id,
      courseId: course2.id,
      teacherId: teacher2.id,
      classroomId: classroom1.id,
      date: yesterday,
      startTime: '14:00',
      endTime: '16:00',
      duration: 120,
      status: ScheduleStatus.FINISHED,
      maxStudents: 30,
      actualStudents: 1,
      notes: '雅思听力场景词汇训练',
    },
    include: {
      course: true,
      teacher: true,
      classroom: true,
    },
  });

  const schedule3 = await prisma.schedule.upsert({
    where: { id: 'schedule-003' },
    update: {},
    create: {
      id: 'schedule-003',
      organizationId: organization.id,
      courseId: course1.id,
      teacherId: teacher1.id,
      classroomId: classroom1.id,
      date: tomorrow,
      startTime: '09:00',
      endTime: '10:30',
      duration: 90,
      status: ScheduleStatus.CONFIRMED,
      maxStudents: 15,
      actualStudents: 0,
      notes: '高中数学导数专题',
    },
    include: {
      course: true,
      teacher: true,
      classroom: true,
    },
  });

  const schedule4 = await prisma.schedule.upsert({
    where: { id: 'schedule-004' },
    update: {},
    create: {
      id: 'schedule-004',
      organizationId: organization.id,
      courseId: course2.id,
      teacherId: teacher2.id,
      classroomId: classroom2.id,
      date: tomorrow,
      startTime: '14:00',
      endTime: '16:00',
      duration: 120,
      status: ScheduleStatus.CONFIRMED,
      maxStudents: 2,
      actualStudents: 0,
      notes: '雅思一对一听力辅导',
    },
    include: {
      course: true,
      teacher: true,
      classroom: true,
    },
  });

  const schedule5 = await prisma.schedule.upsert({
    where: { id: 'schedule-005' },
    update: {},
    create: {
      id: 'schedule-005',
      organizationId: organization.id,
      courseId: course1.id,
      teacherId: teacher1.id,
      classroomId: classroom1.id,
      date: dayBeforeYesterday,
      startTime: '09:00',
      endTime: '10:30',
      duration: 90,
      status: ScheduleStatus.FINISHED,
      maxStudents: 15,
      actualStudents: 1,
      notes: '高中数学三角函数专题',
    },
    include: {
      course: true,
      teacher: true,
      classroom: true,
    },
  });

  const schedule6 = await prisma.schedule.upsert({
    where: { id: 'schedule-006' },
    update: {},
    create: {
      id: 'schedule-006',
      organizationId: organization.id,
      courseId: course2.id,
      teacherId: teacher2.id,
      classroomId: classroom1.id,
      date: dayBeforeYesterday,
      startTime: '14:00',
      endTime: '16:00',
      duration: 120,
      status: ScheduleStatus.FINISHED,
      maxStudents: 30,
      actualStudents: 1,
      notes: '雅思听力技巧训练',
    },
    include: {
      course: true,
      teacher: true,
      classroom: true,
    },
  });

  const attendance1 = await prisma.attendance.upsert({
    where: { id: 'attendance-001' },
    update: {},
    create: {
      id: 'attendance-001',
      organizationId: organization.id,
      scheduleId: schedule1.id,
      studentId: student1.id,
      enrollmentId: enrollment1.id,
      status: AttendanceStatus.PRESENT,
      checkInTime: new Date(yesterday.setHours(9, 0, 0, 0)),
      notes: '正常出勤',
    },
    include: {
      schedule: true,
      student: true,
      enrollment: true,
    },
  });

  const attendance2 = await prisma.attendance.upsert({
    where: { id: 'attendance-002' },
    update: {},
    create: {
      id: 'attendance-002',
      organizationId: organization.id,
      scheduleId: schedule2.id,
      studentId: student2.id,
      enrollmentId: enrollment2.id,
      status: AttendanceStatus.PRESENT,
      checkInTime: new Date(yesterday.setHours(14, 0, 0, 0)),
      notes: '正常出勤',
    },
    include: {
      schedule: true,
      student: true,
      enrollment: true,
    },
  });

  const attendance3 = await prisma.attendance.upsert({
    where: { id: 'attendance-003' },
    update: {},
    create: {
      id: 'attendance-003',
      organizationId: organization.id,
      scheduleId: schedule5.id,
      studentId: student1.id,
      enrollmentId: enrollment1.id,
      status: AttendanceStatus.PRESENT,
      checkInTime: new Date(dayBeforeYesterday.setHours(9, 0, 0, 0)),
      notes: '正常出勤',
    },
    include: {
      schedule: true,
      student: true,
      enrollment: true,
    },
  });

  const attendance4 = await prisma.attendance.upsert({
    where: { id: 'attendance-004' },
    update: {},
    create: {
      id: 'attendance-004',
      organizationId: organization.id,
      scheduleId: schedule6.id,
      studentId: student2.id,
      enrollmentId: enrollment2.id,
      status: AttendanceStatus.LATE,
      checkInTime: new Date(dayBeforeYesterday.setHours(14, 15, 0, 0)),
      notes: '迟到15分钟',
    },
    include: {
      schedule: true,
      student: true,
      enrollment: true,
    },
  });

  const consumption1 = await prisma.consumption.upsert({
    where: { id: 'consumption-001' },
    update: {},
    create: {
      id: 'consumption-001',
      organizationId: organization.id,
      attendanceId: attendance1.id,
      enrollmentId: enrollment1.id,
      studentId: student1.id,
      scheduleId: schedule1.id,
      hoursConsumed: 1.5,
      pricePerHour: 180,
      totalAmount: 270,
      notes: '高中数学函数专题课消',
      consumedAt: new Date(yesterday.setHours(10, 30, 0, 0)),
    },
  });

  const consumption2 = await prisma.consumption.upsert({
    where: { id: 'consumption-002' },
    update: {},
    create: {
      id: 'consumption-002',
      organizationId: organization.id,
      attendanceId: attendance2.id,
      enrollmentId: enrollment2.id,
      studentId: student2.id,
      scheduleId: schedule2.id,
      hoursConsumed: 2,
      pricePerHour: 270,
      totalAmount: 540,
      notes: '雅思听力场景词汇训练课消',
      consumedAt: new Date(yesterday.setHours(16, 0, 0, 0)),
    },
  });

  const consumption3 = await prisma.consumption.upsert({
    where: { id: 'consumption-003' },
    update: {},
    create: {
      id: 'consumption-003',
      organizationId: organization.id,
      attendanceId: attendance3.id,
      enrollmentId: enrollment1.id,
      studentId: student1.id,
      scheduleId: schedule5.id,
      hoursConsumed: 1.5,
      pricePerHour: 180,
      totalAmount: 270,
      notes: '高中数学三角函数专题课消',
      consumedAt: new Date(dayBeforeYesterday.setHours(10, 30, 0, 0)),
    },
  });

  const consumption4 = await prisma.consumption.upsert({
    where: { id: 'consumption-004' },
    update: {},
    create: {
      id: 'consumption-004',
      organizationId: organization.id,
      attendanceId: attendance4.id,
      enrollmentId: enrollment2.id,
      studentId: student2.id,
      scheduleId: schedule6.id,
      hoursConsumed: 2,
      pricePerHour: 270,
      totalAmount: 540,
      notes: '雅思听力技巧训练课消（迟到）',
      consumedAt: new Date(dayBeforeYesterday.setHours(16, 0, 0, 0)),
    },
  });

  await prisma.enrollment.update({
    where: { id: enrollment1.id },
    data: {
      remainingHours: 35,
      usedHours: 5,
    },
  });

  await prisma.enrollment.update({
    where: { id: enrollment2.id },
    data: {
      remainingHours: 18,
      usedHours: 2,
    },
  });

  console.log('========================================');
  console.log('✅ 种子数据初始化完成！');
  console.log('========================================');
  console.log('');
  console.log('【组织机构】');
  console.log(`  - ${organization.name}`);
  console.log('');
  console.log('【默认账号信息】');
  console.log(`  - 管理员: admin / 123456 (${admin.realName})`);
  console.log(`  - 教师1: teacher01 / 123456 (${teacher1.realName} - 数学/物理)`);
  console.log(`  - 教师2: teacher02 / 123456 (${teacher2.realName} - 英语)`);
  console.log(`  - 家长: parent01 / 123456 (${parent1.realName})`);
  console.log(`  - 学生1: student01 / 123456 (${student1.realName} - 高一)`);
  console.log(`  - 学生2: student02 / 123456 (${student2.realName} - 高二)`);
  console.log('');
  console.log('【课程信息】');
  console.log(`  - ${course1.name} (${course1.subject})`);
  console.log(`  - ${course2.name} (${course2.subject})`);
  console.log('');
  console.log('【课表安排】');
  console.log(`  - 已完成: 4节 (昨天2节, 前天2节)`);
  console.log(`  - 已确认: 2节 (明天2节)`);
  console.log(`  - 李老师课表: ${schedule1.dateStr || schedule1.date.toISOString().slice(0, 10)} ${schedule1.startTime}-${schedule1.endTime} - ${schedule1.course.name}`);
  console.log(`  - 王老师课表: ${schedule2.dateStr || schedule2.date.toISOString().slice(0, 10)} ${schedule2.startTime}-${schedule2.endTime} - ${schedule2.course.name}`);
  console.log('');
  console.log('【报名记录】');
  console.log(`  - ${student1.realName} -> ${course1.name}: 40课时, 剩余35课时`);
  console.log(`  - ${student2.realName} -> ${course2.name}: 20课时, 剩余18课时`);
  console.log('');
  console.log('【考勤记录】');
  console.log(`  - 共4条考勤记录`);
  console.log(`  - 出勤: 3人`);
  console.log(`  - 迟到: 1人`);
  console.log('');
  console.log('【课消记录】');
  console.log(`  - 共4条课消记录`);
  console.log(`  - 总课消金额: ¥${(270 + 540 + 270 + 540).toFixed(2)}`);
  console.log('');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
