import { Router, type Response } from 'express';
import type { ApiResponse, Hospital, Department, Doctor, TimeSlot, Appointment } from '@shared/types';
import { getDb } from '../models/db.js';
import { type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/hospitals', async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  
  const { level, area, keyword } = req.query as {
    level?: string;
    area?: string;
    keyword?: string;
  };
  
  let sql = 'SELECT * FROM hospitals WHERE 1=1';
  const params: any[] = [];
  
  if (level) {
    sql += ' AND level = ?';
    params.push(level);
  }
  
  if (area) {
    sql += ' AND area LIKE ?';
    params.push(`%${area}%`);
  }
  
  if (keyword) {
    sql += ' AND (name LIKE ? OR address LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  sql += ' ORDER BY name';
  
  const hospitals = db.prepare(sql).all(...params) as any[];
  
  const formattedHospitals: Hospital[] = hospitals.map(h => ({
    id: h.id,
    name: h.name,
    level: h.level,
    area: h.area,
    address: h.address,
    isInsurancePoint: !!h.is_insurance_point,
    longitude: h.longitude,
    latitude: h.latitude,
    insurancePolicy: JSON.parse(h.insurance_policy || '{}'),
    departments: []
  }));
  
  const response: ApiResponse<Hospital[]> = {
    code: 0,
    message: '获取成功',
    data: formattedHospitals
  };
  
  res.json(response);
});

router.get('/hospitals/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const db = getDb();
  
  const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(id) as any;
  
  if (!hospital) {
    const response: ApiResponse<null> = {
      code: 404,
      message: '医院不存在',
      data: null
    };
    res.status(404).json(response);
    return;
  }
  
  const departments = db.prepare('SELECT * FROM departments WHERE hospital_id = ?').all(id) as any[];
  
  const formattedHospital: Hospital = {
    id: hospital.id,
    name: hospital.name,
    level: hospital.level,
    area: hospital.area,
    address: hospital.address,
    isInsurancePoint: !!hospital.is_insurance_point,
    longitude: hospital.longitude,
    latitude: hospital.latitude,
    insurancePolicy: JSON.parse(hospital.insurance_policy || '{}'),
    departments: departments.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description || undefined
    }))
  };
  
  const response: ApiResponse<Hospital> = {
    code: 0,
    message: '获取成功',
    data: formattedHospital
  };
  
  res.json(response);
});

router.get('/hospitals/:id/departments', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const db = getDb();
  
  const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(id);
  if (!hospital) {
    const response: ApiResponse<null> = {
      code: 404,
      message: '医院不存在',
      data: null
    };
    res.status(404).json(response);
    return;
  }
  
  const departments = db.prepare('SELECT * FROM departments WHERE hospital_id = ?').all(id) as any[];
  
  const formattedDepartments: Department[] = departments.map(d => ({
    id: d.id,
    name: d.name,
    description: d.description || undefined
  }));
  
  const response: ApiResponse<Department[]> = {
    code: 0,
    message: '获取成功',
    data: formattedDepartments
  };
  
  res.json(response);
});

router.get('/departments/:id/doctors', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const db = getDb();
  
  const department = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
  if (!department) {
    const response: ApiResponse<null> = {
      code: 404,
      message: '科室不存在',
      data: null
    };
    res.status(404).json(response);
    return;
  }
  
  const doctors = db.prepare(`
    SELECT d.*, dep.name as dept_name 
    FROM doctors d
    LEFT JOIN departments dep ON d.department_id = dep.id
    WHERE d.department_id = ?
    ORDER BY d.title DESC
  `).all(id) as any[];
  
  const formattedDoctors: Doctor[] = doctors.map(d => ({
    id: d.id,
    name: d.name,
    title: d.title,
    department: d.dept_name,
    departmentId: d.department_id,
    specialty: d.specialty || '',
    registrationFee: d.registration_fee,
    availableDates: [],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.name}`
  }));
  
  const response: ApiResponse<Doctor[]> = {
    code: 0,
    message: '获取成功',
    data: formattedDoctors
  };
  
  res.json(response);
});

router.get('/doctors/:id/slots', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const db = getDb();
  
  const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(id);
  if (!doctor) {
    const response: ApiResponse<null> = {
      code: 404,
      message: '医生不存在',
      data: null
    };
    res.status(404).json(response);
    return;
  }
  
  const today = new Date().toISOString().split('T')[0];
  const slots = db.prepare(`
    SELECT * FROM time_slots 
    WHERE doctor_id = ? AND date >= ?
    ORDER BY date, time
  `).all(id, today) as any[];
  
  const formattedSlots: TimeSlot[] = slots.map(s => ({
    id: s.id,
    time: s.time,
    period: s.period as TimeSlot['period'],
    available: s.available,
    total: s.total,
    status: s.available === 0 ? 'full' : s.available < 5 ? 'limited' : 'available'
  }));
  
  const response: ApiResponse<TimeSlot[]> = {
    code: 0,
    message: '获取成功',
    data: formattedSlots
  };
  
  res.json(response);
});

router.post('/appointment', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const { hospitalId, doctorId, date, timeSlot } = req.body as {
    hospitalId: string;
    doctorId: string;
    date: string;
    timeSlot: string;
  };
  
  if (!hospitalId || !doctorId || !date || !timeSlot) {
    const response: ApiResponse<null> = {
      code: 400,
      message: '缺少必要参数',
      data: null
    };
    res.status(400).json(response);
    return;
  }
  
  const db = getDb();
  
  const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(hospitalId) as any;
  const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(doctorId) as any;
  const department = db.prepare('SELECT * FROM departments WHERE id = ?').get(doctor.department_id) as any;
  
  if (!hospital || !doctor) {
    const response: ApiResponse<null> = {
      code: 404,
      message: '医院或医生不存在',
      data: null
    };
    res.status(404).json(response);
    return;
  }
  
  const slotId = `${doctorId}_${date}_${timeSlot.replace(':', '')}`;
  const slot = db.prepare('SELECT * FROM time_slots WHERE id = ?').get(slotId) as any;
  
  if (!slot || slot.available <= 0) {
    const response: ApiResponse<null> = {
      code: 400,
      message: '该时段号源已约满',
      data: null
    };
    res.status(400).json(response);
    return;
  }
  
  const existing = db.prepare(`
    SELECT * FROM appointments 
    WHERE user_id = ? AND doctor_id = ? AND date = ? AND time_slot = ?
  `).get(userId, doctorId, date, timeSlot);
  
  if (existing) {
    const response: ApiResponse<null> = {
      code: 400,
      message: '您已预约该时段',
      data: null
    };
    res.status(400).json(response);
    return;
  }
  
  const id = `appt_${Date.now()}`;
  const medicalCode = `MED${Date.now()}`;
  const qrCode = `QR${Date.now()}`;
  
  db.prepare(`
    INSERT INTO appointments (id, user_id, hospital_id, doctor_id, date, time_slot, status, medical_code, qr_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, hospitalId, doctorId, date, timeSlot, 'confirmed', medicalCode, qrCode);
  
  db.prepare('UPDATE time_slots SET available = available - 1 WHERE id = ?').run(slotId);
  
  const appointment: Appointment = {
    id,
    hospital: hospital.name,
    hospitalId,
    department: department.name,
    departmentId: department.id,
    doctor: doctor.name,
    doctorId,
    date,
    timeSlot,
    status: 'confirmed',
    medicalCode,
    qrCode,
    registrationFee: doctor.registration_fee,
    createdAt: new Date().toISOString()
  };
  
  const response: ApiResponse<Appointment> = {
    code: 0,
    message: '预约成功',
    data: appointment
  };
  
  res.json(response);
});

router.get('/appointments', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const db = getDb();
  
  const { status } = req.query as { status?: string };
  
  let sql = `
    SELECT a.*, h.name as hospital_name, d.name as doctor_name, dep.name as dept_name, doc.registration_fee
    FROM appointments a
    LEFT JOIN hospitals h ON a.hospital_id = h.id
    LEFT JOIN doctors d ON a.doctor_id = d.id
    LEFT JOIN departments dep ON d.department_id = dep.id
    LEFT JOIN doctors doc ON a.doctor_id = doc.id
    WHERE a.user_id = ?
  `;
  const params: any[] = [userId];
  
  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY a.date DESC, a.time_slot ASC';
  
  const appointments = db.prepare(sql).all(...params) as any[];
  
  const formattedAppointments: Appointment[] = appointments.map(a => ({
    id: a.id,
    hospital: a.hospital_name,
    hospitalId: a.hospital_id,
    department: a.dept_name,
    departmentId: a.doctor_id.split('_').slice(0, 2).join('_') + '_dept',
    doctor: a.doctor_name,
    doctorId: a.doctor_id,
    date: a.date,
    timeSlot: a.time_slot,
    status: a.status as Appointment['status'],
    medicalCode: a.medical_code,
    qrCode: a.qr_code,
    registrationFee: a.registration_fee,
    createdAt: a.created_at
  }));
  
  const response: ApiResponse<Appointment[]> = {
    code: 0,
    message: '获取成功',
    data: formattedAppointments
  };
  
  res.json(response);
});

export default router;
