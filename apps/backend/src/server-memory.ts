import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  User, Department, Doctor, Patient, MedicalPackage, PackageItem,
  Reservation, ExaminationItem, ExaminationReport, AbnormalItem,
  HealthRecommendation, FollowUpTask, Notification, TriagePath,
  TriageStep, QueueItem
} from './types';
import { config } from './config';

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [
      `http://localhost:${config.ports.client}`,
      `http://localhost:${config.ports.reception}`,
      `http://localhost:${config.ports.doctor}`,
      `http://localhost:${config.ports.dashboard}`,
    ],
    methods: ['GET', 'POST'],
  },
});

interface DatabaseStore {
  users: Map<string, User>;
  departments: Map<string, Department>;
  doctors: Map<string, Doctor>;
  patients: Map<string, Patient>;
  packages: Map<string, MedicalPackage>;
  packageItems: Map<string, PackageItem>;
  reservations: Map<string, Reservation>;
  triagePaths: Map<string, TriagePath>;
  triageSteps: Map<string, TriageStep>;
  examinationItems: Map<string, ExaminationItem>;
  reports: Map<string, ExaminationReport>;
  abnormalItems: Map<string, AbnormalItem>;
  recommendations: Map<string, HealthRecommendation>;
  followupTasks: Map<string, FollowUpTask>;
  notifications: Map<string, Notification>;
  queues: Map<string, QueueItem[]>;
}

const store: DatabaseStore = {
  users: new Map(),
  departments: new Map(),
  doctors: new Map(),
  patients: new Map(),
  packages: new Map(),
  packageItems: new Map(),
  reservations: new Map(),
  triagePaths: new Map(),
  triageSteps: new Map(),
  examinationItems: new Map(),
  reports: new Map(),
  abnormalItems: new Map(),
  recommendations: new Map(),
  followupTasks: new Map(),
  notifications: new Map(),
  queues: new Map()
};

const generateToken = (payload: { userId: string; username: string; role: string; doctorId?: string }): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

const verifyToken = (token: string): { userId: string; username: string; role: string; doctorId?: string } | null => {
  try {
    return jwt.verify(token, config.jwt.secret) as any;
  } catch {
    return null;
  }
};

const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ message: '令牌无效或已过期' });
  }

  (req as any).user = payload;
  next();
};

const initMemoryDatabase = () => {
  const departmentId1 = uuidv4();
  const departmentId2 = uuidv4();
  const departmentId3 = uuidv4();
  const departmentId4 = uuidv4();
  const departmentId5 = uuidv4();
  const departmentId6 = uuidv4();

  const departments: Department[] = [
    {
      id: departmentId1, name: '内科', code: 'INTERNAL', description: '内科检查',
      capacity: 5, averageTime: 15, status: 'active', priority: 1,
      createdAt: new Date(), updatedAt: new Date()
    },
    {
      id: departmentId2, name: '外科', code: 'SURGERY', description: '外科检查',
      capacity: 4, averageTime: 10, status: 'active', priority: 2,
      createdAt: new Date(), updatedAt: new Date()
    },
    {
      id: departmentId3, name: '放射科', code: 'RADIOLOGY', description: '影像学检查',
      capacity: 3, averageTime: 20, status: 'active', priority: 3,
      createdAt: new Date(), updatedAt: new Date()
    },
    {
      id: departmentId4, name: '检验科', code: 'LABORATORY', description: '血液、生化等检查',
      capacity: 8, averageTime: 5, status: 'active', priority: 4,
      createdAt: new Date(), updatedAt: new Date()
    },
    {
      id: departmentId5, name: '心电图', code: 'ECG', description: '心电图检查',
      capacity: 2, averageTime: 8, status: 'active', priority: 5,
      createdAt: new Date(), updatedAt: new Date()
    },
    {
      id: departmentId6, name: '超声科', code: 'ULTRASOUND', description: '超声检查',
      capacity: 3, averageTime: 15, status: 'active', priority: 6,
      createdAt: new Date(), updatedAt: new Date()
    }
  ];
  departments.forEach(d => store.departments.set(d.id, d));

  const doctorId1 = uuidv4();
  const doctorId2 = uuidv4();
  const doctorId3 = uuidv4();
  const doctorId4 = uuidv4();

  const doctors: Doctor[] = [
    {
      id: doctorId1, userId: uuidv4(), departmentId: departmentId1,
      name: '张医生', title: '主任医师', specialization: '内科诊断',
      licenseNumber: 'LIC001', status: 'active',
      createdAt: new Date(), updatedAt: new Date()
    },
    {
      id: doctorId2, userId: uuidv4(), departmentId: departmentId2,
      name: '李医生', title: '副主任医师', specialization: '外科检查',
      licenseNumber: 'LIC002', status: 'active',
      createdAt: new Date(), updatedAt: new Date()
    },
    {
      id: doctorId3, userId: uuidv4(), departmentId: departmentId3,
      name: '王医生', title: '主治医师', specialization: '影像学诊断',
      licenseNumber: 'LIC003', status: 'active',
      createdAt: new Date(), updatedAt: new Date()
    },
    {
      id: doctorId4, userId: uuidv4(), departmentId: departmentId4,
      name: '赵医生', title: '检验技师', specialization: '血液生化检验',
      licenseNumber: 'LIC004', status: 'active',
      createdAt: new Date(), updatedAt: new Date()
    }
  ];
  doctors.forEach(d => store.doctors.set(d.id, d));

  const userId1 = uuidv4();
  const userId2 = uuidv4();
  const userId3 = uuidv4();
  const userId4 = uuidv4();
  const userId5 = uuidv4();

  const users: User[] = [
    {
      id: userId1, username: 'admin', passwordHash: 'admin',
      role: 'admin', name: '系统管理员', phone: '13800000001',
      email: 'admin@hospital.com', status: 'active',
      lastLoginAt: null, createdAt: new Date(), updatedAt: new Date()
    },
    {
      id: userId2, username: 'reception', passwordHash: 'reception',
      role: 'reception', name: '前台接待', phone: '13800000002',
      email: 'reception@hospital.com', status: 'active',
      lastLoginAt: null, createdAt: new Date(), updatedAt: new Date()
    },
    {
      id: userId3, username: 'doctor', passwordHash: 'doctor',
      role: 'doctor', doctorId: doctorId1,
      name: '张医生', phone: '13800000003',
      email: 'zhang@hospital.com', status: 'active',
      lastLoginAt: null, createdAt: new Date(), updatedAt: new Date()
    },
    {
      id: userId4, username: 'chief_doctor', passwordHash: 'chief_doctor',
      role: 'chief_doctor', name: '总检医生', phone: '13800000004',
      email: 'chief@hospital.com', status: 'active',
      lastLoginAt: null, createdAt: new Date(), updatedAt: new Date()
    },
    {
      id: userId5, username: 'patient', passwordHash: 'patient',
      role: 'patient', name: '测试患者', phone: '13800000005',
      email: 'patient@test.com', status: 'active',
      lastLoginAt: null, createdAt: new Date(), updatedAt: new Date()
    }
  ];
  users.forEach(u => store.users.set(u.id, u));

  const packageId1 = uuidv4();
  const packageId2 = uuidv4();
  const packageId3 = uuidv4();

  const packages: MedicalPackage[] = [
    {
      id: packageId1, name: '基础体检套餐', code: 'BASIC_001',
      description: '适合常规健康检查', category: 'basic',
      price: 299, originalPrice: 399, status: 'active',
      isPopular: false, estimatedTime: 45, applicableGender: 'all',
      minAge: 18, maxAge: 99, contraindications: '', notes: '空腹检查',
      sortOrder: 1, createdAt: new Date(), updatedAt: new Date()
    },
    {
      id: packageId2, name: '标准体检套餐', code: 'STANDARD_001',
      description: '适合中年人群全面检查', category: 'standard',
      price: 599, originalPrice: 799, status: 'active',
      isPopular: true, estimatedTime: 90, applicableGender: 'all',
      minAge: 30, maxAge: 99, contraindications: '', notes: '空腹检查，带身份证',
      sortOrder: 2, createdAt: new Date(), updatedAt: new Date()
    },
    {
      id: packageId3, name: '高端体检套餐', code: 'PREMIUM_001',
      description: '适合中老年高端健康管理', category: 'premium',
      price: 1599, originalPrice: 2299, status: 'active',
      isPopular: false, estimatedTime: 180, applicableGender: 'all',
      minAge: 40, maxAge: 99, contraindications: '', notes: '空腹检查，提前预约',
      sortOrder: 3, createdAt: new Date(), updatedAt: new Date()
    }
  ];
  packages.forEach(p => store.packages.set(p.id, p));

  const packageItems: PackageItem[] = [
    { id: uuidv4(), packageId: packageId1, departmentId: departmentId1, itemName: '内科检查', itemCode: 'INTERNAL_EXAM', itemType: 'examination' as const, price: 50, sortOrder: 1, estimatedTime: 15, isRequired: true, createdAt: new Date(), updatedAt: new Date() },
    { id: uuidv4(), packageId: packageId1, departmentId: departmentId4, itemName: '血常规', itemCode: 'BLOOD_ROUTINE', itemType: 'laboratory' as const, price: 30, sortOrder: 2, estimatedTime: 5, isRequired: true, createdAt: new Date(), updatedAt: new Date() },
    { id: uuidv4(), packageId: packageId1, departmentId: departmentId5, itemName: '心电图', itemCode: 'ECG', itemType: 'examination' as const, price: 40, sortOrder: 3, estimatedTime: 8, isRequired: true, createdAt: new Date(), updatedAt: new Date() },
    { id: uuidv4(), packageId: packageId2, departmentId: departmentId1, itemName: '内科检查', itemCode: 'INTERNAL_EXAM', itemType: 'examination' as const, price: 50, sortOrder: 1, estimatedTime: 15, isRequired: true, createdAt: new Date(), updatedAt: new Date() },
    { id: uuidv4(), packageId: packageId2, departmentId: departmentId2, itemName: '外科检查', itemCode: 'SURGERY_EXAM', itemType: 'examination' as const, price: 40, sortOrder: 2, estimatedTime: 10, isRequired: true, createdAt: new Date(), updatedAt: new Date() },
    { id: uuidv4(), packageId: packageId2, departmentId: departmentId4, itemName: '血常规', itemCode: 'BLOOD_ROUTINE', itemType: 'laboratory' as const, price: 30, sortOrder: 3, estimatedTime: 5, isRequired: true, createdAt: new Date(), updatedAt: new Date() },
    { id: uuidv4(), packageId: packageId2, departmentId: departmentId4, itemName: '生化全套', itemCode: 'BIOCHEMISTRY', itemType: 'laboratory' as const, price: 180, sortOrder: 4, estimatedTime: 10, isRequired: true, createdAt: new Date(), updatedAt: new Date() },
    { id: uuidv4(), packageId: packageId2, departmentId: departmentId5, itemName: '心电图', itemCode: 'ECG', itemType: 'examination' as const, price: 40, sortOrder: 5, estimatedTime: 8, isRequired: true, createdAt: new Date(), updatedAt: new Date() },
    { id: uuidv4(), packageId: packageId3, departmentId: departmentId1, itemName: '内科检查', itemCode: 'INTERNAL_EXAM', itemType: 'examination' as const, price: 50, sortOrder: 1, estimatedTime: 15, isRequired: true, createdAt: new Date(), updatedAt: new Date() },
    { id: uuidv4(), packageId: packageId3, departmentId: departmentId2, itemName: '外科检查', itemCode: 'SURGERY_EXAM', itemType: 'examination' as const, price: 40, sortOrder: 2, estimatedTime: 10, isRequired: true, createdAt: new Date(), updatedAt: new Date() },
    { id: uuidv4(), packageId: packageId3, departmentId: departmentId3, itemName: '胸部CT', itemCode: 'CHEST_CT', itemType: 'radiology' as const, price: 400, sortOrder: 3, estimatedTime: 20, isRequired: true, createdAt: new Date(), updatedAt: new Date() },
    { id: uuidv4(), packageId: packageId3, departmentId: departmentId4, itemName: '血常规', itemCode: 'BLOOD_ROUTINE', itemType: 'laboratory' as const, price: 30, sortOrder: 4, estimatedTime: 5, isRequired: true, createdAt: new Date(), updatedAt: new Date() },
    { id: uuidv4(), packageId: packageId3, departmentId: departmentId4, itemName: '生化全套', itemCode: 'BIOCHEMISTRY', itemType: 'laboratory' as const, price: 180, sortOrder: 5, estimatedTime: 10, isRequired: true, createdAt: new Date(), updatedAt: new Date() },
    { id: uuidv4(), packageId: packageId3, departmentId: departmentId5, itemName: '心电图', itemCode: 'ECG', itemType: 'examination' as const, price: 40, sortOrder: 6, estimatedTime: 8, isRequired: true, createdAt: new Date(), updatedAt: new Date() },
    { id: uuidv4(), packageId: packageId3, departmentId: departmentId6, itemName: '腹部彩超', itemCode: 'ABDOMINAL_ULTRASOUND', itemType: 'ultrasound' as const, price: 200, sortOrder: 7, estimatedTime: 15, isRequired: true, createdAt: new Date(), updatedAt: new Date() }
  ];
  packageItems.forEach(p => store.packageItems.set(p.id, p));

  const recommendations: HealthRecommendation[] = [
    { id: uuidv4(), abnormalType: 'high_glucose', riskLevel: 'medium' as const, title: '血糖偏高', content: '建议控制碳水化合物摄入，规律运动，定期监测血糖。', lifestyleAdvice: '1. 控制主食摄入量，选择低GI食物\n2. 每周至少150分钟中等强度运动\n3. 戒烟限酒\n4. 保持充足睡眠', dietaryAdvice: '1. 减少精制糖和甜食摄入\n2. 增加膳食纤维摄入\n3. 控制总热量摄入\n4. 规律进餐，避免暴饮暴食', followupAdvice: '建议3个月后复查空腹血糖，如持续升高请内分泌科就诊。', createdAt: new Date(), updatedAt: new Date() },
    { id: uuidv4(), abnormalType: 'high_cholesterol', riskLevel: 'medium' as const, title: '血脂异常', content: '总胆固醇或低密度脂蛋白偏高，增加心血管疾病风险。', lifestyleAdvice: '1. 规律运动，每周至少150分钟\n2. 控制体重，BMI保持在18.5-23.9\n3. 戒烟限酒\n4. 保持心理平衡', dietaryAdvice: '1. 减少饱和脂肪和胆固醇摄入\n2. 增加膳食纤维和不饱和脂肪\n3. 控制总热量摄入\n4. 增加蔬果摄入', followupAdvice: '建议3-6个月复查血脂，如持续异常建议心血管内科就诊。', createdAt: new Date(), updatedAt: new Date() },
    { id: uuidv4(), abnormalType: 'critical', riskLevel: 'critical' as const, title: '危急值', content: '检查结果存在危急值，请立即就医。', lifestyleAdvice: '立即就医，遵医嘱治疗。', dietaryAdvice: '遵医嘱调整饮食。', followupAdvice: '请立即前往医院急诊科或相关科室就诊。', createdAt: new Date(), updatedAt: new Date() }
  ];
  recommendations.forEach(r => store.recommendations.set(r.id, r));

  console.log('Memory database initialized with seed data.');
  console.log('\n========================================');
  console.log('  体检中心管理系统 - 后端服务 (内存版)');
  console.log('========================================');
  console.log('\n默认账号信息:');
  console.log('  管理员:  admin / admin');
  console.log('  前台:    reception / reception');
  console.log('  医生:    doctor / doctor');
  console.log('  总检:    chief_doctor / chief_doctor');
  console.log('  患者:    patient / patient\n');
};

app.use(helmet());
app.use(cors({
  origin: [
    `http://localhost:${config.ports.client}`,
    `http://localhost:${config.ports.reception}`,
    `http://localhost:${config.ports.doctor}`,
    `http://localhost:${config.ports.dashboard}`,
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.env,
    database: 'in-memory',
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    ports: {
      api: config.ports.api,
      socket: config.ports.socket,
    },
    environment: config.env,
  });
});

const authRouter = express.Router();

authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = Array.from(store.users.values()).find(u => u.username === username);
    
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: '账号已被禁用' });
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      doctorId: user.doctorId
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        doctorId: user.doctorId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '登录失败' });
  }
});

authRouter.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: '登出成功' });
});

authRouter.get('/current', authenticateToken, (req, res) => {
  const userPayload = (req as any).user;
  const user = store.users.get(userPayload.userId);
  
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }

  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    phone: user.phone,
    email: user.email,
    doctorId: user.doctorId
  });
});

app.use('/api/auth', authRouter);

const packagesRouter = express.Router();

packagesRouter.get('/', async (req, res) => {
  const packages = Array.from(store.packages.values())
    .filter(p => p.status === 'active')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  
  const packagesWithItems = packages.map(pkg => {
    const items = Array.from(store.packageItems.values())
      .filter(item => item.packageId === pkg.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    
    return { ...pkg, items };
  });

  res.json(packagesWithItems);
});

packagesRouter.get('/:id', async (req, res) => {
  const pkg = store.packages.get(req.params.id);
  
  if (!pkg) {
    return res.status(404).json({ message: '套餐不存在' });
  }

  const items = Array.from(store.packageItems.values())
    .filter(item => item.packageId === pkg.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  res.json({ ...pkg, items });
});

packagesRouter.get('/:id/available-slots', async (req, res) => {
  const slots = [];
  const today = new Date();
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const times = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00'];
    
    slots.push({
      date: dateStr,
      slots: times.map(time => ({
        time,
        available: Math.random() > 0.3,
        capacity: 5,
        booked: Math.floor(Math.random() * 4)
      }))
    });
  }

  res.json(slots);
});

app.use('/api/packages', packagesRouter);

const reservationsRouter = express.Router();

reservationsRouter.post('/', authenticateToken, async (req, res) => {
  const userPayload = (req as any).user;
  const { packageId, reservationDate, reservationTime, patientName, patientPhone, patientIdCard, patientGender, patientAge, patientEmail } = req.body;

  const pkg = store.packages.get(packageId);
  if (!pkg) {
    return res.status(404).json({ message: '套餐不存在' });
  }

  let patientId = userPayload.userId;
  let patient = store.patients.get(patientId);

  if (!patient) {
    patientId = uuidv4();
    patient = {
      id: patientId,
      userId: userPayload.userId,
      name: patientName || userPayload.username,
      phone: patientPhone || '',
      idCard: patientIdCard || '',
      gender: (patientGender as any) || 'unknown',
      birthDate: patientAge ? new Date(new Date().getFullYear() - patientAge, 0, 1) : null,
      email: patientEmail || '',
      bloodType: null,
      allergies: null,
      medicalHistory: null,
      status: 'active',
      lastExamDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    store.patients.set(patientId, patient);
  }

  const reservationCode = 'RV' + Date.now().toString().slice(-8);

  const reservation: Reservation = {
    id: uuidv4(),
    patientId: patientId,
    packageId: packageId,
    reservationCode: reservationCode,
    reservationDate: new Date(reservationDate),
    reservationTime: reservationTime,
    status: 'reserved',
    checkInTime: null,
    checkInUserId: null,
    triagePathId: null,
    estimatedEndTime: null,
    actualEndTime: null,
    paymentStatus: 'pending',
    totalAmount: pkg.price,
    paidAmount: 0,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  store.reservations.set(reservation.id, reservation);

  res.json(reservation);
});

reservationsRouter.get('/', authenticateToken, async (req, res) => {
  const userPayload = (req as any).user;
  const { status } = req.query;

  let reservations = Array.from(store.reservations.values());

  if (status) {
    reservations = reservations.filter(r => r.status === status);
  }

  if (userPayload.role === 'patient') {
    reservations = reservations.filter(r => {
      const patient = store.patients.get(r.patientId);
      return patient?.userId === userPayload.userId;
    });
  }

  const reservationsWithDetails = reservations.map(r => {
    const pkg = store.packages.get(r.packageId);
    const patient = store.patients.get(r.patientId);
    
    return {
      ...r,
      package: pkg,
      patient
    };
  });

  res.json(reservationsWithDetails.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ));
});

reservationsRouter.get('/:id', authenticateToken, async (req, res) => {
  const reservation = store.reservations.get(req.params.id);
  
  if (!reservation) {
    return res.status(404).json({ message: '预约不存在' });
  }

  const pkg = store.packages.get(reservation.packageId);
  const patient = store.patients.get(reservation.patientId);
  const packageItems = Array.from(store.packageItems.values())
    .filter(item => item.packageId === reservation.packageId);

  res.json({
    ...reservation,
    package: pkg,
    patient,
    packageItems
  });
});

reservationsRouter.post('/:id/checkin', authenticateToken, async (req, res) => {
  const userPayload = (req as any).user;
  const reservation = store.reservations.get(req.params.id);

  if (!reservation) {
    return res.status(404).json({ message: '预约不存在' });
  }

  if (reservation.status !== 'reserved') {
    return res.status(400).json({ message: '该预约状态不允许签到' });
  }

  reservation.status = 'checked_in';
  reservation.checkInTime = new Date();
  reservation.checkInUserId = userPayload.userId;
  reservation.updatedAt = new Date();

  const packageItems = Array.from(store.packageItems.values())
    .filter(item => item.packageId === reservation.packageId);

  const departmentGroups = new Map<string, typeof packageItems>();
  packageItems.forEach(item => {
    const deptItems = departmentGroups.get(item.departmentId) || [];
    deptItems.push(item);
    departmentGroups.set(item.departmentId, deptItems);
  });

  const triageSteps: TriageStep[] = [];
  let stepNumber = 1;

  departmentGroups.forEach((items, departmentId) => {
    const department = store.departments.get(departmentId);
    const step: TriageStep = {
      id: uuidv4(),
      triagePathId: '',
      stepNumber: stepNumber++,
      departmentId: departmentId,
      departmentName: department?.name || '',
      items: items.map(item => item.id),
      estimatedTime: items.reduce((sum, i) => sum + (i.estimatedTime || 0), 0),
      status: 'pending',
      actualStartTime: null,
      actualEndTime: null,
      doctorId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    triageSteps.push(step);

    const queueItem: QueueItem = {
      reservationId: reservation.id,
      patientId: reservation.patientId,
      patientName: store.patients.get(reservation.patientId)?.name || '',
      stepNumber: step.stepNumber,
      estimatedTime: step.estimatedTime,
      joinedAt: new Date(),
      priority: 1
    };

    let queue = store.queues.get(departmentId) || [];
    queue.push(queueItem);
    store.queues.set(departmentId, queue);
  });

  const triagePath: TriagePath = {
    id: uuidv4(),
    reservationId: reservation.id,
    patientId: reservation.patientId,
    totalSteps: triageSteps.length,
    currentStep: 1,
    status: 'in_progress',
    estimatedTotalTime: triageSteps.reduce((sum, s) => sum + s.estimatedTime, 0),
    actualStartTime: new Date(),
    actualEndTime: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  triageSteps.forEach(step => step.triagePathId = triagePath.id);
  triageSteps.forEach(step => store.triageSteps.set(step.id, step));
  store.triagePaths.set(triagePath.id, triagePath);

  reservation.triagePathId = triagePath.id;
  reservation.status = 'in_examination';

  io.emit('queue:update', {
    departmentId: triageSteps[0]?.departmentId,
    queue: store.queues.get(triageSteps[0]?.departmentId || '') || []
  });

  res.json({
    reservation,
    triagePath,
    triageSteps
  });
});

reservationsRouter.post('/:id/cancel', authenticateToken, async (req, res) => {
  const reservation = store.reservations.get(req.params.id);

  if (!reservation) {
    return res.status(404).json({ message: '预约不存在' });
  }

  if (!['reserved', 'checked_in'].includes(reservation.status)) {
    return res.status(400).json({ message: '该预约状态不允许取消' });
  }

  reservation.status = 'cancelled';
  reservation.updatedAt = new Date();

  res.json(reservation);
});

app.use('/api/reservations', reservationsRouter);

const examinationsRouter = express.Router();

examinationsRouter.get('/queues/:departmentId', authenticateToken, async (req, res) => {
  const departmentId = req.params.departmentId;
  const queue = store.queues.get(departmentId) || [];

  res.json({
    departmentId,
    queue,
    current: queue[0] || null,
    waiting: queue.length
  });
});

examinationsRouter.post('/queues/:departmentId/call', authenticateToken, async (req, res) => {
  const userPayload = (req as any).user;
  const departmentId = req.params.departmentId;
  const queue = store.queues.get(departmentId) || [];

  if (queue.length === 0) {
    return res.status(404).json({ message: '队列为空' });
  }

  const current = queue[0];

  io.emit('queue:called', {
    departmentId,
    patientId: current.patientId,
    patientName: current.patientName
  });

  res.json({ current, queue: queue.slice(1) });
});

examinationsRouter.post('/results', authenticateToken, async (req, res) => {
  const userPayload = (req as any).user;
  const { reservationId, packageItemId, results, isAbnormal, notes } = req.body;

  const examItem: ExaminationItem = {
    id: uuidv4(),
    reservationId: reservationId,
    packageItemId: packageItemId,
    doctorId: userPayload.doctorId,
    status: 'completed',
    results: results,
    isAbnormal: isAbnormal || false,
    isCritical: false,
    notes: notes,
    startedAt: new Date(),
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  store.examinationItems.set(examItem.id, examItem);

  if (isAbnormal) {
    const abnormalItem: AbnormalItem = {
      id: uuidv4(),
      examinationItemId: examItem.id,
      reservationId: reservationId,
      itemName: '检查项目',
      itemCode: '',
      resultValue: '',
      unit: '',
      referenceRange: '',
      abnormalType: 'high',
      riskLevel: 'medium',
      isCritical: false,
      processed: false,
      processedBy: null,
      processedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    store.abnormalItems.set(abnormalItem.id, abnormalItem);
  }

  res.json(examItem);
});

examinationsRouter.get('/reservations/:id', authenticateToken, async (req, res) => {
  const reservation = store.reservations.get(req.params.id);
  
  if (!reservation) {
    return res.status(404).json({ message: '预约不存在' });
  }

  const packageItems = Array.from(store.packageItems.values())
    .filter(item => item.packageId === reservation.packageId);
  
  const examinationItems = Array.from(store.examinationItems.values())
    .filter(item => item.reservationId === reservation.id);

  const triageSteps = Array.from(store.triageSteps.values())
    .filter(step => step.triagePathId === reservation.triagePathId)
    .sort((a, b) => a.stepNumber - b.stepNumber);

  res.json({
    reservation,
    packageItems,
    examinationItems,
    triageSteps
  });
});

app.use('/api/examinations', examinationsRouter);

const reportsRouter = express.Router();

reportsRouter.post('/generate', authenticateToken, async (req, res) => {
  const userPayload = (req as any).user;
  const { reservationId } = req.body;

  const reservation = store.reservations.get(reservationId);
  if (!reservation) {
    return res.status(404).json({ message: '预约不存在' });
  }

  const examinationItems = Array.from(store.examinationItems.values())
    .filter(item => item.reservationId === reservationId);

  const abnormalItems = Array.from(store.abnormalItems.values())
    .filter(item => item.reservationId === reservationId);

  const recommendations = abnormalItems.length > 0 
    ? Array.from(store.recommendations.values()).slice(0, abnormalItems.length)
    : [];

  const report: ExaminationReport = {
    id: uuidv4(),
    reservationId: reservationId,
    patientId: reservation.patientId,
    reportNumber: 'RPT' + Date.now(),
    status: 'draft',
    chiefDoctorId: userPayload.role === 'chief_doctor' ? userPayload.userId : null,
    summary: '体检报告摘要：各项检查已完成。',
    conclusion: abnormalItems.length > 0 
      ? '存在异常指标，建议进一步检查或复查。' 
      : '各项检查指标基本正常，建议保持健康生活方式。',
    recommendations: recommendations.map(r => r.id),
    isReviewed: false,
    reviewedAt: null,
    reviewedBy: null,
    pdfPath: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  store.reports.set(report.id, report);

  reservation.status = 'report_generated';
  reservation.actualEndTime = new Date();
  reservation.updatedAt = new Date();

  res.json({
    report,
    examinationItems,
    abnormalItems,
    recommendations
  });
});

reportsRouter.get('/:id', authenticateToken, async (req, res) => {
  const report = store.reports.get(req.params.id);
  
  if (!report) {
    return res.status(404).json({ message: '报告不存在' });
  }

  const reservation = store.reservations.get(report.reservationId);
  const patient = store.patients.get(report.patientId);
  const examinationItems = Array.from(store.examinationItems.values())
    .filter(item => item.reservationId === report.reservationId);
  const abnormalItems = Array.from(store.abnormalItems.values())
    .filter(item => item.reservationId === report.reservationId);

  res.json({
    report,
    reservation,
    patient,
    examinationItems,
    abnormalItems
  });
});

reportsRouter.get('/', authenticateToken, async (req, res) => {
  const userPayload = (req as any).user;
  
  let reports = Array.from(store.reports.values());

  if (userPayload.role === 'patient') {
    const patient = Array.from(store.patients.values()).find(p => p.userId === userPayload.userId);
    if (patient) {
      reports = reports.filter(r => r.patientId === patient.id);
    }
  }

  const reportsWithDetails = reports.map(r => {
    const reservation = store.reservations.get(r.reservationId);
    const patient = store.patients.get(r.patientId);
    return { ...r, reservation, patient };
  });

  res.json(reportsWithDetails.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ));
});

app.use('/api/reports', reportsRouter);

const patientsRouter = express.Router();

patientsRouter.get('/me', authenticateToken, async (req, res) => {
  const userPayload = (req as any).user;
  
  let patient = Array.from(store.patients.values()).find(p => p.userId === userPayload.userId);
  
  if (!patient) {
    patient = {
      id: uuidv4(),
      userId: userPayload.userId,
      name: userPayload.username,
      phone: '',
      idCard: '',
      gender: 'unknown',
      birthDate: null,
      email: '',
      bloodType: null,
      allergies: null,
      medicalHistory: null,
      status: 'active',
      lastExamDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    store.patients.set(patient.id, patient);
  }

  res.json(patient);
});

patientsRouter.put('/me', authenticateToken, async (req, res) => {
  const userPayload = (req as any).user;
  const { name, phone, idCard, gender, birthDate, email, bloodType, allergies, medicalHistory } = req.body;

  let patient = Array.from(store.patients.values()).find(p => p.userId === userPayload.userId);
  
  if (!patient) {
    patient = {
      id: uuidv4(),
      userId: userPayload.userId,
      name: name || userPayload.username,
      phone: phone || '',
      idCard: idCard || '',
      gender: gender || 'unknown',
      birthDate: birthDate ? new Date(birthDate) : null,
      email: email || '',
      bloodType: bloodType || null,
      allergies: allergies || null,
      medicalHistory: medicalHistory || null,
      status: 'active',
      lastExamDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    store.patients.set(patient.id, patient);
  } else {
    if (name) patient.name = name;
    if (phone) patient.phone = phone;
    if (idCard) patient.idCard = idCard;
    if (gender) patient.gender = gender;
    if (birthDate) patient.birthDate = new Date(birthDate);
    if (email) patient.email = email;
    if (bloodType) patient.bloodType = bloodType;
    if (allergies) patient.allergies = allergies;
    if (medicalHistory) patient.medicalHistory = medicalHistory;
    patient.updatedAt = new Date();
  }

  res.json(patient);
});

app.use('/api/patients', patientsRouter);

const followupRouter = express.Router();

followupRouter.get('/', authenticateToken, async (req, res) => {
  const tasks = Array.from(store.followupTasks.values());
  res.json(tasks);
});

followupRouter.post('/:id/complete', authenticateToken, async (req, res) => {
  const userPayload = (req as any).user;
  const task = store.followupTasks.get(req.params.id);

  if (!task) {
    return res.status(404).json({ message: '随访任务不存在' });
  }

  task.status = 'completed';
  task.completedBy = userPayload.userId;
  task.completedAt = new Date();
  task.updatedAt = new Date();

  res.json(task);
});

app.use('/api/followup', followupRouter);

const notificationsRouter = express.Router();

notificationsRouter.get('/', authenticateToken, async (req, res) => {
  const userPayload = (req as any).user;
  
  const notifications = Array.from(store.notifications.values())
    .filter(n => n.userId === userPayload.userId || n.userId === null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(notifications);
});

notificationsRouter.post('/:id/read', authenticateToken, async (req, res) => {
  const notification = store.notifications.get(req.params.id);

  if (!notification) {
    return res.status(404).json({ message: '通知不存在' });
  }

  notification.isRead = true;
  notification.readAt = new Date();
  notification.updatedAt = new Date();

  res.json(notification);
});

app.use('/api/notifications', notificationsRouter);

const departmentsRouter = express.Router();

departmentsRouter.get('/', authenticateToken, async (req, res) => {
  const departments = Array.from(store.departments.values())
    .filter(d => d.status === 'active')
    .sort((a, b) => a.priority - b.priority);

  const departmentsWithQueue = departments.map(dept => {
    const queue = store.queues.get(dept.id) || [];
    return {
      ...dept,
      queueLength: queue.length,
      currentPatient: queue[0]?.patientName || null
    };
  });

  res.json(departmentsWithQueue);
});

departmentsRouter.get('/:id', authenticateToken, async (req, res) => {
  const department = store.departments.get(req.params.id);
  
  if (!department) {
    return res.status(404).json({ message: '科室不存在' });
  }

  const queue = store.queues.get(department.id) || [];
  const doctors = Array.from(store.doctors.values()).filter(d => d.departmentId === department.id);

  res.json({
    department,
    queue,
    doctors
  });
});

app.use('/api/departments', departmentsRouter);

const doctorsRouter = express.Router();

doctorsRouter.get('/', authenticateToken, async (req, res) => {
  const { departmentId } = req.query;
  
  let doctors = Array.from(store.doctors.values())
    .filter(d => d.status === 'active');

  if (departmentId) {
    doctors = doctors.filter(d => d.departmentId === departmentId);
  }

  const doctorsWithDept = doctors.map(doc => {
    const dept = store.departments.get(doc.departmentId);
    return { ...doc, departmentName: dept?.name };
  });

  res.json(doctorsWithDept);
});

app.use('/api/doctors', doctorsRouter);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ message: '请求体格式错误' });
  }

  res.status(500).json({ 
    message: config.isDevelopment ? err.message : '服务器内部错误',
  });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join:department', (departmentId: string) => {
    socket.join(`department:${departmentId}`);
    console.log(`Socket ${socket.id} joined department:${departmentId}`);
  });

  socket.on('leave:department', (departmentId: string) => {
    socket.leave(`department:${departmentId}`);
    console.log(`Socket ${socket.id} left department:${departmentId}`);
  });

  socket.on('join:patient', (patientId: string) => {
    socket.join(`patient:${patientId}`);
  });

  socket.on('leave:patient', (patientId: string) => {
    socket.leave(`patient:${patientId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const startServer = async () => {
  try {
    console.log('Initializing in-memory database...');
    initMemoryDatabase();

    httpServer.listen(config.ports.api, () => {
      console.log(`\n========================================`);
      console.log(`  体检中心管理系统 - 后端服务`);
      console.log(`========================================`);
      console.log(`  API Port:      ${config.ports.api}`);
      console.log(`  Socket Port:   ${config.ports.socket}`);
      console.log(`  Environment:   ${config.env}`);
      console.log(`  Database:      In-Memory`);
      console.log(`========================================\n`);
      
      console.log(`服务地址:`);
      console.log(`  API:   http://localhost:${config.ports.api}`);
      console.log(`  健康检查: http://localhost:${config.ports.api}/health\n`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, httpServer, io, store };
