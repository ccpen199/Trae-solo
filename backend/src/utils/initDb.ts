import db from './database';
import bcrypt from 'bcryptjs';

export function initDatabase() {
  const createTables = db.transaction(() => {

    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('worker', 'enterprise', 'admin')),
        phone TEXT UNIQUE,
        id_card TEXT UNIQUE,
        real_name TEXT,
        avatar TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'pending')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS worker_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        gender TEXT,
        birth_date TEXT,
        address TEXT,
        education TEXT,
        work_years INTEGER DEFAULT 0,
        skill_level INTEGER DEFAULT 0,
        emergency_contact TEXT,
        emergency_phone TEXT,
        has_biometric_data INTEGER DEFAULT 0,
        biometric_deleted INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS enterprise_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_name TEXT NOT NULL,
        unified_credit_code TEXT UNIQUE,
        business_license TEXT,
        legal_representative TEXT,
        contact_phone TEXT,
        company_address TEXT,
        qualification_level TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gb_code TEXT UNIQUE NOT NULL,
        gb_name TEXT NOT NULL,
        category TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS trade_certifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trade_id INTEGER NOT NULL REFERENCES trades(id),
        certificate_number TEXT,
        certificate_type TEXT,
        certificate_image TEXT,
        ocr_result TEXT,
        ocr_confidence REAL,
        verification_source TEXT DEFAULT 'manual',
        verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending', 'verified', 'rejected')),
        verified_at DATETIME,
        verified_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS skill_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trade_id INTEGER NOT NULL REFERENCES trades(id),
        theory_score INTEGER,
        theory_passed INTEGER DEFAULT 0,
        practical_video_url TEXT,
        practical_score INTEGER,
        practical_passed INTEGER DEFAULT 0,
        overall_level INTEGER DEFAULT 0,
        assessor_id INTEGER REFERENCES users(id),
        assessment_status TEXT DEFAULT 'pending' CHECK(assessment_status IN ('pending', 'theory_passed', 'practical_passed', 'completed', 'failed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        assessed_at DATETIME
      );

      CREATE TABLE IF NOT EXISTS exam_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trade_id INTEGER NOT NULL REFERENCES trades(id),
        question_text TEXT NOT NULL,
        options TEXT,
        correct_answer TEXT,
        question_type TEXT DEFAULT 'single' CHECK(question_type IN ('single', 'multiple', 'judge')),
        difficulty INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS job_postings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enterprise_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trade_id INTEGER NOT NULL REFERENCES trades(id),
        project_id INTEGER REFERENCES construction_projects(id),
        title TEXT NOT NULL,
        description TEXT,
        salary_type TEXT NOT NULL CHECK(salary_type IN ('daily', 'piece', 'monthly')),
        salary_min REAL NOT NULL,
        salary_max REAL,
        salary_details TEXT,
        includes_board INTEGER DEFAULT 0,
        includes_lodging INTEGER DEFAULT 0,
        safety_training_required TEXT,
        work_location TEXT,
        requirement_description TEXT,
        people_needed INTEGER DEFAULT 1,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'closed', 'filled')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS construction_projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enterprise_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_name TEXT NOT NULL,
        project_code TEXT UNIQUE,
        project_type TEXT,
        project_address TEXT,
        geofence_lat REAL,
        geofence_lng REAL,
        geofence_radius REAL DEFAULT 200,
        budget REAL,
        status TEXT DEFAULT 'planning' CHECK(status IN ('planning', 'approved', 'started', 'under_construction', 'completed', 'closed')),
        start_date TEXT,
        end_date TEXT,
        actual_start_date TEXT,
        actual_end_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS labor_contracts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER NOT NULL REFERENCES users(id),
        enterprise_id INTEGER NOT NULL REFERENCES users(id),
        job_posting_id INTEGER NOT NULL REFERENCES job_postings(id),
        project_id INTEGER REFERENCES construction_projects(id),
        contract_no TEXT UNIQUE,
        contract_type TEXT,
        start_date TEXT,
        end_date TEXT,
        salary_amount REAL,
        salary_type TEXT,
        contract_content TEXT,
        worker_signed INTEGER DEFAULT 0,
        worker_signed_at DATETIME,
        enterprise_signed INTEGER DEFAULT 0,
        enterprise_signed_at DATETIME,
        contract_file TEXT,
        status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'signed', 'terminated', 'expired')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS attendance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER NOT NULL REFERENCES users(id),
        project_id INTEGER REFERENCES construction_projects(id),
        contract_id INTEGER REFERENCES labor_contracts(id),
        check_in_time DATETIME,
        check_in_lat REAL,
        check_in_lng REAL,
        check_in_face_verified INTEGER DEFAULT 0,
        check_in_geofence_verified INTEGER DEFAULT 0,
        check_out_time DATETIME,
        check_out_lat REAL,
        check_out_lng REAL,
        work_hours REAL,
        status TEXT DEFAULT 'normal' CHECK(status IN ('normal', 'late', 'early_leave', 'absent', 'overtime')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payrolls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER NOT NULL REFERENCES users(id),
        enterprise_id INTEGER NOT NULL REFERENCES users(id),
        contract_id INTEGER REFERENCES labor_contracts(id),
        project_id INTEGER REFERENCES construction_projects(id),
        period_year INTEGER NOT NULL,
        period_month INTEGER NOT NULL,
        base_salary REAL DEFAULT 0,
        overtime_pay REAL DEFAULT 0,
        bonus REAL DEFAULT 0,
        deductions REAL DEFAULT 0,
        social_security REAL DEFAULT 0,
        net_salary REAL NOT NULL,
        bank_transfer_status TEXT DEFAULT 'pending' CHECK(bank_transfer_status IN ('pending', 'processing', 'completed', 'failed')),
        bank_transfer_id TEXT,
        payslip_file TEXT,
        worker_viewed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS social_security_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER NOT NULL REFERENCES users(id),
        enterprise_id INTEGER REFERENCES users(id),
        project_id INTEGER REFERENCES construction_projects(id),
        insurance_type TEXT NOT NULL,
        insurance_month TEXT NOT NULL,
        base_amount REAL DEFAULT 0,
        personal_amount REAL DEFAULT 0,
        enterprise_amount REAL DEFAULT 0,
        payment_amount REAL DEFAULT 0,
        payment_status TEXT DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'paid', 'overdue')),
        payment_due_date TEXT,
        paid_at TEXT,
        disposal_status TEXT DEFAULT 'pending' CHECK(disposal_status IN ('pending', 'notified', 'deadline_set', 'reported', 'completed')),
        disposal_action TEXT,
        remedial_deadline TEXT,
        is_reported INTEGER DEFAULT 0,
        reported_at TEXT,
        reviewed_by INTEGER REFERENCES users(id),
        disposal_result TEXT,
        disposal_note TEXT,
        warning_sent INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS biometric_deletion_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER NOT NULL REFERENCES users(id),
        deletion_reason TEXT NOT NULL,
        data_types TEXT NOT NULL,
        operator_id INTEGER NOT NULL REFERENCES users(id),
        deletion_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        deletion_certificate_no TEXT,
        deletion_method TEXT DEFAULT 'physical' CHECK(deletion_method IN ('physical', 'logical', 'crypto_destroy')),
        deletion_result TEXT DEFAULT 'success' CHECK(deletion_result IN ('success', 'failed')),
        review_opinion TEXT,
        execution_time DATETIME,
        destruction_hash TEXT,
        audit_trail TEXT
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        table_name TEXT,
        record_id INTEGER,
        old_values TEXT,
        new_values TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_trade_cert_worker ON trade_certifications(worker_id);
      CREATE INDEX IF NOT EXISTS idx_trade_cert_status ON trade_certifications(verification_status);
      CREATE INDEX IF NOT EXISTS idx_skill_assess_worker ON skill_assessments(worker_id);
      CREATE INDEX IF NOT EXISTS idx_job_posting_trade ON job_postings(trade_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_worker_date ON attendance_records(worker_id, DATE(created_at));
      CREATE INDEX IF NOT EXISTS idx_payroll_worker_period ON payrolls(worker_id, period_year, period_month);
      CREATE INDEX IF NOT EXISTS idx_social_security_worker ON social_security_records(worker_id, insurance_month);
      CREATE INDEX IF NOT EXISTS idx_contract_worker ON labor_contracts(worker_id);
      CREATE INDEX IF NOT EXISTS idx_contract_enterprise ON labor_contracts(enterprise_id);
    `);

    const gbTrades = [
      { code: 'GB/T32952-01-01', name: '建筑焊工', category: '焊接作业' },
      { code: 'GB/T32952-01-02', name: '建筑电工', category: '电气作业' },
      { code: 'GB/T32952-01-03', name: '架子工', category: '高处作业' },
      { code: 'GB/T32952-01-04', name: '塔式起重机司机', category: '起重作业' },
      { code: 'GB/T32952-01-05', name: '施工升降机司机', category: '起重作业' },
      { code: 'GB/T32952-01-06', name: '信号司索工', category: '起重作业' },
      { code: 'GB/T32952-01-07', name: '钢筋工', category: '钢筋作业' },
      { code: 'GB/T32952-01-08', name: '混凝土工', category: '混凝土作业' },
      { code: 'GB/T32952-01-09', name: '模板工', category: '模板作业' },
      { code: 'GB/T32952-01-10', name: '砌筑工', category: '砌筑作业' },
      { code: 'GB/T32952-01-11', name: '抹灰工', category: '装饰装修' },
      { code: 'GB/T32952-01-12', name: '防水工', category: '防水作业' },
      { code: 'GB/T32952-01-13', name: '水暖工', category: '水暖安装' },
      { code: 'GB/T32952-01-14', name: '通风空调工', category: '暖通作业' },
      { code: 'GB/T32952-01-15', name: '建筑机械维修工', category: '机械维修' }
    ];

    const insertTrade = db.prepare('INSERT OR IGNORE INTO trades (gb_code, gb_name, category) VALUES (?, ?, ?)');
    for (const trade of gbTrades) {
      insertTrade.run(trade.code, trade.name, trade.category);
    }

    const examQuestions = [
      { tradeId: 1, question: '焊接作业前必须检查的内容不包括以下哪项？', options: JSON.stringify(['A. 焊机接地是否良好', 'B. 焊接电缆是否破损', 'C. 焊工是否穿戴劳保用品', 'D. 当天天气是否晴朗']), correct: 'D', type: 'single' },
      { tradeId: 1, question: '电焊作业时，焊工必须佩戴的防护用品是？', options: JSON.stringify(['A. 安全帽', 'B. 防护面罩', 'C. 绝缘手套', 'D. 以上都是']), correct: 'D', type: 'single' },
      { tradeId: 2, question: '建筑施工现场临时用电采用的系统是？', options: JSON.stringify(['A. TN-C', 'B. TN-S', 'C. TN-C-S', 'D. TT']), correct: 'B', type: 'single' },
      { tradeId: 2, question: '开关箱与用电设备之间的距离不应超过多少米？', options: JSON.stringify(['A. 2米', 'B. 3米', 'C. 5米', 'D. 10米']), correct: 'B', type: 'single' },
      { tradeId: 3, question: '高处作业是指坠落高度基准面多少米及以上的作业？', options: JSON.stringify(['A. 1米', 'B. 2米', 'C. 3米', 'D. 5米']), correct: 'B', type: 'single' },
      { tradeId: 4, question: '塔式起重机司机在作业前应检查的内容包括？', options: JSON.stringify(['A. 各安全装置', 'B. 钢丝绳磨损情况', 'C. 各连接螺栓', 'D. 以上都是']), correct: 'D', type: 'single' }
    ];

    const insertQuestion = db.prepare('INSERT OR IGNORE INTO exam_questions (trade_id, question_text, options, correct_answer, question_type, difficulty) VALUES (?, ?, ?, ?, ?, 1)');
    for (const q of examQuestions) {
      insertQuestion.run(q.tradeId, q.question, q.options, q.correct, q.type);
    }

    const adminPassword = bcrypt.hashSync('admin123', 10);
    const insertAdmin = db.prepare('INSERT OR IGNORE INTO users (username, password, role, real_name, phone, id_card) VALUES (?, ?, ?, ?, ?, ?)');
    insertAdmin.run('admin', adminPassword, 'admin', '系统管理员', '13800138000', '110101199001010001');

    const workerPassword = bcrypt.hashSync('worker123', 10);
    const insertWorker = db.prepare('INSERT OR IGNORE INTO users (username, password, role, real_name, phone, id_card) VALUES (?, ?, ?, ?, ?, ?)');
    const workerResult = insertWorker.run('worker01', workerPassword, 'worker', '张三', '13900139001', '110101199001010002');
    if (workerResult.changes > 0) {
      const workerId = workerResult.lastInsertRowid as number;
      const insertWorkerProfile = db.prepare('INSERT OR IGNORE INTO worker_profiles (user_id, gender, birth_date, education, work_years) VALUES (?, ?, ?, ?, ?)');
      insertWorkerProfile.run(workerId, '男', '1990-01-01', '高中', 5);
    }

    const enterprisePassword = bcrypt.hashSync('enterprise123', 10);
    const insertEnterprise = db.prepare('INSERT OR IGNORE INTO users (username, password, role, real_name, phone, id_card) VALUES (?, ?, ?, ?, ?, ?)');
    const enterpriseResult = insertEnterprise.run('enterprise01', enterprisePassword, 'enterprise', '李总', '13700137001', '110101198001010003');
    if (enterpriseResult.changes > 0) {
      const enterpriseId = enterpriseResult.lastInsertRowid as number;
      const insertEnterpriseProfile = db.prepare('INSERT OR IGNORE INTO enterprise_profiles (user_id, company_name, unified_credit_code, legal_representative, contact_phone, company_address) VALUES (?, ?, ?, ?, ?, ?)');
      insertEnterpriseProfile.run(enterpriseId, '中建某建筑工程有限公司', '91110000MA0000001X', '李总', '13700137001', '北京市朝阳区建国路88号');
    }

    const adminUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin') as any;
    const workerUser = db.prepare('SELECT id FROM users WHERE username = ?').get('worker01') as any;
    const enterpriseUser = db.prepare('SELECT id FROM users WHERE username = ?').get('enterprise01') as any;

    if (workerUser) {
      db.prepare(`
        UPDATE worker_profiles
        SET skill_level = MAX(COALESCE(skill_level, 0), 3),
            has_biometric_data = 1,
            biometric_deleted = 0,
            emergency_contact = COALESCE(emergency_contact, '张强'),
            emergency_phone = COALESCE(emergency_phone, '13900139002')
        WHERE user_id = ?
      `).run(workerUser.id);
    }

    if (enterpriseUser && (db.prepare('SELECT COUNT(*) as count FROM construction_projects').get() as any).count === 0) {
      db.prepare(`
        INSERT INTO construction_projects
        (enterprise_id, project_name, project_code, project_type, project_address,
         geofence_lat, geofence_lng, geofence_radius, budget, status, start_date, end_date, actual_start_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        enterpriseUser.id,
        '望京装配式住宅一期',
        'BJ-WJ-2026-001',
        '住宅建设',
        '北京市朝阳区望京东路8号',
        39.9928,
        116.4805,
        350,
        128000000,
        'under_construction',
        '2026-03-01',
        '2026-12-31',
        '2026-03-08'
      );

      db.prepare(`
        INSERT INTO construction_projects
        (enterprise_id, project_name, project_code, project_type, project_address,
         geofence_lat, geofence_lng, geofence_radius, budget, status, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        enterpriseUser.id,
        '通州城市副中心综合管廊',
        'BJ-TZ-2026-002',
        '市政工程',
        '北京市通州区运河商务区',
        39.9026,
        116.6568,
        500,
        86000000,
        'approved',
        '2026-07-01',
        '2027-05-30'
      );
    }

    const firstProject = db.prepare('SELECT id FROM construction_projects ORDER BY id LIMIT 1').get() as any;

    if (enterpriseUser && firstProject && (db.prepare('SELECT COUNT(*) as count FROM job_postings').get() as any).count === 0) {
      const insertJob = db.prepare(`
        INSERT INTO job_postings
        (enterprise_id, trade_id, project_id, title, description, salary_type, salary_min, salary_max,
         salary_details, includes_board, includes_lodging, safety_training_required, work_location,
         requirement_description, people_needed, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertJob.run(
        enterpriseUser.id,
        1,
        firstProject.id,
        '建筑焊工班组长',
        '负责钢结构焊接作业组织、焊缝质量自检和安全交底。',
        'daily',
        420,
        560,
        JSON.stringify({ payCycle: '月结', overtime: '按1.5倍计薪', bankPayroll: true }),
        1,
        1,
        '入场前完成三级安全教育，持焊工证并通过现场实操复核。',
        '北京市朝阳区望京东路8号',
        '5年以上建筑焊接经验，熟悉钢结构焊接规范，能带3-5人小组。',
        6,
        'active'
      );

      insertJob.run(
        enterpriseUser.id,
        4,
        firstProject.id,
        '塔吊操作员',
        '负责塔式起重机日常吊装、设备点检和吊装记录填报。',
        'monthly',
        12000,
        15000,
        JSON.stringify({ payCycle: '月结', allowance: '高温补贴+夜班补贴', bankPayroll: true }),
        1,
        1,
        '必须持塔吊操作证，进场完成设备安全培训。',
        '北京市朝阳区望京东路8号',
        '熟悉塔吊安全操作规程，无重大安全事故记录。',
        2,
        'active'
      );

      insertJob.run(
        enterpriseUser.id,
        7,
        firstProject.id,
        '钢筋工',
        '负责钢筋下料、绑扎、隐蔽验收配合和质量整改。',
        'piece',
        380,
        520,
        JSON.stringify({ payCycle: '按月结算', unit: '吨', insuranceIncluded: true }),
        1,
        0,
        '入场前完成实名制登记和安全技术交底。',
        '北京市朝阳区望京东路8号',
        '能看懂结构施工图，熟悉钢筋翻样和现场绑扎工艺。',
        10,
        'active'
      );
    }

    const firstJob = db.prepare('SELECT id FROM job_postings ORDER BY id LIMIT 1').get() as any;

    if (adminUser && workerUser && (db.prepare('SELECT COUNT(*) as count FROM trade_certifications').get() as any).count === 0) {
      db.prepare(`
        INSERT INTO trade_certifications
        (worker_id, trade_id, certificate_number, certificate_type, ocr_result, ocr_confidence,
         verification_source, verification_status, verified_at, verified_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      `).run(
        workerUser.id,
        1,
        'HJ2026012301',
        '建筑焊工证',
        JSON.stringify({ holderName: '张三', certificateNumber: 'HJ2026012301', issuingAuthority: '住房和城乡建设部' }),
        0.96,
        'government_simulation',
        'verified',
        adminUser.id
      );

      db.prepare(`
        INSERT INTO skill_assessments
        (worker_id, trade_id, theory_score, theory_passed, practical_video_url, practical_score,
         practical_passed, overall_level, assessor_id, assessment_status, assessed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(workerUser.id, 1, 92, 1, '/uploads/practical/welder-demo.mp4', 88, 1, 3, adminUser.id, 'completed');
    }

    if (workerUser && enterpriseUser && firstProject && firstJob && (db.prepare('SELECT COUNT(*) as count FROM labor_contracts').get() as any).count === 0) {
      const contractResult = db.prepare(`
        INSERT INTO labor_contracts
        (worker_id, enterprise_id, job_posting_id, project_id, contract_no, contract_type,
         start_date, end_date, salary_amount, salary_type, contract_content,
         worker_signed, worker_signed_at, enterprise_signed, enterprise_signed_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, ?)
      `).run(
        workerUser.id,
        enterpriseUser.id,
        firstJob.id,
        firstProject.id,
        'CONTRACT_20260606_0001',
        'fixed_term',
        '2026-06-01',
        '2026-12-31',
        480,
        'daily',
        '本合同用于建筑实名制用工、电子签署、考勤联动和银行代发工资演示。',
        'signed'
      );

      const contractId = contractResult.lastInsertRowid as number;
      const today = new Date().toISOString().slice(0, 10);

      db.prepare(`
        INSERT INTO attendance_records
        (worker_id, project_id, contract_id, check_in_time, check_in_lat, check_in_lng,
         check_in_face_verified, check_in_geofence_verified, check_out_time, check_out_lat,
         check_out_lng, work_hours, status)
        VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?, ?)
      `).run(
        workerUser.id,
        firstProject.id,
        contractId,
        `${today} 08:52:00`,
        39.9929,
        116.4803,
        `${today} 18:14:00`,
        39.9927,
        116.4806,
        9.37,
        'normal'
      );

      db.prepare(`
        INSERT INTO payrolls
        (worker_id, enterprise_id, contract_id, project_id, period_year, period_month,
         base_salary, overtime_pay, bonus, deductions, social_security, net_salary,
         bank_transfer_status, bank_transfer_id, worker_viewed)
        VALUES (?, ?, ?, ?, 2026, 6, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        workerUser.id,
        enterpriseUser.id,
        contractId,
        firstProject.id,
        10560,
        720,
        500,
        0,
        844.8,
        10935.2,
        'processing',
        'BANK-PAY-202606-0001',
        0
      );
    }

    if (workerUser && enterpriseUser && firstProject && (db.prepare('SELECT COUNT(*) as count FROM social_security_records').get() as any).count === 0) {
      const insertSocialSecurity = db.prepare(`
        INSERT INTO social_security_records
        (worker_id, enterprise_id, project_id, insurance_type, insurance_month, base_amount,
         personal_amount, enterprise_amount, payment_amount, payment_status, payment_due_date,
         disposal_status, warning_sent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertSocialSecurity.run(workerUser.id, enterpriseUser.id, firstProject.id, '工伤保险', '2026-06',
        5000, 100, 220, 320, 'paid', '2026-06-25', 'completed', 0);
      insertSocialSecurity.run(workerUser.id, enterpriseUser.id, firstProject.id, '养老保险', '2026-06',
        5000, 400, 580, 980, 'overdue', '2026-03-25', 'pending', 1);
      insertSocialSecurity.run(workerUser.id, enterpriseUser.id, firstProject.id, '医疗保险', '2026-05',
        5000, 100, 400, 500, 'overdue', '2026-05-25', 'notified', 1);
      insertSocialSecurity.run(workerUser.id, enterpriseUser.id, firstProject.id, '失业保险', '2026-04',
        5000, 50, 100, 150, 'overdue', '2026-04-25', 'deadline_set', 1);
    }

    if (adminUser && workerUser && (db.prepare('SELECT COUNT(*) as count FROM biometric_deletion_logs').get() as any).count === 0) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const certNo = `DEL-${dateStr}-001`;
      const destructionHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      db.prepare(`
        INSERT INTO biometric_deletion_logs
        (worker_id, deletion_reason, data_types, operator_id, deletion_certificate_no,
         deletion_method, deletion_result, review_opinion, execution_time, destruction_hash, audit_trail)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        workerUser.id,
        '离场人员历史人脸模板清理演示',
        JSON.stringify(['face', 'fingerprint']),
        adminUser.id,
        certNo,
        'physical',
        'success',
        '符合《建筑业用工实名制管理办法》规定，数据已彻底销毁，可追溯审计',
        now.toISOString(),
        destructionHash,
        JSON.stringify({ ticketNo: 'BIO-DEL-20260606-001', retainedProof: true })
      );
    }

    if (adminUser && (db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as any).count === 0) {
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(adminUser.id, 'seed_business_demo_data', 'system', 1, JSON.stringify({ source: 'initDatabase' }), '127.0.0.1');
    }

    console.log('Database initialized successfully.');
  });

  createTables();
}

export default initDatabase;
