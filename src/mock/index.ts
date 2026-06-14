import type { Nurse, ServiceOrder, RiskQuestion, ServiceRecord, AuditTask, RiskTicket, InsurancePolicy, DashboardStats, User, VitalSign } from '@/types';
import dayjs from 'dayjs';

export const mockUser: User = {
  id: 'u001',
  name: '张明远',
  role: 'org-admin',
  avatar: '',
  organizationName: '安康居家护理服务中心',
  phone: '13800138000',
};

export const mockDashboardStats: DashboardStats = {
  todayOrders: 128,
  todayOrdersTrend: 12.5,
  inService: 37,
  activeNurses: 89,
  activeNursesTrend: 5.2,
  riskAlerts: 8,
  pendingAudits: 42,
  revenueToday: 68420,
  revenueTrend: 8.3,
  verifiedNurses: 126,
  totalNurses: 143,
  complianceRate: 98.7,
};

const firstNames = ['张', '王', '李', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡'];
const lastNames = ['秀英', '桂兰', '淑珍', '春梅', '玉兰', '丽娟', '敏', '静', '芳', '娜', '雪', '婷', '玲', '欣', '洁'];

function randomName() {
  return firstNames[Math.floor(Math.random() * firstNames.length)] + lastNames[Math.floor(Math.random() * lastNames.length)];
}

function randomPhone() {
  return '1' + (3 + Math.floor(Math.random() * 6)).toString() + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
}

function randomIdCard() {
  const areaCode = ['110101', '310101', '440103', '320102', '510104', '330102'][Math.floor(Math.random() * 6)];
  const birthYear = 1975 + Math.floor(Math.random() * 25);
  const birthMonth = (1 + Math.floor(Math.random() * 12)).toString().padStart(2, '0');
  const birthDay = (1 + Math.floor(Math.random() * 28)).toString().padStart(2, '0');
  const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const check = Math.floor(Math.random() * 10);
  return `${areaCode}${birthYear}${birthMonth}${birthDay}${seq}${check}`;
}

const certificateTypes: Array<'执业护士' | '执业医师' | '助产士'> = ['执业护士', '执业护士', '执业护士', '执业护士', '执业医师', '助产士'];
const practiceScopes = ['基础护理', '伤口护理', '压疮护理', '管路护理', '康复护理', '母婴护理', '临终关怀', '用药指导', '生命体征监测', '血糖监测'];
const verifyStatuses: Array<'pending' | 'verifying' | 'verified' | 'rejected'> = ['verified', 'verified', 'verified', 'verified', 'verified', 'pending', 'verifying', 'rejected'];
const orgNames = ['安康居家护理服务中心', '仁爱护理站', '康泰护理服务有限公司', '颐养护理中心'];

export const mockNurses: Nurse[] = Array.from({ length: 15 }, (_, i) => {
  const name = randomName();
  const status = verifyStatuses[Math.floor(Math.random() * verifyStatuses.length)];
  const orgIndex = Math.floor(Math.random() * orgNames.length);
  return {
    id: `n${(i + 1).toString().padStart(3, '0')}`,
    name,
    phone: randomPhone(),
    idCard: randomIdCard(),
    certificateNumber: 'HN' + (20150000 + Math.floor(Math.random() * 50000)),
    certificateType: certificateTypes[Math.floor(Math.random() * certificateTypes.length)],
    practiceScope: practiceScopes.sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 3)),
    certificateImage: '',
    verifyStatus: status,
    verifyResult: status !== 'pending' ? {
      systemChecked: true,
      systemMessage: status === 'rejected' ? '证书信息无法核验' : '证书信息核验通过',
      manualChecked: status === 'verified' || status === 'rejected',
      manualRemark: status === 'rejected' ? '请上传清晰的证书扫描件' : status === 'verified' ? '资料齐全，审核通过' : undefined,
    } : undefined,
    validUntil: dayjs().add(1 + Math.floor(Math.random() * 5), 'year').format('YYYY-MM-DD'),
    organizationId: `org${(orgIndex + 1).toString().padStart(3, '0')}`,
    organizationName: orgNames[orgIndex],
    createdAt: dayjs().subtract(Math.floor(Math.random() * 730), 'day').format('YYYY-MM-DD HH:mm:ss'),
    rating: Number((4 + Math.random()).toFixed(1)),
    completedOrders: Math.floor(Math.random() * 500),
  };
});

const patientTypes: Array<'elderly' | 'maternal' | 'post-hospital' | 'hospice'> = ['elderly', 'elderly', 'elderly', 'maternal', 'maternal', 'post-hospital', 'post-hospital', 'hospice'];
const orderStatuses: Array<'created' | 'risk-assessed' | 'dispatched' | 'nurse-accepted' | 'in-service' | 'completed' | 'cancelled'> = ['completed', 'completed', 'completed', 'in-service', 'nurse-accepted', 'dispatched', 'risk-assessed', 'created', 'cancelled'];
const auditStatuses: Array<'not-submitted' | 'self-check' | 'quality-control' | 'platform-check' | 'all-passed'> = ['all-passed', 'all-passed', 'all-passed', 'platform-check', 'quality-control', 'self-check', 'not-submitted'];
const riskLevels: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'low', 'medium', 'medium', 'medium', 'high', 'critical'];
const serviceItemPool = [
  { code: 'SV001', name: '基础生命体征监测', duration: 30, price: 80 },
  { code: 'SV002', name: '伤口换药护理', duration: 45, price: 150 },
  { code: 'SV003', name: '压疮护理', duration: 60, price: 200 },
  { code: 'SV004', name: '鼻饲管护理', duration: 40, price: 120 },
  { code: 'SV005', name: '导尿管护理', duration: 35, price: 100 },
  { code: 'SV006', name: '产后康复护理', duration: 90, price: 380 },
  { code: 'SV007', name: '新生儿护理指导', duration: 60, price: 280 },
  { code: 'SV008', name: '术后康复训练', duration: 60, price: 250 },
  { code: 'SV009', name: '临终关怀护理', duration: 120, price: 450 },
  { code: 'SV010', name: '血糖监测与指导', duration: 30, price: 90 },
  { code: 'SV011', name: '用药指导与管理', duration: 45, price: 130 },
  { code: 'SV012', name: '康复理疗', duration: 60, price: 220 },
];
const addresses = [
  '北京市朝阳区建国路88号院3号楼1202室',
  '上海市浦东新区张江高科技园区科苑路88号',
  '广州市天河区天河路385号太古汇',
  '深圳市南山区科技园南区深南大道9988号',
  '杭州市西湖区文三路478号华星时代广场',
  '成都市锦江区春熙路东段1号',
  '南京市鼓楼区中山路18号',
  '武汉市江汉区解放大道128号',
];
const diagnoses = {
  'elderly': ['高血压2级', '糖尿病', '冠心病', '脑梗塞恢复期', '阿尔茨海默病早期', '慢性阻塞性肺疾病'],
  'maternal': ['顺产产后恢复', '剖宫产术后恢复', '妊娠高血压产后', '产后抑郁倾向', '产后乳腺炎'],
  'post-hospital': ['骨折术后康复', '膝关节置换术后', '腹部手术后恢复', '脑卒中后康复', '肿瘤化疗后调养'],
  'hospice': ['晚期肺癌', '晚期胃癌', '晚期肝癌', '晚期胰腺癌', '多器官功能衰竭'],
};
const allergyOptions = [['青霉素', '头孢类'], ['磺胺类'], [], ['花生', '海鲜'], ['阿司匹林'], []];

export const mockOrders: ServiceOrder[] = Array.from({ length: 30 }, (_, i) => {
  const patientType = patientTypes[i % patientTypes.length];
  const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
  const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
  const nurse = mockNurses[Math.floor(Math.random() * mockNurses.length)];
  const scheduledTime = dayjs().subtract(Math.floor(Math.random() * 30), 'day').add(Math.floor(Math.random() * 1440), 'minute');
  const itemCount = 1 + Math.floor(Math.random() * 3);
  const items = serviceItemPool.sort(() => Math.random() - 0.5).slice(0, itemCount);
  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
  const hasInsurance = Math.random() > 0.3;
  const gender: 'male' | 'female' = Math.random() > 0.5 ? 'male' : 'female';
  const baseAge = patientType === 'maternal' ? 25 : patientType === 'hospice' ? 68 : patientType === 'post-hospital' ? 55 : 72;
  const age = baseAge + Math.floor(Math.random() * 15);
  const patientDiagnosisList = diagnoses[patientType];

  return {
    id: `o${(i + 1).toString().padStart(4, '0')}`,
    orderNo: 'SO' + dayjs(scheduledTime).format('YYYYMMDD') + (1000 + i).toString(),
    patientType,
    patientInfo: {
      name: randomName(),
      age,
      gender,
      phone: randomPhone(),
      address: addresses[Math.floor(Math.random() * addresses.length)],
      diagnosis: patientDiagnosisList[Math.floor(Math.random() * patientDiagnosisList.length)],
      allergies: allergyOptions[Math.floor(Math.random() * allergyOptions.length)],
    },
    serviceItems: items,
    riskLevel,
    riskAssessmentId: riskLevel !== 'low' ? `ra${(i + 1).toString().padStart(4, '0')}` : undefined,
    nurseId: ['dispatched', 'nurse-accepted', 'in-service', 'completed'].includes(status) ? nurse.id : undefined,
    nurseInfo: ['dispatched', 'nurse-accepted', 'in-service', 'completed'].includes(status) ? {
      id: nurse.id,
      name: nurse.name,
      phone: nurse.phone,
    } : undefined,
    scheduledTime: scheduledTime.format('YYYY-MM-DD HH:mm:ss'),
    actualStartTime: ['in-service', 'completed'].includes(status) ? scheduledTime.add(5 + Math.floor(Math.random() * 30), 'minute').format('YYYY-MM-DD HH:mm:ss') : undefined,
    actualEndTime: status === 'completed' ? scheduledTime.add(items.reduce((s, it) => s + it.duration, 0) + 20, 'minute').format('YYYY-MM-DD HH:mm:ss') : undefined,
    status,
    auditStatus: status === 'completed' ? auditStatuses[Math.floor(Math.random() * auditStatuses.length)] : 'not-submitted',
    hasInsurance,
    policyId: hasInsurance ? `ip${(i + 1).toString().padStart(4, '0')}` : undefined,
    totalAmount,
    createdAt: scheduledTime.subtract(2 + Math.floor(Math.random() * 48), 'hour').format('YYYY-MM-DD HH:mm:ss'),
    distanceKm: Number((0.5 + Math.random() * 15).toFixed(1)),
  };
});

const riskQuestionData: Record<RiskQuestion['category'], { q: string; opts: { label: string; score: number }[] }[]> = {
  general: [
    { q: '患者近期是否有跌倒经历？', opts: [{ label: '过去30天内无跌倒', score: 0 }, { label: '过去30天内有1次跌倒', score: 2 }, { label: '过去30天内有2次及以上跌倒', score: 4 }] },
    { q: '患者意识状态如何？', opts: [{ label: '清醒', score: 0 }, { label: '时有嗜睡', score: 2 }, { label: '意识模糊或昏迷', score: 5 }] },
    { q: '患者是否存在吞咽困难？', opts: [{ label: '无', score: 0 }, { label: '轻度，偶有呛咳', score: 2 }, { label: '重度，需鼻饲', score: 4 }] },
    { q: '患者目前的活动能力？', opts: [{ label: '完全自理', score: 0 }, { label: '部分依赖协助', score: 2 }, { label: '完全卧床', score: 5 }] },
    { q: '患者是否正在使用抗凝药物？', opts: [{ label: '否', score: 0 }, { label: '是，阿司匹林', score: 1 }, { label: '是，华法林或新型抗凝药', score: 3 }] },
  ],
  elderly: [
    { q: '患者年龄？', opts: [{ label: '65-74岁', score: 1 }, { label: '75-84岁', score: 2 }, { label: '85岁以上', score: 4 }] },
    { q: '患者近半年体重变化？', opts: [{ label: '稳定', score: 0 }, { label: '下降3-5kg', score: 2 }, { label: '下降超过5kg', score: 4 }] },
    { q: '患者是否有认知障碍？', opts: [{ label: '无', score: 0 }, { label: '轻度（MCI）', score: 2 }, { label: '中度至重度痴呆', score: 5 }] },
    { q: '患者居住环境是否有安全隐患？', opts: [{ label: '无', score: 0 }, { label: '部分设施不完善', score: 1 }, { label: '多处隐患（如无扶手、光线差）', score: 3 }] },
    { q: '患者是否存在尿/便失禁？', opts: [{ label: '无', score: 0 }, { label: '偶发', score: 1 }, { label: '经常或完全失禁', score: 3 }] },
  ],
  maternal: [
    { q: '分娩方式？', opts: [{ label: '顺产，无并发症', score: 0 }, { label: '顺产，有会阴侧切', score: 1 }, { label: '剖宫产', score: 2 }] },
    { q: '产后出血量评估？', opts: [{ label: '正常（<500ml）', score: 0 }, { label: '偏多（500-1000ml）', score: 2 }, { label: '产后出血（>1000ml）', score: 5 }] },
    { q: '是否存在妊娠期合并症？', opts: [{ label: '无', score: 0 }, { label: '轻度妊娠糖尿病/高血压', score: 2 }, { label: '重度子痫前期或其他严重并发症', score: 5 }] },
    { q: '产妇情绪状态？', opts: [{ label: '良好', score: 0 }, { label: '偶有情绪低落', score: 1 }, { label: '明显抑郁或焦虑倾向', score: 4 }] },
    { q: '新生儿健康状况？', opts: [{ label: '足月健康', score: 0 }, { label: '早产儿（34-37周）', score: 2 }, { label: '早产儿（<34周）或其他异常', score: 5 }] },
  ],
  'post-hospital': [
    { q: '手术类型？', opts: [{ label: '择期中小型手术', score: 1 }, { label: '择期大型手术', score: 3 }, { label: '急诊手术', score: 5 }] },
    { q: '术后是否有并发症？', opts: [{ label: '无', score: 0 }, { label: '轻度（如低热、伤口轻度红肿）', score: 2 }, { label: '重度（感染、出血、器官功能障碍）', score: 5 }] },
    { q: '患者术后活动能力？', opts: [{ label: '可下床活动', score: 0 }, { label: '床上活动，需协助翻身', score: 2 }, { label: '完全卧床，活动受限', score: 4 }] },
    { q: '是否存在术后管路？', opts: [{ label: '无', score: 0 }, { label: '1-2根管路（如导尿管）', score: 2 }, { label: '3根及以上或有特殊管路', score: 4 }] },
    { q: '患者营养状况？', opts: [{ label: '正常进食', score: 0 }, { label: '进食差，需营养补充', score: 2 }, { label: '无法自主进食，需肠内/肠外营养', score: 5 }] },
  ],
  hospice: [
    { q: '患者预期生存期？', opts: [{ label: '>6个月', score: 1 }, { label: '3-6个月', score: 3 }, { label: '<3个月', score: 5 }] },
    { q: '患者疼痛程度（NRS评分）？', opts: [{ label: '0-3分（轻度）', score: 1 }, { label: '4-6分（中度）', score: 3 }, { label: '7-10分（重度）', score: 5 }] },
    { q: '患者是否存在呼吸困难？', opts: [{ label: '无', score: 0 }, { label: '活动后气短', score: 2 }, { label: '静息下呼吸困难', score: 5 }] },
    { q: '患者意识水平？', opts: [{ label: '清醒', score: 0 }, { label: '嗜睡或时有谵妄', score: 2 }, { label: '昏睡或昏迷', score: 5 }] },
    { q: '家属照护能力评估？', opts: [{ label: '家属照护能力强，有培训', score: 0 }, { label: '家属可参与，但需指导', score: 2 }, { label: '家属照护能力不足或无人照护', score: 4 }] },
  ],
};

export const mockRiskQuestions: RiskQuestion[] = (Object.keys(riskQuestionData) as Array<keyof typeof riskQuestionData>).flatMap(
  (category) =>
    riskQuestionData[category].map((item, idx) => ({
      id: `rq-${category}-${idx + 1}`,
      category,
      question: item.q,
      options: item.opts,
    }))
);

export const mockServiceRecords: ServiceRecord[] = Array.from({ length: 5 }, (_, i) => {
  const order = mockOrders[i * 6];
  const baseTime = dayjs(order.actualStartTime || order.scheduledTime);
  const gpsBase: [number, number] = [116.4074 + Math.random() * 0.1, 39.9042 + Math.random() * 0.1];

  const vitalSigns: VitalSign[] = Array.from({ length: 2 + Math.floor(Math.random() * 2) }, (_, vi) => ({
    temperature: Number((36.3 + Math.random() * 0.8).toFixed(1)),
    heartRate: 70 + Math.floor(Math.random() * 30),
    bloodPressure: { systolic: 110 + Math.floor(Math.random() * 30), diastolic: 70 + Math.floor(Math.random() * 15) },
    respiratoryRate: 16 + Math.floor(Math.random() * 6),
    oxygenSaturation: 95 + Math.floor(Math.random() * 5),
    bloodGlucose: i % 2 === 0 ? Number((5.5 + Math.random() * 3).toFixed(1)) : undefined,
    recordedAt: baseTime.add(vi * 20 + 10, 'minute').format('YYYY-MM-DD HH:mm:ss'),
  }));

  const medicationList = i % 2 === 0 ? [
    { name: '硝苯地平缓释片', dosage: '30mg', frequency: '每日1次', administered: true, remark: '早餐后服用' },
    { name: '阿司匹林肠溶片', dosage: '100mg', frequency: '每日1次', administered: true },
  ] : [
    { name: '二甲双胍片', dosage: '500mg', frequency: '每日2次', administered: true, remark: '餐中服用' },
  ];

  const duration = order.serviceItems.reduce((s, it) => s + it.duration, 0);

  return {
    id: `sr${(i + 1).toString().padStart(4, '0')}`,
    orderId: order.id,
    checkIn: {
      time: baseTime.format('YYYY-MM-DD HH:mm:ss'),
      gps: gpsBase,
      photo: '',
    },
    checkOut: {
      time: baseTime.add(duration + 15, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      gps: gpsBase,
    },
    recording: {
      audioUrl: '',
      videoUrl: '',
      encryptedHash: 'sha256:' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
      startTime: baseTime.add(2, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      endTime: baseTime.add(duration + 10, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      duration: duration * 60 + Math.floor(Math.random() * 300),
      hasInterruptions: i === 2,
    },
    vitalSigns,
    medicationList,
    nursingNotes: [
      {
        content: i % 2 === 0
          ? '患者神志清楚，精神可，生命体征平稳。伤口愈合良好，无红肿渗液。遵医嘱给药，观察无不良反应。'
          : '患者主诉轻度头晕，测量血压偏高，已告知家属注意监测。指导床上被动肢体活动，协助翻身叩背。',
        images: [],
        signature: order.nurseInfo?.name || randomName(),
        createdAt: baseTime.add(duration + 5, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      },
    ],
    dataBindingVerified: i !== 2,
  };
});

const stages: Array<'self-check' | 'quality-control' | 'platform-check'> = ['self-check', 'quality-control', 'platform-check'];
const auditResults: Array<'approved' | 'rejected' | 'pending'> = ['approved', 'approved', 'approved', 'pending', 'rejected'];
const priorities: Array<'normal' | 'high' | 'urgent'> = ['normal', 'normal', 'normal', 'high', 'urgent'];
const auditorNames = ['质量管理-李红', '质控专员-王芳', '平台审核-陈明', '复核员-赵静'];

export const mockAuditTasks: AuditTask[] = Array.from({ length: 15 }, (_, i) => {
  const order = mockOrders[i % mockOrders.length];
  const stage = stages[i % stages.length];
  const result = auditResults[Math.floor(Math.random() * auditResults.length)];
  const startedAt = dayjs(order.createdAt).add(1 + Math.floor(Math.random() * 5), 'day');

  return {
    id: `at${(i + 1).toString().padStart(4, '0')}`,
    orderId: order.id,
    orderNo: order.orderNo,
    patientName: order.patientInfo.name,
    nurseName: order.nurseInfo?.name || randomName(),
    stage,
    auditorId: result !== 'pending' ? `aud${(i % 4 + 1).toString().padStart(3, '0')}` : undefined,
    auditorName: result !== 'pending' ? auditorNames[i % auditorNames.length] : undefined,
    result,
    remarks: result === 'rejected'
      ? '护理记录中血压数据与体征监测记录不一致，请核实补充。'
      : result === 'approved'
      ? '资料完整，服务规范，审核通过。'
      : undefined,
    attachments: result === 'rejected' ? ['补充说明材料.pdf'] : undefined,
    startedAt: startedAt.format('YYYY-MM-DD HH:mm:ss'),
    completedAt: result !== 'pending' ? startedAt.add(1 + Math.floor(Math.random() * 24), 'hour').format('YYYY-MM-DD HH:mm:ss') : undefined,
    priority: priorities[Math.floor(Math.random() * priorities.length)],
  };
});

const riskTypes: Array<'out-of-scope' | 'no-check-in' | 'recording-interrupt' | 'data-mismatch' | 'overtime' | 'complaint'> = [
  'out-of-scope', 'no-check-in', 'recording-interrupt', 'data-mismatch', 'overtime', 'complaint',
  'out-of-scope', 'recording-interrupt', 'data-mismatch', 'complaint',
];
const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'medium', 'high', 'medium', 'high', 'critical', 'low', 'medium', 'high'];
const ticketStatuses: Array<'open' | 'investigating' | 'resolved' | 'closed'> = ['open', 'investigating', 'resolved', 'resolved', 'closed', 'open', 'investigating', 'resolved', 'closed', 'investigating'];
const riskDescriptions: Record<typeof riskTypes[number], string> = {
  'out-of-scope': '护士执行了超出订单服务范围的操作（静脉输液），超出执业许可范围。',
  'no-check-in': '服务已完成但系统未检测到有效的GPS签到记录，存在虚假服务风险。',
  'recording-interrupt': '服务录像存在3次中断，累计中断时长12分钟，关键服务过程未完整记录。',
  'data-mismatch': '护理记录中的血压值（180/110）与体征监测设备上传的数据（145/92）明显不符。',
  'overtime': '护士提前25分钟签退，服务时长不足订单规定的60分钟，实际服务约35分钟。',
  'complaint': '患者家属投诉护士服务态度差，操作不规范，导致患者情绪激动。',
};
const assigneeNames = ['风控专员-刘强', '风控主管-周磊', '高级风控-吴敏'];

export const mockRiskTickets: RiskTicket[] = Array.from({ length: 10 }, (_, i) => {
  const order = mockOrders[i * 3];
  const riskType = riskTypes[i];
  const status = ticketStatuses[i];
  const createdAt = dayjs(order.createdAt).add(1 + Math.floor(Math.random() * 3), 'day').add(Math.floor(Math.random() * 1440), 'minute');

  return {
    id: `rt${(i + 1).toString().padStart(4, '0')}`,
    ticketNo: 'RT' + createdAt.format('YYYYMMDD') + (100 + i).toString(),
    orderId: order.id,
    orderNo: order.orderNo,
    nurseId: order.nurseId,
    nurseName: order.nurseInfo?.name,
    riskType,
    severity: severities[i],
    description: riskDescriptions[riskType],
    evidence: [
      { type: 'screenshot', url: '', description: '异常数据截图' },
      { type: 'recording', url: '', description: i % 2 === 0 ? '相关服务录像片段' : 'GPS轨迹记录' },
    ],
    status,
    assigneeId: status !== 'open' ? `asg${(i % 3 + 1).toString().padStart(3, '0')}` : undefined,
    assigneeName: status !== 'open' ? assigneeNames[i % assigneeNames.length] : undefined,
    resolution: (status === 'resolved' || status === 'closed')
      ? (severities[i] === 'critical'
        ? '已对涉事护士进行停岗培训，扣除当月绩效，向患者家属致歉并达成和解。'
        : '已与护士沟通核实，对其进行警告教育，补充完善相关记录。')
      : undefined,
    createdAt: createdAt.format('YYYY-MM-DD HH:mm:ss'),
    resolvedAt: (status === 'resolved' || status === 'closed')
      ? createdAt.add(2 + Math.floor(Math.random() * 72), 'hour').format('YYYY-MM-DD HH:mm:ss')
      : undefined,
  };
});

const insurers = ['中国平安保险', '中国人寿保险', '太平洋保险', '泰康人寿', '中国人保健康'];
const products = ['居家护理意外险A款', '上门服务责任险B款', '护工综合保障计划', '医疗护理职业责任险', '居家养老综合险'];
const policyStatuses: Array<'pending' | 'active' | 'expired' | 'claimed'> = ['active', 'active', 'active', 'active', 'active', 'pending', 'expired', 'claimed', 'active', 'active', 'active', 'active'];
const claimStatuses: Array<'none' | 'applied' | 'processing' | 'approved' | 'rejected'> = ['none', 'none', 'none', 'none', 'none', 'none', 'none', 'approved', 'processing', 'none', 'none', 'none'];

export const mockPolicies: InsurancePolicy[] = Array.from({ length: 12 }, (_, i) => {
  const order = mockOrders[i % mockOrders.length];
  const status = policyStatuses[i];
  const startDate = dayjs(order.createdAt).add(Math.floor(Math.random() * 2), 'day');
  const premium = 30 + Math.floor(Math.random() * 100);
  const coverage = [50000, 100000, 200000, 500000][Math.floor(Math.random() * 4)];

  return {
    id: `ip${(i + 1).toString().padStart(4, '0')}`,
    policyNo: 'POL' + startDate.format('YYYYMMDD') + (2000 + i).toString(),
    orderId: order.id,
    orderNo: order.orderNo,
    insurerName: insurers[i % insurers.length],
    productName: products[i % products.length],
    insuredName: order.patientInfo.name,
    premium,
    coverage,
    period: {
      start: startDate.format('YYYY-MM-DD'),
      end: startDate.add(1, 'year').format('YYYY-MM-DD'),
    },
    status,
    claimStatus: claimStatuses[i],
    createdAt: startDate.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    nurseName: order.nurseInfo?.name,
  };
});

export const mockRiskTrendData = Array.from({ length: 7 }, (_, i) => {
  const date = dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD');
  return {
    date,
    low: 15 + Math.floor(Math.random() * 10),
    medium: 8 + Math.floor(Math.random() * 6),
    high: 2 + Math.floor(Math.random() * 4),
    critical: i === 3 ? 2 : Math.floor(Math.random() * 2),
  };
});

export const mockPatientTypeDistribution = [
  { type: 'elderly', name: '老年护理', value: 156, percentage: 52 },
  { type: 'post-hospital', name: '术后康复', value: 68, percentage: 22.7 },
  { type: 'maternal', name: '母婴护理', value: 48, percentage: 16 },
  { type: 'hospice', name: '临终关怀', value: 28, percentage: 9.3 },
];

export const mockOrderTrendData = Array.from({ length: 12 }, (_, i) => {
  const month = dayjs().subtract(11 - i, 'month').format('YYYY-MM');
  return {
    month,
    orders: 80 + Math.floor(Math.random() * 120),
    revenue: 50000 + Math.floor(Math.random() * 150000),
  };
});

export const mockNurseRankingData = mockNurses
  .map((nurse) => ({
    id: nurse.id,
    name: nurse.name,
    completedOrders: nurse.completedOrders,
    rating: nurse.rating,
    organization: nurse.organizationName,
  }))
  .sort((a, b) => b.completedOrders - a.completedOrders)
  .slice(0, 10);

export const mockComplianceStats = {
  qualificationCompliance: 98.7,
  auditPassRate: 96.3,
  recordingCompleteRate: 94.8,
};

export const mockRiskTypeDistribution = [
  { type: 'out-of-scope', name: '超范围操作', value: 12, percentage: 24 },
  { type: 'no-check-in', name: '未签到服务', value: 8, percentage: 16 },
  { type: 'recording-interrupt', name: '录像中断', value: 15, percentage: 30 },
  { type: 'data-mismatch', name: '数据不一致', value: 7, percentage: 14 },
  { type: 'overtime', name: '服务超时', value: 5, percentage: 10 },
  { type: 'complaint', name: '患者投诉', value: 3, percentage: 6 },
];

export const mockRiskProcessingTime = [
  { type: 'out-of-scope', name: '超范围操作', avgHours: 24.5 },
  { type: 'no-check-in', name: '未签到服务', avgHours: 12.3 },
  { type: 'recording-interrupt', name: '录像中断', avgHours: 8.6 },
  { type: 'data-mismatch', name: '数据不一致', avgHours: 18.2 },
  { type: 'overtime', name: '服务超时', avgHours: 6.4 },
  { type: 'complaint', name: '患者投诉', avgHours: 36.8 },
];

export const mockRiskTrendByMonth = Array.from({ length: 6 }, (_, i) => {
  const month = dayjs().subtract(5 - i, 'month').format('YYYY-MM');
  return {
    month,
    low: 20 + Math.floor(Math.random() * 20),
    medium: 15 + Math.floor(Math.random() * 15),
    high: 5 + Math.floor(Math.random() * 10),
    critical: Math.floor(Math.random() * 5),
  };
});

export const mockReportStats = {
  totalOrders: 1258,
  totalRevenue: 685420,
  activeNurses: 89,
  avgOrderAmount: 545,
  totalPolicies: 892,
  totalClaims: 23,
  claimApprovalRate: 87.5,
  avgPremium: 85,
};

