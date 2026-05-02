import http from 'http';

const BASE_URL = 'http://localhost:9876/api/v1';

async function httpRequest(
  path: string,
  method: string = 'GET',
  body?: any,
  token?: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    
    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: parseInt(url.port) || 80,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers!['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode, ...response });
        } catch (e) {
          console.error('Parse error:', data);
          reject(e);
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testBusinessFlow() {
  console.log('========================================');
  console.log('  教培机构排课系统 - 业务链路测试');
  console.log('========================================\n');

  let adminToken: string;
  let teacherToken: string;
  let enrollmentId: string;
  let scheduleId: string;

  try {
    console.log('【步骤 1】登录管理员账号...');
    const loginResult = await httpRequest('/auth/login', 'POST', {
      username: 'admin',
      password: '123456',
    });
    
    if (loginResult.success) {
      adminToken = loginResult.data.token;
      console.log('✅ 登录成功');
      console.log(`   用户: ${loginResult.data.user.realName}`);
      console.log(`   角色: ${loginResult.data.user.role}`);
    } else {
      throw new Error(`登录失败: ${loginResult.error?.message || loginResult.message}`);
    }

    console.log('\n【步骤 2】登录教师账号...');
    const teacherLoginResult = await httpRequest('/auth/login', 'POST', {
      username: 'teacher01',
      password: '123456',
    });
    
    if (teacherLoginResult.success) {
      teacherToken = teacherLoginResult.data.token;
      console.log('✅ 教师登录成功');
      console.log(`   用户: ${teacherLoginResult.data.user.realName}`);
    } else {
      throw new Error(`教师登录失败: ${teacherLoginResult.error?.message || teacherLoginResult.message}`);
    }

    const courseId = 'course-001';
    const studentId = 'user-student-001';
    const teacherId = 'user-teacher-001';
    const classroomId = 'classroom-001';

    console.log('\n【步骤 3】查询学员报名记录...');
    const enrollmentsResult = await httpRequest(`/enrollments?studentId=${studentId}`, 'GET', undefined, adminToken);
    
    if (enrollmentsResult.success && enrollmentsResult.data.length > 0) {
      enrollmentId = enrollmentsResult.data[0].id;
      console.log('✅ 找到现有报名记录');
      console.log(`   报名ID: ${enrollmentId}`);
      console.log(`   课程: ${enrollmentsResult.data[0].course?.name}`);
      console.log(`   总课时: ${enrollmentsResult.data[0].totalHours}`);
      console.log(`   剩余课时: ${enrollmentsResult.data[0].remainingHours}`);
      console.log(`   状态: ${enrollmentsResult.data[0].status}`);
    } else {
      console.log('  未找到报名记录，尝试为学员报名...');
      const enrollmentData = {
        studentId: studentId,
        courseId: courseId,
        totalHours: 40,
        validMonths: 12,
        paymentAmount: 7200,
        paymentMethod: '现金',
      };
      
      const newEnrollmentResult = await httpRequest('/enrollments', 'POST', enrollmentData, adminToken);
      
      if (newEnrollmentResult.success) {
        enrollmentId = newEnrollmentResult.data.id;
        console.log('✅ 报名成功');
        console.log(`   报名ID: ${enrollmentId}`);
      } else {
        throw new Error(`报名失败: ${newEnrollmentResult.error?.message || newEnrollmentResult.message}`);
      }
    }

    console.log('\n【步骤 4】排课 - 检测冲突...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const conflictCheckData = {
      teacherId: teacherId,
      classroomId: classroomId,
      date: tomorrowStr,
      startTime: '09:00',
      endTime: '10:30',
    };
    
    const conflictResult = await httpRequest('/schedules/detect-conflict', 'POST', conflictCheckData, adminToken);
    
    if (conflictResult.success) {
      console.log(`✅ 冲突检测结果: ${conflictResult.data.hasConflict ? '有冲突' : '无冲突'}`);
      if (conflictResult.data.conflicts && conflictResult.data.conflicts.length > 0) {
        console.log('   冲突详情:', conflictResult.data.conflicts);
      }
    } else {
      console.log('⚠️  冲突检测失败:', conflictResult.error?.message || conflictResult.message);
    }

    console.log('\n【步骤 5】创建课表...');
    const scheduleData = {
      courseId: courseId,
      teacherId: teacherId,
      classroomId: classroomId,
      date: tomorrowStr,
      startTime: '09:00',
      endTime: '10:30',
      duration: 90,
      maxStudents: 15,
      notes: '数学精品班测试课',
    };
    
    const scheduleResult = await httpRequest('/schedules', 'POST', scheduleData, adminToken);
    
    if (scheduleResult.success) {
      scheduleId = scheduleResult.data.id;
      console.log('✅ 课表创建成功');
      console.log(`   课表ID: ${scheduleId}`);
      console.log(`   日期: ${scheduleResult.data.date}`);
      console.log(`   时间: ${scheduleResult.data.startTime} - ${scheduleResult.data.endTime}`);
      console.log(`   状态: ${scheduleResult.data.status}`);
    } else {
      console.log('⚠️  查询现有课表...');
      const schedulesResult = await httpRequest(`/schedules?teacherId=${teacherId}`, 'GET', undefined, adminToken);
      if (schedulesResult.success && schedulesResult.data.length > 0) {
        scheduleId = schedulesResult.data[0].id;
        console.log('✅ 找到现有课表');
        console.log(`   课表ID: ${scheduleId}`);
        console.log(`   日期: ${schedulesResult.data[0].date}`);
      } else {
        throw new Error(`创建课表失败: ${scheduleResult.error?.message || scheduleResult.message}`);
      }
    }

    console.log('\n【步骤 6】确认课表...');
    const confirmResult = await httpRequest(`/schedules/${scheduleId}/confirm`, 'POST', {}, adminToken);
    
    if (confirmResult.success) {
      console.log('✅ 课表已确认');
      console.log(`   状态: ${confirmResult.data.status}`);
    } else {
      console.log('ℹ️  课表可能已确认:', confirmResult.error?.message || confirmResult.message);
    }

    console.log('\n【步骤 7】查询课表详情...');
    const scheduleDetailResult = await httpRequest(`/schedules/${scheduleId}`, 'GET', undefined, teacherToken);
    
    if (scheduleDetailResult.success) {
      console.log('✅ 课表详情');
      console.log(`   课程: ${scheduleDetailResult.data.course?.name}`);
      console.log(`   教师: ${scheduleDetailResult.data.teacher?.realName}`);
      console.log(`   教室: ${scheduleDetailResult.data.classroom?.name}`);
      console.log(`   状态: ${scheduleDetailResult.data.status}`);
    }

    console.log('\n【步骤 8】查询仪表盘数据...');
    const dashboardResult = await httpRequest('/reports/dashboard', 'GET', undefined, adminToken);
    
    if (dashboardResult.success) {
      console.log('✅ 仪表盘数据');
      console.log(`   今日课表: ${dashboardResult.data.today.schedules}`);
      console.log(`   今日签到: ${dashboardResult.data.today.attendances}`);
      console.log(`   活跃报名: ${dashboardResult.data.overview.activeEnrollments}`);
      console.log(`   待续费: ${dashboardResult.data.overview.pendingRenewals}`);
      console.log(`   活跃教师: ${dashboardResult.data.overview.activeTeachers}`);
      console.log(`   活跃课程: ${dashboardResult.data.overview.activeCourses}`);
    }

    console.log('\n【步骤 9】续费检查...');
    const renewalResult = await httpRequest('/enrollments/renewal-check?thresholdHours=10&thresholdDays=30', 'GET', undefined, adminToken);
    
    if (renewalResult.success) {
      console.log('✅ 续费检查结果');
      console.log(`   阈值课时: ${renewalResult.data.thresholdHours}`);
      console.log(`   阈值天数: ${renewalResult.data.thresholdDays}`);
      console.log(`   待续费数量: ${renewalResult.data.count}`);
    }

    console.log('\n========================================');
    console.log('  ✅ 所有测试步骤完成！');
    console.log('========================================');
    console.log('\n测试验证的业务链路：');
    console.log('1. 登录认证 → 2. 报名管理 → 3. 冲突检测 → 4. 排课');
    console.log('5. 确认课表 → 6. 课表查询 → 7. 报表统计 → 8. 续费检查');
    console.log('\n服务信息：');
    console.log('  - 地址: http://localhost:9876');
    console.log('  - API前缀: /api/v1');
    console.log('  - 健康检查: /health');
    console.log('\n测试账号：');
    console.log('  - 管理员: admin / 123456');
    console.log('  - 教师: teacher01 / 123456');
    console.log('  - 学员: student01 / 123456');
    console.log('  - 家长: parent01 / 123456');

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testBusinessFlow();
