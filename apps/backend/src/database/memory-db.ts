import { 
  User, Department, Doctor, Patient, MedicalPackage, PackageItem, 
  NormalRange, Reservation, TriagePath, TriageStep, ExaminationItem,
  ExaminationReport, AbnormalItem, HealthRecommendation, FollowUpTask,
  Notification, AuditLog, OfflineOperation, QueueItem
} from '../types';
import { v4 as uuidv4 } from 'uuid';

interface DatabaseStore {
  users: Map<string, User>;
  departments: Map<string, Department>;
  doctors: Map<string, Doctor>;
  patients: Map<string, Patient>;
  packages: Map<string, MedicalPackage>;
  packageItems: Map<string, PackageItem>;
  normalRanges: Map<string, NormalRange>;
  reservations: Map<string, Reservation>;
  triagePaths: Map<string, TriagePath>;
  triageSteps: Map<string, TriageStep>;
  examinationItems: Map<string, ExaminationItem>;
  reports: Map<string, ExaminationReport>;
  abnormalItems: Map<string, AbnormalItem>;
  recommendations: Map<string, HealthRecommendation>;
  followupTasks: Map<string, FollowUpTask>;
  notifications: Map<string, Notification>;
  auditLogs: Map<string, AuditLog>;
  offlineOperations: Map<string, OfflineOperation>;
  queues: Map<string, QueueItem[]>;
  patientStatus: Map<string, string>;
}

let store: DatabaseStore = {
  users: new Map(),
  departments: new Map(),
  doctors: new Map(),
  patients: new Map(),
  packages: new Map(),
  packageItems: new Map(),
  normalRanges: new Map(),
  reservations: new Map(),
  triagePaths: new Map(),
  triageSteps: new Map(),
  examinationItems: new Map(),
  reports: new Map(),
  abnormalItems: new Map(),
  recommendations: new Map(),
  followupTasks: new Map(),
  notifications: new Map(),
  auditLogs: new Map(),
  offlineOperations: new Map(),
  queues: new Map(),
  patientStatus: new Map()
};

export const query = async (text: string, params?: unknown[]): Promise<any> => {
  console.log('Query (in-memory):', text, params);
  return { rows: [], rowCount: 0 };
};

export const pool = {
  query: query,
  end: async () => { console.log('Pool connection ended (in-memory)'); }
};

export const initMemoryDatabase = () => {
  const departmentId1 = uuidv4();
  const departmentId2 = uuidv4();
  const departmentId3 = uuidv4();
  const departmentId4 = uuidv4();
  const departmentId5 = uuidv4();
  const departmentId6 = uuidv4();

  const departments: Department[] = [
    {
      id: departmentId1,
      name: '内科',
      code: 'INTERNAL',
      description: '内科检查',
      capacity: 5,
      averageTime: 15,
      status: 'active',
      priority: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: departmentId2,
      name: '外科',
      code: 'SURGERY',
      description: '外科检查',
      capacity: 4,
      averageTime: 10,
      status: 'active',
      priority: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: departmentId3,
      name: '放射科',
      code: 'RADIOLOGY',
      description: '影像学检查',
      capacity: 3,
      averageTime: 20,
      status: 'active',
      priority: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: departmentId4,
      name: '检验科',
      code: 'LABORATORY',
      description: '血液、生化等检查',
      capacity: 8,
      averageTime: 5,
      status: 'active',
      priority: 4,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: departmentId5,
      name: '心电图',
      code: 'ECG',
      description: '心电图检查',
      capacity: 2,
      averageTime: 8,
      status: 'active',
      priority: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: departmentId6,
      name: '超声科',
      code: 'ULTRASOUND',
      description: '超声检查',
      capacity: 3,
      averageTime: 15,
      status: 'active',
      priority: 6,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  departments.forEach(d => store.departments.set(d.id, d));

  const doctorId1 = uuidv4();
  const doctorId2 = uuidv4();
  const doctorId3 = uuidv4();
  const doctorId4 = uuidv4();

  const doctors: Doctor[] = [
    {
      id: doctorId1,
      userId: uuidv4(),
      departmentId: departmentId1,
      name: '张医生',
      title: '主任医师',
      specialization: '内科诊断',
      licenseNumber: 'LIC001',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: doctorId2,
      userId: uuidv4(),
      departmentId: departmentId2,
      name: '李医生',
      title: '副主任医师',
      specialization: '外科检查',
      licenseNumber: 'LIC002',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: doctorId3,
      userId: uuidv4(),
      departmentId: departmentId3,
      name: '王医生',
      title: '主治医师',
      specialization: '影像学诊断',
      licenseNumber: 'LIC003',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: doctorId4,
      userId: uuidv4(),
      departmentId: departmentId4,
      name: '赵医生',
      title: '检验技师',
      specialization: '血液生化检验',
      licenseNumber: 'LIC004',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
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
      id: userId1,
      username: 'admin',
      passwordHash: 'admin',
      role: 'admin',
      name: '系统管理员',
      phone: '13800000001',
      email: 'admin@hospital.com',
      status: 'active',
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: userId2,
      username: 'reception',
      passwordHash: 'reception',
      role: 'reception',
      name: '前台接待',
      phone: '13800000002',
      email: 'reception@hospital.com',
      status: 'active',
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: userId3,
      username: 'doctor',
      passwordHash: 'doctor',
      role: 'doctor',
      doctorId: doctorId1,
      name: '张医生',
      phone: '13800000003',
      email: 'zhang@hospital.com',
      status: 'active',
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: userId4,
      username: 'chief_doctor',
      passwordHash: 'chief_doctor',
      role: 'chief_doctor',
      name: '总检医生',
      phone: '13800000004',
      email: 'chief@hospital.com',
      status: 'active',
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: userId5,
      username: 'patient',
      passwordHash: 'patient',
      role: 'patient',
      name: '测试患者',
      phone: '13800000005',
      email: 'patient@test.com',
      status: 'active',
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  users.forEach(u => store.users.set(u.id, u));

  const packageId1 = uuidv4();
  const packageId2 = uuidv4();
  const packageId3 = uuidv4();

  const packages: MedicalPackage[] = [
    {
      id: packageId1,
      name: '基础体检套餐',
      code: 'BASIC_001',
      description: '适合常规健康检查',
      category: 'basic',
      price: 299,
      originalPrice: 399,
      status: 'active',
      isPopular: false,
      estimatedTime: 45,
      applicableGender: 'all',
      minAge: 18,
      maxAge: 99,
      contraindications: '',
      notes: '空腹检查',
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: packageId2,
      name: '标准体检套餐',
      code: 'STANDARD_001',
      description: '适合中年人群全面检查',
      category: 'standard',
      price: 599,
      originalPrice: 799,
      status: 'active',
      isPopular: true,
      estimatedTime: 90,
      applicableGender: 'all',
      minAge: 30,
      maxAge: 99,
      contraindications: '',
      notes: '空腹检查，带身份证',
      sortOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: packageId3,
      name: '高端体检套餐',
      code: 'PREMIUM_001',
      description: '适合中老年高端健康管理',
      category: 'premium',
      price: 1599,
      originalPrice: 2299,
      status: 'active',
      isPopular: false,
      estimatedTime: 180,
      applicableGender: 'all',
      minAge: 40,
      maxAge: 99,
      contraindications: '',
      notes: '空腹检查，提前预约',
      sortOrder: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  packages.forEach(p => store.packages.set(p.id, p));

  const packageItems: PackageItem[] = [
    {
      id: uuidv4(),
      packageId: packageId1,
      departmentId: departmentId1,
      itemName: '内科检查',
      itemCode: 'INTERNAL_EXAM',
      itemType: 'examination',
      price: 50,
      sortOrder: 1,
      estimatedTime: 15,
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      packageId: packageId1,
      departmentId: departmentId4,
      itemName: '血常规',
      itemCode: 'BLOOD_ROUTINE',
      itemType: 'laboratory',
      price: 30,
      sortOrder: 2,
      estimatedTime: 5,
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      packageId: packageId1,
      departmentId: departmentId5,
      itemName: '心电图',
      itemCode: 'ECG',
      itemType: 'examination',
      price: 40,
      sortOrder: 3,
      estimatedTime: 8,
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      packageId: packageId2,
      departmentId: departmentId1,
      itemName: '内科检查',
      itemCode: 'INTERNAL_EXAM',
      itemType: 'examination',
      price: 50,
      sortOrder: 1,
      estimatedTime: 15,
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      packageId: packageId2,
      departmentId: departmentId2,
      itemName: '外科检查',
      itemCode: 'SURGERY_EXAM',
      itemType: 'examination',
      price: 40,
      sortOrder: 2,
      estimatedTime: 10,
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      packageId: packageId2,
      departmentId: departmentId4,
      itemName: '血常规',
      itemCode: 'BLOOD_ROUTINE',
      itemType: 'laboratory',
      price: 30,
      sortOrder: 3,
      estimatedTime: 5,
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      packageId: packageId2,
      departmentId: departmentId4,
      itemName: '生化全套',
      itemCode: 'BIOCHEMISTRY',
      itemType: 'laboratory',
      price: 180,
      sortOrder: 4,
      estimatedTime: 10,
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      packageId: packageId2,
      departmentId: departmentId5,
      itemName: '心电图',
      itemCode: 'ECG',
      itemType: 'examination',
      price: 40,
      sortOrder: 5,
      estimatedTime: 8,
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      packageId: packageId3,
      departmentId: departmentId1,
      itemName: '内科检查',
      itemCode: 'INTERNAL_EXAM',
      itemType: 'examination',
      price: 50,
      sortOrder: 1,
      estimatedTime: 15,
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      packageId: packageId3,
      departmentId: departmentId2,
      itemName: '外科检查',
      itemCode: 'SURGERY_EXAM',
      itemType: 'examination',
      price: 40,
      sortOrder: 2,
      estimatedTime: 10,
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      packageId: packageId3,
      departmentId: departmentId3,
      itemName: '胸部CT',
      itemCode: 'CHEST_CT',
      itemType: 'radiology',
      price: 400,
      sortOrder: 3,
      estimatedTime: 20,
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      packageId: packageId3,
      departmentId: departmentId4,
      itemName: '血常规',
      itemCode: 'BLOOD_ROUTINE',
      itemType: 'laboratory',
      price: 30,
      sortOrder: 4,
      estimatedTime: 5,
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      packageId: packageId3,
      departmentId: departmentId4,
      itemName: '生化全套',
      itemCode: 'BIOCHEMISTRY',
      itemType: 'laboratory',
      price: 180,
      sortOrder: 5,
      estimatedTime: 10,
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      packageId: packageId3,
      departmentId: departmentId5,
      itemName: '心电图',
      itemCode: 'ECG',
      itemType: 'examination',
      price: 40,
      sortOrder: 6,
      estimatedTime: 8,
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      packageId: packageId3,
      departmentId: departmentId6,
      itemName: '腹部彩超',
      itemCode: 'ABDOMINAL_ULTRASOUND',
      itemType: 'ultrasound',
      price: 200,
      sortOrder: 7,
      estimatedTime: 15,
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  packageItems.forEach(p => store.packageItems.set(p.id, p));

  const normalRanges: NormalRange[] = [
    {
      id: uuidv4(),
      itemCode: 'BLOOD_ROUTINE_WBC',
      testName: '白细胞计数',
      unit: '×10^9/L',
      maleMin: 4,
      maleMax: 10,
      femaleMin: 4,
      femaleMax: 10,
      childMin: 5,
      childMax: 12,
      referenceText: '4-10×10^9/L',
      isCriticalLow: true,
      criticalLowValue: 2,
      isCriticalHigh: true,
      criticalHighValue: 30,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      itemCode: 'BLOOD_ROUTINE_RBC',
      testName: '红细胞计数',
      unit: '×10^12/L',
      maleMin: 4.3,
      maleMax: 5.8,
      femaleMin: 3.8,
      femaleMax: 5.1,
      childMin: 4,
      childMax: 4.5,
      referenceText: '男:4.3-5.8,女:3.8-5.1',
      isCriticalLow: true,
      criticalLowValue: 2.5,
      isCriticalHigh: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      itemCode: 'BLOOD_ROUTINE_HGB',
      testName: '血红蛋白',
      unit: 'g/L',
      maleMin: 130,
      maleMax: 175,
      femaleMin: 115,
      femaleMax: 150,
      childMin: 120,
      childMax: 140,
      referenceText: '男:130-175,女:115-150',
      isCriticalLow: true,
      criticalLowValue: 60,
      isCriticalHigh: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      itemCode: 'BLOOD_ROUTINE_PLT',
      testName: '血小板计数',
      unit: '×10^9/L',
      maleMin: 125,
      maleMax: 350,
      femaleMin: 125,
      femaleMax: 350,
      childMin: 100,
      childMax: 300,
      referenceText: '125-350×10^9/L',
      isCriticalLow: true,
      criticalLowValue: 30,
      isCriticalHigh: true,
      criticalHighValue: 1000,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      itemCode: 'BIOCHEM_GLUCOSE',
      testName: '空腹血糖',
      unit: 'mmol/L',
      maleMin: 3.9,
      maleMax: 6.1,
      femaleMin: 3.9,
      femaleMax: 6.1,
      childMin: 3.9,
      childMax: 6.1,
      referenceText: '3.9-6.1 mmol/L',
      isCriticalLow: true,
      criticalLowValue: 2.2,
      isCriticalHigh: true,
      criticalHighValue: 22,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      itemCode: 'BIOCHEM_TC',
      testName: '总胆固醇',
      unit: 'mmol/L',
      maleMin: 2.8,
      maleMax: 5.2,
      femaleMin: 2.8,
      femaleMax: 5.2,
      childMin: 2.8,
      childMax: 5.2,
      referenceText: '2.8-5.2 mmol/L',
      isCriticalLow: false,
      isCriticalHigh: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      itemCode: 'BIOCHEM_TRIG',
      testName: '甘油三酯',
      unit: 'mmol/L',
      maleMin: 0.45,
      maleMax: 1.7,
      femaleMin: 0.45,
      femaleMax: 1.7,
      childMin: 0.45,
      childMax: 1.7,
      referenceText: '0.45-1.7 mmol/L',
      isCriticalLow: false,
      isCriticalHigh: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      itemCode: 'BIOCHEM_HDL',
      testName: '高密度脂蛋白胆固醇',
      unit: 'mmol/L',
      maleMin: 1.04,
      maleMax: 1.55,
      femaleMin: 1.29,
      femaleMax: 1.55,
      childMin: 1,
      childMax: 1.55,
      referenceText: '男:>1.04,女:>1.29 mmol/L',
      isCriticalLow: false,
      isCriticalHigh: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      itemCode: 'BIOCHEM_LDL',
      testName: '低密度脂蛋白胆固醇',
      unit: 'mmol/L',
      maleMin: 0,
      maleMax: 3.4,
      femaleMin: 0,
      femaleMax: 3.4,
      childMin: 0,
      childMax: 3.4,
      referenceText: '<3.4 mmol/L',
      isCriticalLow: false,
      isCriticalHigh: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      itemCode: 'BIOCHEM_ALT',
      testName: '谷丙转氨酶(ALT)',
      unit: 'U/L',
      maleMin: 9,
      maleMax: 50,
      femaleMin: 7,
      femaleMax: 40,
      childMin: 5,
      childMax: 40,
      referenceText: '男:9-50,女:7-40 U/L',
      isCriticalLow: false,
      isCriticalHigh: true,
      criticalHighValue: 500,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      itemCode: 'BIOCHEM_AST',
      testName: '谷草转氨酶(AST)',
      unit: 'U/L',
      maleMin: 15,
      maleMax: 40,
      femaleMin: 13,
      femaleMax: 35,
      childMin: 10,
      childMax: 40,
      referenceText: '男:15-40,女:13-35 U/L',
      isCriticalLow: false,
      isCriticalHigh: true,
      criticalHighValue: 500,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      itemCode: 'BIOCHEM_CREA',
      testName: '肌酐',
      unit: 'μmol/L',
      maleMin: 57,
      maleMax: 97,
      femaleMin: 41,
      femaleMax: 73,
      childMin: 25,
      childMax: 70,
      referenceText: '男:57-97,女:41-73 μmol/L',
      isCriticalLow: false,
      isCriticalHigh: true,
      criticalHighValue: 700,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      itemCode: 'BIOCHEM_BUN',
      testName: '尿素氮',
      unit: 'mmol/L',
      maleMin: 3.1,
      maleMax: 8.0,
      femaleMin: 2.9,
      femaleMax: 7.5,
      childMin: 2.5,
      childMax: 6.4,
      referenceText: '3.1-8.0 mmol/L',
      isCriticalLow: false,
      isCriticalHigh: true,
      criticalHighValue: 30,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  normalRanges.forEach(n => store.normalRanges.set(n.id, n));

  const healthRecommendations: HealthRecommendation[] = [
    {
      id: uuidv4(),
      abnormalType: 'high_glucose',
      riskLevel: 'medium',
      title: '血糖偏高',
      content: '建议控制碳水化合物摄入，规律运动，定期监测血糖。',
      lifestyleAdvice: '1. 控制主食摄入量，选择低GI食物\n2. 每周至少150分钟中等强度运动\n3. 戒烟限酒\n4. 保持充足睡眠',
      dietaryAdvice: '1. 减少精制糖和甜食摄入\n2. 增加膳食纤维摄入\n3. 控制总热量摄入\n4. 规律进餐，避免暴饮暴食',
      followupAdvice: '建议3个月后复查空腹血糖，如持续升高请内分泌科就诊。',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      abnormalType: 'high_cholesterol',
      riskLevel: 'medium',
      title: '血脂异常',
      content: '总胆固醇或低密度脂蛋白偏高，增加心血管疾病风险。',
      lifestyleAdvice: '1. 规律运动，每周至少150分钟\n2. 控制体重，BMI保持在18.5-23.9\n3. 戒烟限酒\n4. 保持心理平衡',
      dietaryAdvice: '1. 减少饱和脂肪和胆固醇摄入\n2. 增加膳食纤维和不饱和脂肪\n3. 控制总热量摄入\n4. 增加蔬果摄入',
      followupAdvice: '建议3-6个月复查血脂，如持续异常建议心血管内科就诊。',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      abnormalType: 'high_triglycerides',
      riskLevel: 'medium',
      title: '甘油三酯偏高',
      content: '甘油三酯升高增加胰腺炎和心血管疾病风险。',
      lifestyleAdvice: '1. 增加有氧运动\n2. 控制体重\n3. 限制饮酒\n4. 规律作息',
      dietaryAdvice: '1. 减少精制碳水化合物\n2. 限制甜食和甜饮料\n3. 减少饱和脂肪摄入\n4. 增加omega-3脂肪酸摄入',
      followupAdvice: '建议3个月复查，如持续升高建议就医。',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      abnormalType: 'low_hdl',
      riskLevel: 'medium',
      title: '高密度脂蛋白偏低',
      content: '高密度脂蛋白胆固醇偏低，心血管保护作用减弱。',
      lifestyleAdvice: '1. 规律有氧运动\n2. 戒烟\n3. 控制体重\n4. 减轻精神压力',
      dietaryAdvice: '1. 增加不饱和脂肪摄入\n2. 适量摄入坚果\n3. 增加蔬果摄入\n4. 减少精制碳水化合物',
      followupAdvice: '建议定期复查，结合其他血脂指标综合评估。',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      abnormalType: 'high_ldl',
      riskLevel: 'high',
      title: '低密度脂蛋白偏高',
      content: '低密度脂蛋白胆固醇是动脉粥样硬化的主要危险因素。',
      lifestyleAdvice: '1. 规律有氧运动\n2. 控制体重\n3. 戒烟\n4. 限制饮酒',
      dietaryAdvice: '1. 严格限制饱和脂肪和胆固醇\n2. 增加膳食纤维摄入\n3. 增加植物固醇摄入\n4. 控制总热量',
      followupAdvice: '建议心血管内科就诊评估，可能需要药物治疗。',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      abnormalType: 'high_liver_enzymes',
      riskLevel: 'medium',
      title: '肝功能异常',
      content: '转氨酶升高提示可能存在肝脏损伤。',
      lifestyleAdvice: '1. 戒酒\n2. 避免过度劳累\n3. 规律作息\n4. 避免肝毒性药物',
      dietaryAdvice: '1. 低脂饮食\n2. 增加优质蛋白摄入\n3. 增加蔬果摄入\n4. 控制体重',
      followupAdvice: '建议2周后复查，如持续异常建议消化内科就诊，排除病毒性肝炎、脂肪肝等。',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      abnormalType: 'high_creatinine',
      riskLevel: 'high',
      title: '肾功能异常',
      content: '肌酐升高提示肾功能可能受损。',
      lifestyleAdvice: '1. 控制血压\n2. 避免肾毒性药物\n3. 适量饮水\n4. 规律作息',
      dietaryAdvice: '1. 优质低蛋白饮食\n2. 控制钠盐摄入\n3. 控制钾摄入\n4. 控制磷摄入',
      followupAdvice: '建议肾内科就诊，进一步检查明确原因。',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      abnormalType: 'low_wbc',
      riskLevel: 'medium',
      title: '白细胞减少',
      content: '白细胞计数偏低，免疫力可能下降。',
      lifestyleAdvice: '1. 注意个人卫生\n2. 避免感染\n3. 规律作息\n4. 适当运动',
      dietaryAdvice: '1. 均衡营养\n2. 增加蛋白质摄入\n3. 增加维生素摄入\n4. 避免生冷不洁食物',
      followupAdvice: '建议复查，如持续偏低建议血液科就诊。',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      abnormalType: 'low_platelet',
      riskLevel: 'high',
      title: '血小板减少',
      content: '血小板计数偏低，出血风险增加。',
      lifestyleAdvice: '1. 避免剧烈运动\n2. 避免外伤\n3. 注意口腔卫生\n4. 保持大便通畅',
      dietaryAdvice: '1. 软食为主\n2. 避免过硬过热食物\n3. 均衡营养\n4. 增加维生素C摄入',
      followupAdvice: '建议立即血液科就诊，进一步检查明确原因。',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      abnormalType: 'anemia',
      riskLevel: 'medium',
      title: '贫血',
      content: '血红蛋白偏低，存在贫血情况。',
      lifestyleAdvice: '1. 规律作息\n2. 避免过度劳累\n3. 适当运动\n4. 保持心情舒畅',
      dietaryAdvice: '1. 增加铁摄入（红肉、动物肝脏）\n2. 增加维生素C促进铁吸收\n3. 避免茶和咖啡影响铁吸收\n4. 均衡营养',
      followupAdvice: '建议复查，明确贫血类型，必要时血液科就诊。',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      abnormalType: 'critical',
      riskLevel: 'critical',
      title: '危急值',
      content: '检查结果存在危急值，请立即就医。',
      lifestyleAdvice: '立即就医，遵医嘱治疗。',
      dietaryAdvice: '遵医嘱调整饮食。',
      followupAdvice: '请立即前往医院急诊科或相关科室就诊。',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  healthRecommendations.forEach(r => store.recommendations.set(r.id, r));

  console.log('Memory database initialized with seed data.');
  console.log('Default users created:');
  console.log('  - admin / admin (role: admin)');
  console.log('  - reception / reception (role: reception)');
  console.log('  - doctor / doctor (role: doctor)');
  console.log('  - chief_doctor / chief_doctor (role: chief_doctor)');
  console.log('  - patient / patient (role: patient)');
};

export const createTables = async () => {
  console.log('Creating tables (in-memory mode - skipping)');
  initMemoryDatabase();
  return true;
};

export const seedData = async () => {
  console.log('Seeding data (in-memory mode - already initialized)');
  return true;
};

export { store };
