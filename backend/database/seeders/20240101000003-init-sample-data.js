'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. 添加系别
    const departments = [
      { code: 'CS', name: '计算机科学系', head: '王主任', description: '计算机科学与技术相关专业', status: true, createdAt: new Date(), updatedAt: new Date() },
      { code: 'EE', name: '电子工程系', head: '赵主任', description: '电子信息工程相关专业', status: true, createdAt: new Date(), updatedAt: new Date() },
      { code: 'MA', name: '数学系', head: '孙主任', description: '数学与应用数学相关专业', status: true, createdAt: new Date(), updatedAt: new Date() }
    ];
    await queryInterface.bulkInsert('departments', departments, {});

    // 2. 添加班级
    const classes = [
      { code: 'CS202101', name: '计算机科学2021级1班', departmentId: 1, grade: 2021, monitor: '张三', status: true, createdAt: new Date(), updatedAt: new Date() },
      { code: 'CS202102', name: '计算机科学2021级2班', departmentId: 1, grade: 2021, monitor: '李四', status: true, createdAt: new Date(), updatedAt: new Date() },
      { code: 'CS202201', name: '计算机科学2022级1班', departmentId: 1, grade: 2022, monitor: '王五', status: true, createdAt: new Date(), updatedAt: new Date() },
      { code: 'EE202101', name: '电子工程2021级1班', departmentId: 2, grade: 2021, monitor: '赵六', status: true, createdAt: new Date(), updatedAt: new Date() }
    ];
    await queryInterface.bulkInsert('classes', classes, {});

    // 3. 添加课程
    const courses = [
      { code: 'CS101', name: '程序设计基础', departmentId: 1, teacherId: 3, credits: 4.0, hours: 64, term: '2023-2024-1', status: true, createdAt: new Date(), updatedAt: new Date() },
      { code: 'CS102', name: '数据结构与算法', departmentId: 1, teacherId: 3, credits: 4.0, hours: 64, term: '2023-2024-2', status: true, createdAt: new Date(), updatedAt: new Date() },
      { code: 'CS201', name: '操作系统', departmentId: 1, teacherId: 4, credits: 3.0, hours: 48, term: '2023-2024-1', status: true, createdAt: new Date(), updatedAt: new Date() },
      { code: 'MA101', name: '高等数学', departmentId: 3, teacherId: 3, credits: 5.0, hours: 80, term: '2023-2024-1', status: true, createdAt: new Date(), updatedAt: new Date() },
      { code: 'EE101', name: '电路原理', departmentId: 2, teacherId: 4, credits: 3.0, hours: 48, term: '2023-2024-1', status: true, createdAt: new Date(), updatedAt: new Date() }
    ];
    await queryInterface.bulkInsert('courses', courses, {});

    // 4. 生成哈希密码用于学生
    const hashedPassword = await bcrypt.hash('123456', 10);

    // 5. 添加学生用户和学生信息
    const studentUsers = [];
    const students = [];
    
    const studentNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二'];
    
    for (let i = 0; i < 10; i++) {
      const studentNo = `202100${String(i + 1).padStart(3, '0')}`;
      studentUsers.push({
        username: studentNo,
        password: hashedPassword,
        name: studentNames[i],
        gender: i % 2 === 0 ? '男' : '女',
        phone: `13800${String(10001 + i).padStart(5, '0')}`,
        email: `student${i + 1}@school.edu`,
        roleId: 4,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    await queryInterface.bulkInsert('users', studentUsers, {});

    // 获取刚插入的用户ID
    const [results] = await queryInterface.sequelize.query(
      `SELECT id, username FROM users WHERE "roleId" = 4 ORDER BY id`
    );

    for (let i = 0; i < results.length && i < 10; i++) {
      const user = results[i];
      const classId = i < 5 ? 1 : 2;
      students.push({
        studentNo: user.username,
        userId: user.id,
        classId: classId,
        name: studentNames[i],
        gender: i % 2 === 0 ? '男' : '女',
        idCard: `11010120030${String(10 + i).padStart(2, '0')}${String(1000 + i).padStart(4, '0')}`,
        birthDate: `2003-0${1 + (i % 9)}-${10 + i}`,
        address: `北京市海淀区第${i + 1}小区`,
        phone: `13800${String(10001 + i).padStart(5, '0')}`,
        email: `student${i + 1}@school.edu`,
        enrollmentDate: '2021-09-01',
        status: '在读',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('students', students, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('students', null, {});
    await queryInterface.bulkDelete('users', { roleId: 4 }, {});
    await queryInterface.bulkDelete('courses', null, {});
    await queryInterface.bulkDelete('classes', null, {});
    await queryInterface.bulkDelete('departments', null, {});
  }
};
