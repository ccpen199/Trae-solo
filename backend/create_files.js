const fs = require('fs');
const path = require('path');

const files = {
  'src/db/index.ts': `import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/hospital_transfer.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
`,

  'src/db/init.ts': `import db from './index';

export function initDatabase() {
  db.exec(\`
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
  \`);

  const hospitalCount = db.prepare('SELECT COUNT(*) as count FROM hospitals').get();
  if (hospitalCount.count === 0) {
    const insertHospital = db.prepare(\`
      INSERT INTO hospitals (name, level, address, phone, departments)
      VALUES (?, ?, ?, ?, ?)
    \`);

    const insertDoctor = db.prepare(\`
      INSERT INTO doctors (hospital_id, hospital_name, name, department, title, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    \`);

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

    const insertPatient = db.prepare(\`
      INSERT INTO patients (name, gender, age, id_card, phone, address, medical_history)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    \`);

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
}
`,

  'src/types/index.ts': `export interface Transfer {
  id: number;
  transfer_no: string;
  patient_id: number;
  patient_name: string;
  from_hospital_id: number;
  from_hospital_name: string;
  from_department: string;
  from_doctor_id: number;
  from_doctor_name: string;
  to_hospital_id: number;
  to_hospital_name: string;
  to_department: string;
  to_doctor_id: number;
  to_doctor_name: string;
  urgency: 'normal' | 'urgent' | 'emergency';
  primary_diagnosis: string;
  transfer_reason: string;
  current_condition: string;
  treatment_history: string;
  examination_results: string;
  status: 'pending' | 'reviewing' | 'accepted' | 'supplement' | 'rejected' | 'coordinating' | 'transiting' | 'completed' | 'cancelled';
  rejection_reason?: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  transfer_id: number;
  reviewer_id: number;
  reviewer_name: string;
  result: 'accepted' | 'supplement' | 'rejected';
  comments: string;
  supplement_requirements?: string;
  created_at: string;
}

export interface Coordination {
  id: number;
  transfer_id: number;
  coordinator_id: number;
  coordinator_name: string;
  bed_available: boolean;
  bed_number?: string;
  estimated_arrival_time?: string;
  preparation_notes: string;
  contact_person?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Result {
  id: number;
  transfer_id: number;
  arrival_time: string;
  received_by: number;
  received_by_name: string;
  patient_condition: string;
  diagnosis: string;
  treatment_given: string;
  admission_decision: 'admitted' | 'observed' | 'discharged' | 'transferred_again';
  ward?: string;
  bed_number?: string;
  notes?: string;
  created_at: string;
}

export interface Hospital {
  id: number;
  name: string;
  level: string;
  address: string;
  phone: string;
  departments: string;
  created_at: string;
}

export interface Doctor {
  id: number;
  hospital_id: number;
  hospital_name: string;
  name: string;
  department: string;
  title: string;
  phone: string;
  created_at: string;
}

export interface Patient {
  id: number;
  name: string;
  gender: 'male' | 'female';
  age: number;
  id_card: string;
  phone: string;
  address: string;
  medical_history?: string;
  allergies?: string;
  created_at: string;
}

export interface OperationLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  ip: string;
  details: string;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export type TransferStatus = Transfer['status'];
export type UrgencyLevel = Transfer['urgency'];
export type ReviewResult = Review['result'];
`,

  'src/utils/generator.ts': `import db from '../db';

export function generateTransferNo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = \`\${year}\${month}\${day}\`;
  
  const result = db.prepare(\`
    SELECT MAX(transfer_no) as max_no 
    FROM transfers 
    WHERE transfer_no LIKE ?
  \`).get(\`TR\${datePart}%\`) as { max_no: string | null };
  
  let sequence = 1;
  if (result.max_no) {
    const seqPart = result.max_no.slice(-6);
    sequence = parseInt(seqPart, 10) + 1;
  }
  
  const sequenceStr = String(sequence).padStart(6, '0');
  return \`TR\${datePart}\${sequenceStr}\`;
}
`,

  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log(`Created ${filePath} (${content.length} bytes)`);
}

console.log('\\nAll files created successfully!');
