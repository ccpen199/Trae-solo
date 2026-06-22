import type { UserInfo, AccountBalance, ConsumptionRecord, MedicalRecord, ChronicDisease, Hospital, Doctor, TimeSlot, Appointment, SettlementOrder, Notification, RemoteRecordStatus, Prescription, Examination, ConsumptionDetail, SettlementItem } from '@shared/types';

const USER_ID = 'user_001';

const MOCK_USER: UserInfo = {
  id: USER_ID,
  name: '张伟',
  idCard: '320101198501011234',
  socialSecurityNo: '100000000001',
  insuredArea: '江苏省南京市',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangwei'
};

const MOCK_ACCOUNT: AccountBalance = {
  personalAccount: 12580.50,
  overallAccount: 50000.00,
  annualConsumption: 8650.30,
  monthlyConsumption: 720.86,
  lastUpdated: new Date().toISOString()
};

const JIANGSU_HOSPITALS: Omit<Hospital, 'departments'>[] = [
  {
    id: 'hosp_001',
    name: '江苏省人民医院',
    level: '三级甲等',
    area: '南京市鼓楼区',
    address: '江苏省南京市鼓楼区广州路300号',
    isInsurancePoint: true,
    longitude: 118.7784,
    latitude: 32.0556,
    insurancePolicy: {
      reimbursementRate: 0.85,
      deductible: 1000,
      maxReimbursement: 200000
    }
  },
  {
    id: 'hosp_002',
    name: '南京鼓楼医院',
    level: '三级甲等',
    area: '南京市鼓楼区',
    address: '江苏省南京市鼓楼区中山路321号',
    isInsurancePoint: true,
    longitude: 118.7821,
    latitude: 32.0603,
    insurancePolicy: {
      reimbursementRate: 0.85,
      deductible: 1000,
      maxReimbursement: 200000
    }
  },
  {
    id: 'hosp_003',
    name: '苏州大学附属第一医院',
    level: '三级甲等',
    area: '苏州市姑苏区',
    address: '江苏省苏州市姑苏区十梓街188号',
    isInsurancePoint: true,
    longitude: 120.6308,
    latitude: 31.3139,
    insurancePolicy: {
      reimbursementRate: 0.80,
      deductible: 1200,
      maxReimbursement: 180000
    }
  },
  {
    id: 'hosp_004',
    name: '南京医科大学第一附属医院',
    level: '三级甲等',
    area: '南京市鼓楼区',
    address: '江苏省南京市鼓楼区广州路300号',
    isInsurancePoint: true,
    longitude: 118.7784,
    latitude: 32.0556,
    insurancePolicy: {
      reimbursementRate: 0.85,
      deductible: 1000,
      maxReimbursement: 200000
    }
  },
  {
    id: 'hosp_005',
    name: '东南大学附属中大医院',
    level: '三级甲等',
    area: '南京市鼓楼区',
    address: '江苏省南京市鼓楼区丁家桥87号',
    isInsurancePoint: true,
    longitude: 118.7892,
    latitude: 32.0765,
    insurancePolicy: {
      reimbursementRate: 0.85,
      deductible: 1000,
      maxReimbursement: 200000
    }
  },
  {
    id: 'hosp_006',
    name: '无锡市人民医院',
    level: '三级甲等',
    area: '无锡市梁溪区',
    address: '江苏省无锡市梁溪区清扬路299号',
    isInsurancePoint: true,
    longitude: 120.2896,
    latitude: 31.5703,
    insurancePolicy: {
      reimbursementRate: 0.80,
      deductible: 1200,
      maxReimbursement: 180000
    }
  },
  {
    id: 'hosp_007',
    name: '常州市第一人民医院',
    level: '三级甲等',
    area: '常州市天宁区',
    address: '江苏省常州市天宁区局前街185号',
    isInsurancePoint: true,
    longitude: 119.9668,
    latitude: 31.7763,
    insurancePolicy: {
      reimbursementRate: 0.80,
      deductible: 1200,
      maxReimbursement: 180000
    }
  },
  {
    id: 'hosp_008',
    name: '江苏省中医院',
    level: '三级甲等',
    area: '南京市秦淮区',
    address: '江苏省南京市秦淮区汉中路155号',
    isInsurancePoint: true,
    longitude: 118.7704,
    latitude: 32.0458,
    insurancePolicy: {
      reimbursementRate: 0.85,
      deductible: 1000,
      maxReimbursement: 200000
    }
  }
];

const DEPARTMENTS = [
  { id: 'dept_001', name: '内科', description: '综合内科诊疗' },
  { id: 'dept_002', name: '外科', description: '外科手术治疗' },
  { id: 'dept_003', name: '儿科', description: '儿童疾病诊疗' },
  { id: 'dept_004', name: '妇产科', description: '妇科产科诊疗' },
  { id: 'dept_005', name: '心内科', description: '心血管疾病诊疗' },
  { id: 'dept_006', name: '消化内科', description: '消化系统疾病诊疗' },
  { id: 'dept_007', name: '呼吸内科', description: '呼吸系统疾病诊疗' },
  { id: 'dept_008', name: '内分泌科', description: '内分泌代谢疾病诊疗' },
  { id: 'dept_009', name: '神经内科', description: '神经系统疾病诊疗' },
  { id: 'dept_010', name: '骨科', description: '骨科疾病诊疗' },
  { id: 'dept_011', name: '眼科', description: '眼科疾病诊疗' },
  { id: 'dept_012', name: '耳鼻喉科', description: '耳鼻喉疾病诊疗' },
  { id: 'dept_013', name: '皮肤科', description: '皮肤疾病诊疗' },
  { id: 'dept_014', name: '中医科', description: '中医诊疗' },
  { id: 'dept_015', name: '肿瘤科', description: '肿瘤诊疗' }
];

const DOCTOR_TITLES = ['主任医师', '副主任医师', '主治医师', '住院医师'];
const DOCTOR_NAMES = ['王建国', '李明华', '张秀英', '赵志强', '陈美玲', '刘伟强', '杨秀珍', '周海涛', '吴晓燕', '孙文杰', '郑晓东', '黄丽娟', '朱军辉', '林雅琴', '何志远'];

function generateId(prefix: string, index: number): string {
  return `${prefix}_${String(index).padStart(3, '0')}`;
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function randomDateTime(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function generateDoctors(hospitalId: string, departments: typeof DEPARTMENTS): Doctor[] {
  const doctors: Doctor[] = [];
  let docIndex = 0;
  for (const dept of departments) {
    const doctorCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < doctorCount; i++) {
      doctors.push({
        id: `${hospitalId}_doc_${String(++docIndex).padStart(3, '0')}`,
        name: randomFromArray(DOCTOR_NAMES),
        title: randomFromArray(DOCTOR_TITLES),
        department: dept.name,
        departmentId: dept.id,
        specialty: `${dept.name}常见病、多发病诊治`,
        registrationFee: randomAmount(12, 50),
        availableDates: []
      });
    }
  }
  return doctors;
}

function generateTimeSlots(doctorId: string, doctor: Doctor): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const today = new Date();
  const periods = [
    { period: 'morning' as const, times: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] },
    { period: 'afternoon' as const, times: ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'] }
  ];
  
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toISOString().split('T')[0];
    
    for (const periodInfo of periods) {
      for (const time of periodInfo.times) {
        const total = 15 + Math.floor(Math.random() * 10);
        const available = Math.floor(Math.random() * (total + 1));
        const status = available === 0 ? 'full' : available < 5 ? 'limited' : 'available';
        slots.push({
          id: `${doctorId}_${dateStr}_${time.replace(':', '')}`,
          time,
          period: periodInfo.period,
          available,
          total,
          status
        });
      }
    }
  }
  return slots;
}

function generatePrescriptions(): Prescription[] {
  const drugs = [
    { name: '阿莫西林胶囊', spec: '0.5g*24粒', dosage: '0.5g', frequency: '每日3次' },
    { name: '布洛芬缓释胶囊', spec: '0.3g*20粒', dosage: '0.3g', frequency: '每日2次' },
    { name: '奥美拉唑肠溶胶囊', spec: '20mg*14粒', dosage: '20mg', frequency: '每日1次' },
    { name: '氯雷他定片', spec: '10mg*6片', dosage: '10mg', frequency: '每日1次' },
    { name: '二甲双胍缓释片', spec: '0.5g*30片', dosage: '0.5g', frequency: '每日2次' },
    { name: '硝苯地平控释片', spec: '30mg*7片', dosage: '30mg', frequency: '每日1次' },
    { name: '阿司匹林肠溶片', spec: '100mg*30片', dosage: '100mg', frequency: '每日1次' },
    { name: '头孢克肟分散片', spec: '0.1g*6片', dosage: '0.1g', frequency: '每日2次' }
  ];
  
  const count = 1 + Math.floor(Math.random() * 4);
  const prescriptions: Prescription[] = [];
  
  for (let i = 0; i < count; i++) {
    const drug = randomFromArray(drugs);
    const quantity = 1 + Math.floor(Math.random() * 3);
    const unitPrice = randomAmount(10, 80);
    const amount = Math.round(unitPrice * quantity * 100) / 100;
    prescriptions.push({
      ...drug,
      quantity,
      unitPrice,
      amount,
      insuranceCoverage: Math.random() > 0.2 ? '医保甲类' : '医保乙类'
    });
  }
  
  return prescriptions;
}

function generateExaminations(): Examination[] {
  const exams = [
    { name: '血常规', type: '检验' },
    { name: '尿常规', type: '检验' },
    { name: '肝功能', type: '检验' },
    { name: '肾功能', type: '检验' },
    { name: '心电图', type: '检查' },
    { name: '胸部CT', type: '影像' },
    { name: '腹部B超', type: '影像' },
    { name: 'X线检查', type: '影像' },
    { name: '血糖检测', type: '检验' },
    { name: '血脂检测', type: '检验' }
  ];
  
  const count = 1 + Math.floor(Math.random() * 3);
  const examinations: Examination[] = [];
  
  for (let i = 0; i < count; i++) {
    const exam = randomFromArray(exams);
    const amount = randomAmount(30, 300);
    examinations.push({
      ...exam,
      result: '正常',
      amount,
      insuranceCoverage: Math.random() > 0.1 ? '医保甲类' : '医保乙类'
    });
  }
  
  return examinations;
}

function generateMedicalRecords(): MedicalRecord[] {
  const records: MedicalRecord[] = [];
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 3);
  const endDate = new Date();
  
  const diagnoses = [
    ['上呼吸道感染', '急性支气管炎'],
    ['高血压病2级', '高脂血症'],
    ['2型糖尿病', '糖尿病周围神经病变'],
    ['慢性胃炎', '胃食管反流病'],
    ['腰椎间盘突出症', '腰肌劳损'],
    ['冠心病', '心绞痛'],
    ['甲状腺功能亢进症', '甲状腺结节'],
    ['过敏性鼻炎', '支气管哮喘'],
    ['偏头痛', '紧张性头痛'],
    ['颈椎病', '颈肩综合征']
  ];
  
  const symptoms = [
    '发热、咳嗽、咳痰3天',
    '头晕、头痛1周，血压控制不佳',
    '多饮、多尿、体重下降1个月',
    '反复上腹痛、反酸、烧心',
    '腰痛伴下肢放射痛',
    '胸闷、胸痛活动后加重',
    '心悸、手抖、体重下降',
    '反复发作性喘息、呼吸困难',
    '单侧搏动性头痛，伴恶心',
    '颈肩酸痛，上肢麻木'
  ];
  
  for (let i = 0; i < 36; i++) {
    const hospital = randomFromArray(JIANGSU_HOSPITALS);
    const dept = randomFromArray(DEPARTMENTS);
    const doctor = randomFromArray(DOCTOR_NAMES);
    const diagnosisIdx = Math.floor(Math.random() * diagnoses.length);
    const visitDate = randomDate(startDate, endDate);
    
    const prescriptions = generatePrescriptions();
    const examinations = generateExaminations();
    
    const drugTotal = prescriptions.reduce((sum, p) => sum + p.amount, 0);
    const examTotal = examinations.reduce((sum, e) => sum + e.amount, 0);
    const registrationFee = randomAmount(12, 50);
    const total = Math.round((drugTotal + examTotal + registrationFee) * 100) / 100;
    const overallPay = Math.round(total * 0.7 * 100) / 100;
    const personalPay = Math.round((total - overallPay) * 100) / 100;
    const accountPay = Math.round(personalPay * 0.6 * 100) / 100;
    const selfPay = Math.round((personalPay - accountPay) * 100) / 100;
    
    records.push({
      id: generateId('med', i + 1),
      visitDate,
      hospital: hospital.name,
      hospitalId: hospital.id,
      department: dept.name,
      doctor,
      diagnosis: diagnoses[diagnosisIdx],
      symptoms: symptoms[diagnosisIdx],
      prescriptions,
      examinations,
      cost: {
        total,
        overallPay,
        personalPay,
        accountPay,
        selfPay
      }
    });
  }
  
  return records.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
}

function generateConsumptionRecords(medicalRecords: MedicalRecord[]): ConsumptionRecord[] {
  const records: ConsumptionRecord[] = [];
  const pharmacies = [
    '南京医药百信药房',
    '益丰大药房',
    '老百姓大药房',
    '先声再康药店',
    '国大药房'
  ];
  
  for (let i = 0; i < medicalRecords.length; i++) {
    const mr = medicalRecords[i];
    const details: ConsumptionDetail[] = mr.prescriptions.map(p => ({
      name: p.drugName,
      spec: p.spec,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      amount: p.amount,
      insuranceType: p.insuranceCoverage
    }));
    
    mr.examinations.forEach(e => {
      details.push({
        name: e.name,
        spec: e.type,
        quantity: 1,
        unitPrice: e.amount,
        amount: e.amount,
        insuranceType: e.insuranceCoverage
      });
    });
    
    records.push({
      id: generateId('cons', i + 1),
      date: mr.visitDate,
      type: 'hospital',
      merchantName: mr.hospital,
      amount: mr.cost.total,
      personalPay: mr.cost.personalPay,
      overallPay: mr.cost.overallPay,
      category: '门诊费用',
      details
    });
  }
  
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 3);
  const endDate = new Date();
  
  for (let i = 0; i < 12; i++) {
    const pharmacy = randomFromArray(pharmacies);
    const date = randomDate(startDate, endDate);
    const prescription = randomFromArray([
      { name: '维生素C片', spec: '100mg*100片' },
      { name: '复合维生素B片', spec: '100片' },
      { name: '碳酸钙D3片', spec: '600mg*30片' },
      { name: '鱼油软胶囊', spec: '1000mg*60粒' },
      { name: '褪黑素片', spec: '3mg*60片' }
    ]);
    
    const quantity = 1 + Math.floor(Math.random() * 3);
    const unitPrice = randomAmount(20, 100);
    const amount = Math.round(unitPrice * quantity * 100) / 100;
    const overallPay = Math.round(amount * 0.5 * 100) / 100;
    const personalPay = Math.round((amount - overallPay) * 100) / 100;
    
    records.push({
      id: generateId('cons', medicalRecords.length + i + 1),
      date,
      type: 'pharmacy',
      merchantName: pharmacy,
      amount,
      personalPay,
      overallPay,
      category: '药店购药',
      details: [{
        name: prescription.name,
        spec: prescription.spec,
        quantity,
        unitPrice,
        amount,
        insuranceType: '医保乙类'
      }]
    });
  }
  
  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function generateChronicDiseases(): ChronicDisease[] {
  return [
    {
      id: 'chronic_001',
      diseaseType: '高血压',
      diseaseName: '原发性高血压',
      confirmedDate: '2021-03-15',
      expiryDate: '2026-03-14',
      status: 'approved',
      materials: ['病历复印件', '诊断证明', '检查报告单'],
      approvalNotes: '符合高血压慢特病认定标准，予以认定'
    },
    {
      id: 'chronic_002',
      diseaseType: '糖尿病',
      diseaseName: '2型糖尿病',
      confirmedDate: '2022-06-20',
      expiryDate: '2027-06-19',
      status: 'approved',
      materials: ['病历复印件', '血糖检测报告', '诊断证明'],
      approvalNotes: '符合糖尿病慢特病认定标准，予以认定'
    }
  ];
}

function generateHospitalsWithDepartments(): Hospital[] {
  return JIANGSU_HOSPITALS.map(hospital => ({
    ...hospital,
    departments: DEPARTMENTS.map(d => ({
      id: `${hospital.id}_${d.id}`,
      name: d.name,
      description: d.description
    }))
  }));
}

function generateAllDoctors(): Doctor[] {
  const allDoctors: Doctor[] = [];
  for (const hospital of JIANGSU_HOSPITALS) {
    const hospitalDepts = DEPARTMENTS.map(d => ({
      ...d,
      id: `${hospital.id}_${d.id}`
    }));
    const doctors = generateDoctors(hospital.id, hospitalDepts);
    allDoctors.push(...doctors);
  }
  return allDoctors;
}

function generateAllTimeSlots(doctors: Doctor[]): Map<string, TimeSlot[]> {
  const slotsMap = new Map<string, TimeSlot[]>();
  for (const doctor of doctors) {
    slotsMap.set(doctor.id, generateTimeSlots(doctor.id, doctor));
  }
  return slotsMap;
}

function generateAppointments(hospitals: Hospital[], doctors: Doctor[]): Appointment[] {
  const appointments: Appointment[] = [];
  const today = new Date();
  
  for (let i = 0; i < 3; i++) {
    const hospital = randomFromArray(hospitals);
    const dept = randomFromArray(hospital.departments);
    const doctor = randomFromArray(doctors.filter(d => d.departmentId.startsWith(hospital.id)));
    if (!doctor) continue;
    
    const date = new Date(today);
    date.setDate(date.getDate() + 1 + i);
    const dateStr = date.toISOString().split('T')[0];
    const timeSlot = randomFromArray(['08:00', '09:00', '10:00', '14:00', '15:00', '16:00']);
    const statuses: Appointment['status'][] = ['confirmed', 'confirmed', 'pending'];
    
    appointments.push({
      id: generateId('appt', i + 1),
      hospital: hospital.name,
      hospitalId: hospital.id,
      department: dept.name,
      departmentId: dept.id,
      doctor: doctor.name,
      doctorId: doctor.id,
      date: dateStr,
      timeSlot,
      status: statuses[i],
      medicalCode: `MED${Date.now()}${i}`,
      qrCode: `QR${Date.now()}${i}`,
      registrationFee: doctor.registrationFee,
      createdAt: randomDateTime(new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000), new Date(date.getTime() - 1 * 24 * 60 * 60 * 1000))
    });
  }
  
  return appointments;
}

function generatePaymentOrders(medicalRecords: MedicalRecord[], appointments: Appointment[]): SettlementOrder[] {
  const orders: SettlementOrder[] = [];
  
  for (let i = 0; i < 5; i++) {
    const mr = medicalRecords[i];
    const items: SettlementItem[] = mr.prescriptions.map(p => ({
      name: p.drugName,
      spec: p.spec,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      amount: p.amount,
      insuranceType: p.insuranceCoverage,
      insurancePay: Math.round(p.amount * 0.7 * 100) / 100,
      selfPay: Math.round(p.amount * 0.3 * 100) / 100
    }));
    
    mr.examinations.forEach(e => {
      items.push({
        name: e.name,
        spec: e.type,
        quantity: 1,
        unitPrice: e.amount,
        amount: e.amount,
        insuranceType: e.insuranceCoverage,
        insurancePay: Math.round(e.amount * 0.7 * 100) / 100,
        selfPay: Math.round(e.amount * 0.3 * 100) / 100
      });
    });
    
    const statuses: SettlementOrder['status'][] = ['paid', 'paid', 'paid', 'pending', 'pending'];
    const paidAt = statuses[i] === 'paid' ? randomDateTime(new Date(mr.visitDate), new Date(mr.visitDate + 'T12:00:00')) : undefined;
    const transactionId = statuses[i] === 'paid' ? `TXN${Date.now()}${i}` : undefined;
    
    orders.push({
      id: generateId('pay', i + 1),
      type: 'outpatient',
      hospital: mr.hospital,
      hospitalId: mr.hospitalId,
      amount: {
        total: mr.cost.total,
        overallPay: mr.cost.overallPay,
        accountPay: mr.cost.accountPay,
        selfPay: mr.cost.selfPay
      },
      items,
      status: statuses[i],
      createdAt: randomDateTime(new Date(mr.visitDate), new Date(mr.visitDate + 'T10:00:00')),
      paidAt,
      transactionId
    });
  }
  
  return orders;
}

function generateNotifications(): Notification[] {
  const notifications: Notification[] = [
    {
      id: 'notif_001',
      type: 'treatment_abnormal',
      title: '就诊异常提醒',
      content: '您在江苏省人民医院的就诊记录显示，最近3个月内同一种抗生素处方超过5次，请注意合理用药。如有疑问请咨询您的主治医生。',
      level: 'warning',
      read: false,
      createdAt: randomDateTime(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), new Date()),
      actionUrl: '/medical',
      retryable: false
    },
    {
      id: 'notif_002',
      type: 'policy',
      title: '医保政策更新',
      content: '2024年江苏省医保政策调整：高血压、糖尿病等慢特病门诊报销比例提高至85%，详情请查看政策解读。',
      level: 'info',
      read: true,
      createdAt: randomDateTime(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
      retryable: false
    },
    {
      id: 'notif_003',
      type: 'record_failure',
      title: '异地就医备案失败',
      content: '您在上海市第一人民医院的异地就医备案失败，原因：参保地信息核验失败。请检查个人信息是否正确。',
      level: 'error',
      read: false,
      createdAt: randomDateTime(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), new Date()),
      actionUrl: '/notification',
      retryable: true
    },
    {
      id: 'notif_004',
      type: 'system',
      title: '系统维护通知',
      content: '系统将于2024年6月25日22:00-次日02:00进行维护升级，期间部分服务可能暂时无法使用，敬请谅解。',
      level: 'info',
      read: false,
      createdAt: randomDateTime(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
      retryable: false
    },
    {
      id: 'notif_005',
      type: 'treatment_abnormal',
      title: '医保账户消费预警',
      content: '您本月医保账户累计消费已达到年度消费额度的80%，请注意控制医疗费用支出。',
      level: 'warning',
      read: false,
      createdAt: randomDateTime(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      actionUrl: '/account',
      retryable: false
    },
    {
      id: 'notif_006',
      type: 'policy',
      title: '慢特病认定提醒',
      content: '您的高血压慢特病认定有效期将于2026年3月14日到期，请提前准备材料办理续期手续。',
      level: 'warning',
      read: true,
      createdAt: randomDateTime(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
      actionUrl: '/chronic',
      retryable: false
    }
  ];
  
  return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function generateRemoteRecords(): RemoteRecordStatus[] {
  return [
    {
      id: 'remote_001',
      status: 'failed',
      area: '上海市',
      hospital: '上海市第一人民医院',
      attemptCount: 3,
      errorMessage: '参保地信息核验失败，请检查身份证号和社保卡号是否正确'
    },
    {
      id: 'remote_002',
      status: 'success',
      area: '苏州市',
      hospital: '苏州大学附属第一医院',
      attemptCount: 1
    },
    {
      id: 'remote_003',
      status: 'pending',
      area: '杭州市',
      hospital: '浙江大学医学院附属第一医院',
      attemptCount: 1,
      nextRetryAt: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString()
    }
  ];
}

export const mockData = {
  user: MOCK_USER,
  account: MOCK_ACCOUNT,
  userId: USER_ID,
  hospitals: generateHospitalsWithDepartments(),
  doctors: generateAllDoctors(),
  timeSlots: generateAllTimeSlots(generateAllDoctors()),
  medicalRecords: generateMedicalRecords(),
  consumptionRecords: [],
  chronicDiseases: generateChronicDiseases(),
  appointments: [],
  paymentOrders: [],
  notifications: generateNotifications(),
  remoteRecords: generateRemoteRecords(),
  departments: DEPARTMENTS
};

mockData.consumptionRecords = generateConsumptionRecords(mockData.medicalRecords);
mockData.appointments = generateAppointments(mockData.hospitals, mockData.doctors);
mockData.paymentOrders = generatePaymentOrders(mockData.medicalRecords, mockData.appointments);

export function getUserId(): string {
  return USER_ID;
}

export function getMockUser(): UserInfo {
  return MOCK_USER;
}

export function getMockAccount(): AccountBalance {
  return MOCK_ACCOUNT;
}

export function getMockHospitals(): Hospital[] {
  return mockData.hospitals;
}

export function getMockDoctors(): Doctor[] {
  return mockData.doctors;
}

export function getMockTimeSlots(doctorId: string): TimeSlot[] {
  return mockData.timeSlots.get(doctorId) || [];
}

export function getMockMedicalRecords(): MedicalRecord[] {
  return mockData.medicalRecords;
}

export function getMockConsumptionRecords(): ConsumptionRecord[] {
  return mockData.consumptionRecords;
}

export function getMockChronicDiseases(): ChronicDisease[] {
  return mockData.chronicDiseases;
}

export function getMockAppointments(): Appointment[] {
  return mockData.appointments;
}

export function getMockPaymentOrders(): SettlementOrder[] {
  return mockData.paymentOrders;
}

export function getMockNotifications(): Notification[] {
  return mockData.notifications;
}

export function getMockRemoteRecords(): RemoteRecordStatus[] {
  return mockData.remoteRecords;
}
