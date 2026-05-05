const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: 'ADMIN',
      email: 'admin@department.edu',
      department: '计算机学院'
    }
  });

  const admin2 = await prisma.user.upsert({
    where: { username: 'admin2' },
    update: {},
    create: {
      username: 'admin2',
      password: hashedPassword,
      name: '教务主任',
      role: 'ADMIN',
      email: 'admin2@department.edu',
      department: '计算机学院'
    }
  });

  const teacher = await prisma.user.upsert({
    where: { username: 'teacher' },
    update: {},
    create: {
      username: 'teacher',
      password: hashedPassword,
      name: '张老师',
      role: 'TEACHER',
      email: 'teacher@department.edu',
      department: '计算机学院'
    }
  });

  const teacher2 = await prisma.user.upsert({
    where: { username: 'teacher2' },
    update: {},
    create: {
      username: 'teacher2',
      password: hashedPassword,
      name: '李老师',
      role: 'TEACHER',
      email: 'teacher2@department.edu',
      department: '计算机学院'
    }
  });

  const teacher3 = await prisma.user.upsert({
    where: { username: 'teacher3' },
    update: {},
    create: {
      username: 'teacher3',
      password: hashedPassword,
      name: '王老师',
      role: 'TEACHER',
      email: 'teacher3@department.edu',
      department: '计算机学院'
    }
  });

  const monitor = await prisma.user.upsert({
    where: { username: 'monitor' },
    update: {},
    create: {
      username: 'monitor',
      password: hashedPassword,
      name: '李班长',
      role: 'CLASS_MONITOR',
      studentId: '2021001',
      email: 'monitor@department.edu',
      department: '计算机学院',
      classId: 'CS2021-01'
    }
  });

  const monitor2 = await prisma.user.upsert({
    where: { username: 'monitor2' },
    update: {},
    create: {
      username: 'monitor2',
      password: hashedPassword,
      name: '赵班长',
      role: 'CLASS_MONITOR',
      studentId: '2021009',
      email: 'monitor2@department.edu',
      department: '计算机学院',
      classId: 'CS2021-02'
    }
  });

  const student = await prisma.user.upsert({
    where: { username: 'student' },
    update: {},
    create: {
      username: 'student',
      password: hashedPassword,
      name: '王同学',
      role: 'STUDENT',
      studentId: '2021002',
      email: 'student@department.edu',
      department: '计算机学院',
      classId: 'CS2021-01'
    }
  });

  const student2 = await prisma.user.upsert({
    where: { username: 'student2' },
    update: {},
    create: {
      username: 'student2',
      password: hashedPassword,
      name: '孙同学',
      role: 'STUDENT',
      studentId: '2021003',
      email: 'student2@department.edu',
      department: '计算机学院',
      classId: 'CS2021-01'
    }
  });

  const student3 = await prisma.user.upsert({
    where: { username: 'student3' },
    update: {},
    create: {
      username: 'student3',
      password: hashedPassword,
      name: '周同学',
      role: 'STUDENT',
      studentId: '2021010',
      email: 'student3@department.edu',
      department: '计算机学院',
      classId: 'CS2021-02'
    }
  });

  await prisma.announcement.upsert({
    where: { id: 'ann1' },
    update: {},
    create: {
      id: 'ann1',
      title: '关于2024年春季学期开学的通知',
      content: '各位同学：2024年春季学期将于2月26日正式开学，请各位同学提前做好返校准备。如有特殊情况不能按时返校，请提前向辅导员请假。',
      type: 'DEPARTMENT',
      authorId: admin.id,
      isPinned: true,
      isPublished: true
    }
  });

  await prisma.announcement.upsert({
    where: { id: 'ann2' },
    update: {},
    create: {
      id: 'ann2',
      title: 'CS2021-01班班会通知',
      content: '各位同学：本周三下午16:00在教学楼A301召开班会，请准时参加。会议内容：新学期学习计划、综合测评说明等。',
      type: 'CLASS',
      authorId: monitor.id,
      targetClass: 'CS2021-01',
      isPublished: true
    }
  });

  await prisma.announcement.upsert({
    where: { id: 'ann3' },
    update: {},
    create: {
      id: 'ann3',
      title: '综合测评提交提醒',
      content: '各位同学：2023-2024学年第一学期综合测评材料提交截止日期为3月15日，请各位同学及时提交相关证明材料。',
      type: 'REMINDER',
      authorId: teacher.id,
      isPublished: true
    }
  });

  console.log('数据库种子数据已创建');
  console.log('\n管理员账号:');
  console.log('  - admin / 123456（系统管理员）');
  console.log('  - admin2 / 123456（教务主任）');
  console.log('\n教师账号:');
  console.log('  - teacher / 123456（张老师）');
  console.log('  - teacher2 / 123456（李老师）');
  console.log('  - teacher3 / 123456（王老师）');
  console.log('\n班长账号:');
  console.log('  - monitor / 123456（李班长 - CS2021-01班）');
  console.log('  - monitor2 / 123456（赵班长 - CS2021-02班）');
  console.log('\n学生账号:');
  console.log('  - student / 123456（王同学 - CS2021-01班）');
  console.log('  - student2 / 123456（孙同学 - CS2021-01班）');
  console.log('  - student3 / 123456（周同学 - CS2021-02班）');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
