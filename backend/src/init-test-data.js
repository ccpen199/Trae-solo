const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

const testAccounts = [
  { phone: 'admin', password: '123456', role: 'admin', name: '系统管理员', id_card: '110101199001010001' },
  { phone: 'platform', password: '123456', role: 'admin', name: '平台运营', id_card: '110101199001010002' },
  { phone: 'ops', password: '123456', role: 'admin', name: '运维工程师', id_card: '110101199001010003' },
  { phone: '13800000001', password: '123456', role: 'worker', name: '张工友', id_card: '110101199001010004' },
  { phone: '13800000002', password: '123456', role: 'worker', name: '李师傅', id_card: '110101199001010005' },
  { phone: '13900000001', password: '123456', role: 'company', name: '中建集团', id_card: '91110000000000001A' },
  { phone: '13900000002', password: '123456', role: 'company', name: '中铁四局', id_card: '91110000000000002B' },
  { phone: '13700000001', password: '123456', role: 'team', name: '精工班组', id_card: '91110000000000003C' },
];

function initTestAccounts() {
  console.log('=== 初始化测试账号 ===\n');
  
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (phone, password, role, name, id_card, real_name_verified)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  const insertWorker = db.prepare(`
    INSERT OR IGNORE INTO workers (user_id, skills, experience_years, experience_tags, 
                                    credit_score, certificates, location, daily_salary_expected, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCompany = db.prepare(`
    INSERT OR IGNORE INTO companies (user_id, company_name, license_number, license_verified, 
                                     address, contact_person, contact_phone, safety_certificates, credit_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTeam = db.prepare(`
    INSERT OR IGNORE INTO teams (user_id, team_name, qualification_number, qualification_verified, 
                                 member_count, member_skills, credit_score, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertJob = db.prepare(`
    INSERT OR IGNORE INTO job_posts (company_id, title, job_type, skill_required, workers_needed, 
                                     location, daily_salary, start_date, end_date, description, 
                                     safety_training_required, status, deposit_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  testAccounts.forEach(account => {
    const hashedPassword = bcrypt.hashSync(account.password, 10);
    
    try {
      const result = insertUser.run(
        account.phone, hashedPassword, account.role, account.name, account.id_card
      );
      
      if (result.changes > 0) {
        const userId = result.lastInsertRowid;
        console.log(`✅ 创建账号: ${account.phone} (${account.role} - ${account.name})`);

        if (account.role === 'worker') {
          insertWorker.run(
            userId,
            JSON.stringify(['电工', '木工']),
            5,
            '高层建筑,地铁施工',
            100,
            '低压电工证,高处作业证',
            '北京市朝阳区',
            350,
            'idle'
          );
          console.log(`   ↳ 工友资料已初始化`);
        } else if (account.role === 'company') {
          insertCompany.run(
            userId,
            account.name,
            `LIC-${Date.now()}`,
            1,
            '北京市海淀区中关村大街1号',
            account.name,
            account.phone,
            '安全生产许可证,建筑企业资质证书',
            100
          );
          console.log(`   ↳ 企业资料已初始化`);
        } else if (account.role === 'team') {
          insertTeam.run(
            userId,
            account.name,
            `QUAL-${Date.now()}`,
            1,
            15,
            JSON.stringify(['木工', '钢筋工', '架子工']),
            100,
            '北京市丰台区'
          );
          console.log(`   ↳ 班组资料已初始化`);
        }
      } else {
        console.log(`⏭️  账号已存在: ${account.phone} (${account.name})`);
      }
    } catch (error) {
      console.log(`❌ 创建账号失败: ${account.phone} - ${error.message}`);
    }
  });

  console.log('\n=== 初始化示例招工数据 ===\n');
  
  const companyIds = db.prepare('SELECT id, company_name FROM companies').all();
  
  const sampleJobs = [
    {
      title: '急招电工师傅5名',
      job_type: '临时',
      skill_required: '电工',
      workers_needed: 5,
      location: '北京市朝阳区国贸中心项目',
      daily_salary: 380,
      start_date: '2026-06-10',
      end_date: '2026-12-31',
      description: '负责项目电气安装与调试，要求有低压电工证，3年以上工作经验。\n工作时间：8:00-18:00，包食宿。',
      safety_training_required: 1,
      deposit_amount: 2000
    },
    {
      title: '招聘木工班组20人',
      job_type: '包工',
      skill_required: '木工',
      workers_needed: 20,
      location: '北京市海淀区中关村软件园',
      daily_salary: 420,
      start_date: '2026-06-15',
      end_date: '2027-03-15',
      description: '高层住宅项目模板工程，要求会做铝模，班组优先。\n按进度结算，每月付80%。',
      safety_training_required: 1,
      deposit_amount: 5000
    },
    {
      title: '急招架子工10名',
      job_type: '点工',
      skill_required: '架子工',
      workers_needed: 10,
      location: '北京市通州区城市副中心',
      daily_salary: 450,
      start_date: '2026-06-05',
      end_date: '2026-09-30',
      description: '外脚手架搭设与拆除，必须持有高处作业证。\n工期4个月，加班另算。',
      safety_training_required: 1,
      deposit_amount: 3000
    },
    {
      title: '招聘钢筋工15名',
      job_type: '包工',
      skill_required: '钢筋工',
      workers_needed: 15,
      location: '北京市大兴区国际机场二期',
      daily_salary: 400,
      start_date: '2026-06-08',
      end_date: '2027-06-30',
      description: '机场航站楼钢筋制作与绑扎，要求会看图纸。\n包吃住，工资月结。',
      safety_training_required: 0,
      deposit_amount: 0
    },
    {
      title: '招塔吊司机3名',
      job_type: '全职',
      skill_required: '塔吊司机',
      workers_needed: 3,
      location: '北京市丰台区丽泽商务区',
      daily_salary: 500,
      start_date: '2026-06-06',
      end_date: '2026-12-20',
      description: '操作6015型塔吊，必须持有塔吊司机证。\n两班倒，包吃住，买意外险。',
      safety_training_required: 1,
      deposit_amount: 5000
    },
    {
      title: '招聘混凝土工8名',
      job_type: '点工',
      skill_required: '混凝土工',
      workers_needed: 8,
      location: '北京市石景山区冬奥公园',
      daily_salary: 350,
      start_date: '2026-06-04',
      end_date: '2026-08-30',
      description: '混凝土浇筑与振捣，要求有相关经验。\n工期3个月，人走账清。',
      safety_training_required: 0,
      deposit_amount: 0
    }
  ];

  if (companyIds.length > 0) {
    sampleJobs.forEach((job, index) => {
      const company = companyIds[index % companyIds.length];
      try {
        const result = insertJob.run(
          company.id, job.title, job.job_type, job.skill_required, job.workers_needed,
          job.location, job.daily_salary, job.start_date, job.end_date, job.description,
          job.safety_training_required, 'open', job.deposit_amount
        );
        if (result.changes > 0) {
          console.log(`✅ 创建招工: ${job.title} (${job.skill_required})`);
        }
      } catch (error) {
        console.log(`❌ 创建招工失败: ${job.title} - ${error.message}`);
      }
    });
  }

  console.log('\n=== 初始化完成 ===');
  console.log('\n📋 测试账号清单:');
  console.log('  管理员:');
  console.log('    admin / 123456 (系统管理员)');
  console.log('    platform / 123456 (平台运营)');
  console.log('    ops / 123456 (运维工程师)');
  console.log('  工友:');
  console.log('    13800000001 / 123456 (张工友)');
  console.log('    13800000002 / 123456 (李师傅)');
  console.log('  企业:');
  console.log('    13900000001 / 123456 (中建集团)');
  console.log('    1390000002 / 123456 (中铁四局)');
  console.log('  班组:');
  console.log('    13700000001 / 123456 (精工班组)');
  console.log('\n🚀 所有账号均已完成实名认证，可直接登录使用！');
}

initTestAccounts();
db.close();
