import db from './index';

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS hospitals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      level TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      departments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hospital_id INTEGER NOT NULL,
      hospital_name TEXT NOT NULL,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      title TEXT NOT NULL,
      phone TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
      age INTEGER NOT NULL,
      id_card TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      address TEXT,
      medical_history TEXT,
      allergies TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_no TEXT NOT NULL UNIQUE,
      patient_id INTEGER NOT NULL,
      patient_name TEXT NOT NULL,
      from_hospital_id INTEGER NOT NULL,
      from_hospital_name TEXT NOT NULL,
      from_department TEXT NOT NULL,
      from_doctor_id INTEGER NOT NULL,
      from_doctor_name TEXT NOT NULL,
      to_hospital_id INTEGER NOT NULL,
      to_hospital_name TEXT NOT NULL,
      to_department TEXT NOT NULL,
      to_doctor_id INTEGER NOT NULL,
      to_doctor_name TEXT NOT NULL,
      urgency TEXT NOT NULL CHECK(urgency IN ('normal', 'urgent', 'emergency')),
      primary_diagnosis TEXT NOT NULL,
      transfer_reason TEXT NOT NULL,
      current_condition TEXT NOT NULL,
      treatment_history TEXT,
      examination_results TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'reviewing', 'accepted', 'supplement', 'rejected', 'coordinating', 'transiting', 'completed', 'cancelled')),
      rejection_reason TEXT,
      created_by INTEGER NOT NULL,
      created_by_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (from_hospital_id) REFERENCES hospitals(id),
      FOREIGN KEY (to_hospital_id) REFERENCES hospitals(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      reviewer_name TEXT NOT NULL,
      result TEXT NOT NULL CHECK(result IN ('accepted', 'supplement', 'rejected')),
      comments TEXT NOT NULL,
      supplement_requirements TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transfer_id) REFERENCES transfers(id)
    );

    CREATE TABLE IF NOT EXISTS coordinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id INTEGER NOT NULL UNIQUE,
      coordinator_id INTEGER NOT NULL,
      coordinator_name TEXT NOT NULL,
      bed_available INTEGER NOT NULL DEFAULT 0,
      bed_number TEXT,
      estimated_arrival_time DATETIME,
      preparation_notes TEXT,
      contact_person TEXT,
      contact_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transfer_id) REFERENCES transfers(id)
    );

    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id INTEGER NOT NULL UNIQUE,
      arrival_time DATETIME NOT NULL,
      received_by INTEGER NOT NULL,
      received_by_name TEXT NOT NULL,
      patient_condition TEXT NOT NULL,
      diagnosis TEXT NOT NULL,
      treatment_given TEXT,
      admission_decision TEXT NOT NULL CHECK(admission_decision IN ('admitted', 'observed', 'discharged', 'transferred_again')),
      ward TEXT,
      bed_number TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transfer_id) REFERENCES transfers(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      ip TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
    CREATE INDEX IF NOT EXISTS idx_transfers_urgency ON transfers(urgency);
    CREATE INDEX IF NOT EXISTS idx_transfers_from_hospital ON transfers(from_hospital_id);
    CREATE INDEX IF NOT EXISTS idx_transfers_to_hospital ON transfers(to_hospital_id);
    CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON transfers(created_at);
    CREATE INDEX IF NOT EXISTS idx_operation_logs_user ON operation_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_operation_logs_action ON operation_logs(action);
  `);

  const hospitalCount = db.prepare('SELECT COUNT(*) as count FROM hospitals').get() as { count: number };
  if (hospitalCount.count === 0) {
    const insertHospital = db.prepare(`
      INSERT INTO hospitals (name, level, address, phone, departments)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertDoctor = db.prepare(`
      INSERT INTO doctors (hospital_id, hospital_name, name, department, title, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const hospitals = [
      { name: '北京市第一人民医院', level: '三甲', address: '北京市朝阳区建国路88号', phone: '010-88880001', departments: '心内科,神经内科,呼吸科,消化科,骨科,急诊科,ICU' },
      { name: '北京市协和医院', level: '三甲', address: '北京市东城区王府井大街1号', phone: '010-88880002', departments: '心内科,神经内科,呼吸科,消化科,肿瘤科,急诊科,ICU' },
      { name: '北京医科大学附属医院', level: '三甲', address: '北京市海淀区学院路38号', phone: '010-88880003', departments: '心内科,神经内科,呼吸科,消化科,骨科,妇产科,儿科,急诊科' },
      { name: '北京市第二人民医院', level: '三乙', address: '北京市丰台区丰台路100号', phone: '010-88880004', departments: '心内科,神经内科,呼吸科,消化科,骨科,急诊科' },
      { name: '北京市中西医结合医院', level: '三乙', address: '北京市西城区阜成门内大街100号', phone: '010-88880005', departments: '中医科,中西医结合科,针灸科,推拿科,急诊科' },
    ];

    const doctors = [
      { hospitalIdx: 0, name: '张医生', department: '心内科', title: '主任医师', phone: '13800000001' },
      { hospitalIdx: 0, name: '李医生', department: '神经内科', title: '副主任医师', phone: '13800000002' },
      { hospitalIdx: 0, name: '王医生', department: '急诊科', title: '主治医师', phone: '13800000003' },
      { hospitalIdx: 1, name: '刘医生', department: '心内科', title: '主任医师', phone: '13800000004' },
      { hospitalIdx: 1, name: '陈医生', department: '呼吸科', title: '副主任医师', phone: '13800000005' },
      { hospitalIdx: 1, name: '赵医生', department: 'ICU', title: '主治医师', phone: '13800000006' },
      { hospitalIdx: 2, name: '孙医生', department: '骨科', title: '主任医师', phone: '13800000007' },
      { hospitalIdx: 2, name: '周医生', department: '消化科', title: '副主任医师', phone: '13800000008' },
      { hospitalIdx: 3, name: '吴医生', department: '急诊科', title: '主治医师', phone: '13800000009' },
      { hospitalIdx: 4, name: '郑医生', department: '中医科', title: '主任医师', phone: '13800000010' },
    ];

    const insertPatient = db.prepare(`
      INSERT INTO patients (name, gender, age, id_card, phone, address, medical_history)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const patients = [
      { name: '张三', gender: 'male', age: 65, id_card: '110101196001011234', phone: '13900000001', address: '北京市朝阳区', medical_history: '高血压,糖尿病' },
      { name: '李四', gender: 'female', age: 52, id_card: '110101197202022345', phone: '13900000002', address: '北京市海淀区', medical_history: '冠心病' },
      { name: '王五', gender: 'male', age: 45, id_card: '110101197903033456', phone: '13900000003', address: '北京市东城区', medical_history: '' },
    ];

    hospitals.forEach((h, idx) => {
      const result = insertHospital.run(h.name, h.level, h.address, h.phone, h.departments);
      const hospitalId = result.lastInsertRowid;
      
      doctors
        .filter(d => d.hospitalIdx === idx)
        .forEach(d => {
          insertDoctor.run(hospitalId, h.name, d.name, d.department, d.title, d.phone);
        });
    });

    patients.forEach(p => {
      insertPatient.run(p.name, p.gender, p.age, p.id_card, p.phone, p.address, p.medical_history);
    });
  }

  const transferCount = db.prepare('SELECT COUNT(*) as count FROM transfers').get() as { count: number };
  if (transferCount.count === 0) {
    const hospitals = db.prepare('SELECT id, name FROM hospitals ORDER BY id').all() as Array<{ id: number; name: string }>;
    const doctors = db.prepare('SELECT id, hospital_id, name, department FROM doctors ORDER BY id').all() as Array<{
      id: number;
      hospital_id: number;
      name: string;
      department: string;
    }>;
    const patients = db.prepare('SELECT id, name FROM patients ORDER BY id').all() as Array<{ id: number; name: string }>;

    if (hospitals.length >= 3 && doctors.length >= 6 && patients.length >= 3) {
      const byDepartment = (hospitalId: number, department: string) => (
        doctors.find(d => d.hospital_id === hospitalId && d.department === department) ||
        doctors.find(d => d.hospital_id === hospitalId) ||
        doctors[0]
      );
      const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const h1 = hospitals[0];
      const h2 = hospitals[1];
      const h3 = hospitals[2];
      const h4 = hospitals[3] || hospitals[0];

      const seedTransfers = [
        {
          transfer_no: `TR${dateStamp}000001`,
          patient: patients[0],
          fromHospital: h1,
          fromDoctor: byDepartment(h1.id, '急诊科'),
          toHospital: h2,
          toDoctor: byDepartment(h2.id, 'ICU'),
          toDepartment: 'ICU',
          urgency: 'emergency',
          primary_diagnosis: '急性心衰伴呼吸困难',
          transfer_reason: '需上级医院 ICU 连续监护和高级生命支持',
          current_condition: '吸氧后血氧维持在 92%，血压偏低，需尽快转入',
          treatment_history: '已完成心电图、胸片和利尿治疗',
          examination_results: 'BNP 升高，胸片提示肺淤血',
          status: 'pending'
        },
        {
          transfer_no: `TR${dateStamp}000002`,
          patient: patients[1],
          fromHospital: h4,
          fromDoctor: byDepartment(h4.id, '急诊科'),
          toHospital: h1,
          toDoctor: byDepartment(h1.id, '心内科'),
          toDepartment: '心内科',
          urgency: 'urgent',
          primary_diagnosis: '不稳定型心绞痛',
          transfer_reason: '需完善冠脉介入评估',
          current_condition: '胸痛缓解，心肌酶待复查',
          treatment_history: '已给予抗血小板、抗凝和监护',
          examination_results: '心电图 ST-T 改变',
          status: 'accepted'
        },
        {
          transfer_no: `TR${dateStamp}000003`,
          patient: patients[2],
          fromHospital: h1,
          fromDoctor: byDepartment(h1.id, '神经内科'),
          toHospital: h3,
          toDoctor: byDepartment(h3.id, '骨科'),
          toDepartment: '骨科',
          urgency: 'normal',
          primary_diagnosis: '腰椎间盘突出伴下肢麻木',
          transfer_reason: '需骨科进一步评估手术适应证',
          current_condition: '生命体征平稳，可平车转运',
          treatment_history: '止痛、脱水和营养神经治疗后症状仍反复',
          examination_results: '腰椎 MRI 提示 L4-L5 椎间盘突出',
          status: 'coordinating'
        }
      ];

      const insertTransfer = db.prepare(`
        INSERT INTO transfers (
          transfer_no, patient_id, patient_name, from_hospital_id, from_hospital_name,
          from_department, from_doctor_id, from_doctor_name, to_hospital_id, to_hospital_name,
          to_department, to_doctor_id, to_doctor_name, urgency, primary_diagnosis,
          transfer_reason, current_condition, treatment_history, examination_results,
          status, created_by, created_by_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'system')
      `);

      seedTransfers.forEach((item, index) => {
        const result = insertTransfer.run(
          item.transfer_no,
          item.patient.id,
          item.patient.name,
          item.fromHospital.id,
          item.fromHospital.name,
          item.fromDoctor.department,
          item.fromDoctor.id,
          item.fromDoctor.name,
          item.toHospital.id,
          item.toHospital.name,
          item.toDepartment,
          item.toDoctor.id,
          item.toDoctor.name,
          item.urgency,
          item.primary_diagnosis,
          item.transfer_reason,
          item.current_condition,
          item.treatment_history,
          item.examination_results,
          item.status
        );

        const transferId = result.lastInsertRowid;

        if (item.status === 'accepted' || item.status === 'coordinating') {
          db.prepare(`
            INSERT INTO reviews (transfer_id, reviewer_id, reviewer_name, result, comments)
            VALUES (?, 1, 'system', 'accepted', ?)
          `).run(transferId, index === 1 ? '符合转入指征，请协调床位。' : '资料完整，可进入转运协调。');
        }

        if (item.status === 'coordinating') {
          db.prepare(`
            INSERT INTO coordinations (
              transfer_id, coordinator_id, coordinator_name, bed_available,
              bed_number, estimated_arrival_time, preparation_notes,
              contact_person, contact_phone
            ) VALUES (?, 1, 'system', 1, 'B-1208', datetime('now', '+3 hours'), ?, '总值班护士', '010-88881208')
          `).run(transferId, '已预留床位，通知骨科二线医生接诊。');
        }
      });
    }
  }
}
