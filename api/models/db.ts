import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mockData } from '../mock/data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', '..', 'medical_insurance.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDatabase(): void {
  const database = getDb();
  
  const migrationPath = path.join(__dirname, '..', '..', 'migrations', '001_init_schema.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');
  
  database.exec(migrationSql);
  
  seedData();
}

function seedData(): void {
  const database = getDb();
  
  const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    return;
  }
  
  const insertUser = database.prepare(`
    INSERT INTO users (id, name, id_card, social_security_no, insured_area)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const insertAccount = database.prepare(`
    INSERT INTO accounts (id, user_id, personal_balance, overall_balance, annual_consumption, last_updated)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const insertHospital = database.prepare(`
    INSERT INTO hospitals (id, name, level, area, address, is_insurance_point, longitude, latitude, insurance_policy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertDepartment = database.prepare(`
    INSERT INTO departments (id, hospital_id, name, description)
    VALUES (?, ?, ?, ?)
  `);
  
  const insertDoctor = database.prepare(`
    INSERT INTO doctors (id, department_id, name, title, specialty, registration_fee)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const insertTimeSlot = database.prepare(`
    INSERT INTO time_slots (id, doctor_id, date, time, period, available, total)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertMedicalRecord = database.prepare(`
    INSERT INTO medical_records (id, user_id, hospital_id, visit_date, department, doctor, diagnosis, symptoms, prescriptions, examinations, cost)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertConsumptionRecord = database.prepare(`
    INSERT INTO consumption_records (id, user_id, date, type, merchant_name, amount, personal_pay, overall_pay, category, details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertChronicDisease = database.prepare(`
    INSERT INTO chronic_diseases (id, user_id, disease_type, confirmed_date, expiry_date, status, materials)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertAppointment = database.prepare(`
    INSERT INTO appointments (id, user_id, hospital_id, doctor_id, date, time_slot, status, medical_code, qr_code, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertPaymentOrder = database.prepare(`
    INSERT INTO payment_orders (id, user_id, hospital_id, appointment_id, type, amount, items, status, transaction_id, paid_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertNotification = database.prepare(`
    INSERT INTO notifications (id, user_id, type, title, content, level, is_read, action_url, retryable, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertRemoteRecord = database.prepare(`
    INSERT INTO remote_records (id, user_id, area, hospital, status, attempt_count, next_retry, error_message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const transaction = database.transaction(() => {
    const user = mockData.user;
    insertUser.run(user.id, user.name, user.idCard, user.socialSecurityNo, user.insuredArea);
    
    const account = mockData.account;
    insertAccount.run(
      'acc_001',
      user.id,
      account.personalAccount,
      account.overallAccount,
      account.annualConsumption,
      account.lastUpdated
    );
    
    for (const hospital of mockData.hospitals) {
      insertHospital.run(
        hospital.id,
        hospital.name,
        hospital.level,
        hospital.area,
        hospital.address,
        hospital.isInsurancePoint ? 1 : 0,
        hospital.longitude,
        hospital.latitude,
        JSON.stringify(hospital.insurancePolicy)
      );
      
      for (const dept of hospital.departments) {
        insertDepartment.run(dept.id, hospital.id, dept.name, dept.description || null);
      }
    }
    
    for (const doctor of mockData.doctors) {
      insertDoctor.run(
        doctor.id,
        doctor.departmentId,
        doctor.name,
        doctor.title,
        doctor.specialty || null,
        doctor.registrationFee
      );
      
      const slots = mockData.timeSlots.get(doctor.id) || [];
      for (const slot of slots) {
        const [datePart] = slot.id.split('_').slice(-2);
        insertTimeSlot.run(
          slot.id,
          doctor.id,
          datePart,
          slot.time,
          slot.period,
          slot.available,
          slot.total
        );
      }
    }
    
    for (const mr of mockData.medicalRecords) {
      insertMedicalRecord.run(
        mr.id,
        user.id,
        mr.hospitalId,
        mr.visitDate,
        mr.department,
        mr.doctor,
        JSON.stringify(mr.diagnosis),
        mr.symptoms || null,
        JSON.stringify(mr.prescriptions),
        JSON.stringify(mr.examinations),
        JSON.stringify(mr.cost)
      );
    }
    
    for (const cr of mockData.consumptionRecords) {
      insertConsumptionRecord.run(
        cr.id,
        user.id,
        cr.date,
        cr.type,
        cr.merchantName,
        cr.amount,
        cr.personalPay,
        cr.overallPay,
        cr.category,
        JSON.stringify(cr.details)
      );
    }
    
    for (const cd of mockData.chronicDiseases) {
      insertChronicDisease.run(
        cd.id,
        user.id,
        cd.diseaseType,
        cd.confirmedDate,
        cd.expiryDate,
        cd.status,
        cd.materials ? JSON.stringify(cd.materials) : null
      );
    }
    
    for (const apt of mockData.appointments) {
      insertAppointment.run(
        apt.id,
        user.id,
        apt.hospitalId,
        apt.doctorId,
        apt.date,
        apt.timeSlot,
        apt.status,
        apt.medicalCode,
        apt.qrCode,
        apt.createdAt
      );
    }
    
    for (const order of mockData.paymentOrders) {
      insertPaymentOrder.run(
        order.id,
        user.id,
        order.hospitalId,
        order.appointmentId || null,
        order.type,
        JSON.stringify(order.amount),
        JSON.stringify(order.items),
        order.status,
        order.transactionId || null,
        order.paidAt || null,
        order.createdAt
      );
    }
    
    for (const notif of mockData.notifications) {
      insertNotification.run(
        notif.id,
        user.id,
        notif.type,
        notif.title,
        notif.content,
        notif.level,
        notif.read ? 1 : 0,
        notif.actionUrl || null,
        notif.retryable ? 1 : 0,
        notif.createdAt
      );
    }
    
    for (const rr of mockData.remoteRecords) {
      insertRemoteRecord.run(
        rr.id,
        user.id,
        rr.area,
        rr.hospital,
        rr.status,
        rr.attemptCount,
        rr.nextRetryAt || null,
        rr.errorMessage || null,
        new Date().toISOString()
      );
    }
  });
  
  transaction();
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
