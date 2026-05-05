require('dotenv').config();
const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  console.log('开始插入种子数据...');

  try {
    const saltRounds = 10;

    console.log('插入权限数据...');
    const permissions = [
      { code: 'user:manage', name: '用户管理', description: '管理系统用户', module: '用户管理' },
      { code: 'permission:manage', name: '权限管理', description: '管理用户权限', module: '用户管理' },
      { code: 'dormitory:manage', name: '宿舍楼管理', description: '管理宿舍楼信息', module: '宿舍管理' },
      { code: 'room:manage', name: '房间管理', description: '管理房间信息', module: '宿舍管理' },
      { code: 'bed:manage', name: '床位管理', description: '管理床位信息', module: '宿舍管理' },
      { code: 'checkin:manage', name: '入住管理', description: '管理入住记录', module: '入住管理' },
      { code: 'checkout:manage', name: '迁出管理', description: '管理迁出记录', module: '入住管理' },
      { code: 'roomchange:manage', name: '调房管理', description: '管理调房记录', module: '入住管理' },
      { code: 'maintenance:manage', name: '维修管理', description: '管理维修单', module: '维修管理' },
      { code: 'report:view', name: '报表查看', description: '查看统计报表', module: '报表管理' },
      { code: 'log:view', name: '日志查看', description: '查看操作日志', module: '系统管理' },
      { code: 'system:maintain', name: '系统维护', description: '系统备份和维护', module: '系统管理' },
    ];

    for (const perm of permissions) {
      await query(
        `INSERT INTO permissions (code, name, description, module) 
         VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO NOTHING`,
        [perm.code, perm.name, perm.description, perm.module]
      );
    }
    console.log('✓ 权限数据插入完成');

    console.log('插入角色权限关联...');
    const rolePermissions = {
      admin: [
        'user:manage', 'permission:manage', 'dormitory:manage', 'room:manage', 
        'bed:manage', 'checkin:manage', 'checkout:manage', 'roomchange:manage',
        'maintenance:manage', 'report:view', 'log:view', 'system:maintain'
      ],
      dormitory_admin: [
        'dormitory:manage', 'room:manage', 'bed:manage', 'checkin:manage',
        'checkout:manage', 'roomchange:manage', 'maintenance:manage', 'report:view'
      ],
      student: [
        'report:view'
      ],
    };

    const getPermissionId = async (code) => {
      const result = await query('SELECT id FROM permissions WHERE code = $1', [code]);
      return result.rows[0]?.id;
    };

    for (const [role, codes] of Object.entries(rolePermissions)) {
      for (const code of codes) {
        const permId = await getPermissionId(code);
        if (permId) {
          await query(
            `INSERT INTO role_permissions (role, permission_id) 
             VALUES ($1, $2) ON CONFLICT (role, permission_id) DO NOTHING`,
            [role, permId]
          );
        }
      }
    }
    console.log('✓ 角色权限关联完成');

    console.log('插入默认用户...');
    const hashedAdminPassword = await bcrypt.hash('admin123', saltRounds);
    const hashedDormAdminPassword = await bcrypt.hash('dorm123', saltRounds);
    const hashedStudentPassword = await bcrypt.hash('student123', saltRounds);

    await query(`
      INSERT INTO users (username, password, role, name, email, phone) 
      VALUES ('admin', $1, 'admin', '系统管理员', 'admin@example.com', '13800138000')
      ON CONFLICT (username) DO NOTHING
    `, [hashedAdminPassword]);

    await query(`
      INSERT INTO users (username, password, role, name, email, phone) 
      VALUES ('dormadmin', $1, 'dormitory_admin', '宿舍管理员', 'dormadmin@example.com', '13800138001')
      ON CONFLICT (username) DO NOTHING
    `, [hashedDormAdminPassword]);

    await query(`
      INSERT INTO users (username, password, role, name, email, phone) 
      VALUES ('student1', $1, 'student', '张三', 'zhangsan@example.com', '13800138002')
      ON CONFLICT (username) DO NOTHING
    `, [hashedStudentPassword]);

    console.log('✓ 默认用户插入完成');

    console.log('插入宿舍楼数据...');
    const dormitories = [
      { code: 'A', name: 'A栋宿舍楼', description: '男生宿舍', gender_type: 'male' },
      { code: 'B', name: 'B栋宿舍楼', description: '女生宿舍', gender_type: 'female' },
      { code: 'C', name: 'C栋宿舍楼', description: '研究生宿舍', gender_type: 'mixed' },
    ];

    for (const dorm of dormitories) {
      await query(
        `INSERT INTO dormitories (building_code, building_name, description, gender_type, total_rooms, total_beds)
         VALUES ($1, $2, $3, $4, 20, 80) ON CONFLICT (building_code) DO NOTHING`,
        [dorm.code, dorm.name, dorm.description, dorm.gender_type]
      );
    }
    console.log('✓ 宿舍楼数据插入完成');

    console.log('插入房间和床位数据...');
    const dormResult = await query('SELECT id, building_code, gender_type FROM dormitories');
    
    for (const dorm of dormResult.rows) {
      for (let floor = 1; floor <= 5; floor++) {
        for (let roomNum = 1; roomNum <= 4; roomNum++) {
          const roomNumber = `${dorm.building_code}${floor}${String(roomNum).padStart(2, '0')}`;
          
          const roomResult = await query(
            `INSERT INTO rooms (room_number, dormitory_id, floor, total_beds, gender_type, status)
             VALUES ($1, $2, $3, 4, $4, 'available') 
             ON CONFLICT (room_number) DO NOTHING RETURNING id`,
            [roomNumber, dorm.id, floor, dorm.gender_type]
          );

          let roomId;
          if (roomResult.rows.length > 0) {
            roomId = roomResult.rows[0].id;
          } else {
            const existingRoom = await query('SELECT id FROM rooms WHERE room_number = $1', [roomNumber]);
            roomId = existingRoom.rows[0]?.id;
          }

          if (roomId) {
            for (let bedNum = 1; bedNum <= 4; bedNum++) {
              const bedCode = `${roomNumber}-${bedNum}`;
              await query(
                `INSERT INTO beds (bed_number, room_id, bed_code, status)
                 VALUES ($1, $2, $3, 'available') 
                 ON CONFLICT (bed_code) DO NOTHING`,
                [`${bedNum}`, roomId, bedCode]
              );
            }
          }
        }
      }
    }
    console.log('✓ 房间和床位数据插入完成');

    console.log('插入学生数据...');
    const studentUserResult = await query("SELECT id FROM users WHERE username = 'student1'");
    const studentUserId = studentUserResult.rows[0]?.id;

    const students = [
      { student_id: '2024001', name: '张三', gender: 'male', major: '计算机科学', class: '计科1班', grade: 2024 },
      { student_id: '2024002', name: '李四', gender: 'male', major: '计算机科学', class: '计科1班', grade: 2024 },
      { student_id: '2024003', name: '王五', gender: 'female', major: '软件工程', class: '软工1班', grade: 2024 },
      { student_id: '2024004', name: '赵六', gender: 'male', major: '计算机科学', class: '计科2班', grade: 2024 },
    ];

    for (const student of students) {
      await query(
        `INSERT INTO students (student_id, user_id, name, gender, major, class, grade)
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (student_id) DO NOTHING`,
        [student.student_id, studentUserId, student.name, student.gender, student.major, student.class, student.grade]
      );
    }
    console.log('✓ 学生数据插入完成');

    console.log('\n✓ 所有种子数据插入完成！');
    console.log('\n默认账号信息：');
    console.log('  系统管理员: admin / admin123');
    console.log('  宿舍管理员: dormadmin / dorm123');
    console.log('  学生账号:   student1 / student123');

  } catch (err) {
    console.error('种子数据插入失败:', err.message);
    throw err;
  }
};

seedData().catch((err) => {
  console.error(err);
  process.exit(1);
});