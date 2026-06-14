import Mock from 'mockjs';
import type { UserInfo } from '../../stores/useUserStore';
import type { RoutePermission, ButtonPermission } from '../../stores/usePermissionStore';

const Random = Mock.Random;

const cities = ['济南市', '青岛市', '淄博市', '枣庄市', '东营市', '烟台市', '潍坊市', '济宁市', '泰安市', '威海市', '日照市', '临沂市', '德州市', '聊城市', '滨州市', '菏泽市'];
const pickCity = () => cities[Math.floor(Math.random() * cities.length)];

const ok = <T>(data: T, msg = '操作成功') => ({ code: 200, message: msg, data, timestamp: Date.now() });
const emptyOk = (msg = '操作成功') => ({ code: 200, message: msg, data: null, timestamp: Date.now() });

export const mockUserInfo: UserInfo = {
  id: '1', username: 'admin', realName: '系统管理员', avatar: '',
  phone: '13800138000', email: 'admin@shandong.gov.cn',
  department: '山东省文化和旅游厅', role: '超级管理员', roleId: '1', permissions: ['*'],
};

export const mockRoutes: RoutePermission[] = [
  { path: '/dashboard', name: '监管大屏', icon: 'DashboardOutlined' },
  { path: '/places', name: '场所备案', icon: 'ShopOutlined', children: [{ path: '/places', name: '场所列表', icon: 'UnorderedListOutlined' }] },
  { path: '/verification', name: '实名核验', icon: 'SafetyCertificateOutlined', children: [{ path: '/verification', name: '核验记录', icon: 'FileSearchOutlined' }] },
  { path: '/reservation', name: '预约分流', icon: 'CalendarOutlined', children: [{ path: '/reservation', name: '预约记录', icon: 'FileSearchOutlined' }, { path: '/reservation/config', name: '预约配置', icon: 'SettingOutlined' }] },
  { path: '/alarms', name: 'AI告警', icon: 'BellOutlined', children: [{ path: '/alarms', name: '告警列表', icon: 'FileSearchOutlined' }] },
  { path: '/inspection', name: '巡检任务', icon: 'FileTextOutlined', children: [{ path: '/inspection', name: '任务列表', icon: 'UnorderedListOutlined' }] },
  { path: '/analytics', name: '经营数据', icon: 'BarChartOutlined', children: [{ path: '/analytics', name: '数据分析', icon: 'LineChartOutlined' }, { path: '/analytics/reports', name: '数据上报', icon: 'UploadOutlined' }] },
  { path: '/system', name: '系统管理', icon: 'SettingOutlined', children: [
    { path: '/system/users', name: '用户管理', icon: 'UserOutlined' },
    { path: '/system/roles', name: '角色权限', icon: 'TeamOutlined' },
    { path: '/system/logs', name: '日志审计', icon: 'FileSearchOutlined' },
    { path: '/system/security', name: '等保配置', icon: 'SafetyOutlined' },
  ]},
];

export const mockButtons: ButtonPermission[] = [
  { key: 'place:create', name: '新增场所', description: '新增场所备案' },
  { key: 'place:edit', name: '编辑场所', description: '编辑场所信息' },
  { key: 'place:review', name: '审核场所', description: '审核场所备案' },
  { key: 'place:revoke', name: '注销场所', description: '注销场所备案' },
  { key: 'verification:live', name: '现场核验', description: '发起现场实名核验' },
  { key: 'inspection:create', name: '创建巡检', description: '创建巡检任务' },
  { key: 'inspection:execute', name: '执行巡检', description: '执行巡检任务' },
  { key: 'alarm:handle', name: '处置告警', description: '处置AI告警' },
  { key: 'system:config', name: '系统配置', description: '修改系统配置' },
];

function genPlaces(n: number) {
  const types = ['internet_cafe', 'arcade', 'ktv', 'other'];
  const typeNames: Record<string, string> = { internet_cafe: '网吧', arcade: '游戏厅', ktv: 'KTV', other: '其他' };
  const statuses = ['pending', 'approved', 'rejected', 'closed'];
  const statusTexts: Record<string, string> = { pending: '待审核', approved: '已备案', rejected: '已驳回', closed: '已注销' };
  const certs = ['valid', 'expiring_soon', 'expired', 'not_uploaded'];
  const certTexts: Record<string, string> = { valid: '有效', expiring_soon: '即将过期', expired: '已过期', not_uploaded: '未上传' };
  return Array.from({ length: n }, (_, i) => {
    const type = types[i % types.length];
    const city = pickCity();
    const status = statuses[i % statuses.length];
    return {
      id: `place-${i + 1}`, name: `${city}${typeNames[type]}${Random.cword(2, 3)}店`, type, typeName: typeNames[type],
      legalPerson: Random.cname(), phone: `1${Random.string('number', 10)}`, contactPerson: Random.cname(),
      region: city, address: `${city}某某路${Random.natural(1, 200)}号`, businessHours: '08:00-24:00',
      computerCount: type === 'internet_cafe' ? Random.natural(30, 200) : undefined,
      area: Random.natural(50, 500), status, statusText: statusTexts[status],
      fireLicenseStatus: certs[i % certs.length], fireLicenseStatusText: certTexts[certs[i % certs.length]],
      securityLicenseStatus: certs[(i + 1) % certs.length], securityLicenseStatusText: certTexts[certs[(i + 1) % certs.length]],
      lastAuditTime: Random.datetime('yyyy-MM-dd HH:mm'), rectificationStatus: i % 5 === 0 ? 'pending' : 'none',
      certificateDetails: {
        fireLicense: { certNo: `XF${Random.string('number', 10)}`, issuer: `${city}消防支队`, issueDate: '2024-01-15', expireDate: '2027-01-14', status: certs[i % certs.length], statusText: certTexts[certs[i % certs.length]], scanUrl: '' },
        securityLicense: { certNo: `ZA${Random.string('number', 10)}`, issuer: `${city}公安局`, issueDate: '2024-03-20', expireDate: '2027-03-19', status: certs[(i + 1) % certs.length], statusText: certTexts[certs[(i + 1) % certs.length]], scanUrl: '' },
        businessLicense: { certNo: `YY${Random.string('number', 10)}`, issuer: `${city}市场监管局`, issueDate: '2023-06-01', expireDate: '2028-05-31', status: 'valid', statusText: '有效', scanUrl: '' },
      },
      auditRecords: [
        { step: 1, action: 'submit', actionText: '提交备案', operator: Random.cname(), operatorRole: '场所管理员', time: Random.datetime('yyyy-MM-dd HH:mm'), result: 'submitted', resultText: '已提交', opinion: '提交场所备案申请', attachments: [] },
        { step: 2, action: 'material_review', actionText: '材料审查', operator: Random.cname(), operatorRole: '审核员', time: Random.datetime('yyyy-MM-dd HH:mm'), result: status === 'rejected' ? 'rejected' : 'approved', resultText: status === 'rejected' ? '驳回' : '通过', opinion: status === 'rejected' ? '消防许可已过期，请补充' : '材料齐全', attachments: [] },
        { step: 3, action: 'site_inspection', actionText: '现场核查', operator: Random.cname(), operatorRole: '核查员', time: Random.datetime('yyyy-MM-dd HH:mm'), result: 'approved', resultText: '通过', opinion: '现场核查通过', attachments: [] },
      ],
      rectificationRecords: i % 5 === 0 ? [{ id: `rect-${i + 1}`, source: 'audit_reject', sourceText: '审核驳回', content: '消防许可已过期', requirement: '请在30日内更新消防许可', deadline: Random.datetime('yyyy-MM-dd HH:mm'), status: 'pending', statusText: '待整改', submittedAt: null, materials: [], rechecks: [] }] : [],
      createdAt: Random.datetime('yyyy-MM-dd HH:mm'),
    };
  });
}

function genVerifications(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const isMinor = i % 15 === 0;
    return {
      id: `verify-${i + 1}`, placeId: `place-${Random.natural(1, 20)}`, placeName: `${pickCity()}网吧${Random.cword(2)}店`,
      type: 'id_card', typeName: '身份证核验', name: Random.cname(), idCard: `3701${Random.string('number', 14)}`,
      phone: `1${Random.string('number', 10)}`, status: isMinor ? 'failed' : 'success', statusName: isMinor ? '未通过' : '通过',
      verifyTime: Random.datetime('yyyy-MM-dd HH:mm'), operator: Random.cname(),
      verifyMethod: i % 3 === 0 ? 'terminal' : 'manual', verifyMethodName: i % 3 === 0 ? '终端核验' : '人工核验',
      compareSource: i % 4 === 0 ? 'police' : 'local', compareSourceName: i % 4 === 0 ? '公安人口库' : '本地比对',
      confidence: isMinor ? 0 : Random.float(85, 100, 1, 1), interceptResult: isMinor ? '未成年人拦截' : '',
      isMinor, isAdult: !isMinor, age: isMinor ? Random.natural(14, 17) : Random.natural(18, 60),
      gender: i % 2 === 0 ? '男' : '女', remark: '',
    };
  });
}

function genReservations(n: number) {
  const statuses = ['pending', 'confirmed', 'used', 'cancelled', 'expired'];
  const statusTexts: Record<string, string> = { pending: '待确认', confirmed: '已确认', used: '已核销', cancelled: '已取消', expired: '已过期' };
  return Array.from({ length: n }, (_, i) => ({
    id: `resv-${i + 1}`, placeId: `place-${Random.natural(1, 20)}`, placeName: `${pickCity()}网吧${Random.cword(2)}店`,
    name: Random.cname(), phone: `1${Random.string('number', 10)}`, date: Random.date('yyyy-MM-dd'),
    timeSlot: `${Random.natural(8, 22)}:00-${Random.natural(9, 23)}:00`, personCount: Random.natural(1, 5),
    status: statuses[i % statuses.length], statusText: statusTexts[statuses[i % statuses.length]],
    verificationCode: Random.string('upper', 6), isAnomaly: i % 12 === 0, anomalyReason: i % 12 === 0 ? '超时未核销' : undefined,
    createdAt: Random.datetime('yyyy-MM-dd HH:mm'),
  }));
}

function genAlarms(n: number) {
  const types = ['overcrowd', 'fire', 'intrusion', 'equipment', 'system', 'other'];
  const typeNames: Record<string, string> = { overcrowd: '人员密集', fire: '火灾隐患', intrusion: '非法入侵', equipment: '设备异常', system: '系统告警', other: '其他' };
  const levels: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];
  const levelNames: Record<string, string> = { critical: '严重', high: '高', medium: '中', low: '低' };
  const statuses = ['pending', 'confirmed', 'dispatched', 'received', 'processing', 'resolved', 'reviewing', 'closed', 'ignored'];
  const statusNames: Record<string, string> = { pending: '待处理', confirmed: '已确认', dispatched: '已派发', received: '已接收', processing: '处理中', resolved: '已解决', reviewing: '审核中', closed: '已关闭', ignored: '已忽略' };
  return Array.from({ length: n }, (_, i) => {
    const level = levels[i % levels.length];
    const status = statuses[i % statuses.length];
    return {
      id: `alarm-${i + 1}`, alarmNo: `ALM${String(i + 1).padStart(6, '0')}`,
      placeId: `place-${Random.natural(1, 20)}`, placeName: `${pickCity()}网吧${Random.cword(2)}店`,
      type: types[i % types.length], typeName: typeNames[types[i % types.length]], level, levelName: levelNames[level],
      title: `${typeNames[types[i % types.length]]}告警`, description: `在${pickCity()}网吧发现${typeNames[types[i % types.length]]}情况`,
      location: `${pickCity()}某某路`, images: [`https://picsum.photos/400/300?random=${i}`],
      status, statusName: statusNames[status], confidence: Random.float(75, 99, 1, 1),
      createdAt: Random.datetime('yyyy-MM-dd HH:mm'), startedAt: Random.datetime('yyyy-MM-dd HH:mm'),
      lifecycle: [
        { step: 1, stepName: 'AI识别告警', operator: 'AI系统', operatorRole: '系统', time: Random.datetime('yyyy-MM-dd HH:mm'), result: 'detected', resultText: '检测到异常', opinion: `AI检测置信度${Random.float(75, 99, 1, 1)}%`, attachments: [], lawReference: '' },
        { step: 2, stepName: '告警确认', operator: Random.cname(), operatorRole: '监管员', time: Random.datetime('yyyy-MM-dd HH:mm'), result: 'confirmed', resultText: '已确认', opinion: '确认为真实告警', attachments: [], lawReference: '' },
      ],
    };
  });
}

function genInspections(n: number) {
  const statuses = ['pending', 'dispatched', 'accepted', 'in_progress', 'submitted', 'reviewing', 'completed', 'rejected', 'cancelled'];
  const statusNames: Record<string, string> = { pending: '待派发', dispatched: '已派发', accepted: '已接收', in_progress: '执行中', submitted: '已提交', reviewing: '复查中', completed: '已完成', rejected: '已驳回', cancelled: '已取消' };
  const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
  const priorityNames: Record<string, string> = { high: '高', medium: '中', low: '低' };
  const types = ['routine', 'special', 'complaint', 'emergency'];
  const typeNames: Record<string, string> = { routine: '常规巡检', special: '专项巡检', complaint: '投诉核查', emergency: '应急巡检' };
  return Array.from({ length: n }, (_, i) => ({
    id: `insp-${i + 1}`, taskNo: `INS${String(i + 1).padStart(6, '0')}`,
    title: `${typeNames[types[i % types.length]]}-${pickCity()}`, type: types[i % types.length], typeName: typeNames[types[i % types.length]],
    placeId: `place-${Random.natural(1, 20)}`, placeName: `${pickCity()}网吧${Random.cword(2)}店`,
    inspector: Random.cname(), inspectorId: `user-${Random.natural(1, 30)}`,
    priority: priorities[i % priorities.length], priorityName: priorityNames[priorities[i % priorities.length]],
    status: statuses[i % statuses.length], statusName: statusNames[statuses[i % statuses.length]],
    description: `${typeNames[types[i % types.length]]}任务`, deadline: Random.datetime('yyyy-MM-dd HH:mm'),
    createdAt: Random.datetime('yyyy-MM-dd HH:mm'), startTime: Random.datetime('yyyy-MM-dd HH:mm'),
    checkItems: [
      { id: `item-1`, name: '消防通道检查', category: '消防安全', status: 'pass', remark: '通道畅通' },
      { id: `item-2`, name: '灭火器检查', category: '消防安全', status: i % 3 === 0 ? 'fail' : 'pass', remark: i % 3 === 0 ? '灭火器过期' : '正常' },
      { id: `item-3`, name: '实名登记检查', category: '经营管理', status: 'pass', remark: '登记规范' },
      { id: `item-4`, name: '未成年人标识检查', category: '合规检查', status: 'pass', remark: '标识醒目' },
    ],
  }));
}

function genUsers(n: number) {
  const roles = ['super_admin', 'admin', 'reviewer', 'inspector', 'analyst'];
  const roleNames: Record<string, string> = { super_admin: '超级管理员', admin: '系统管理员', reviewer: '审核员', inspector: '巡检员', analyst: '数据分析员' };
  return Array.from({ length: n }, (_, i) => ({
    id: `user-${i + 1}`, username: `user${i + 1}`, realName: Random.cname(),
    phone: `1${Random.string('number', 10)}`, email: Random.email(),
    role: roles[i % roles.length], roleName: roleNames[roles[i % roles.length]],
    region: pickCity(), status: i % 8 === 0 ? 'disabled' : 'active',
    lastLoginTime: Random.datetime('yyyy-MM-dd HH:mm'),
  }));
}

const allPlaces = genPlaces(50);
const allVerifications = genVerifications(100);
const allReservations = genReservations(80);
const allAlarms = genAlarms(60);
const allInspections = genInspections(40);
const allUsers = genUsers(30);

function paginate(list: any[], page = 1, pageSize = 10) {
  const p = Number(page) || 1, ps = Number(pageSize) || 10;
  return { list: list.slice((p - 1) * ps, p * ps), total: list.length, page: p, pageSize: ps };
}

const captchaSvg = btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><rect width="120" height="40" fill="#1e293b" rx="8"/><text x="20" y="28" font-size="24" font-weight="bold" fill="#3b82f6">ABCD</text></svg>`);

const mockHandlers: Record<string, (body?: any, params?: any) => any> = {
  // ===== AUTH =====
  'POST /api/auth/captcha': () => ok({ captchaId: `cap-${Date.now()}`, captchaImage: `data:image/svg+xml;base64,${captchaSvg}`, expiresIn: 300 }),
  'GET /api/auth/captcha': () => ok({ captchaId: `cap-${Date.now()}`, captchaImage: `data:image/svg+xml;base64,${captchaSvg}`, expiresIn: 300 }),
  'POST /api/auth/login': (body) => body?.username === 'admin' ? ok({ token: `tk-${Date.now()}`, userInfo: mockUserInfo, lastLogin: null }, '登录成功') : { code: 401, message: '用户名或密码错误', data: null, timestamp: Date.now() },
  'POST /api/auth/logout': () => emptyOk(),
  'POST /api/auth/login/log': () => emptyOk(),
  'POST /api/auth/sms/send': () => ok({ smsId: `sms-${Date.now()}`, expiresIn: 300 }),
  'PUT /api/auth/password': () => emptyOk('密码修改成功'),
  'GET /api/auth/userinfo': () => ok(mockUserInfo),
  'GET /api/auth/permissions': () => ok({ routes: mockRoutes, buttons: mockButtons }),
  'PUT /api/auth/profile': () => emptyOk('更新成功'),
  'GET /api/auth/login-history': () => ok(Array.from({ length: 5 }, (_, i) => ({ id: `lh-${i + 1}`, ip: `192.168.1.${i + 1}`, location: '山东省济南市', device: 'Chrome/Windows', browser: 'Chrome 120', loginTime: Random.datetime('yyyy-MM-dd HH:mm'), status: i === 2 ? 'failed' : 'success' }))),

  // ===== PLACE =====
  'GET /api/place/list': (_b, params) => {
    let f = [...allPlaces];
    if (params?.name) f = f.filter(p => p.name.includes(params.name));
    if (params?.type) f = f.filter(p => p.type === params.type);
    if (params?.status) f = f.filter(p => p.status === params.status);
    if (params?.region) f = f.filter(p => p.region === params.region);
    return ok(paginate(f, params?.page, params?.pageSize));
  },
  'GET /api/place/:id': () => ok(allPlaces[0]),
  'POST /api/place': () => ok(allPlaces[0], '创建成功'),
  'PUT /api/place/:id': () => ok(allPlaces[0], '更新成功'),
  'DELETE /api/place/:id': () => emptyOk('删除成功'),
  'POST /api/place/review': () => emptyOk('审核成功'),
  'POST /api/place/revoke': () => emptyOk('注销成功'),
  'POST /api/place/batch-review': () => emptyOk('批量审核成功'),
  'POST /api/place/batch-urge': () => emptyOk('催报成功'),
  'POST /api/place/rectification/recheck': () => emptyOk('复查成功'),
  'GET /api/place/statistics': () => ok({ total: 50, approved: 35, pending: 8, rejected: 5, closed: 2 }),

  // ===== VERIFICATION =====
  'GET /api/verification/list': (_b, params) => ok(paginate(allVerifications, params?.page, params?.pageSize)),
  'GET /api/verification/:id': () => ok(allVerifications[0]),
  'POST /api/verification/verify': (body) => ok({ id: `v-${Date.now()}`, result: 'success', confidence: 96.5, source: 'police', isAdult: true, verifiedAt: new Date().toISOString() }),
  'POST /api/verification/live-verify': (body) => {
    const isMinor = body?.idCard && parseInt(body.idCard.substring(6, 10)) > 2008;
    return ok({ id: `lv-${Date.now()}`, result: isMinor ? 'intercepted' : 'passed', confidence: isMinor ? 0 : 96.8, source: 'police', isAdult: !isMinor, isMinor, verifiedAt: new Date().toISOString() });
  },
  'GET /api/verification/statistics': () => ok({ todayTotal: 256, passRate: 94.5, minorIntercept: 3 }),
  'POST /api/verification/export': () => ok('export-url'),
  'GET /api/verification/minor-intercept/list': (_b, params) => ok(paginate(allVerifications.filter(v => v.isMinor), params?.page, params?.pageSize)),
  'POST /api/verification/minor-intercept/handle': () => emptyOk('处置成功'),

  // ===== RESERVATION =====
  'GET /api/reservation/list': (_b, params) => ok(paginate(allReservations, params?.page, params?.pageSize)),
  'GET /api/reservation/:id': () => ok(allReservations[0]),
  'POST /api/reservation': () => ok(allReservations[0], '预约成功'),
  'PUT /api/reservation/:id/cancel': () => emptyOk('取消成功'),
  'POST /api/reservation/verify': () => ok({ success: true, message: '核销成功' }),
  'GET /api/reservation/config/:placeId': () => ok({
    placeId: 'place-1', maxDaily: 200, maxPerSlot: 30, minAdvanceDays: 1, maxAdvanceDays: 7, enabled: true,
    overdueCancelMinutes: 30, noShowHandling: 'auto_cancel', maxDailyPerPhone: 3,
    timeSlots: [
      { start: '08:00', end: '10:00', maxPersons: 30, enabled: true },
      { start: '10:00', end: '12:00', maxPersons: 30, enabled: true },
      { start: '12:00', end: '14:00', maxPersons: 25, enabled: true },
      { start: '14:00', end: '16:00', maxPersons: 30, enabled: true },
      { start: '16:00', end: '18:00', maxPersons: 35, enabled: true },
      { start: '18:00', end: '20:00', maxPersons: 40, enabled: true },
      { start: '20:00', end: '22:00', maxPersons: 35, enabled: true },
      { start: '22:00', end: '24:00', maxPersons: 25, enabled: true },
    ],
  }),
  'PUT /api/reservation/config/:placeId': () => emptyOk('配置保存成功'),
  'GET /api/reservation/statistics': () => ok({ todayTotal: 89, used: 45, cancelled: 12, expired: 8 }),
  'GET /api/reservation/capacity-board': () => ok([
    { timeSlot: '08:00-10:00', total: 30, reserved: 12, checkedIn: 10, remaining: 18, status: 'normal' },
    { timeSlot: '10:00-12:00', total: 30, reserved: 25, checkedIn: 20, remaining: 5, status: 'tight' },
    { timeSlot: '12:00-14:00', total: 25, reserved: 25, checkedIn: 22, remaining: 0, status: 'full' },
    { timeSlot: '14:00-16:00', total: 30, reserved: 15, checkedIn: 12, remaining: 15, status: 'normal' },
    { timeSlot: '16:00-18:00', total: 35, reserved: 28, checkedIn: 18, remaining: 7, status: 'tight' },
    { timeSlot: '18:00-20:00', total: 40, reserved: 40, checkedIn: 35, remaining: 0, status: 'full' },
    { timeSlot: '20:00-22:00', total: 35, reserved: 20, checkedIn: 15, remaining: 15, status: 'normal' },
    { timeSlot: '22:00-24:00', total: 25, reserved: 8, checkedIn: 5, remaining: 17, status: 'normal' },
  ]),

  // ===== ALARM =====
  'GET /api/alarm/list': (_b, params) => {
    let f = [...allAlarms];
    if (params?.type) f = f.filter(a => a.type === params.type);
    if (params?.level) f = f.filter(a => a.level === params.level);
    if (params?.status) f = f.filter(a => a.status === params.status);
    return ok(paginate(f, params?.page, params?.pageSize));
  },
  'GET /api/alarm/:id': () => ok(allAlarms[0]),
  'PUT /api/alarm/handle': () => emptyOk('处置成功'),
  'POST /api/alarm/confirm': () => emptyOk('确认成功'),
  'POST /api/alarm/receive': () => emptyOk('接收成功'),
  'POST /api/alarm/process': () => emptyOk('处理成功'),
  'POST /api/alarm/review': () => emptyOk('审核成功'),
  'GET /api/alarm/statistics': () => ok({ total: 60, pending: 12, processing: 8, resolved: 35, todayNew: 5, critical: 5, high: 15, medium: 25, low: 15 }),
  'POST /api/alarm/export': () => ok('export-url'),

  // ===== INSPECTION =====
  'GET /api/inspection/list': (_b, params) => ok(paginate(allInspections, params?.page, params?.pageSize)),
  'GET /api/inspection/:id': () => ok(allInspections[0]),
  'POST /api/inspection': () => emptyOk('创建成功'),
  'PUT /api/inspection/execute': () => emptyOk('执行成功'),
  'PUT /api/inspection/:id/cancel': () => emptyOk('取消成功'),
  'POST /api/inspection/accept': () => emptyOk('接收成功'),
  'POST /api/inspection/review': () => emptyOk('审核成功'),
  'GET /api/inspection/statistics': () => ok({ total: 40, completed: 22, inProgress: 10, pending: 8 }),

  // ===== ANALYTICS =====
  'GET /api/analytics/overview': () => ok({ totalVisitors: 12580, totalDuration: 45600, avgDuration: 3.6, peakHour: '20:00', activePlaces: 35, minorIntercept: 3, visitorTrend: { value: 12.5, direction: 'up' }, durationTrend: { value: -2.1, direction: 'down' } }),
  'GET /api/analytics/visitor-trend': () => ok(Array.from({ length: 30 }, (_, i) => ({ date: `05-${String(i + 1).padStart(2, '0')}`, count: Random.natural(800, 2000) }))),
  'GET /api/analytics/place-ranking': () => ok(allPlaces.slice(0, 10).map(p => ({ placeId: p.id, placeName: p.name, visitorCount: Random.natural(500, 3000), avgDuration: Random.float(1.5, 5, 1, 1) }))),
  'GET /api/analytics/revenue': () => ok(Array.from({ length: 12 }, (_, i) => ({ month: `${2026 - (i > 5 ? 1 : 0)}-${String((i % 12) + 1).padStart(2, '0')}`, amount: Random.natural(50000, 200000) }))),
  'GET /api/analytics/regional-distribution': () => ok(cities.map(city => ({ region: city, count: Random.natural(50, 500), avgDuration: Random.float(1.5, 5, 1, 1) }))),
  'GET /api/analytics/place-daily': () => ok(Array.from({ length: 7 }, (_, i) => ({ date: `06-0${i + 1}`, count: Random.natural(100, 500) }))),
  'GET /api/analytics/report': () => ok('report-url'),
  'GET /api/analytics/report/list': (_b, params) => ok(paginate(allPlaces.slice(0, 20).map(p => ({ id: `rpt-${p.id}`, placeId: p.id, placeName: p.name, month: '2026-06', status: Random.pick(['draft', 'submitted', 'reviewed', 'rejected']), submittedAt: Random.datetime('yyyy-MM-dd HH:mm'), submittedBy: Random.cname() })), params?.page, params?.pageSize)),
  'GET /api/analytics/report/:id': () => ok({ id: 'rpt-1', placeId: 'place-1', placeName: '济南市网吧旗舰店', month: '2026-06', status: 'submitted', totalVisitors: 1258, totalDuration: 4560, avgDuration: 3.6, peakHour: '20:00', minorCount: 2, submittedAt: Random.datetime('yyyy-MM-dd HH:mm'), submittedBy: '张三' }),
  'POST /api/analytics/report': () => emptyOk('上报成功'),
  'PUT /api/analytics/report/:id/submit': () => emptyOk('提交成功'),
  'PUT /api/analytics/report/:id/review': () => emptyOk('审核成功'),
  'GET /api/analytics/duration-distribution': () => ok([{ range: '<1h', count: 230 }, { range: '1-2h', count: 450 }, { range: '2-4h', count: 580 }, { range: '4-6h', count: 220 }, { range: '>6h', count: 98 }]),
  'GET /api/analytics/report-status': () => ok(allPlaces.slice(0, 20).map(p => ({ placeId: p.id, placeName: p.name, month: '2026-06', status: Random.pick(['submitted', 'not_submitted', 'overdue']), submitTime: Random.datetime('yyyy-MM-dd HH:mm'), completeness: Random.natural(70, 100) }))),
  'GET /api/analytics/profile': () => ok({ ageDistribution: [{ range: '18-25', count: 3200 }, { range: '26-35', count: 4500 }, { range: '36-45', count: 2800 }, { range: '46+', count: 1200 }], genderRatio: [{ gender: '男', count: 7500 }, { gender: '女', count: 4200 }] }),

  // ===== ANALYTICS BUSINESS =====
  'GET /api/analytics/business/overview': () => ok({ totalVisitors: 12580, totalDuration: 45600, avgDuration: 3.6, peakHour: '20:00', activePlaces: 35, minorIntercept: 3 }),
  'GET /api/analytics/business/hourly-heatmap': () => ok(Array.from({ length: 24 }, (_, i) => ({ hour: i, count: Random.natural(50, 500) }))),
  'GET /api/analytics/business/age-distribution': () => ok([{ range: '18-25', count: 3200 }, { range: '26-35', count: 4500 }, { range: '36-45', count: 2800 }, { range: '46+', count: 1200 }]),
  'GET /api/analytics/business/gender-distribution': () => ok([{ gender: '男', count: 7500 }, { gender: '女', count: 4200 }]),
  'GET /api/analytics/business/place-ranking': () => ok(allPlaces.slice(0, 10).map(p => ({ placeId: p.id, placeName: p.name, visitorCount: Random.natural(500, 3000), avgDuration: Random.float(1.5, 5, 1, 1) }))),
  'GET /api/analytics/business/hourly-distribution': () => ok(Array.from({ length: 24 }, (_, i) => ({ hour: i, count: Random.natural(20, 400) }))),
  'GET /api/analytics/business/duration-segments': () => ok([{ range: '<1h', count: 230 }, { range: '1-2h', count: 450 }, { range: '2-4h', count: 580 }, { range: '4-6h', count: 220 }, { range: '>6h', count: 98 }]),
  'GET /api/analytics/business/duration-by-hour': () => ok(Array.from({ length: 24 }, (_, i) => ({ hour: i, avgDuration: Random.float(0.5, 4, 1, 1) }))),
  'GET /api/analytics/business/personnel-detail': () => ok(Array.from({ length: 10 }, (_, i) => ({ id: `p-${i + 1}`, name: Random.cname(), idCard: `3701${Random.string('number', 14)}`, duration: Random.float(0.5, 6, 1, 1), placeName: `${pickCity()}网吧`, time: Random.datetime('yyyy-MM-dd HH:mm') }))),
  'GET /api/analytics/business/city-drilldown': () => ok(cities.map(city => ({ region: city, count: Random.natural(50, 500), avgDuration: Random.float(1.5, 5, 1, 1) }))),
  'GET /api/analytics/business/district-places': () => ok(allPlaces.slice(0, 5).map(p => ({ placeId: p.id, placeName: p.name, visitorCount: Random.natural(100, 500), avgDuration: Random.float(1.5, 5, 1, 1) }))),
  'GET /api/analytics/business/personnel-profile': () => ok({ ageDistribution: [{ range: '18-25', count: 3200 }, { range: '26-35', count: 4500 }, { range: '36-45', count: 2800 }, { range: '46+', count: 1200 }], genderRatio: [{ gender: '男', count: 7500 }, { gender: '女', count: 4200 }], idTypeDistribution: [{ type: '本地', count: 8000 }, { type: '外地', count: 3500 }, { type: '港澳台', count: 150 }, { type: '外籍', count: 50 }], minorRateTrend: Array.from({ length: 7 }, (_, i) => ({ date: `06-0${i + 1}`, rate: Random.float(0.5, 3, 1, 1) })) }),
  'GET /api/analytics/business/report-status': () => ok(allPlaces.slice(0, 20).map(p => ({ placeId: p.id, placeName: p.name, month: '2026-06', status: Random.pick(['submitted', 'not_submitted', 'overdue']), submitTime: Random.datetime('yyyy-MM-dd HH:mm'), completeness: Random.natural(70, 100) }))),

  // ===== DASHBOARD =====
  'GET /api/analytics/dashboard/overview': () => ok({ totalPlaces: 50, onlinePlaces: 35, todayVisitors: 12580, pendingAlarms: 12, inspectionRate: 78.5 }),
  'GET /api/analytics/dashboard/map-heat': () => ok(cities.map(city => ({ code: `370${Random.natural(100, 200)}`, name: city, level: 'city', value: Random.natural(20, 200) }))),
  'GET /api/analytics/dashboard/realtime-alarms': () => ok(allAlarms.slice(0, 10)),
  'GET /api/analytics/dashboard/trend': () => ok(Array.from({ length: 7 }, (_, i) => ({ date: `06-0${i + 1}`, count: Random.natural(800, 2000) }))),
  'GET /api/analytics/dashboard/region-ranking': () => ok(cities.slice(0, 10).map(city => ({ region: city, count: Random.natural(100, 800) }))),
  'GET /api/analytics/dashboard/place-type': () => ok([{ type: '网吧', count: 25 }, { type: '游戏厅', count: 10 }, { type: 'KTV', count: 12 }, { type: '其他', count: 3 }]),
  'GET /api/dashboard/overview': () => ok({ totalPlaces: 50, onlinePlaces: 35, todayVisitors: 12580, pendingAlarms: 12, inspectionRate: 78.5 }),
  'GET /api/dashboard/alarms': () => ok(allAlarms.slice(0, 10)),
  'GET /api/dashboard/map-heat': () => ok(cities.map(city => ({ code: `370${Random.natural(100, 200)}`, name: city, level: 'city', value: Random.natural(20, 200) }))),

  // ===== SYSTEM =====
  'GET /api/system/user/list': (_b, params) => ok(paginate(allUsers, params?.page, params?.pageSize)),
  'GET /api/system/user/:id': () => ok(allUsers[0]),
  'POST /api/system/user': () => emptyOk('创建成功'),
  'PUT /api/system/user/:id': () => emptyOk('更新成功'),
  'DELETE /api/system/user/:id': () => emptyOk('删除成功'),
  'PUT /api/system/user/:id/reset-password': () => emptyOk('重置成功'),
  'GET /api/system/role/list': () => ok([
    { id: '1', code: 'super_admin', name: '超级管理员', description: '系统最高权限', dataScope: 'all', status: 'active', permissions: 50 },
    { id: '2', code: 'admin', name: '系统管理员', description: '系统管理权限', dataScope: 'all', status: 'active', permissions: 40 },
    { id: '3', code: 'reviewer', name: '审核员', description: '审核管理权限', dataScope: 'region', status: 'active', permissions: 20 },
    { id: '4', code: 'inspector', name: '巡检员', description: '巡检执行权限', dataScope: 'region', status: 'active', permissions: 15 },
    { id: '5', code: 'analyst', name: '数据分析员', description: '数据分析权限', dataScope: 'all', status: 'active', permissions: 10 },
  ]),
  'GET /api/system/role/:id': () => ok({ id: '1', code: 'super_admin', name: '超级管理员', description: '系统最高权限', dataScope: 'all', status: 'active', permissions: 50 }),
  'POST /api/system/role': () => emptyOk('创建成功'),
  'PUT /api/system/role/:id': () => emptyOk('更新成功'),
  'DELETE /api/system/role/:id': () => emptyOk('删除成功'),
  'GET /api/system/log/list': (_b, params) => ok(paginate(Array.from({ length: 100 }, (_, i) => ({
    id: `log-${i + 1}`, userId: `user-${Random.natural(1, 30)}`, username: `user${Random.natural(1, 30)}`,
    module: Random.pick(['登录', '场所管理', '告警处理', '巡检管理', '系统设置']),
    action: Random.pick(['查询', '新增', '修改', '删除', '导出']),
    ip: `192.168.${Random.natural(1, 255)}.${Random.natural(1, 255)}`,
    status: Random.pick(['success', 'fail']), duration: Random.natural(10, 500),
    createdAt: Random.datetime('yyyy-MM-dd HH:mm'),
  })), params?.page, params?.pageSize)),
  'GET /api/system/log/:id': () => ok({ id: 'log-1', userId: 'user-1', username: 'admin', module: '登录', action: '查询', ip: '192.168.1.1', status: 'success', duration: 150, createdAt: Random.datetime('yyyy-MM-dd HH:mm') }),
  'GET /api/system/statistics': () => ok({ userCount: 30, roleCount: 5, logCount: 1000, todayLogin: 15 }),
  'GET /api/system/users': (_b, params) => ok(paginate(allUsers, params?.page, params?.pageSize)),
  'GET /api/system/roles': () => ok([
    { id: '1', code: 'super_admin', name: '超级管理员', description: '系统最高权限', dataScope: 'all', status: 'active', permissions: 50 },
    { id: '2', code: 'admin', name: '系统管理员', description: '系统管理权限', dataScope: 'all', status: 'active', permissions: 40 },
    { id: '3', code: 'reviewer', name: '审核员', description: '审核管理权限', dataScope: 'region', status: 'active', permissions: 20 },
    { id: '4', code: 'inspector', name: '巡检员', description: '巡检执行权限', dataScope: 'region', status: 'active', permissions: 15 },
    { id: '5', code: 'analyst', name: '数据分析员', description: '数据分析权限', dataScope: 'all', status: 'active', permissions: 10 },
  ]),
  'GET /api/system/logs': (_b, params) => ok(paginate(Array.from({ length: 100 }, (_, i) => ({
    id: `log-${i + 1}`, userId: `user-${Random.natural(1, 30)}`, username: `user${Random.natural(1, 30)}`,
    module: Random.pick(['登录', '场所管理', '告警处理', '巡检管理', '系统设置']),
    action: Random.pick(['查询', '新增', '修改', '删除', '导出']),
    ip: `192.168.${Random.natural(1, 255)}.${Random.natural(1, 255)}`,
    status: Random.pick(['success', 'fail']), duration: Random.natural(10, 500),
    createdAt: Random.datetime('yyyy-MM-dd HH:mm'),
  })), params?.page, params?.pageSize)),
  'GET /api/system/security-config': () => ok({
    minPasswordLength: 8, requireComplexity: true, passwordExpireDays: 90, historyPasswordCount: 5,
    maxLoginAttempts: 5, lockDuration: 30, sessionTimeout: 30,
    twoFactorEnabled: true, dataEncryptionEnabled: true,
    ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8'],
  }),
  'PUT /api/system/security-config': () => emptyOk('保存成功'),
};

function matchMock(method: string, url: string): ((body?: any, params?: any) => any) | null {
  const u = url.replace(/^\/+/, '/');
  const exactKey = `${method} ${u}`;
  if (mockHandlers[exactKey]) return mockHandlers[exactKey];
  for (const key of Object.keys(mockHandlers)) {
    const spaceIdx = key.indexOf(' ');
    const m = key.substring(0, spaceIdx);
    const pattern = key.substring(spaceIdx + 1);
    if (m !== method) continue;
    const regex = pattern.replace(/:[^/]+/g, '[^/]+');
    if (new RegExp(`^${regex}$`).test(u)) return mockHandlers[key];
  }
  return null;
}

export function mockRequest(method: string, url: string, body?: any, params?: any): any {
  const handler = matchMock(method, url);
  if (handler) {
    return handler(body, params);
  }
  console.warn(`[Mock] Unmatched: ${method} ${url}`);
  return emptyOk();
}
