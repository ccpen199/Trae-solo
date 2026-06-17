import http from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { URL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

function loadEnv() {
  try {
    const env = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of env.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...rest] = trimmed.split('=');
      if (!process.env[key]) process.env[key] = rest.join('=');
    }
  } catch {
    // Local runtime can start with defaults.
  }
}

loadEnv();

const HOST = process.env.HOST || process.env.BACKEND_HOST || '127.0.0.1';
const FRONTEND_HOST = process.env.FRONTEND_HOST || HOST;
const BACKEND_HOST = process.env.BACKEND_HOST || HOST;
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 49207);
const BACKEND_PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59207);
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const mode = process.argv[2] || 'both';

mkdirSync(resolve(process.cwd(), 'data'), { recursive: true });
const db = new DatabaseSync(resolve(process.cwd(), 'data/runtime.sqlite'));

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS service_items (
      id TEXT PRIMARY KEY,
      item_code TEXT NOT NULL,
      item_name TEXT NOT NULL,
      department TEXT NOT NULL,
      time_limit TEXT NOT NULL,
      materials TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      applicant TEXT NOT NULL,
      item_name TEXT NOT NULL,
      status TEXT NOT NULL,
      current_node TEXT NOT NULL,
      due_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const count = db.prepare('SELECT COUNT(*) AS count FROM service_items').get().count;
  if (count > 0) return;

  const insertItem = db.prepare(`
    INSERT INTO service_items (id, item_code, item_name, department, time_limit, materials)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertItem.run('si-001', '114401000001', '居住证办理', '公安局', '7 working days', '身份证、居住证明、电子照片');
  insertItem.run('si-002', '114401000002', '社保卡申领', '人社局', '5 working days', '身份证、社保缴费记录');
  insertItem.run('si-003', '114401000003', '营业执照设立登记', '市场监管局', '3 working days', '电子表单、住所证明、经营者身份信息');

  const insertApp = db.prepare(`
    INSERT INTO applications (id, applicant, item_name, status, current_node, due_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertApp.run('app-20260614-001', '陈女士', '居住证办理', 'PRE_REVIEWING', '智能预审', '2026-06-17');
  insertApp.run('app-20260614-002', '广州政务小程序', '社保卡申领', 'APPROVING', '部门协同审批', '2026-06-18');
  insertApp.run('app-20260614-003', '李先生', '营业执照设立登记', 'CERTIFICATE_ISSUED', '电子证照签发', '2026-06-14');

  const insertPolicy = db.prepare(`
    INSERT INTO policies (id, title, category, updated_at)
    VALUES (?, ?, ?, ?)
  `);
  insertPolicy.run('pol-001', '广州市政务服务事项标准化指引', '办事指南', '2026-06-14');
  insertPolicy.run('pol-002', '电子证照跨部门调用规范', '政策文件', '2026-06-12');
  insertPolicy.run('pol-003', '移动端实名核验与粤省事对接说明', '接口规范', '2026-06-10');
}

initDb();

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
  });
  res.end(body);
}

function sendHtml(res, html) {
  res.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(html);
}

function serviceItems() {
  const items = db.prepare('SELECT * FROM service_items ORDER BY item_code').all();
  return items.map((item) => {
    const form = formTemplates.find((f) => f.itemCode === item.item_code);
    const formLog = form ? (formFieldChangeLogs[form.id] || []) : [];
    const reviewRecords = form ? (templateReviewRecords[form.id] || []) : [];
    const audit = standardAuditRecords[item.item_code] || null;
    return {
      ...item,
      handlingTimeLimit: handlingTimeLimits[item.item_code] || null,
      applicableConditions: applicableConditions[item.item_code] || [],
      formTemplate: form || null,
      formFieldChangeLog: formLog,
      materialVerificationRule: materialVerificationRules[item.item_code] || [],
      templateReviewRecords: reviewRecords,
      standardReviewReady: form && formLog.length > 0 && reviewRecords.length > 0,
      standardAuditRecords: audit,
      hasAuditRecords: audit != null && (audit.timeLimitChanges.length > 0 || audit.materialVerifyFailures.length > 0 || audit.formVersionDiffs.length > 0 || audit.applicableConditionConflicts.length > 0),
    };
  });
}

function applications() {
  return db.prepare('SELECT * FROM applications ORDER BY due_at').all();
}

function policies() {
  return db.prepare('SELECT * FROM policies ORDER BY updated_at DESC').all();
}

const workflowNodeTemplates = {
  'default': [
    { key: 'appointment', label: '预约取号', owner: '移动端' },
    { key: 'upload', label: '材料上传', owner: '申请人' },
    { key: 'pre-review', label: '智能预审', owner: 'AI预审' },
    { key: 'approval', label: '部门协同审批', owner: '公安局/人社局/市场监管局' },
    { key: 'certificate', label: '电子证照签发', owner: '电子证照库' },
    { key: 'push', label: '结果推送', owner: '短信/微信/小程序' },
  ],
};

const nodeResponsiblePersons = {
  'app-20260614-001': {
    appointment: { name: '陈女士', idCard: '440101********1234', operation: '微信预约', evidence: '预约号 GZYY-240614-1088', abnormal: null },
    upload: { name: '陈女士', operation: '自助上传', evidence: '身份证/电子照片/社保缴费证明已验真；居住证明待补正', abnormal: { type: 'MATERIAL_PENDING', description: '居住证明缺少备案编号' } },
    'pre-review': { name: 'AI预审引擎', operation: '自动预审', evidence: 'OCR字段通过率 95.2%，触发补正分支', abnormal: { type: 'TRIGGER_SUPPLEMENT', description: '自动发起补正通知' } },
    approval: { name: '王建国/李美玲/张伟/陈志强', operation: '四部门会签 3/4', evidence: '跨部门核验 3/4 完成，住建局待补正复核', abnormal: { type: 'JOINTSIGN_PENDING', description: '住建局等待补正后复核' } },
    certificate: { name: '待审批通过', operation: '待签发', evidence: '待补正通过且四部门会签完成后签发', abnormal: null },
    push: { name: '待签发完成', operation: '待推送', evidence: '待证照签发后三渠道推送', abnormal: null },
  },
  'app-20260614-002': {
    appointment: { name: '广州政务小程序', operation: '批量预约', evidence: '预约号 GZYY-240613-0956', abnormal: null },
    upload: { name: '广州政务小程序', operation: '批量上传', evidence: '身份证/参保凭证/照片已验真', abnormal: null },
    'pre-review': { name: 'AI预审引擎', operation: '自动预审', evidence: 'OCR字段通过率 98.1%，自动核准通过', abnormal: null },
    approval: { name: '林晓东（协调）/赵军/黄敏/刘芳', operation: '跨部门审批中', evidence: '人社/医保已通过，银行制卡预审核中', abnormal: { type: 'TIMEOUT_PENDING', description: '距办理时限还有18小时' } },
    certificate: { name: '待审批通过', operation: '待制卡', evidence: '待审批通过后进入制卡流程', abnormal: null },
    push: { name: '待制卡完成', operation: '待推送', evidence: '待卡片制作完成后推送领取通知', abnormal: null },
  },
  'app-20260614-003': {
    appointment: { name: '李先生', idCard: '440102********5678', operation: '粤省事预约', evidence: '预约号 GZYY-240614-0712', abnormal: null },
    upload: { name: '李先生', operation: '自助上传', evidence: '身份证/居住证明/照片/劳动合同全部验真通过', abnormal: null },
    'pre-review': { name: 'AI预审引擎', operation: '自动预审', evidence: 'OCR字段通过率 99.4%，评分92分自动核准', abnormal: null },
    approval: { name: '王建国/李美玲/周丽/何强', operation: '四部门会签 4/4', evidence: '公安/人社/住建/市场监管全部通过', abnormal: null },
    certificate: { name: '王建国（越秀区公安局）', operation: '签发确认', evidence: '电子证照 GZJZZ-2026-0614-00892 签发', abnormal: null },
    push: { name: '系统自动推送', operation: '三渠道送达', evidence: '短信/微信/小程序已推送，申请人已确认', abnormal: null },
  },
};

const supplementRecords = {
  'app-20260614-001': [
    { id: 'sup-001', material: '居住证明', issue: '缺少房屋租赁备案编号', initiatedBy: '陈志强（越秀区住建局）', initiatedAt: '2026-06-15 11:20', initiatorDept: '越秀区住建局', deadline: '2026-06-17 23:59', status: 'PENDING_SUBMIT', submittedAt: '', submittedBy: '', recheckedAt: '', recheckedBy: '', recheckResult: '', nodeRollback: 'pre-review → upload → pre-review → approval（当前停留在approval等待补正复核）', rollbackHistory: [
      { from: 'pre-review', to: 'upload', triggeredAt: '2026-06-15 11:21', reason: '材料需补正' },
      { from: 'upload', to: 'pre-review', triggeredAt: '', reason: '待申请人重新提交' },
      { from: 'pre-review', to: 'approval', triggeredAt: '', reason: '待预审通过后流转' },
    ] },
  ],
};

const approvalOpinions = [
  { id: 'apv-001', applicationId: 'app-20260614-001', dept: '越秀区公安局', handler: '王建国', opinion: '申请人身份核验通过，居住信息与登记一致，同意办理。', signedAt: '2026-06-15 09:30', status: 'APPROVED' },
  { id: 'apv-002', applicationId: 'app-20260614-001', dept: '越秀区人社局', handler: '李美玲', opinion: '社保缴费记录连续满12个月，符合申领条件。', signedAt: '2026-06-15 10:15', status: 'APPROVED' },
  { id: 'apv-003', applicationId: 'app-20260614-001', dept: '越秀区市场监管局', handler: '张伟', opinion: '经营场所信息核验通过，经营范围合规。', signedAt: '2026-06-15 11:20', status: 'APPROVED' },
  { id: 'apv-004', applicationId: 'app-20260614-001', dept: '越秀区住房城乡建设局', handler: '陈志强', opinion: '居住证明需补充房屋租赁备案编号，待补正。', signedAt: '', status: 'PENDING' },
  { id: 'apv-005', applicationId: 'app-20260614-002', dept: '越秀区人社局', handler: '赵军', opinion: '参保信息核验通过，连续缴费满24个月。', signedAt: '2026-06-14 15:10', status: 'APPROVED' },
  { id: 'apv-006', applicationId: 'app-20260614-002', dept: '越秀区医保局', handler: '黄敏', opinion: '医保状态正常，未享受其他同类待遇。', signedAt: '2026-06-14 16:25', status: 'APPROVED' },
  { id: 'apv-007', applicationId: 'app-20260614-002', dept: '工商银行广州分行', handler: '刘芳', opinion: '制卡资质核验中，需确认制卡网点产能。', signedAt: '', status: 'PENDING' },
  { id: 'apv-008', applicationId: 'app-20260614-002', dept: '广州市社保卡中心', handler: '林晓东', opinion: '请银行加快制卡预审核，距超时还有18小时。', signedAt: '', status: 'PENDING' },
  { id: 'apv-009', applicationId: 'app-20260614-003', dept: '越秀区公安局', handler: '王建国', opinion: '身份核验通过，居住登记信息与备案一致。', signedAt: '2026-06-14 14:10', status: 'APPROVED' },
  { id: 'apv-010', applicationId: 'app-20260614-003', dept: '越秀区人社局', handler: '李美玲', opinion: '社保缴费记录连续满14个月，符合申领条件。', signedAt: '2026-06-14 14:50', status: 'APPROVED' },
  { id: 'apv-011', applicationId: 'app-20260614-003', dept: '越秀区住房城乡建设局', handler: '周丽', opinion: '房屋租赁备案编号有效，符合住所要求。', signedAt: '2026-06-14 15:30', status: 'APPROVED' },
  { id: 'apv-012', applicationId: 'app-20260614-003', dept: '越秀区市场监管局', handler: '何强', opinion: '无经营异常记录，符合办理条件。', signedAt: '2026-06-14 16:00', status: 'APPROVED' },
];

const certificateDetail = {
  applicationId: 'app-20260614-003',
  certificateNo: 'GZJZZ-2026-0614-00892',
  certificateType: '电子居住证',
  issuer: '广州市公安局越秀区分局',
  issuedAt: '2026-06-14 16:20',
  issuanceConfirmed: true,
  confirmedBy: '王建国（越秀区公安局审批员）',
  confirmedAt: '2026-06-14 16:25',
  sealImageUrl: '/static/seals/gz-gonganjv.png',
  qrCodeUrl: '/static/qrcodes/cert-gzjzz-2026-0614-00892.png',
  validFrom: '2026-06-14',
  validTo: '2027-06-13',
};

const resultPushReceipt = {
  applicationId: 'app-20260614-003',
  pushChannels: ['sms', 'wechat', 'miniProgram'],
  pushedAt: '2026-06-14 16:30',
  pushOperator: '系统自动推送',
  deliveryReceiptNo: 'DR-20260614-1630-007',
  applicantReceived: true,
  receiptConfirmedAt: '2026-06-14 16:45',
  failedChannels: [],
  retryAttempts: 0,
  smsStatus: 'DELIVERED',
  wechatStatus: 'READ',
  miniProgramStatus: 'READ',
};

const branchRecords = [
  { id: 'br-001', applicationId: 'app-20260614-001', type: 'SUPPLEMENT', label: '材料补正', triggeredAt: '2026-06-15 11:20', triggeredBy: '陈志强（住建局）', description: '需补充房屋租赁备案编号', resolved: false },
  { id: 'br-002', applicationId: 'app-20260614-002', type: 'RESCHEDULE', label: '预约改期', triggeredAt: '2026-06-13 14:30', triggeredBy: '广州政务小程序', description: '原预约6月15日改至6月16日', resolved: true, resolvedAt: '2026-06-13 14:35' },
  { id: 'br-003', applicationId: 'app-20260614-001', type: 'JOINT_SIGN', label: '部门会签', triggeredAt: '2026-06-15 09:00', triggeredBy: '系统自动分送', description: '四部门联合审批，3/4已完成', resolved: false },
  { id: 'br-004', applicationId: 'app-20260614-003', type: 'CERTIFICATE_ISSUED', label: '签发确认', triggeredAt: '2026-06-14 16:20', triggeredBy: '电子证照库', description: '证照签发完成并确认', resolved: true, resolvedAt: '2026-06-14 16:25' },
  { id: 'br-005', applicationId: 'app-20260614-003', type: 'RESULT_DELIVERY', label: '结果送达', triggeredAt: '2026-06-14 16:30', triggeredBy: '通知中心', description: '三渠道推送，申请人已确认', resolved: true, resolvedAt: '2026-06-14 16:45' },
  { id: 'br-006', applicationId: 'app-20260614-002', type: 'TIMEOUT_WARNING', label: '超时预警', triggeredAt: '2026-06-15 10:03', triggeredBy: '系统超时检测', description: '距办理时限还有18小时，二级预警', resolved: false },
  { id: 'br-007', applicationId: 'app-20260614-001', type: 'NODE_ROLLBACK', label: '节点回退', triggeredAt: '2026-06-15 11:21', triggeredBy: '系统自动回退', description: 'pre-review → upload 回退，等待补正后重新预审', resolved: false },
  { id: 'br-008', applicationId: 'app-20260614-002', type: 'TIMEOUT_ESCALATION', label: '升级督办', triggeredAt: '2026-06-15 10:05', triggeredBy: '系统预警规则', description: '升级至运行监控处林晓东协调处置', resolved: false },
];

const timeoutAuditRecords = [
  { id: 'ntc-001', applicationId: 'app-20260614-001', itemCode: '114401000001', itemName: '居住证办理', node: 'pre-review', nodeLabel: '智能预审', channel: '微信服务通知', receiver: '陈女士', message: '智能预审需补充居住证明', sentAt: '2026-06-15 09:12', status: 'SENT', audit: '自动触发+后台留痕', responsibleDept: '越秀区住房城乡建设局', responsiblePerson: '陈志强', disposalRecordId: 'disp-001', notificationType: 'SUPPLEMENT_NOTICE', urgencyLevel: 'NORMAL' },
  { id: 'ntc-002', applicationId: 'app-20260614-002', itemCode: '114401000002', itemName: '社保卡申领', node: 'approval', nodeLabel: '部门协同审批', channel: '短信', receiver: '广州政务小程序', message: '部门协同审批剩余 18 小时', sentAt: '2026-06-15 10:03', status: 'SENT', audit: '超时预警规则 R-2024-07', responsibleDept: '广州市政务服务数据管理局 运行监控处', responsiblePerson: '林晓东', disposalRecordId: 'disp-002', notificationType: 'TIMEOUT_WARNING', urgencyLevel: 'HIGH' },
  { id: 'ntc-003', applicationId: 'app-20260614-003', itemCode: '114401000001', itemName: '居住证办理', node: 'certificate', nodeLabel: '电子证照签发', channel: '小程序订阅消息', receiver: '李先生', message: '电子证照已签发，可下载', sentAt: '2026-06-14 16:30', status: 'DELIVERED', audit: '证照签发回调', responsibleDept: '公安局电子证照管理处', responsiblePerson: '王警官', disposalRecordId: '', notificationType: 'RESULT_NOTICE', urgencyLevel: 'LOW' },
  { id: 'ntc-004', applicationId: 'app-20260614-001', itemCode: '114401000001', itemName: '居住证办理', node: 'upload', nodeLabel: '材料上传', channel: '短信', receiver: '陈女士', message: '补正材料已提交，等待复核', sentAt: '2026-06-15 14:20', status: 'DELIVERED', audit: '申请人操作触发', responsibleDept: '越秀区政务服务中心', responsiblePerson: '李敏', disposalRecordId: 'disp-003', notificationType: 'MATERIAL_RECEIVED', urgencyLevel: 'NORMAL' },
];

const notificationDisposalRecords = {
  'disp-001': { id: 'disp-001', notificationId: 'ntc-001', disposalType: 'SUPPLEMENT_REVIEW', disposalStatus: 'PENDING', disposedBy: '陈志强', disposedAt: '', disposalNote: '待申请人提交补正材料后复核', expectedCompletionAt: '2026-06-20 18:00' },
  'disp-002': { id: 'disp-002', notificationId: 'ntc-002', disposalType: 'TIMEOUT_COORDINATION', disposalStatus: 'IN_PROGRESS', disposedBy: '林晓东', disposedAt: '2026-06-15 10:30', disposalNote: '已联系工商银行核验部门，要求加快进度', expectedCompletionAt: '2026-06-16 02:00' },
  'disp-003': { id: 'disp-003', notificationId: 'ntc-004', disposalType: 'MATERIAL_REVIEW', disposalStatus: 'PENDING', disposedBy: '李敏', disposedAt: '', disposalNote: '待材料核验完成后通知申请人', expectedCompletionAt: '2026-06-16 12:00' },
};

const disposalPersons = {
  'app-20260614-002': {
    id: 'user-op-007',
    name: '林晓东',
    department: '广州市政务服务数据管理局 运行监控处',
    assignedAt: '2026-06-15 08:00',
    disposalDeadline: '2026-06-16 02:00',
    countdownMinutes: 1080,
    responsibility: '跨部门协同协调',
    escalationPath: '运行监控处 → 政务服务处处长 → 分管副局长',
  },
  'app-20260614-001': {
    id: 'user-op-008',
    name: '陈志强',
    department: '越秀区住房城乡建设局',
    assignedAt: '2026-06-15 11:20',
    disposalDeadline: '2026-06-17 23:59',
    countdownMinutes: 3420,
    responsibility: '材料补正复核',
    escalationPath: '住建局审批员 → 住建局审批科长 → 住建局分管副局长',
  },
};

const workflowActions = {
  'app-20260614-001': {
    available: [
      { key: 'supplement_submit', label: '提交补正材料', type: 'primary', tip: '申请人提交补正后的居住证明' },
      { key: 'rollback_to_upload', label: '退回材料上传', type: 'warn', tip: '将节点回退到材料上传阶段' },
      { key: 'supervise', label: '发起督办', type: 'danger', tip: '对当前节点发起超期督办' },
      { key: 'view_log', label: '操作日志', type: 'secondary', tip: '查看该办件所有操作记录' },
    ],
    disabled: [
      { key: 'approve', label: '审批通过', reason: '待补正材料复核通过后启用' },
      { key: 'issue_cert', label: '签发证照', reason: '待四部门会签全部通过后启用' },
    ],
  },
  'app-20260614-002': {
    available: [
      { key: 'urge_dept', label: '催办银行核验', type: 'primary', tip: '向工商银行核验部门发送催办通知' },
      { key: 'escalate', label: '升级督办', type: 'danger', tip: '升级至政务服务处处长督办' },
      { key: 'view_log', label: '操作日志', type: 'secondary', tip: '查看该办件所有操作记录' },
    ],
    disabled: [
      { key: 'approve', label: '审批通过', reason: '待银行核验完成后启用' },
    ],
  },
  'app-20260614-003': {
    available: [
      { key: 're_open', label: '重启办件', type: 'warn', tip: '对已办结办件发起复审' },
      { key: 'print_cert', label: '打印证照', type: 'secondary', tip: '打印电子证照纸质副本' },
      { key: 'view_log', label: '操作日志', type: 'secondary', tip: '查看该办件所有操作记录' },
    ],
    disabled: [
      { key: 'supplement', label: '发起补正', reason: '办件已办结，材料全部验真' },
    ],
  },
};

const operationLogs = {
  'app-20260614-001': [
    { id: 'op-001', action: '发起预约', operator: '陈女士', operatorType: 'APPLICANT', operatedAt: '2026-06-15 08:00', node: 'appointment', result: 'SUCCESS', note: '微信小程序预约越秀区政务服务中心居住证办理' },
    { id: 'op-002', action: '提交材料', operator: '陈女士', operatorType: 'APPLICANT', operatedAt: '2026-06-15 08:30', node: 'upload', result: 'SUCCESS', note: '上传身份证、居住证明、电子照片、社保缴费证明4项材料' },
    { id: 'op-003', action: '材料预审', operator: '李敏', operatorType: 'STAFF', operatedAt: '2026-06-15 09:45', node: 'pre-review', result: 'REJECT', note: '居住证明缺少房屋租赁备案编号，退回补正' },
    { id: 'op-004', action: '发起补正', operator: '李敏', operatorType: 'STAFF', operatedAt: '2026-06-15 09:46', node: 'pre-review', result: 'SUCCESS', note: '系统自动发送补正通知至申请人微信和短信' },
    { id: 'op-005', action: '节点回退', operator: '系统', operatorType: 'SYSTEM', operatedAt: '2026-06-15 09:46', node: 'approval→pre-review→upload', result: 'SUCCESS', note: '补正触发节点回退至材料上传阶段，待申请人重新提交' },
    { id: 'op-006', action: '督办提醒', operator: '张科长', operatorType: 'SUPERVISOR', operatedAt: '2026-06-15 13:00', node: 'upload', result: 'SUCCESS', note: '关注补正时限，确保申请人及时知晓补正要求' },
  ],
  'app-20260614-002': [
    { id: 'op-011', action: '受理登记', operator: '王芳', operatorType: 'STAFF', operatedAt: '2026-06-15 08:15', node: 'pre-review', result: 'SUCCESS', note: '街镇综合受理窗口录入社保卡申领信息' },
    { id: 'op-012', action: '身份核验', operator: '系统', operatorType: 'SYSTEM', operatedAt: '2026-06-15 08:20', node: 'pre-review', result: 'FALLBACK', note: 'NFC读卡失败，自动降级至身份证联网核查' },
    { id: 'op-013', action: '临时授权', operator: '系统', operatorType: 'SYSTEM', operatedAt: '2026-06-15 08:20', node: 'pre-review', result: 'SUCCESS', note: '发放24小时临时授权凭证 AUTH-TKN-20260615-0820-00156' },
    { id: 'op-014', action: '推送银行核验', operator: '系统', operatorType: 'SYSTEM', operatedAt: '2026-06-15 08:30', node: 'approval', result: 'PENDING', note: '推送至工商银行制卡网点核验，预计2个工作日反馈' },
    { id: 'op-015', action: '超时预警', operator: '系统', operatorType: 'SYSTEM', operatedAt: '2026-06-15 06:00', node: 'approval', result: 'WARNING', note: '距承诺办结时限还有18小时，触发黄色预警' },
    { id: 'op-016', action: '督办催办', operator: '王处长', operatorType: 'SUPERVISOR', operatedAt: '2026-06-15 10:30', node: 'approval', result: 'PENDING', note: '请银行加快核验，距超时还有18小时（紧急督办）' },
  ],
  'app-20260614-003': [
    { id: 'op-021', action: '受理登记', operator: '系统', operatorType: 'SYSTEM', operatedAt: '2026-06-14 09:00', node: 'pre-review', result: 'SUCCESS', note: '线上全流程受理，无需纸质材料' },
    { id: 'op-022', action: '材料智能核验', operator: '系统', operatorType: 'SYSTEM', operatedAt: '2026-06-14 09:05', node: 'pre-review', result: 'SUCCESS', note: '4项材料全部自动验真通过' },
    { id: 'op-023', action: '四部门会签', operator: '系统', operatorType: 'SYSTEM', operatedAt: '2026-06-14 09:30-14:20', node: 'approval', result: 'SUCCESS', note: '公安局、人社局、住建局、卫健委全部审批通过' },
    { id: 'op-024', action: '电子证照签发', operator: '系统', operatorType: 'SYSTEM', operatedAt: '2026-06-14 14:30', node: 'certificate', result: 'SUCCESS', note: '签发电子居住证 证号GZJZZ20260614000123' },
    { id: 'op-025', action: '三渠道推送', operator: '系统', operatorType: 'SYSTEM', operatedAt: '2026-06-14 14:35', node: 'result-push', result: 'SUCCESS', note: '粤省事、微信、短信三渠道全部送达成功' },
    { id: 'op-026', action: '申请人签收', operator: '李先生', operatorType: 'APPLICANT', operatedAt: '2026-06-14 15:10', node: 'result-push', result: 'SUCCESS', note: '申请人在粤省事小程序确认收到电子证照' },
    { id: 'op-027', action: '证照打印', operator: '李先生', operatorType: 'APPLICANT', operatedAt: '2026-06-15 10:20', node: 'certificate', result: 'SUCCESS', note: '政务服务中心自助终端打印纸质证照副本，打印回执PRT-20260615-00234' },
  ],
};

const restartRecords = {
  'app-20260614-003': [
    {
      id: 'rst-001',
      restartType: 'REVIEW_REOPEN',
      restartReason: '申请人对居住地址登记信息有异议，申请复核',
      restartedBy: '张科长',
      restartDept: '越秀区政务服务数据管理局',
      restartedAt: '2026-06-16 09:30',
      rollbackToNode: 'approval',
      rollbackFromNode: 'closed',
      currentStatus: 'PENDING',
      auditRequired: true,
      auditNote: '需政策法规处复核后决定是否重启',
      historyCount: 0,
    },
  ],
};

const printRecords = {
  'app-20260614-003': [
    {
      id: 'prt-001',
      printType: 'CERTIFICATE_COPY',
      printChannel: 'SELF_SERVICE_TERMINAL',
      printLocation: '越秀区政务服务中心一楼自助终端机#3',
      printedAt: '2026-06-15 10:20',
      printedBy: '李先生',
      printCount: 1,
      receiptNumber: 'PRT-20260615-00234',
      paperSize: 'A4',
      colorMode: 'COLOR',
      hasAntiCounterfeit: true,
      verificationCode: 'GZ20260615K3X9',
      validDays: 30,
      status: 'SUCCESS',
    },
  ],
};

const auditReviewResults = {
  'app-20260614-001': {
    auditType: 'SUPPLEMENT_AUDIT',
    auditor: '陈主任',
    auditorDept: '政务服务监督处',
    auditedAt: '2026-06-15 14:00',
    auditConclusion: 'PENDING',
    auditItems: [
      { item: '补正发起合规性', result: 'PASS', note: '材料核验规则符合事项标准，补正发起合理' },
      { item: '补正通知送达', result: 'PASS', note: '微信+短信双通道送达，申请人已读' },
      { item: '补正时限设置', result: 'PENDING', note: '需确认是否给予5个工作日补正期' },
    ],
    overallScore: 0,
    reviewRemark: '补正流程基本合规，待确认补正时限是否符合标准',
  },
  'app-20260614-003': {
    auditType: 'FULL_PROCESS_AUDIT',
    auditor: '王处长',
    auditorDept: '政务服务监督处',
    auditedAt: '2026-06-15 16:30',
    auditConclusion: 'PASS',
    auditItems: [
      { item: '受理合规性', result: 'PASS', note: '材料齐全，符合受理条件' },
      { item: '审批流程', result: 'PASS', note: '四部门会签程序合规，时限符合要求' },
      { item: '证照签发', result: 'PASS', note: '电子证照签发规范，证号可追溯' },
      { item: '结果推送', result: 'PASS', note: '三渠道推送及时，申请人已确认' },
    ],
    overallScore: 96.5,
    reviewRemark: '全流程合规高效，可作为标杆办件',
  },
};

const approvalWithdrawRecords = {
  'app-20260614-003': [
    { id: 'wd-001', withdrawType: 'INFO_CORRECTION', withdrawReason: '居住地址门牌号信息有误，需撤回更正后重新审批', withdrawnBy: '王警官', withdrawDept: '公安局电子证照管理处', withdrawnAt: '2026-06-14 15:20', rollbackToNode: 'approval', previousApprovalNode: 'certificate', affectedCount: 1, auditRequired: true, auditStatus: 'PASSED', auditNote: '信息更正类撤回，符合业务规范', blameLevel: 'NONE', },
  ],
};

const printWatermarkRules = {
  'CERTIFICATE_COPY': {
    watermarkEnabled: true,
    watermarkType: 'FULL_PAGE_DIAGONAL',
    watermarkContent: '仅供政务业务办理使用 再次复印无效',
    fontSize: 24,
    opacity: 0.15,
    angle: -30,
    additionalMarkings: ['打印时间', '验证码', '打印网点', '打印人脱敏姓名'],
    antiForgery: true,
    validDays: 30,
    reprintLimit: 3,
    ruleSource: '《广州市电子证照打印管理规范》',
  },
};

const logLiabilityChain = {
  'app-20260614-003': {
    liabilityChain: [
      { node: '受理登记', responsible: '系统', liability: '系统自动受理，无人工介入', riskLevel: 'LOW' },
      { node: '材料核验', responsible: 'AI预审系统', liability: '智能核验通过，可追溯核验日志', riskLevel: 'LOW' },
      { node: '部门审批', responsible: '四部门审批系统', liability: '各部门独立审批，各自承担审批责任', riskLevel: 'MEDIUM' },
      { node: '证照签发', responsible: '王警官（公安局）', liability: '证照签发人对证照内容真实性负责', riskLevel: 'HIGH' },
      { node: '结果推送', responsible: '系统', liability: '三渠道推送，送达记录可审计', riskLevel: 'LOW' },
    ],
    totalLiabilityNodes: 5,
    highRiskCount: 1,
    liabilityPrinciple: '谁审批谁负责、谁签发谁负责',
  },
};

const materialVerifyFailureSamples = {
  '114401000001': [
    { id: 'mfs-001', materialName: '居住证明', failType: 'OCR_RECOGNITION_FAIL', failReason: '照片模糊，无法识别租赁备案编号', sampleImageDesc: '夜间拍摄，光线不足，字迹模糊', failRate: '8.3%', occurrence: '越秀区政务中心 占比32%', suggestion: '引导用户使用高清拍摄模式', sampleCount: 2348 },
    { id: 'mfs-002', materialName: '居住证明', failType: 'FORMAT_VALIDATION_FAIL', failReason: '房屋租赁备案编号格式不符', sampleImageDesc: '15位编号，应为18位', failRate: '5.7%', occurrence: '海珠区 占比24%', suggestion: '增加格式说明和样例展示', sampleCount: 1620 },
    { id: 'mfs-003', materialName: '身份证', failType: 'FACE_MISMATCH', failReason: '证件照与自拍人脸匹配度过低', sampleImageDesc: '佩戴眼镜、刘海遮挡', failRate: '4.2%', occurrence: '天河区 占比18%', suggestion: '提示摘掉眼镜、整理刘海', sampleCount: 1195 },
  ],
};

const conditionHitRecords = {
  '114401000001': {
    totalApplications: 15230,
    hitRateByCondition: [
      { conditionId: 'cond-001', condition: '居住半年以上', hitCount: 14820, hitRate: '97.3%', missReason: '居住登记不满6个月', suggestion: '指引先办理居住登记' },
      { conditionId: 'cond-002', condition: '合法稳定就业', hitCount: 12680, hitRate: '83.3%', missReason: '社保缴费未满12个月', suggestion: '提供社保补缴指引' },
      { conditionId: 'cond-003', condition: '合法稳定住所', hitCount: 13950, hitRate: '91.6%', missReason: '无有效房屋租赁备案', suggestion: '推行住所申报承诺制' },
      { conditionId: 'cond-004', condition: '连续就读（替代）', hitCount: 856, hitRate: '5.6%', missReason: '', suggestion: '在校生可走就读通道' },
    ],
    multipleConditionHit: {
      threeConditionsHit: 11200,
      threeConditionsHitRate: '73.5%',
      allConditionsHit: 9850,
      allConditionsHitRate: '64.7%',
    },
  },
};

const highRiskAuthRecords = [
  { id: 'hra-001', itemCode: '114401000001', itemName: '居住证办理', riskLevel: 'HIGH', authMethod: 'FACE_RECOGNITION + ID_CARD_VERIFY', userId: 'user-20260614-003', applicationId: 'app-20260614-003', verifiedAt: '2026-06-14 09:16', authLevelBefore: 'L3实名', authLevelAfter: 'L4人脸', traceId: 'TRACE-FACE-20260615-00512', result: 'PASS', similarity: 96.4, livenessScore: 98.2, operatorNote: '高风险事项自动触发二次核验', retentionPeriod: '5年', },
  { id: 'hra-002', itemCode: '114401000002', itemName: '社保卡申领', riskLevel: 'HIGH', authMethod: 'NFC + ID_CARD_DOUBLE_CHECK', userId: 'user-20260614-002', applicationId: 'app-20260614-002', verifiedAt: '2026-06-15 09:05', authLevelBefore: 'L2登录', authLevelAfter: 'L3芯片核验', traceId: 'TRACE-NFC-20260615-00122', result: 'FALLBACK', similarity: 0, livenessScore: 0, operatorNote: 'NFC读卡失败，降级至身份证核验+人工兜底', retentionPeriod: '5年', },
];

const bottleneckDeptItemDetails = {
  '居住证办理': {
    itemCode: '114401000001',
    departmentBreakdown: [
      { dept: '越秀区住建局', disposalCount: 342, avgDisposalHours: 28.5, responsiblePerson: '张伟', lastDisposalAt: '2026-06-15 11:00', bottleneckReason: '租赁备案人工核验耗时长', improvement: '推进备案数据自动核验', },
      { dept: '海珠区住建局', disposalCount: 256, avgDisposalHours: 22.3, responsiblePerson: '李娜', lastDisposalAt: '2026-06-15 10:30', bottleneckReason: '材料补正率高', improvement: '上线材料样例与OCR预检', },
      { dept: '天河区公安局', disposalCount: 189, avgDisposalHours: 15.2, responsiblePerson: '王强', lastDisposalAt: '2026-06-15 09:45', bottleneckReason: '人脸核验排队', improvement: '增加人脸识别服务器', },
    ],
    nodeBottleneck: {
      '材料上传': { avgHours: 4.2, volume: '高', bottleneck: '材料拍摄质量参差' },
      '智能预审': { avgHours: 2.8, volume: '高', bottleneck: 'AI识别准确率待提升' },
      '部门审批': { avgHours: 36.0, volume: '中', bottleneck: '住建部门核验耗时长' },
      '证照签发': { avgHours: 1.5, volume: '低', bottleneck: '正常' },
      '结果推送': { avgHours: 0.5, volume: '低', bottleneck: '正常' },
    },
  },
};

const supervisionRecords = [
  { id: 'spv-001', applicationId: 'app-20260614-002', supervisor: '王处长', supervisorDept: '政务服务处', supervisedAt: '2026-06-15 10:30', supervisionLevel: 'URGENT', content: '请银行加快核验，距超时还有18小时', responseStatus: 'PENDING', responder: '', responseContent: '', followUpCount: 1 },
  { id: 'spv-002', applicationId: 'app-20260614-002', supervisor: '李科长', supervisorDept: '运行监控处', supervisedAt: '2026-06-15 09:45', supervisionLevel: 'NORMAL', content: '请确认跨部门核验进度', responseStatus: 'RESPONDED', responder: '刘芳（工商银行）', responseContent: '正在核验制卡网点产能，预计今日内完成', followUpCount: 0 },
  { id: 'spv-003', applicationId: 'app-20260614-001', supervisor: '张科长', supervisorDept: '越秀区住建局', supervisedAt: '2026-06-15 13:00', supervisionLevel: 'NORMAL', content: '请关注补正时限，确保申请人及时知晓补正要求', responseStatus: 'RESPONDED', responder: '陈志强（住建局）', responseContent: '已通过微信/短信发送补正通知，等待申请人提交', followUpCount: 0 },
];

const notificationRetryTraces = {
  'app-20260614-001': {
    failedCount: 1,
    retryCount: 1,
    retrySuccessCount: 1,
    pendingRetry: false,
    failedList: [
      { channel: 'sms', failedAt: '2026-06-15 09:12', failReason: '运营商网关超时', retried: true, retriedAt: '2026-06-15 09:15', retrySuccess: true },
    ],
    nextRetryAt: '',
  },
};

function applicationFlow(applicationId) {
  const appApprovalOpinions = approvalOpinions.filter((item) => item.applicationId === applicationId);
  const appBranchRecords = branchRecords.filter((item) => item.applicationId === applicationId);

  const approvedCount = appApprovalOpinions.filter((o) => o.status === 'APPROVED').length;
  const pendingDept = appApprovalOpinions.find((o) => o.status === 'PENDING')?.dept || '';
  const allApproved = approvedCount === appApprovalOpinions.length && appApprovalOpinions.length > 0;

  const materialResults = materialVerificationResults[applicationId] || [];
  const hasUnverifiedMaterial = materialResults.some((m) => !m.verified);

  const supplements = supplementRecords[applicationId] || [];

  const approvedNodes = allApproved && !hasUnverifiedMaterial;
  const hasCertificate = approvedNodes;
  const hasPushReceipt = approvedNodes;

  const disposal = disposalPersons[applicationId] || null;
  const supervision = supervisionRecords.filter((r) => r.applicationId === applicationId);
  const notificationRetry = notificationRetryTraces[applicationId] || null;
  const deliveryTrace = deliveryTraces[applicationId] || null;
  const applicantConfirmation = applicantConfirmations[applicationId] || null;
  const riskLevel = timeoutRiskLevels[applicationId] || null;

  const responsible = nodeResponsiblePersons[applicationId] || {};

  const nodes = workflowNodeTemplates['default'].map((node, index) => {
    let status = 'DONE';
    let evidence = responsible[node.key]?.evidence || node.owner;
    if (node.key === 'appointment') status = 'DONE';
    else if (node.key === 'upload') {
      status = hasUnverifiedMaterial ? 'RUNNING' : 'DONE';
      if (hasUnverifiedMaterial) evidence = responsible[node.key]?.evidence || '材料上传中（含待补正项）';
    } else if (node.key === 'pre-review') {
      status = hasUnverifiedMaterial ? 'RUNNING' : 'DONE';
    } else if (node.key === 'approval') {
      status = allApproved ? 'DONE' : 'RUNNING';
      evidence = `跨部门核验 ${approvedCount}/${appApprovalOpinions.length || 4} 完成`;
      if (!allApproved && pendingDept) evidence += `，${pendingDept}待完成`;
    } else if (node.key === 'certificate') {
      status = approvedNodes ? 'DONE' : 'WAITING';
      evidence = approvedNodes ? (responsible[node.key]?.evidence || '电子证照已签发') : '待审批通过后签发';
    } else if (node.key === 'push') {
      status = approvedNodes ? 'DONE' : 'WAITING';
      evidence = approvedNodes ? (responsible[node.key]?.evidence || '结果已推送并确认') : '待证照签发后推送';
    }

    return {
      ...node,
      status,
      evidence,
      responsiblePerson: responsible[node.key]?.name || node.owner,
      operation: responsible[node.key]?.operation || '',
      abnormal: responsible[node.key]?.abnormal || null,
      startedAt: `2026-06-15 ${String(8 + index).padStart(2, '0')}:00`,
      finishedAt: status === 'DONE' ? `2026-06-15 ${String(8 + index).padStart(2, '0')}:35` : (status === 'WAITING' ? '' : ''),
    };
  });

  const fullResponsibilityChain = nodes.map((n) => ({
    nodeKey: n.key,
    nodeLabel: n.label,
    status: n.status,
    responsiblePerson: n.responsiblePerson,
    operation: n.operation,
    startedAt: n.startedAt,
    finishedAt: n.finishedAt,
    abnormal: n.abnormal,
  }));

  const abnormalDisposalChain = nodes
    .filter((n) => n.abnormal)
    .map((n) => ({
      nodeKey: n.key,
      nodeLabel: n.label,
      abnormalType: n.abnormal.type,
      abnormalDescription: n.abnormal.description,
      triggerTime: n.startedAt,
      disposalDeadline: n.key === 'approval' && disposal ? disposal.disposalDeadline : '',
      disposalPerson: n.key === 'approval' && disposal ? disposal.name : '',
      escalationPath: n.key === 'approval' && disposal ? disposal.escalationPath : '',
    }));

  return {
    applicationId,
    nodes,
    workflowStage: approvedNodes ? '已办结' : (hasUnverifiedMaterial ? '材料补正中' : '部门审批中'),
    timeoutAudit: timeoutAuditRecords.filter((item) => item.applicationId === applicationId),
    approvalOpinions: appApprovalOpinions,
    hasJointSign: appApprovalOpinions.length > 1,
    jointSignProgress: `${approvedCount}/${appApprovalOpinions.length || 4}`,
    pendingApprovalDept: pendingDept,
    allApproved,
    hasUnverifiedMaterial,
    supplementRecords: supplements,
    certificateDetail: hasCertificate ? certificateDetail : null,
    resultPushReceipt: hasPushReceipt ? resultPushReceipt : null,
    branchRecords: appBranchRecords,
    materialVerification: materialResults,
    disposalPerson: disposal,
    supervisionRecords: supervision,
    notificationRetry: notificationRetry,
    deliveryTrace: deliveryTrace,
    applicantConfirmation: applicantConfirmation,
    riskLevel: riskLevel,
    fullResponsibilityChain,
    abnormalDisposalChain,
    canShowClosedLoop: approvedNodes,
    canShowIssuance: approvedNodes,
    restartRecords: restartRecords[applicationId] || [],
    printRecords: printRecords[applicationId] || [],
    auditReviewResult: auditReviewResults[applicationId] || null,
    workflowActions: workflowActions[applicationId] || { available: [], disabled: [] },
    operationLogs: operationLogs[applicationId] || [],
  };
}

const deliveryTraces = {
  'app-20260614-003': {
    sms: { sent: 1, delivered: 1, failed: 0, read: 1, deliveredAt: '2026-06-14 16:31', readAt: '2026-06-14 16:42' },
    wechat: { sent: 1, delivered: 1, failed: 0, read: 1, deliveredAt: '2026-06-14 16:30', readAt: '2026-06-14 16:35' },
    miniProgram: { sent: 1, delivered: 1, failed: 0, read: 1, deliveredAt: '2026-06-14 16:30', readAt: '2026-06-14 16:45' },
  },
  'app-20260614-002': {
    sms: { sent: 2, delivered: 2, failed: 0, read: 0 },
    wechat: { sent: 1, delivered: 1, failed: 0, read: 1 },
    miniProgram: { sent: 1, delivered: 1, failed: 0, read: 0 },
  },
};

const applicantConfirmations = {
  'app-20260614-003': {
    confirmed: true,
    confirmedAt: '2026-06-14 16:45',
    confirmMethod: 'miniProgram',
    receiptNo: 'RC-20260614-1645-003',
    confirmationContent: '本人已确认收到电子居住证，证照信息准确无误。',
    countdownMinutes: 0,
  },
  'app-20260614-002': {
    confirmed: false,
    confirmedAt: '',
    confirmMethod: '',
    receiptNo: '',
    confirmationContent: '',
    countdownMinutes: 4320,
  },
};

const timeoutRiskLevels = {
  'app-20260614-002': {
    riskLevel: 2,
    riskLevelLabel: '二级风险（橙色预警）',
    riskDescription: '距办理时限还有18小时，部门协同审批未完成，存在超时风险。已触发催办机制，处置人林晓东负责协调。',
    nextEscalationAt: '2026-06-16 02:00',
    escalationAction: '升级至政务服务处处长督办',
  },
  'app-20260614-001': {
    riskLevel: 1,
    riskLevelLabel: '一级风险（黄色预警）',
    riskDescription: '材料补正中，申请人需补充房屋租赁备案编号，当前在补正时限内。',
    nextEscalationAt: '',
    escalationAction: '',
  },
};

const formTemplates = [
  { id: 'form-001', itemCode: '114401000001', name: '居住证办理电子表单', fields: '姓名、身份证号、居住地址、居住证明编号', version: 'v3.2', status: 'ACTIVE' },
  { id: 'form-002', itemCode: '114401000002', name: '社保卡申领电子表单', fields: '参保人、手机号、制卡网点、领取方式', version: 'v2.8', status: 'ACTIVE' },
  { id: 'form-003', itemCode: '114401000003', name: '营业执照设立登记表', fields: '经营者、统一社会信用代码、住所证明、经营范围', version: 'v4.1', status: 'REVIEWING' },
];

const handlingTimeLimits = {
  '114401000001': {
    totalWorkingDays: 7,
    breakdown: [
      { stage: '受理初审', days: 1, description: '材料齐全的，当日内完成受理初审' },
      { stage: '部门审核', days: 3, description: '公安、人社、住建等部门联合审核' },
      { stage: '审批决定', days: 2, description: '根据审核结果作出审批决定' },
      { stage: '证照制发', days: 1, description: '电子证照签发与推送' },
    ],
    legalBasis: '《广东省流动人口服务管理条例',
    promiseTimeLimit: '7个工作日',
    statutoryTimeLimit: '15个工作日',
  },
  '114401000002': {
    totalWorkingDays: 5,
    breakdown: [
      { stage: '受理初审', days: 1, description: '身份核验与材料初审' },
      { stage: '社保信息核验', days: 2, description: '人社部门核验参保信息' },
      { stage: '制卡准备', days: 1, description: '制卡数据准备' },
      { stage: '卡片制作', days: 1, description: '社保卡制作与发放' },
    ],
    legalBasis: '《社会保障卡管理办法',
    promiseTimeLimit: '5个工作日',
    statutoryTimeLimit: '30个自然日',
  },
};

const applicableConditions = {
  '114401000001': [
    { id: 'cond-001', condition: '在广州市居住半年以上', type: 'REQUIRED', description: '需提供居住登记满6个月以上', verified: true },
    { id: 'cond-002', condition: '有合法稳定就业', type: 'REQUIRED', description: '需提供社保缴费证明', verified: true },
    { id: 'cond-003', condition: '有合法稳定住所', type: 'REQUIRED', description: '需提供房屋租赁备案或房产证明', verified: true },
    { id: 'cond-004', condition: '连续就读', type: 'ALTERNATIVE', description: '在广州市全日制学校就读可替代就业条件', verified: false },
  ],
  '114401000002': [
    { id: 'cond-005', condition: '广州市户籍或参保人员', type: 'REQUIRED', description: '需具有广州市户籍或在广州市参加社会保险', verified: true },
    { id: 'cond-006', condition: '年满16周岁', type: 'REQUIRED', description: '未满16周岁需由监护人代办', verified: true },
  ],
};

const formFieldChangeLogs = {
  'form-001': [
    { version: 'v3.2', changedAt: '2026-05-20', changedBy: '张工（标准处）', changes: '新增"居住证明编号"字段，优化表单布局', reason: '配合住建部门房屋租赁备案系统对接需求' },
    { version: 'v3.1', changedAt: '2026-03-15', changedBy: '李工（标准处）', changes: '调整"居住地址"字段长度限制，从100字扩展到200字', reason: '满足部分复杂地址填写需求' },
    { version: 'v3.0', changedAt: '2026-01-10', changedBy: '王处（标准处）', changes: '表单全面升级，支持电子签名与OCR自动填充', reason: '数字政府建设要求' },
  ],
};

const materialVerificationRules = {
  '114401000001': [
    { materialName: '居民身份证', required: true, verifyMethod: 'OCR+公安联网核查', rule: '必须与申请人一致，照片清晰无遮挡', standardReference: '《居民身份证法》第十四条' },
    { materialName: '居住证明', required: true, verifyMethod: '住建部门备案系统核验', rule: '需含房屋租赁备案编号，有效期内', standardReference: '《广东省流动人口服务管理条例》第十条' },
    { materialName: '电子照片', required: true, verifyMethod: 'AI人像比对', rule: '近6个月免冠白底，规格358×441像素，相似度≥90%', standardReference: '《政务服务电子照片规范》' },
    { materialName: '社保缴费证明', required: true, verifyMethod: '人社部门社保系统核验', rule: '连续缴费满12个月以上，无断缴记录', standardReference: '《广州市社会保障条例》' },
  ],
  '114401000002': [
    { materialName: '居民身份证', required: true, verifyMethod: 'OCR+公安联网核查', rule: '必须与参保人一致', standardReference: '《社会保障卡管理办法》' },
    { materialName: '参保凭证', required: true, verifyMethod: '人社部门核验', rule: '处于正常参保状态', standardReference: '《社会保障卡管理办法》' },
    { materialName: '电子照片', required: true, verifyMethod: 'AI人像比对', rule: '近6个月免冠白底，符合社保卡照片规格', standardReference: '《社会保障卡照片规范》' },
  ],
};

const standardAuditRecords = {
  '114401000001': {
    timeLimitChanges: [
      { id: 'tlc-001', version: 'v3.2', changedAt: '2026-05-20', changedBy: '王处（标准与信息化处）', changeType: 'PROMISE_SHORTEN', fromDays: 15, toDays: 7, reason: '依托"穗好办"全流程线上化，承诺时限压缩53%', basis: '《广州市政务服务事项承诺时限优化工作方案》', status: 'EFFECTIVE' },
      { id: 'tlc-002', version: 'v2.1', changedAt: '2026-01-15', changedBy: '李处（政务服务处）', changeType: 'STANDARD_ADJUST', fromDays: 20, toDays: 15, reason: '对接省政务服务事项管理系统，统一时限标准', basis: '广东省政务服务事项管理办法', status: 'SUPERSEDED' },
    ],
    materialVerifyFailures: [
      { id: 'mvf-001', material: '居住证明', failReason: '缺少房屋租赁备案编号', failCountMonth: 2348, failRate: '18.2%', topOccurrences: ['越秀区 32%', '海珠区 24%', '天河区 18%'], improvementAction: '上线材料样例与OCR预检，与住建部门打通备案数据自动核验', last30DaysTrend: '下降5.2%' },
      { id: 'mvf-002', material: '电子照片', failReason: '照片规格不符合要求（模糊/戴帽/底色不对）', failCountMonth: 856, failRate: '6.7%', topOccurrences: ['自助终端拍摄 45%', '手机上传 38%', '照相馆 17%'], improvementAction: '上线AI照片预检，实时提示不合规原因', last30DaysTrend: '下降12.8%' },
    ],
    formVersionDiffs: [
      { id: 'fvd-001', fromVersion: 'v3.1', toVersion: 'v3.2', diffFields: [
        { field: '居住地址', change: '新增"小区名称"选填字段', type: 'ADD' },
        { field: '联系电话', change: '增加格式校验（11位手机号）', type: 'VALIDATION' },
        { field: '申报方式', change: '新增"告知承诺制"选项', type: 'ADD' },
        { field: '材料清单', change: '取消"工作证明"必填项', type: 'REMOVE' },
      ], changeCount: 4, updatedAt: '2026-05-22', updatedBy: '张工（电子表单组）', reviewStatus: 'REVIEWED', reviewer: '王处（标准与信息化处）' },
      { id: 'fvd-002', fromVersion: 'v3.0', toVersion: 'v3.1', diffFields: [
        { field: '身份证号', change: '增加脱敏显示规则', type: 'DISPLAY' },
        { field: '办理类型', change: '新增"投靠配偶"选项', type: 'ADD' },
      ], changeCount: 2, updatedAt: '2026-03-10', updatedBy: '李工（电子表单组）', reviewStatus: 'REVIEWED', reviewer: '李处（法规处）' },
    ],
    applicableConditionConflicts: [
      { id: 'acc-001', condition: '连续缴纳社保满12个月', conflictSource: '《广东省流动人口服务管理条例》 vs 《广州市居住证实施细则》', conflictType: 'DEFINITION_DIFF', description: '省级条例要求"连续居住满半年"，市级细则要求"连续缴纳社保满12个月"，两者适用条件口径不一致', resolutionStatus: 'RESOLVED', resolution: '按"就高不就低"原则，执行市级12个月社保标准，同时接受居住登记满半年替代', resolvedAt: '2026-04-15', resolvedBy: '政策法规处', relatedPolicy: '穗政规〔2026〕3号' },
    ],
    auditSummary: {
      totalTimeLimitChanges: 2,
      totalMaterialFailures: 2,
      totalFormVersionDiffs: 2,
      totalConditionConflicts: 1,
      lastAuditDate: '2026-06-10',
      auditor: '标准与信息化处 王处',
      standardCompliance: '92.5%',
    },
  },
  '114401000002': {
    timeLimitChanges: [
      { id: 'tlc-003', version: 'v2.0', changedAt: '2026-02-28', changedBy: '人社局', changeType: 'PROMISE_SHORTEN', fromDays: 30, toDays: 15, reason: '社保卡制卡流程优化，承诺时限减半', basis: '广州市社保卡"立等可取"工程', status: 'EFFECTIVE' },
    ],
    materialVerifyFailures: [
      { id: 'mvf-003', material: '参保凭证', failReason: '异地参保记录未同步', failCountMonth: 924, failRate: '9.4%', topOccurrences: ['省内外市转入 58%', '跨省转入 32%', '本地新参保 10%'], improvementAction: '对接省社保平台，实现参保记录实时查询', last30DaysTrend: '下降8.1%' },
    ],
    formVersionDiffs: [
      { id: 'fvd-003', fromVersion: 'v1.2', toVersion: 'v2.0', diffFields: [
        { field: '领卡方式', change: '新增"邮寄到家"选项', type: 'ADD' },
        { field: '社保卡功能', change: '新增"金融功能激活"选项', type: 'ADD' },
      ], changeCount: 2, updatedAt: '2026-02-28', updatedBy: '人社局部', reviewStatus: 'REVIEWED', reviewer: '标准与信息化处' },
    ],
    applicableConditionConflicts: [],
    auditSummary: {
      totalTimeLimitChanges: 1,
      totalMaterialFailures: 1,
      totalFormVersionDiffs: 1,
      totalConditionConflicts: 0,
      lastAuditDate: '2026-06-08',
      auditor: '标准与信息化处 李科',
      standardCompliance: '96.8%',
    },
  },
};

const materialVerificationResults = {
  'app-20260614-001': [
    { materialName: '居民身份证', verified: true, verifyMethod: 'OCR+公安联网核查', verifyResult: '身份信息一致', verifiedAt: '2026-06-15 08:30' },
    { materialName: '居住证明', verified: false, verifyMethod: '住建部门备案系统核验', verifyResult: '缺少房屋租赁备案编号', verifiedAt: '2026-06-15 09:45' },
    { materialName: '电子照片', verified: true, verifyMethod: 'AI人像比对', verifyResult: '照片符合规格，与身份证人像相似度96.8%', verifiedAt: '2026-06-15 08:35' },
    { materialName: '社保缴费证明', verified: true, verifyMethod: '人社部门社保系统核验', verifyResult: '连续缴费12个月以上', verifiedAt: '2026-06-15 09:00' },
  ],
};

const templateReviewRecords = {
  'form-001': [
    { id: 'rev-001', reviewer: '王处（标准与信息化处）', reviewedAt: '2026-05-22', reviewResult: 'PASSED', reviewOpinion: '字段调整合理，符合政务服务事项标准化要求。', version: 'v3.2' },
    { id: 'rev-002', reviewer: '李科（法规处）', reviewedAt: '2026-05-21', reviewResult: 'PASSED', reviewOpinion: '法律依据充分，表单内容与现行法规一致。', version: 'v3.2' },
    { id: 'rev-003', reviewer: '张工（技术支撑单位）', reviewedAt: '2026-05-20', reviewResult: 'PASSED', reviewOpinion: '技术实现可行，OCR识别字段匹配度95%以上。', version: 'v3.2' },
  ],
  'form-003': [
    { id: 'rev-004', reviewer: '王处（标准与信息化处）', reviewedAt: '2026-06-10', reviewResult: 'PENDING', reviewOpinion: '', version: 'v4.1' },
    { id: 'rev-005', reviewer: '李科（法规处）', reviewedAt: '2026-06-09', reviewResult: 'PASSED', reviewOpinion: '经营范围字段调整符合《市场主体登记管理条例》。', version: 'v4.1' },
  ],
};

const policyCorpus = [
  { id: 'corp-001', policyId: 'pol-001', field: '事项编码规则', chunks: 36, trained: true, qaPairs: 128, lastTrainedAt: '2026-06-14 21:10', linkedItems: ['114401000001', '114401000002', '114401000003'], linkedDepts: ['公安局', '人社局', '市场监管局'] },
  { id: 'corp-002', policyId: 'pol-002', field: '电子证照调用边界', chunks: 24, trained: true, qaPairs: 76, lastTrainedAt: '2026-06-12 18:40', linkedItems: ['114401000001', '114401000002'], linkedDepts: ['公安局', '人社局'] },
  { id: 'corp-003', policyId: 'pol-003', field: '实名核验问答语料', chunks: 19, trained: false, qaPairs: 42, lastTrainedAt: '待训练', linkedItems: ['114401000001'], linkedDepts: ['公安局', '政务服务数据管理局'] },
];

const policyQaHitRecords = {
  'pol-001': [
    { id: 'qa-001', question: '居住证办理需要哪些材料？', hitIntent: '居住证_材料清单', hitConfidence: 96.5, answerSource: 'corp-001/事项编码规则/第三章', askedAt: '2026-06-15 09:30', userId: 'user-20260614-001', applicationId: 'app-20260614-001', helpful: true },
    { id: 'qa-002', question: '办理时限是多久？', hitIntent: '居住证_办理时限', hitConfidence: 92.1, answerSource: 'corp-001/事项编码规则/办理时限一节', askedAt: '2026-06-15 10:15', userId: 'user-20260614-007', applicationId: '', helpful: true },
    { id: 'qa-003', question: '社保交多久可以办居住证？', hitIntent: '居住证_适用条件', hitConfidence: 88.3, answerSource: 'corp-001/适用条件/社保要求', askedAt: '2026-06-15 08:45', userId: 'user-20260614-002', applicationId: 'app-20260614-002', helpful: false },
  ],
  'pol-002': [
    { id: 'qa-011', question: '电子证照可以用在什么地方？', hitIntent: '电子证照_应用范围', hitConfidence: 94.8, answerSource: 'corp-002/调用边界/第一节', askedAt: '2026-06-15 11:00', userId: 'user-20260614-003', applicationId: '', helpful: true },
  ],
};

const policyPublishAudits = {
  'pol-001': {
    publishStatus: 'PUBLISHED',
    publishedAt: '2026-06-14 22:00',
    publisher: '王处（政策法规处）',
    reviewer: '李处（标准与信息化处）',
    reviewOpinion: '政策解读准确，问答对覆盖主要场景，可发布上线。',
    reviewedAt: '2026-06-14 21:50',
    version: 'v2.1',
    qaPassRate: '92.5%',
  },
  'pol-002': {
    publishStatus: 'PUBLISHED',
    publishedAt: '2026-06-13 10:00',
    publisher: '张工（电子证照处）',
    reviewer: '王处（政策法规处）',
    reviewOpinion: '证照调用边界清晰，合规性符合要求。',
    reviewedAt: '2026-06-12 20:30',
    version: 'v1.3',
    qaPassRate: '88.2%',
  },
  'pol-003': {
    publishStatus: 'PENDING_REVIEW',
    publishedAt: '',
    publisher: '',
    reviewer: '待分配',
    reviewOpinion: '',
    reviewedAt: '',
    version: 'v1.0',
    qaPassRate: '76.8%',
  },
};

const policyVersionOrigins = {
  'pol-001': [
    { version: 'v2.1', updatedAt: '2026-06-14', source: '广州市政务服务事项标准化指引（2026修订版）', changeSummary: '新增事项编码规则第三章，补充区县编码规范' },
    { version: 'v2.0', updatedAt: '2026-03-20', source: '广州市政务服务事项标准化指引（2026版）', changeSummary: '全面升级事项编码体系，对接省政务服务事项管理系统' },
    { version: 'v1.0', updatedAt: '2025-12-01', source: '广州市政务服务事项标准化指引（试行）', changeSummary: '初始版本，建立基本编码规则' },
  ],
};

const identityIntegrations = [
  {
    name: '粤省事统一认证', status: 'ONLINE', latency: '86ms', successRate: '99.92%', scope: '实名登录/授权',
    authChain: {
      entryMethod: '粤省事小程序跳转授权',
      credentialType: 'JWT电子凭证',
      credentialValidity: '本次会话有效，最长30分钟',
      authLevels: ['L1匿名', 'L2登录', 'L3实名', 'L4人脸'],
      fallbackMethod: '微信授权登录',
      secondaryVerification: '高风险事项触发人脸识别二次核验',
      credentialTemplate: { type: 'YSS_OAUTH_TOKEN', issuer: '广东省政务服务数据管理局', algorithm: 'RS256' },
    },
    auditTrail: [
      { traceId: 'TRACE-YSS-20260615-00882', appId: 'mini-gz-001', userId: 'user-20260614-001', verifiedAt: '2026-06-15 08:15', result: 'SUCCESS', authLevel: 'L3实名', ip: '223.104.63.12', note: '居住证办理身份核验' },
      { traceId: 'TRACE-YSS-20260615-00881', appId: 'mini-gz-001', userId: 'user-20260614-003', verifiedAt: '2026-06-15 08:12', result: 'SUCCESS', authLevel: 'L3实名', ip: '120.230.88.45', note: '社保卡申领身份核验' },
      { traceId: 'TRACE-YSS-20260615-00879', appId: 'mini-gz-001', userId: 'user-20260614-002', verifiedAt: '2026-06-15 08:05', result: 'RETRY', authLevel: 'L2登录', ip: '183.232.96.18', note: '首次认证超时，15秒后重试成功' },
    ],
    dailyStats: { todayCalls: 12680, successCount: 12669, failCount: 11, avgLatencyMs: 86 },
    reviewAvailable: true,
  },
  {
    name: '人脸识别活体检测', status: 'ONLINE', latency: '142ms', successRate: '98.70%', scope: '高风险事项二次核验',
    authChain: {
      entryMethod: 'SDK活体检测 + 人脸比对',
      credentialType: '人脸核验电子凭证',
      credentialValidity: '本次核验有效，7天内可复用',
      authLevels: ['L3.5人脸实名'],
      fallbackMethod: '短信验证码 + 人工坐席复核',
      secondaryVerification: '首次人脸不通过时，支持二次采集',
      credentialTemplate: { type: 'FACE_VERIFY_TOKEN', issuer: '广州市政务服务人脸识别平台', algorithm: 'HMAC-SHA256' },
    },
    auditTrail: [
      { traceId: 'TRACE-FACE-20260615-00512', appId: 'mini-gz-001', userId: 'user-20260614-003', verifiedAt: '2026-06-15 08:20', result: 'SUCCESS', similarity: 96.4, livenessScore: 98.2, note: '居住证二次核验通过' },
      { traceId: 'TRACE-FACE-20260615-00511', appId: 'bank-verify-006', userId: 'user-20260613-088', verifiedAt: '2026-06-15 08:18', result: 'FAIL', similarity: 72.1, livenessScore: 0, note: '疑似照片攻击，已转人工复核' },
    ],
    dailyStats: { todayCalls: 4862, successCount: 4799, failCount: 63, avgLatencyMs: 142 },
    reviewAvailable: true,
  },
  {
    name: '社保卡 NFC', status: 'DEGRADED', latency: '320ms', successRate: '96.40%', scope: '社保卡申领/补换卡',
    authChain: {
      entryMethod: 'NFC读卡 + 芯片校验',
      credentialType: '社保卡芯片凭证 + 临时授权令牌',
      credentialValidity: '正常读卡永久有效 / 降级模式24小时',
      authLevels: ['L3芯片核验'],
      fallbackMethod: '身份证联网核查 + 粤省事实名',
      secondaryVerification: '降级模式自动触发身份证二次核验',
      credentialTemplate: { type: 'NFC_CARD_TOKEN + TEMP_AUTH_TOKEN', issuer: '广州市社会保障卡管理中心', algorithm: 'PS256' },
    },
    auditTrail: [
      { traceId: 'TRACE-NFC-20260615-00122', appId: 'street-portal-018', userId: 'user-20260614-002', verifiedAt: '2026-06-15 09:30', result: 'FALLBACK', fallbackMethod: '身份证联网核查', note: 'NFC读卡失败，自动降级至身份证核验' },
      { traceId: 'TRACE-NFC-20260615-00120', appId: 'mini-gz-001', userId: 'user-20260614-008', verifiedAt: '2026-06-15 09:15', result: 'SUCCESS', cardReadMs: 280, note: 'NFC读卡成功' },
      { traceId: 'TRACE-NFC-20260615-00118', appId: 'mini-gz-001', userId: 'user-20260614-002', verifiedAt: '2026-06-15 09:02', result: 'DEGRADED_ISSUED', tempToken: 'AUTH-TKN-20260615-0902-00118', validHours: 24, note: '降级模式，发放临时授权凭证' },
    ],
    dailyStats: { todayCalls: 1120, successCount: 1080, degradedCount: 36, fallbackCount: 4, avgLatencyMs: 320 },
    reviewAvailable: true,
    degradationLinkId: 'nfc-degradation-detail',
  },
  {
    name: '身份证联网核查', status: 'ONLINE', latency: '103ms', successRate: '99.10%', scope: '基础身份校验',
    authChain: {
      entryMethod: '身份证号 + 姓名 + 照片比对',
      credentialType: '身份核查电子回执',
      credentialValidity: '本次核查有效，24小时内复用',
      authLevels: ['L2.5联网核查'],
      fallbackMethod: '人工审核 + 短信验证',
      secondaryVerification: '匹配度低于90%触发人工复核',
      credentialTemplate: { type: 'IDCARD_VERIFY_RECEIPT', issuer: '公安部公民身份信息核查中心', algorithm: '国密SM2' },
    },
    auditTrail: [
      { traceId: 'TRACE-IDNET-20260615-01208', appId: 'mini-gz-001', userId: 'user-20260614-002', verifiedAt: '2026-06-15 09:03', result: 'SUCCESS', matchScore: 99.8, source: '公安人口信息库', note: 'NFC降级替代核验通过' },
      { traceId: 'TRACE-IDNET-20260615-01207', appId: 'mini-gz-001', userId: 'user-20260614-001', verifiedAt: '2026-06-15 08:31', result: 'SUCCESS', matchScore: 99.5, source: '公安人口信息库', note: '材料补正后重新核验' },
    ],
    dailyStats: { todayCalls: 18920, successCount: 18749, failCount: 171, avgLatencyMs: 103 },
    reviewAvailable: true,
  },
];

const crossPlatformIdentityMapping = {
  'user-20260614-001': {
    masterId: 'GZID-20260614-00012345',
    platforms: [
      { platform: '粤省事', platformUserId: 'yss_20260614_001', authLevel: 'L3实名', bindAt: '2025-08-15' },
      { platform: '穗好办小程序', platformUserId: 'shb_user_0089207', authLevel: 'L3实名', bindAt: '2026-03-20' },
      { platform: '广州政务网', platformUserId: 'gzzw_user_0012345', authLevel: 'L4人脸', bindAt: '2025-12-01' },
      { platform: '社保卡', platformUserId: 'gzsbk_6217001234567890', authLevel: 'L3芯片', bindAt: '2024-06-10' },
    ],
    identityInfo: { name: '陈女士', idCardHash: '****1234', realNameVerified: true },
    mappingStatus: 'ACTIVE',
    lastSyncAt: '2026-06-15 08:30',
  },
  'user-20260614-002': {
    masterId: 'GZID-20260614-00023456',
    platforms: [
      { platform: '粤省事', platformUserId: 'yss_20260614_002', authLevel: 'L3实名', bindAt: '2025-09-20' },
      { platform: '穗好办小程序', platformUserId: 'shb_user_0092345', authLevel: 'L2登录', bindAt: '2026-04-10' },
      { platform: '社保卡', platformUserId: 'gzsbk_6217002345678901', authLevel: 'L3芯片', bindAt: '2024-08-15' },
    ],
    identityInfo: { name: '周先生', idCardHash: '****5678', realNameVerified: true },
    mappingStatus: 'ACTIVE',
    lastSyncAt: '2026-06-15 09:05',
  },
};

const authFailureRecords = {
  '粤省事统一认证': [
    { id: 'fail-001', failType: 'NETWORK_TIMEOUT', failCount: 8, failRate: '0.06%', peakTime: '08:30-09:00', topReasons: ['粤省事网关超时', '网络波动'], impact: '低 - 用户重试即可成功' },
    { id: 'fail-002', failType: 'USER_CANCEL', failCount: 3, failRate: '0.02%', peakTime: '全天', topReasons: ['用户主动取消授权'], impact: '无 - 用户主动行为' },
  ],
  '人脸识别活体检测': [
    { id: 'fail-101', failType: 'LIVENESS_FAIL', failCount: 42, failRate: '0.86%', peakTime: '14:00-16:00', topReasons: ['光线不足', '面部遮挡', '疑似照片攻击'], impact: '中 - 转人工复核' },
    { id: 'fail-102', failType: 'SIMILARITY_LOW', failCount: 21, failRate: '0.43%', peakTime: '全天', topReasons: ['与证件照差异较大', '整容/化妆'], impact: '中 - 需补充材料' },
  ],
};

const secondaryVerificationRecords = [
  { id: 'secv-001', userId: 'user-20260614-003', applicationId: 'app-20260614-003', triggerReason: 'HIGH_RISK_ITEM', verificationMethod: 'FACE_RECOGNITION', triggeredAt: '2026-06-14 09:15', verifiedAt: '2026-06-14 09:16', result: 'PASS', authLevelBefore: 'L3实名', authLevelAfter: 'L4人脸', operator: '系统', note: '居住证办理属于高风险事项，自动触发人脸二次核验' },
  { id: 'secv-002', userId: 'user-20260614-002', applicationId: 'app-20260614-002', triggerReason: 'DEGRADED_MODE', verificationMethod: 'ID_CARD_CHECK', triggeredAt: '2026-06-15 08:20', verifiedAt: '2026-06-15 08:22', result: 'PASS', authLevelBefore: 'L2登录', authLevelAfter: 'L2.5联网核查', operator: '系统', note: 'NFC降级后自动触发身份证联网二次核验' },
  { id: 'secv-003', userId: 'user-20260613-088', applicationId: 'app-20260613-008', triggerReason: 'SUSPICIOUS_ACTIVITY', verificationMethod: 'MANUAL_REVIEW', triggeredAt: '2026-06-15 08:18', verifiedAt: '', result: 'PENDING', authLevelBefore: 'L3实名', authLevelAfter: '', operator: '', note: '疑似照片攻击，转人工坐席复核' },
];

const nfcDegradationDetail = {
  status: 'DEGRADED',
  degradationReason: '社保卡NFC芯片读卡模块故障率升高，从0.2%上升至3.6%',
  degradationSince: '2026-06-10 14:30',
  affectedServices: ['社保卡申领', '社保卡补换卡', '社保信息查询'],
  alternativeVerification: [
    { id: 'alt-001', name: '身份证联网核查', description: '通过公安身份证联网核查系统验证身份', available: true, additionalSteps: '需手动输入身份证号码' },
    { id: 'alt-002', name: '粤省事实名认证', description: '跳转粤省事小程序完成实名认证', available: true, additionalSteps: '需用户授权粤省事账号' },
    { id: 'alt-003', name: '人脸识别活体检测', description: '通过面部识别完成身份核验', available: true, additionalSteps: '高风险事项需二次核验' },
  ],
  fallbackPath: {
    manualReview: {
      available: true,
      window: '越秀区政务服务中心 A1窗口',
      workingHours: '工作日 9:00-17:00',
      requiredMaterials: ['本人身份证原件', '社保卡申请回执'],
      estimatedTime: '15分钟',
      contactPhone: '020-12345678',
    },
    appointmentSupport: {
      available: true,
      bookingUrl: '/booking/nfc-degraded',
      hotline: '12345',
    },
  },
  authorizationCredentials: [
    { id: 'auth-001', type: 'TEMPORARY_TOKEN', validHours: 24, issuedCount: 328, description: 'NFC降级期间发放的临时授权令牌，用于替代身份核验' },
  ],
  highRiskSecondaryVerification: {
    enabled: true,
    triggeredScenarios: ['首次办理', '信息变更', '大额业务'],
    verificationMethods: ['人脸识别', '短信验证码', '人工坐席复核'],
  },
};

const openApiApps = [
  { appId: 'mini-gz-001', name: '广州政务小程序', subject: '广州市政务服务数据管理局', subjectType: 'GOVERNMENT', contactPerson: '张工', contactPhone: '020-12345678-8001', scopes: 'service-items,applications,certificates', callsToday: 12860, status: 'AUTHORIZED', authorizedAt: '2025-10-15', expiryDate: '2027-10-15' },
  { appId: 'street-portal-018', name: '街镇综合受理端', subject: '广州市越秀区人民政府', subjectType: 'GOVERNMENT', contactPerson: '李主任', contactPhone: '020-83123456', scopes: 'applications,notifications', callsToday: 4820, status: 'AUTHORIZED', authorizedAt: '2026-01-20', expiryDate: '2027-01-20' },
  { appId: 'bank-verify-006', name: '银行证照核验插件', subject: '中国工商银行广州分行', subjectType: 'ENTERPRISE', contactPerson: '王经理', contactPhone: '020-81234567', scopes: 'certificates.read', callsToday: 936, status: 'LIMITED', authorizedAt: '2026-03-01', expiryDate: '2027-03-01' },
];

const openApiScopeDetails = {
  'mini-gz-001': [
    { scope: 'service-items', permission: 'READ', description: '查询政务服务事项列表和详情', apiCount: 8, dailyLimit: 100000 },
    { scope: 'applications', permission: 'READ_WRITE', description: '创建和查询办件申请', apiCount: 12, dailyLimit: 50000 },
    { scope: 'certificates', permission: 'READ', description: '查询电子证照信息', apiCount: 5, dailyLimit: 20000 },
  ],
  'street-portal-018': [
    { scope: 'applications', permission: 'READ_WRITE', description: '街镇受理端办件录入与查询', apiCount: 10, dailyLimit: 10000 },
    { scope: 'notifications', permission: 'READ', description: '查询通知消息', apiCount: 4, dailyLimit: 5000 },
  ],
  'bank-verify-006': [
    { scope: 'certificates.read', permission: 'READ_ONLY', description: '仅可读取证照基本信息，含脱敏处理', apiCount: 2, dailyLimit: 2000 },
  ],
};

const openApiExceptionLogs = [
  { id: 'exc-001', appId: 'mini-gz-001', endpoint: 'GET /api/v1/applications', errorType: 'RATE_LIMIT_EXCEEDED', errorMessage: '超出今日调用次数限制', occurredAt: '2026-06-15 08:45', status: 'RESOLVED', resolution: '已临时提升调用限额', intercepted: true, interceptRule: 'dailyLimit:50000', retryCount: 3, receiptId: 'RCPT-EXC-20260615-0001' },
  { id: 'exc-002', appId: 'bank-verify-006', endpoint: 'GET /api/v1/certificates/verify', errorType: 'SIGNATURE_INVALID', errorMessage: 'API签名验证失败', occurredAt: '2026-06-15 09:20', status: 'RESOLVED', resolution: '已通知对方更新签名算法', intercepted: true, interceptRule: 'signature:RS256', retryCount: 0, receiptId: 'RCPT-EXC-20260615-0002' },
  { id: 'exc-003', appId: 'street-portal-018', endpoint: 'POST /api/v1/applications', errorType: 'PARAM_VALIDATION_FAILED', errorMessage: '缺少必填字段itemCode', occurredAt: '2026-06-15 10:15', status: 'INVESTIGATING', resolution: '正在排查对接系统参数问题', intercepted: true, interceptRule: 'requiredFields:itemCode,applicantName', retryCount: 1, receiptId: 'RCPT-EXC-20260615-0003' },
];

const openApiInterceptRules = {
  'mini-gz-001': [
    { id: 'rule-001', type: 'RATE_LIMIT', rule: 'QPS 100次/秒', status: 'ACTIVE', interceptCount: 12, lastInterceptedAt: '2026-06-15 08:45' },
    { id: 'rule-002', type: 'SIGNATURE_VERIFY', rule: 'RS256签名 + timestamp 5分钟有效', status: 'ACTIVE', interceptCount: 0, lastInterceptedAt: '' },
    { id: 'rule-003', type: 'IP_WHITELIST', rule: '政务云内网网段', status: 'ACTIVE', interceptCount: 3, lastInterceptedAt: '2026-06-14 22:10' },
    { id: 'rule-004', type: 'DATA_MASKING', rule: '身份证号脱敏、手机号脱敏', status: 'ACTIVE', interceptCount: 0, lastInterceptedAt: '' },
  ],
  'bank-verify-006': [
    { id: 'rule-011', type: 'SCOPE_LIMIT', rule: '仅可读证照基本信息，不可读敏感字段', status: 'ACTIVE', interceptCount: 28, lastInterceptedAt: '2026-06-15 09:50' },
    { id: 'rule-012', type: 'SIGNATURE_VERIFY', rule: 'HMAC-SHA256签名', status: 'ACTIVE', interceptCount: 5, lastInterceptedAt: '2026-06-15 09:20' },
  ],
};

const openApiReceiptTraces = {
  'mini-gz-001': [
    { receiptId: 'RCPT-20260615-084500-001', endpoint: 'GET /api/v1/service-items', method: 'GET', requestAt: '2026-06-15 08:45:00', responseAt: '2026-06-15 08:45:02', statusCode: 200, requestSize: '0.8KB', responseSize: '12.6KB', result: 'SUCCESS', traceId: 'TRACE-API-20260615-084500-001' },
    { receiptId: 'RCPT-20260615-084510-002', endpoint: 'POST /api/v1/applications', method: 'POST', requestAt: '2026-06-15 08:45:10', responseAt: '2026-06-15 08:45:13', statusCode: 201, requestSize: '2.3KB', responseSize: '0.9KB', result: 'SUCCESS', traceId: 'TRACE-API-20260615-084510-002' },
    { receiptId: 'RCPT-20260615-092000-003', endpoint: 'GET /api/v1/certificates/xxx', method: 'GET', requestAt: '2026-06-15 09:20:00', responseAt: '2026-06-15 09:20:01', statusCode: 200, requestSize: '0.3KB', responseSize: '4.2KB', result: 'SUCCESS', traceId: 'TRACE-API-20260615-092000-003' },
  ],
  'bank-verify-006': [
    { receiptId: 'RCPT-20260615-091500-101', endpoint: 'GET /api/v1/certificates/verify', method: 'GET', requestAt: '2026-06-15 09:15:00', responseAt: '2026-06-15 09:15:02', statusCode: 403, requestSize: '0.5KB', responseSize: '0.2KB', result: 'INTERCEPTED', interceptReason: '超出授权范围，尝试访问证照敏感字段', traceId: 'TRACE-API-20260615-091500-101' },
    { receiptId: 'RCPT-20260615-092000-102', endpoint: 'GET /api/v1/certificates/verify', method: 'GET', requestAt: '2026-06-15 09:20:00', responseAt: '2026-06-15 09:20:00', statusCode: 401, requestSize: '0.4KB', responseSize: '0.1KB', result: 'SIGNATURE_FAIL', interceptReason: 'API签名验证失败', traceId: 'TRACE-API-20260615-092000-102' },
  ],
};

const openApiPendingAuthorizations = [
  { id: 'pending-001', appId: 'hospital-health-002', appName: '医院预约挂号平台', applyScopes: 'service-items.read,applications.read', applyReason: '就医预约需要核验参保身份', applicant: '广州市某三甲医院', appliedAt: '2026-06-14', status: 'PENDING' },
  { id: 'pending-002', appId: 'tax-service-009', appName: '税务服务小程序', applyScopes: 'certificates.read,user-info.read', applyReason: '办税需验证法人身份和营业执照', applicant: '广州市税务局', appliedAt: '2026-06-13', status: 'REVIEWING' },
];

const bottleneckReports = [
  {
    item: '居住证办理', itemCode: '114401000001', department: '公安局', usage: 12860, materialFixRate: '18.2%', avgDepartmentHours: 14.6, bottleneck: '居住证明补正', action: '上线材料样例与OCR预检',
    linkedApplications: ['app-20260614-001', 'app-20260614-003'],
    deptDisposalRecords: [
      { dept: '越秀区住建局', disposalCount: 328, avgDisposalHours: 6.2, responsiblePerson: '陈志强', lastDisposalAt: '2026-06-15 11:20' },
      { dept: '海珠区住建局', disposalCount: 245, avgDisposalHours: 8.5, responsiblePerson: '李慧敏', lastDisposalAt: '2026-06-15 10:45' },
    ],
    reviewDetail: {
      heatmapDataId: 'heatmap-jzz',
      attributionId: 'attr-jzz',
      topPeakHours: ['周一 10:00-11:30', '周四 14:30-16:00'],
      sampleCases: [
        { caseId: 'CASE-JZZ-001', applicationId: 'app-20260614-001', applicant: '陈女士', occurredAt: '2026-06-15', issue: '居住证明缺备案编号', resolution: '系统自动发起补正，待申请人补充后5分钟内完成复核' },
        { caseId: 'CASE-JZZ-002', applicationId: 'app-20260614-012', applicant: '黄先生', occurredAt: '2026-06-14', issue: '合同出租方信息不一致', resolution: '人工核实后通过告知承诺制办理' },
      ],
      improvementSuggestions: [
        '上线材料自动预检提示，减少现场发现率',
        '与住建部门打通备案数据自动核验接口',
        '推广告知承诺制替代纸质材料',
      ],
    },
  },
  {
    item: '社保卡申领', itemCode: '114401000002', department: '人社局', usage: 9820, materialFixRate: '9.4%', avgDepartmentHours: 10.2, bottleneck: '身份核验重试', action: 'NFC降级到身份证联网核查',
    linkedApplications: ['app-20260614-002'],
    deptDisposalRecords: [
      { dept: '广州市社会保障卡管理中心', disposalCount: 512, avgDisposalHours: 12.8, responsiblePerson: '林晓东', lastDisposalAt: '2026-06-15 10:30' },
      { dept: '工商银行广州分行', disposalCount: 896, avgDisposalHours: 24.5, responsiblePerson: '刘芳', lastDisposalAt: '2026-06-15 09:00' },
    ],
    reviewDetail: {
      heatmapDataId: 'heatmap-sbk',
      attributionId: 'attr-sbk',
      topPeakHours: ['周二 09:30-11:00', '周五 15:00-16:30'],
      sampleCases: [
        { caseId: 'CASE-SBK-001', applicationId: 'app-20260614-002', applicant: '社保卡申领批量件', occurredAt: '2026-06-15', issue: 'NFC读卡失败触发降级', resolution: '自动发放临时授权凭证，身份证联网核查通过' },
      ],
      improvementSuggestions: [
        '加速NFC模块固件升级计划',
        '增加NFC读卡器部署密度',
        '优化降级自动切换体验',
      ],
    },
  },
  {
    item: '营业执照设立登记', itemCode: '114401000003', department: '市场监管局', usage: 7540, materialFixRate: '22.8%', avgDepartmentHours: 21.5, bottleneck: '住所证明复核', action: '增加街镇协同审批提醒',
    linkedApplications: ['app-20260614-004'],
    deptDisposalRecords: [
      { dept: '越秀区市场监管局', disposalCount: 186, avgDisposalHours: 18.3, responsiblePerson: '张伟', lastDisposalAt: '2026-06-15 11:00' },
      { dept: '天河区市场监管局', disposalCount: 210, avgDisposalHours: 25.7, responsiblePerson: '王强', lastDisposalAt: '2026-06-15 08:45' },
    ],
    reviewDetail: {
      heatmapDataId: 'heatmap-yyzz',
      attributionId: 'attr-yyzz',
      topPeakHours: ['周三 10:00-12:00'],
      sampleCases: [
        { caseId: 'CASE-YYZZ-001', applicationId: 'app-20260614-004', applicant: '某餐饮公司', occurredAt: '2026-06-14', issue: '住所产权证明不清', resolution: '街镇协查后3个工作日完成复核' },
      ],
      improvementSuggestions: [
        '接入不动产登记数据自动核验',
        '推行住所申报承诺制',
        '增加住所标准化地址库建设',
      ],
    },
  },
];

const bottleneckHeatmapData = {
  hours: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
  items: [
    { name: '居住证办理', data: [20, 15, 10, 8, 12, 35, 80, 120, 150, 180, 160, 140, 130, 145, 170, 190, 200, 180, 150, 120, 90, 60, 40, 25] },
    { name: '社保卡申领', data: [15, 10, 8, 6, 10, 25, 60, 90, 120, 130, 115, 100, 95, 110, 125, 140, 135, 120, 100, 80, 60, 40, 28, 18] },
    { name: '营业执照设立登记', data: [10, 8, 5, 4, 8, 20, 50, 75, 95, 105, 90, 85, 80, 90, 100, 110, 115, 100, 85, 70, 50, 35, 25, 15] },
  ],
  peakHours: ['16:00-17:00', '09:00-10:00', '14:00-15:00'],
  totalDataPoints: 72,
};

const bottleneckAttribution = {
  '居住证办理': {
    primaryCause: '材料补正率高（18.2%）',
    secondaryCause: '住建部门备案核验耗时长',
    correlation: {
      materialMissingRate: { pearson: 0.78, pValue: 0.001, significant: true, description: '材料缺失率与办理时长强正相关' },
      departmentCount: { pearson: 0.65, pValue: 0.012, significant: true, description: '涉及部门数量与办理时长中等正相关' },
    },
    caseStudies: [
      { caseId: 'case-001', description: '陈女士居住证办理，因缺少房屋租赁备案编号被退回补正，耗时增加2个工作日', impact: '+2工作日', outcome: '已补充材料并通过' },
      { caseId: 'case-002', description: '王先生居住证办理，住建部门核验耗时48小时，超出标准24小时', impact: '+1工作日', outcome: '已协调优化核验流程' },
    ],
    improvementSuggestions: [
      '上线材料样例展示与OCR预检功能',
      '与住建部门打通备案数据接口，实现自动核验',
      '推行告知承诺制，减少材料前置审核',
    ],
  },
};

const profile = {
  id: 'user-admin-001',
  name: '政务平台管理员',
  mobile: '13800000000',
  roles: ['ADMIN', 'OPERATOR'],
  department: '广州市政务服务数据管理局',
  permissions: ['service-items.read', 'applications.trace', 'admin.dashboard', 'open-api.audit'],
};

const compatibilityResources = {
  teachers: [
    { id: 'agent-001', name: '智能预审坐席', specialty: '材料识别与政策问答', status: 'ONLINE' },
    { id: 'agent-002', name: '综合受理专员', specialty: '事项导办与办件咨询', status: 'ONLINE' },
  ],
  courses: [
    { id: 'guide-001', title: '居住证办理导办流程', itemCode: '114401000001', duration: '8 minutes' },
    { id: 'guide-002', title: '社保卡申领材料准备', itemCode: '114401000002', duration: '6 minutes' },
  ],
  bookings: [
    { id: 'booking-001', applicationId: 'app-20260614-001', window: '越秀区政务大厅 A12', time: '2026-06-15 14:30', status: 'RESERVED' },
    { id: 'booking-002', applicationId: 'app-20260614-002', window: '线上智能受理', time: '2026-06-15 10:00', status: 'ONLINE' },
  ],
  products: [
    { id: 'service-001', name: '居住证办理服务包', type: '政务事项', price: 0, status: 'AVAILABLE' },
    { id: 'service-002', name: '社保卡申领服务包', type: '政务事项', price: 0, status: 'AVAILABLE' },
  ],
  cart: {
    id: 'cart-demo',
    owner: '政务平台管理员',
    items: [
      { itemCode: '114401000001', itemName: '居住证办理', quantity: 1, fee: 0 },
    ],
    totalFee: 0,
    note: '政务服务事项不收取平台服务费',
  },
};

function handleBackend(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  const url = new URL(req.url || '/', `http://${BACKEND_HOST}:${BACKEND_PORT}`);
  const path = url.pathname.replace(/\/$/, '') || '/';

  if (path === '/api/health' || path === `${API_PREFIX}/health`) {
    return sendJson(res, 200, {
      success: true,
      status: 'ok',
      service: 'gz-government-service-local',
      database: 'sqlite',
      frontendUrl: `http://${FRONTEND_HOST}:${FRONTEND_PORT}/`,
      backendUrl: `http://${BACKEND_HOST}:${BACKEND_PORT}`,
    });
  }

  if (path === '/api/search' || path === `${API_PREFIX}/search`) {
    const q = (url.searchParams.get('q') || '').trim();
    const sourceRows = [
      ...serviceItems(),
      ...applications(),
      ...policies(),
      ...formTemplates,
      ...policyCorpus,
      ...identityIntegrations,
      ...openApiApps,
      ...bottleneckReports,
      ...timeoutAuditRecords,
    ];
    const rows = q
      ? sourceRows.filter((item) => JSON.stringify(item).includes(q))
      : sourceRows;
    return sendJson(res, 200, {
      success: true,
      query: q,
      matchMode: rows.length > 0 ? 'keyword' : 'demo-fallback',
      results: rows.length > 0 ? rows : sourceRows.slice(0, 6),
    });
  }

  if (path === `${API_PREFIX}/service-items` || path === '/api/service-items') {
    return sendJson(res, 200, { success: true, data: serviceItems() });
  }

  if (path === `${API_PREFIX}/applications` || path === '/api/applications') {
    return sendJson(res, 200, { success: true, data: applications() });
  }

  const appFlowMatch = path.match(new RegExp(`^(?:${API_PREFIX.replace(/\//g, '\\/')}|\\/api)\\/applications\\/([^/]+)\\/flow$`));
  if (appFlowMatch) {
    return sendJson(res, 200, { success: true, data: applicationFlow(appFlowMatch[1]) });
  }

  if (path === `${API_PREFIX}/policies` || path === '/api/policies') {
    return sendJson(res, 200, { success: true, data: policies() });
  }

  if (path === `${API_PREFIX}/service-items/forms` || path === '/api/service-items/forms') {
    return sendJson(res, 200, { success: true, data: formTemplates });
  }

  if (path === `${API_PREFIX}/policies/training-corpus` || path === '/api/policies/training-corpus') {
    return sendJson(res, 200, { success: true, data: policyCorpus });
  }

  if (path === `${API_PREFIX}/admin/notifications` || path === '/api/admin/notifications') {
    return sendJson(res, 200, { success: true, data: timeoutAuditRecords });
  }

  if (path === `${API_PREFIX}/admin/stats` || path === '/api/admin/stats' || path === `${API_PREFIX}/admin/dashboard` || path === '/api/admin/dashboard') {
    return sendJson(res, 200, {
      success: true,
      data: {
        serviceItems: serviceItems().length,
        applications: applications().length,
        policyCorpus: policyCorpus.reduce((sum, item) => sum + item.qaPairs, 0),
        openApiCallsToday: openApiApps.reduce((sum, item) => sum + item.callsToday, 0),
        identityIntegrations,
        bottleneckReports,
        latestApplications: applications().map((app, index) => {
          const flow = applicationFlow(app.id);
          return {
            id: app.id,
            applicant: app.applicant,
            itemName: app.item_name,
            status: app.status,
            currentNode: app.current_node,
            dueAt: app.due_at,
            workflowStage: flow.workflowStage,
            nodes: flow.nodes,
            approvalOpinions: flow.approvalOpinions,
            branchRecords: flow.branchRecords,
            riskLevel: flow.riskLevel,
            fullResponsibilityChain: flow.fullResponsibilityChain,
            abnormalDisposalChain: flow.abnormalDisposalChain,
            materialVerification: flow.materialVerification,
            supplementRecords: flow.supplementRecords,
            disposalPerson: flow.disposalPerson,
            supervisionRecords: flow.supervisionRecords,
            canShowClosedLoop: flow.canShowClosedLoop,
            canShowIssuance: flow.canShowIssuance,
            certificateDetail: flow.certificateDetail,
            resultPushReceipt: flow.resultPushReceipt,
            deliveryTrace: flow.deliveryTrace,
            applicantConfirmation: flow.applicantConfirmation,
          };
        }),
        timeoutAlerts: applications().filter((a) => a.id === 'app-20260614-002' || a.id === 'app-20260614-001').map((app) => {
          const flow = applicationFlow(app.id);
          return {
            id: `timeout-${app.id}`,
            applicationId: app.id,
            applicant: app.applicant,
            itemName: app.item_name,
            currentNode: app.current_node,
            dueAt: app.due_at,
            hoursRemaining: flow.riskLevel?.riskLevel === 2 ? 18 : (flow.riskLevel?.riskLevel === 1 ? 57 : 0),
            workflowStage: flow.workflowStage,
            disposalPerson: flow.disposalPerson,
            supervisionRecords: flow.supervisionRecords,
            notificationRetry: flow.notificationRetry,
            deliveryTrace: flow.deliveryTrace,
            applicantConfirmation: flow.applicantConfirmation,
            riskLevel: flow.riskLevel,
            fullResponsibilityChain: flow.fullResponsibilityChain,
            abnormalDisposalChain: flow.abnormalDisposalChain,
            materialVerification: flow.materialVerification,
            supplementRecords: flow.supplementRecords,
            branchRecords: flow.branchRecords,
          };
        }),
        nfcDegradationDetail,
        openApiSummary: {
          totalApps: openApiApps.length,
          totalCallsToday: openApiApps.reduce((sum, item) => sum + item.callsToday, 0),
          pendingAuthorizations: openApiPendingAuthorizations.length,
          exceptionCount: openApiExceptionLogs.length,
        },
        policySummary: {
          totalPolicies: policies().length,
          trainedCorpus: policyCorpus.filter((c) => c.trained).length,
          pendingReview: policyCorpus.filter((c) => !c.trained).length,
        },
      },
    });
  }

  if (path === `${API_PREFIX}/admin/integrations` || path === '/api/admin/integrations') {
    return sendJson(res, 200, { success: true, data: identityIntegrations });
  }

  if (path === `${API_PREFIX}/admin/bottleneck/report` || path === '/api/admin/bottleneck/report') {
    return sendJson(res, 200, { success: true, data: bottleneckReports });
  }

  if (path === `${API_PREFIX}/auth/me` || path === '/api/auth/me' || path === `${API_PREFIX}/users/profile` || path === '/api/users/profile' || path === `${API_PREFIX}/user/profile` || path === '/api/user/profile') {
    return sendJson(res, 200, { success: true, data: profile });
  }

  if (path === `${API_PREFIX}/teachers` || path === '/api/teachers') {
    return sendJson(res, 200, { success: true, data: compatibilityResources.teachers });
  }

  if (path === `${API_PREFIX}/courses` || path === '/api/courses') {
    return sendJson(res, 200, { success: true, data: compatibilityResources.courses });
  }

  if (path === `${API_PREFIX}/bookings` || path === '/api/bookings') {
    return sendJson(res, 200, { success: true, data: compatibilityResources.bookings });
  }

  if (path === `${API_PREFIX}/orders` || path === '/api/orders') {
    return sendJson(res, 200, {
      success: true,
      data: applications().map((app) => ({
        id: app.id,
        applicant: app.applicant,
        itemName: app.item_name,
        status: app.status,
        currentNode: app.current_node,
        dueAt: app.due_at,
      })),
    });
  }

  if (path === `${API_PREFIX}/products` || path === '/api/products') {
    return sendJson(res, 200, { success: true, data: compatibilityResources.products });
  }

  if (path === `${API_PREFIX}/cart` || path === '/api/cart') {
    return sendJson(res, 200, { success: true, data: compatibilityResources.cart });
  }

  if (path === `${API_PREFIX}/open-api/apps` || path === '/api/open-api/apps') {
    return sendJson(res, 200, { success: true, data: openApiApps });
  }

  if (path === `${API_PREFIX}/analytics/hotspots` || path === '/api/analytics/hotspots') {
    return sendJson(res, 200, {
      success: true,
      data: [
        { name: '居住证办理', count: 12860, bottleneck: '材料补正' },
        { name: '社保卡申领', count: 9820, bottleneck: '身份核验' },
        { name: '营业执照设立登记', count: 7540, bottleneck: '部门协同审批' },
      ],
    });
  }

  if (path === `${API_PREFIX}/open-api/catalog` || path === '/api/open-api/catalog') {
    return sendJson(res, 200, {
      success: true,
      data: [
        { method: 'GET', path: `${API_PREFIX}/service-items`, scope: 'THIRD_PARTY' },
        { method: 'POST', path: `${API_PREFIX}/applications`, scope: 'THIRD_PARTY' },
        { method: 'GET', path: `${API_PREFIX}/analytics/hotspots`, scope: 'INTERNAL' },
      ],
    });
  }

  const itemDetailMatch = path.match(new RegExp(`^(?:${API_PREFIX.replace(/\//g, '\\/')}|\\/api)\\/service-items\\/([^/]+)$`));
  if (itemDetailMatch) {
    const itemCode = itemDetailMatch[1];
    const item = serviceItems().find((i) => i.item_code === itemCode);
    if (!item) return sendJson(res, 404, { success: false, error: 'Item not found' });
    const form = formTemplates.find((f) => f.itemCode === itemCode);
    return sendJson(res, 200, {
      success: true,
      data: {
        ...item,
        handlingTimeLimit: handlingTimeLimits[itemCode] || null,
        applicableConditions: applicableConditions[itemCode] || [],
        formTemplate: form || null,
        formFieldChangeLog: form ? formFieldChangeLogs[form.id] || [] : [],
        templateReviewRecords: form ? templateReviewRecords[form.id] || [] : [],
      },
    });
  }

  if (path === `${API_PREFIX}/admin/integrations/nfc-degradation` || path === '/api/admin/integrations/nfc-degradation') {
    return sendJson(res, 200, { success: true, data: nfcDegradationDetail });
  }

  if (path === `${API_PREFIX}/admin/policies/publish-audit` || path === '/api/admin/policies/publish-audit') {
    return sendJson(res, 200, { success: true, data: policyPublishAudits });
  }

  const policyAuditMatch = path.match(new RegExp(`^(?:${API_PREFIX.replace(/\//g, '\\/')}|\\/api)\\/admin\\/policies\\/([^/]+)\\/publish-audit$`));
  if (policyAuditMatch) {
    const policyId = policyAuditMatch[1];
    return sendJson(res, 200, {
      success: true,
      data: {
        publishAudit: policyPublishAudits[policyId] || null,
        versionOrigins: policyVersionOrigins[policyId] || [],
      },
    });
  }

  if (path === `${API_PREFIX}/admin/open-api/scopes` || path === '/api/admin/open-api/scopes') {
    return sendJson(res, 200, { success: true, data: openApiScopeDetails });
  }

  if (path === `${API_PREFIX}/admin/open-api/exceptions` || path === '/api/admin/open-api/exceptions') {
    return sendJson(res, 200, { success: true, data: openApiExceptionLogs });
  }

  if (path === `${API_PREFIX}/admin/open-api/pending-authorizations` || path === '/api/admin/open-api/pending-authorizations') {
    return sendJson(res, 200, { success: true, data: openApiPendingAuthorizations });
  }

  if (path === `${API_PREFIX}/admin/bottleneck/heatmap` || path === '/api/admin/bottleneck/heatmap') {
    return sendJson(res, 200, { success: true, data: bottleneckHeatmapData });
  }

  if (path === `${API_PREFIX}/admin/bottleneck/attribution` || path === '/api/admin/bottleneck/attribution') {
    return sendJson(res, 200, { success: true, data: bottleneckAttribution });
  }

  return sendJson(res, 404, { success: false, error: 'API not found' });
}

function pageHtml() {
  const items = serviceItems();
  const apps = applications();
  const policyRows = policies();
  const firstApplicationId = apps[0]?.id || 'app-20260614-001';
  const firstFlow = applicationFlow(firstApplicationId);
  const thirdAppId = 'app-20260614-003';
  const thirdFlow = applicationFlow(thirdAppId);
  const flowCards = firstFlow.nodes.map((node) => `
    <div class="flow-card" style="${node.status === 'WAITING' ? 'opacity: 0.55;' : ''}">
      <span class="flow-status ${node.status.toLowerCase()}">${node.status === 'DONE' ? '已完成' : node.status === 'RUNNING' ? '进行中' : '待处理'}</span>
      <strong>${node.label}</strong>
      <small style="color:#1570EF;font-weight:600;">责任人：${node.responsiblePerson}</small>
      <p>${node.evidence}</p>
      ${node.abnormal ? `<p style="margin-top:6px;color:#b54708;font-size:12px;padding:4px 8px;background:#fff7ed;border-radius:4px;">⚠️ 异常：${node.abnormal.description}</p>` : ''}
    </div>
  `).join('');
  const appRows = apps.map((app, index) => {
    const flow = applicationFlow(app.id);
    const stageColor = flow.workflowStage === '已办结' ? '#10b981' : flow.workflowStage === '材料补正中' ? '#f59e0b' : '#3b82f6';
    const hasLoop = flow.canShowClosedLoop;
    return `<tr>
      <td>${app.id}</td>
      <td>${app.applicant}</td>
      <td>${app.item_name}</td>
      <td><span style="font-weight:600;color:${stageColor};">${flow.workflowStage}</span><br><small style="color:#667085;">当前：${app.current_node}</small></td>
      <td><span class="badge">${app.status}</span></td>
      <td>${app.due_at}</td>
      <td>${flow.riskLevel ? `<span class="badge warn">${flow.riskLevel.riskLevelLabel}</span>` : '<span class="badge">正常</span>'}</td>
      <td style="font-size:12px;">
        ${hasLoop ? '✅ <span style="color:#10b981;">闭环已形成</span>' : '⏳ <span style="color:#667085;">流程进行中</span>'}<br>
        <small style="color:#98a2b3;">责任链：${flow.fullResponsibilityChain.length}节点 · 异常处置：${flow.abnormalDisposalChain.length}条</small>
      </td>
    </tr>`;
  }).join('');
  const itemRows = items.map((item) => {
    const timeLimit = item.handlingTimeLimit;
    const conditions = item.applicableConditions || [];
    const readyBadge = item.standardReviewReady ? '<span class="badge">✓ 可复查</span>' : '<span class="badge warn">待完善</span>';
    return `<tr>
      <td><strong>${item.item_code}</strong></td>
      <td>${item.item_name}</td>
      <td>${item.department}</td>
      <td style="font-size:12px;">
        <div style="font-weight:600;color:#172033;">${item.materials}</div>
        <div style="color:#667085;margin-top:2px;">核验规则：${(item.materialVerificationRule || []).length}项 · 适用条件：${conditions.length}条</div>
        <div style="margin-top:4px;padding:3px 6px;background:#fef2f2;border-radius:4px;font-size:10px;color:#b91c1c;">
          失败样本：${(materialVerifyFailureSamples[item.item_code] || []).length}类 · 首月 ${(materialVerifyFailureSamples[item.item_code] || [])[0]?.sampleCount || 0} 件
        </div>
      </td>
      <td style="font-size:12px;">
        <div style="font-weight:600;color:#172033;">${item.formTemplate?.name || '待配置'}</div>
        <div style="color:#667085;margin-top:2px;">版本：${item.formTemplate?.version || '-'} · 变更记录：${(item.formFieldChangeLog || []).length}条</div>
      </td>
      <td style="font-size:12px;">
        <div style="font-weight:600;color:${timeLimit ? '#137333' : '#9a5b00'};">承诺：${timeLimit?.promiseTimeLimit || '-'}</div>
        <div style="color:#667085;margin-top:2px;">法定：${timeLimit?.statutoryTimeLimit || '-'}</div>
      </td>
      <td style="font-size:12px;">
        ${readyBadge}<br>
        <small style="color:#98a2b3;">模板复查：${(item.templateReviewRecords || []).length}条</small>
        <div style="margin-top:4px;padding:2px 6px;background:#eff6ff;border-radius:3px;font-size:10px;color:#1e40af;display:inline-block;">
          📊 可抽查
        </div>
        <div style="margin-top:2px;font-size:10px;color:#667085;">
          条件命中：${(conditionHitRecords[item.item_code]?.totalApplications || 0).toLocaleString()}件
        </div>
      </td>
      <td><button onclick="show('/api/service-items/${item.item_code}')">查看详情</button></td>
    </tr>`;
  }).join('');
  const corpusRows = policyRows.map((policy) => {
    const corpus = policyCorpus.find((item) => item.policyId === policy.id);
    return `<tr><td>${policy.title}</td><td>${policy.category}</td><td>${corpus?.field || '待拆分'}</td><td>${corpus?.chunks || 0}</td><td>${corpus?.qaPairs || 0}</td><td>${corpus?.trained ? '已训练' : '待训练'}</td></tr>`;
  }).join('');
  const integrationRows = identityIntegrations.map((item) => `
    <div class="item">
      <div style="display:flex;align-items:center;gap:8px;">
        <strong>${item.name}</strong>
        <span class="badge ${item.status === 'DEGRADED' ? 'warn' : ''}">${item.status}</span>
        ${item.reviewAvailable ? '<small style="color:#1570EF;">✅ 可审计</small>' : ''}
      </div>
      <p>${item.scope} · 延迟 ${item.latency} · 成功率 ${item.successRate}</p>
      ${item.dailyStats ? `<p style="font-size:12px;color:#667085;margin-top:4px;">今日调用：${(item.dailyStats.todayCalls || 0).toLocaleString()} 次 · 成功 ${(item.dailyStats.successCount || 0).toLocaleString()} · 失败 ${(item.dailyStats.failCount || 0).toLocaleString()}</p>` : ''}
      <div style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap;">
        <small style="padding:2px 6px;background:#ecfdf3;border-radius:3px;color:#065f46;">✓ 授权凭证</small>
        <small style="padding:2px 6px;background:#fff7ed;border-radius:3px;color:#92400e;">↓ 降级处理</small>
        <small style="padding:2px 6px;background:#faf5ff;border-radius:3px;color:#6b21a8;">↻ 二次核验</small>
        ${item.status === 'DEGRADED' ? '<small style="padding:2px 6px;background:#fef2f2;border-radius:3px;color:#b91c1c;">⚠ 高风险留痕</small>' : ''}
      </div>
      ${item.auditTrail && item.auditTrail.length > 0 ? `
        <div style="margin-top:8px;padding:8px;background:#f8fafc;border-radius:6px;">
          <small style="font-weight:600;color:#344054;">最近调用明细：</small>
          ${item.auditTrail.slice(0, 3).map(t => `
            <div style="font-size:11px;color:#475467;margin-top:4px;padding:4px 6px;background:#ffffff;border:1px solid #e5e7eb;border-radius:4px;">
              <span style="color:#1570EF;font-weight:600;">${t.result}</span> ·
              ${t.verifiedAt} ·
              ${t.traceId ? `<small style="color:#98a2b3;">trace: ${t.traceId}</small>` : ''}
              <br><small style="color:#667085;">${t.note || ''}</small>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');
  const apiRows = openApiApps.map((app) => `<tr><td>${app.appId}</td><td>${app.name}</td><td>${app.scopes}</td><td>${app.callsToday.toLocaleString()}</td><td>
  <span class="badge">${app.status}</span>
  <div style="margin-top:4px;display:flex;gap:3px;flex-wrap:wrap;">
    <small style="padding:1px 5px;background:#eff6ff;border-radius:3px;color:#1e40af;font-size:9px;">授权范围</small>
    <small style="padding:1px 5px;background:#fef2f2;border-radius:3px;color:#b91c1c;font-size:9px;">拦截规则</small>
    <small style="padding:1px 5px;background:#f0fdf4;border-radius:3px;color:#166534;font-size:9px;">回执追踪</small>
  </div>
</td></tr>`).join('');
  const bottleneckRows = bottleneckReports.map((item) => `
    <tr>
      <td><strong>${item.item}</strong></td>
      <td>${item.usage.toLocaleString()}</td>
      <td>${item.materialFixRate}</td>
      <td>${item.avgDepartmentHours}h</td>
      <td style="color:#b45309;font-weight:600;">${item.bottleneck}</td>
      <td>${item.action}</td>
      <td style="font-size:12px;">
        ${item.reviewDetail ? `
          <div style="color:#1570EF;font-weight:600;">✅ 可复查</div>
          <small style="color:#667085;">典型案例：${item.reviewDetail.sampleCases.length}条 · 优化建议：${item.reviewDetail.improvementSuggestions.length}项</small>
          <div style="margin-top:4px;display:flex;gap:3px;flex-wrap:wrap;">
            <small style="padding:1px 5px;background:#fffbeb;border-radius:3px;color:#92400e;font-size:9px;">🔍 归因</small>
            <small style="padding:1px 5px;background:#ecfdf5;border-radius:3px;color:#065f46;font-size:9px;">📋 处置</small>
            <small style="padding:1px 5px;background:#eff6ff;border-radius:3px;color:#1e40af;font-size:9px;">🏢 部门</small>
          </div>
        ` : '<small style="color:#98a2b3;">明细待补充</small>'}
      </td>
    </tr>
  `).join('');
  const noticeRows = timeoutAuditRecords.map((item) => `<tr><td>${item.applicationId}</td><td>${item.channel}</td><td>${item.receiver}</td><td>${item.message}</td><td>${item.sentAt}</td><td>${item.audit}</td></tr>`).join('');

  const firstAuth = identityIntegrations[0];
  const authChainHtml = firstAuth?.authChain ? `
    <div class="depth-section" style="background:linear-gradient(135deg,#eff6ff 0%,#f5f3ff 100%);border:1px solid #c7d2fe;">
      <h3 style="color:#3730a3;">🔗 认证链路 · 授权凭证·降级·二次核验</h3>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:8px;">
        <div style="padding:10px;background:white;border-radius:6px;border-left:4px solid #2563eb;">
          <small style="color:#64748b;">接入方式</small>
          <p style="font-weight:600;color:#172033;margin-top:2px;">${firstAuth.authChain.entryMethod}</p>
        </div>
        <div style="padding:10px;background:white;border-radius:6px;border-left:4px solid #10b981;">
          <small style="color:#64748b;">凭证类型</small>
          <p style="font-weight:600;color:#172033;margin-top:2px;">${firstAuth.authChain.credentialType}</p>
        </div>
        <div style="padding:10px;background:white;border-radius:6px;border-left:4px solid #f59e0b;">
          <small style="color:#64748b;">凭证有效期</small>
          <p style="font-weight:600;color:#172033;margin-top:2px;">${firstAuth.authChain.credentialValidity}</p>
        </div>
        <div style="padding:10px;background:white;border-radius:6px;border-left:4px solid #8b5cf6;">
          <small style="color:#64748b;">认证等级</small>
          <p style="font-weight:600;color:#172033;margin-top:2px;font-size:12px;">${firstAuth.authChain.authLevels.join(' → ')}</p>
        </div>
      </div>
      <div style="margin-top:8px;">
        <small style="color:#64748b;font-weight:600;">🔄 降级路径：</small>
        <span style="font-size:12px;color:#475467;margin-left:4px;">${firstAuth.authChain.fallbackMethod}</span>
      </div>
      <div style="margin-top:4px;">
        <small style="color:#64748b;font-weight:600;">✅ 二次核验：</small>
        <span style="font-size:12px;color:#475467;margin-left:4px;">${firstAuth.authChain.secondaryVerification}</span>
      </div>
      <div style="margin-top:6px;padding:6px 8px;background:#eef2ff;border-radius:4px;">
        <small style="color:#3730a3;font-weight:600;">凭证模板：</small>
        <small style="color:#475467;">${firstAuth.authChain.credentialTemplate.type} · 签发方：${firstAuth.authChain.credentialTemplate.issuer} · 算法：${firstAuth.authChain.credentialTemplate.algorithm}</small>
      </div>
    </div>
  ` : '';
  const authFailureRecordsList = authFailureRecords[firstAuth?.name] || [];
  const authFailureHtml = authFailureRecordsList.length > 0 ? `
    <div class="depth-section" style="background:linear-gradient(135deg,#fef2f2 0%,#fff7ed 100%);border:1px solid #fecaca;">
      <h3 style="color:#991b1b;">⚠️ 认证失败降级明细</h3>
      ${authFailureRecordsList.map(f => `
        <div style="padding:10px;border:1px solid #fecaca;border-radius:8px;margin-top:8px;background:#fef2f2;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="color:#991b1b;">${f.failType === 'NETWORK_TIMEOUT' ? '网络超时' : f.failType === 'USER_CANCEL' ? '用户取消' : f.failType === 'LIVENESS_FAIL' ? '活体检测失败' : f.failType === 'SIMILARITY_LOW' ? '相似度不足' : f.failType}</strong>
            <span style="font-weight:700;color:#dc2626;">失败 ${f.failCount} 次 · 失败率 ${f.failRate}</span>
          </div>
          <p style="font-size:12px;color:#9a3412;margin:6px 0 0;">高峰时段：${f.peakTime}</p>
          <p style="font-size:12px;color:#667085;margin:4px 0 0;">Top原因：${f.topReasons.join('、')}</p>
          <p style="font-size:12px;color:#92400e;margin:4px 0 0;">影响：${f.impact}</p>
        </div>
      `).join('')}
    </div>
  ` : '';
  const secondaryVerifyList = secondaryVerificationRecords.slice(0, 3);
  const secondaryVerifyHtml = secondaryVerifyList.length > 0 ? `
    <div class="depth-section" style="background:linear-gradient(135deg,#faf5ff 0%,#f3e8ff 100%);border:1px solid #e9d5ff;">
      <h3 style="color:#6b21a8;">🔍 二次核验记录</h3>
      <ul class="timeline-list" style="margin-top:10px;">
        ${secondaryVerifyList.map((v, i) => `
          <li class="${v.result === 'PASS' ? 'done' : v.result === 'PENDING' ? 'pending' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <strong style="color:#172033;">${v.triggerReason === 'HIGH_RISK_ITEM' ? '高风险事项触发' : v.triggerReason === 'DEGRADED_MODE' ? '降级模式触发' : v.triggerReason === 'SUSPICIOUS_ACTIVITY' ? '可疑活动触发' : v.triggerReason}</strong>
                <small style="color:#667085;display:block;margin-top:2px;">核验方式：${v.verificationMethod === 'FACE_RECOGNITION' ? '人脸识别' : v.verificationMethod === 'ID_CARD_CHECK' ? '身份证核查' : v.verificationMethod === 'MANUAL_REVIEW' ? '人工复核' : v.verificationMethod}</small>
              </div>
              <span class="badge ${v.result === 'PASS' ? '' : 'warn'}" style="${v.result === 'PASS' ? '' : v.result === 'PENDING' ? 'background:#fef3c7;color:#92400e;' : 'background:#fee2e2;color:#991b1b;'}">${v.result === 'PASS' ? '通过' : v.result === 'PENDING' ? '待核验' : '失败'}</span>
            </div>
            <p style="font-size:12px;color:#667085;margin:6px 0 0;">认证等级：${v.authLevelBefore} → ${v.authLevelAfter || '待提升'}</p>
            <p style="font-size:12px;color:#475467;margin:4px 0 0;">关联办件：${v.applicationId || '无'}</p>
            <p style="font-size:11px;color:#98a2b3;margin:2px 0 0;">触发时间：${v.triggeredAt}${v.verifiedAt ? ` · 完成时间：${v.verifiedAt}` : ''}</p>
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';
  const crossPlatformMap = crossPlatformIdentityMapping['user-20260614-001'];
  const crossPlatformMapHtml = crossPlatformMap ? `
    <div class="depth-section" style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border:1px solid #bfdbfe;">
      <h3 style="color:#1e40af;">🌐 跨平台身份映射</h3>
      <div style="margin-top:8px;padding:8px 10px;background:white;border-radius:6px;border-left:4px solid #2563eb;">
        <small style="color:#64748b;">主身份ID</small>
        <p style="font-weight:700;color:#1e40af;margin-top:2px;font-size:14px;">${crossPlatformMap.masterId}</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:8px;">
        ${crossPlatformMap.platforms.map(p => `
          <div style="padding:8px;background:white;border-radius:6px;border:1px solid #bfdbfe;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong style="color:#1e40af;font-size:13px;">${p.platform}</strong>
              <span style="font-size:10px;padding:2px 6px;border-radius:10px;background:#dbeafe;color:#1e40af;">${p.authLevel}</span>
            </div>
            <p style="font-size:11px;color:#667085;margin:4px 0 0;">用户ID：${p.platformUserId}</p>
            <p style="font-size:11px;color:#98a2b3;margin:2px 0 0;">绑定时间：${p.bindAt}</p>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:8px;padding:6px 10px;background:#e0f2fe;border-radius:4px;">
        <small style="color:#0369a1;font-weight:600;">身份信息：</small>
        <small style="color:#075985;">${crossPlatformMap.identityInfo.name} · 身份证：${crossPlatformMap.identityInfo.idCardHash} · ${crossPlatformMap.identityInfo.realNameVerified ? '已实名' : '未实名'}</small>
      </div>
      <p style="font-size:11px;color:#64748b;margin-top:6px;">同步时间：${crossPlatformMap.lastSyncAt} · 状态：${crossPlatformMap.mappingStatus === 'ACTIVE' ? '正常' : crossPlatformMap.mappingStatus}</p>
    </div>
  ` : '';
  const highRiskAuthHtml = highRiskAuthRecords && highRiskAuthRecords.length > 0 ? `
    <div class="depth-section" style="background:#fef2f2;border:1px solid #fecaca;">
      <h3 style="color:#991b1b;">🚨 高风险事项核验留痕 · ${highRiskAuthRecords.length}条</h3>
      <div style="max-height:250px;overflow-y:auto;">
        ${highRiskAuthRecords.map(record => `
          <div style="padding:8px;background:white;border:1px solid #fee2e2;border-radius:4px;margin-bottom:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong style="font-size:12px;color:#991b1b;">${record.itemName}</strong>
              <span style="font-size:10px;padding:2px 8px;border-radius:10px;background:${record.result === 'PASS' ? '#dcfce7' : record.result === 'FALLBACK' ? '#fef3c7' : '#fee2e2'};color:${record.result === 'PASS' ? '#166534' : record.result === 'FALLBACK' ? '#92400e' : '#991b1b'};">${record.result === 'PASS' ? '核验通过' : record.result === 'FALLBACK' ? '降级通过' : '待核验'}</span>
            </div>
            <div style="font-size:11px;color:#667085;margin-top:2px;">
              核验方式：${record.authMethod} · 等级跃迁：${record.authLevelBefore} → ${record.authLevelAfter}
            </div>
            <div style="font-size:10px;color:#98a2b3;margin-top:2px;">
              trace: ${record.traceId} · 留存 ${record.retentionPeriod}
            </div>
          </div>
        `).join('')}
      </div>
      <p style="font-size:10px;color:#991b1b;margin-top:6px;text-align:right;">
        依据《政务服务高风险事项身份核验管理办法》
      </p>
    </div>
  ` : '';
  const firstOpenApi = openApiApps[0];
  const firstOpenApiIntercept = openApiInterceptRules[firstOpenApi?.appId] || [];
  const firstOpenApiReceipt = openApiReceiptTraces[firstOpenApi?.appId] || [];
  const openApiDepthHtml = firstOpenApi ? `
    <div class="depth-section">
      <h3>🏢 调用主体 · ${firstOpenApi.name}</h3>
      <div class="detail-grid">
        <div class="detail-item"><strong>主体名称</strong><span>${firstOpenApi.subject}（${firstOpenApi.subjectType === 'GOVERNMENT' ? '政府部门' : '企业单位'}）</span></div>
        <div class="detail-item"><strong>联系人</strong><span>${firstOpenApi.contactPerson} · ${firstOpenApi.contactPhone}</span></div>
        <div class="detail-item"><strong>授权时间</strong><span>${firstOpenApi.authorizedAt}</span></div>
        <div class="detail-item"><strong>到期时间</strong><span>${firstOpenApi.expiryDate}</span></div>
      </div>
    </div>
  ` : '';
  const interceptRulesHtml = firstOpenApiIntercept.length > 0 ? `
    <div class="depth-section">
      <h3>🛡️ 异常拦截规则 · ${firstOpenApiIntercept.length}条</h3>
      ${firstOpenApiIntercept.map(r => `
        <div style="padding:8px 10px;border:1px solid #fecaca;border-radius:6px;margin-top:6px;background:#fef2f2;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="color:#991b1b;font-size:13px;">${r.type === 'RATE_LIMIT' ? '流量控制' : r.type === 'SIGNATURE_VERIFY' ? '签名校验' : r.type === 'IP_WHITELIST' ? 'IP白名单' : r.type === 'SCOPE_LIMIT' ? '范围限制' : '数据脱敏'}：${r.rule}</strong>
            <span class="badge" style="background:${r.status === 'ACTIVE' ? '#dcfce7;color:#166534;' : '#fee2e2;color:#991b1b;'}">${r.status === 'ACTIVE' ? '启用中' : '已停用'}</span>
          </div>
          <p style="font-size:11px;color:#667085;margin:4px 0 0;">累计拦截 ${r.interceptCount} 次 · 最近拦截：${r.lastInterceptedAt || '无'}</p>
        </div>
      `).join('')}
    </div>
  ` : '';
  const receiptTracesHtml = firstOpenApiReceipt.length > 0 ? `
    <div class="depth-section">
      <h3>📨 调用回执追踪 · ${firstOpenApiReceipt.length}条</h3>
      ${firstOpenApiReceipt.map(r => `
        <div style="padding:8px 10px;border:1px solid #e5e7eb;border-radius:6px;margin-top:6px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="font-size:12px;color:#172033;">${r.method} ${r.endpoint}</strong>
            <span class="badge ${r.result === 'SUCCESS' ? '' : 'warn'}" style="${r.result === 'SUCCESS' ? '' : 'background:#fee2e2;color:#991b1b;'}">${r.result === 'SUCCESS' ? '成功' : r.result === 'INTERCEPTED' ? '已拦截' : '失败'}</span>
          </div>
          <p style="font-size:11px;color:#667085;margin:4px 0 0;">
            ${r.requestAt} → ${r.responseAt} · 状态码 ${r.statusCode} · 请求 ${r.requestSize} / 响应 ${r.responseSize}
          </p>
          ${r.interceptReason ? `<p style="font-size:11px;color:#dc2626;margin:2px 0 0;">拦截原因：${r.interceptReason}</p>` : ''}
          <p style="font-size:10px;color:#98a2b3;margin:2px 0 0;">trace: ${r.traceId} · 回执号：${r.receiptId}</p>
        </div>
      `).join('')}
    </div>
  ` : '';
  const firstPolicy = policyCorpus[0];
  const firstPolicyQa = policyQaHitRecords[firstPolicy?.policyId] || [];
  const policyLinkageHtml = firstPolicy ? `
    <div class="depth-section">
      <h3>🔗 政策语料联动 · 关联事项 · 关联部门</h3>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
        ${firstPolicy.linkedItems.map(code => `<span style="padding:4px 10px;background:#dbeafe;color:#1e40af;border-radius:12px;font-size:11px;">事项：${code}</span>`).join('')}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
        ${firstPolicy.linkedDepts.map(dept => `<span style="padding:4px 10px;background:#dcfce7;color:#166534;border-radius:12px;font-size:11px;">部门：${dept}</span>`).join('')}
      </div>
    </div>
  ` : '';
  const qaHitHtml = firstPolicyQa.length > 0 ? `
    <div class="depth-section">
      <h3>💬 问答命中记录 · ${firstPolicyQa.length}条</h3>
      ${firstPolicyQa.map(qa => `
        <div style="padding:8px 10px;border:1px solid #e0e7ff;border-radius:6px;margin-top:6px;background:#eef2ff;">
          <p style="font-size:12px;color:#3730a3;font-weight:600;">Q: ${qa.question}</p>
          <p style="font-size:11px;color:#667085;margin:4px 0 0;">命中意图：${qa.hitIntent} · 置信度：${qa.hitConfidence}% · 来源：${qa.answerSource}</p>
          <p style="font-size:11px;color:#98a2b3;margin:2px 0 0;">${qa.askedAt} · 用户：${qa.userId}${qa.applicationId ? ` · 关联办件：${qa.applicationId}` : ''} · ${qa.helpful ? '✅ 有帮助' : '❌ 无帮助'}</p>
        </div>
      `).join('')}
    </div>
  ` : '';
  const firstBottleneck = bottleneckReports[0];
  const bottleneckLinkageHtml = firstBottleneck ? `
    <div class="depth-section" style="background:linear-gradient(135deg,#fef3c7 0%,#fce7f3 100%);border:1px solid #fcd34d;">
      <h3 style="color:#92400e;">🔗 堵点联动 · 关联办件与部门处置</h3>
      <div style="margin-top:6px;">
        <small style="color:#64748b;font-weight:600;">📋 关联办件：</small>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
          ${firstBottleneck.linkedApplications.map(id => `<span style="padding:3px 8px;background:#fef3c7;color:#92400e;border-radius:4px;font-size:11px;border:1px solid #fcd34d;">${id}</span>`).join('')}
        </div>
      </div>
      <div style="margin-top:8px;">
        <small style="color:#64748b;font-weight:600;">🏢 部门处置记录：</small>
        ${firstBottleneck.deptDisposalRecords.map(d => `
          <div style="padding:6px 8px;background:white;border-radius:4px;margin-top:4px;border-left:3px solid #f59e0b;">
            <strong style="font-size:12px;color:#172033;">${d.dept}</strong>
            <p style="font-size:11px;color:#667085;margin:2px 0 0;">处置 ${d.disposalCount} 件 · 平均耗时 ${d.avgDisposalHours} 小时 · 责任人：${d.responsiblePerson} · 最近：${d.lastDisposalAt}</p>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';
  const firstBottleneckReview = firstBottleneck?.reviewDetail;
  const firstAttribution = firstBottleneck ? (bottleneckAttribution[firstBottleneck.item] || null) : null;
  const bottleneckNodeDetailHtml = firstBottleneckReview && firstAttribution ? `
    <div class="depth-section" style="background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);border:1px solid #fcd34d;">
      <h3 style="color:#92400e;">🎯 堵点节点级归因明细</h3>
      <div style="margin-top:8px;">
        <div style="padding:8px 10px;background:white;border-radius:6px;border-left:4px solid #f59e0b;">
          <small style="color:#64748b;">堵点节点</small>
          <p style="font-weight:700;color:#92400e;margin-top:2px;font-size:14px;">${firstBottleneck.bottleneck}</p>
          <p style="font-size:11px;color:#667085;margin-top:2px;">所属事项：${firstBottleneck.item} · 责任部门：${firstBottleneck.department}</p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:8px;">
        <div style="padding:8px;background:white;border-radius:6px;border:1px solid #fcd34d;">
          <small style="color:#dc2626;font-weight:600;">🔴 主要原因</small>
          <p style="font-size:12px;color:#172033;margin-top:4px;font-weight:500;">${firstAttribution.primaryCause}</p>
        </div>
        <div style="padding:8px;background:white;border-radius:6px;border:1px solid #fcd34d;">
          <small style="color:#ea580c;font-weight:600;">🟠 次要原因</small>
          <p style="font-size:12px;color:#172033;margin-top:4px;font-weight:500;">${firstAttribution.secondaryCause}</p>
        </div>
      </div>
      <div style="margin-top:8px;padding:8px 10px;background:white;border-radius:6px;border:1px solid #fde68a;">
        <small style="color:#92400e;font-weight:600;">📊 相关性分析</small>
        <div style="margin-top:6px;display:flex;flex-direction:column;gap:4px;">
          ${Object.entries(firstAttribution.correlation).map(([key, val]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;">
              <span style="color:#667085;">${key === 'materialMissingRate' ? '材料缺失率' : key === 'departmentCount' ? '涉及部门数' : key}</span>
              <span style="font-family:monospace;font-weight:600;color:${val.significant ? '#dc2626' : '#6b7280'};">
                皮尔逊 r=${val.pearson} · p=${val.pValue}${val.significant ? ' ✱' : ''}
              </span>
            </div>
          `).join('')}
        </div>
        <p style="font-size:11px;color:#92400e;margin-top:6px;font-style:italic;">${firstAttribution.correlation[Object.keys(firstAttribution.correlation)[0]]?.description || ''}</p>
      </div>
      <div style="margin-top:8px;">
        <small style="color:#92400e;font-weight:600;">📁 典型案例 · 落到办件节点/处置记录/责任部门</small>
        ${firstBottleneckReview.sampleCases.map((c, i) => `
          <div style="padding:8px 10px;background:white;border-radius:6px;margin-top:6px;border-left:3px solid #f59e0b;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong style="font-size:12px;color:#172033;">${c.caseId} · ${c.applicant}</strong>
              <span style="font-size:10px;padding:2px 6px;border-radius:10px;background:#fef3c7;color:#92400e;">关联办件：${c.applicationId}</span>
            </div>
            <p style="font-size:11px;color:#667085;margin:4px 0 0;">问题：${c.issue}</p>
            <p style="font-size:11px;color:#166534;margin:2px 0 0;">处置：${c.resolution}</p>
            <p style="font-size:10px;color:#98a2b3;margin:2px 0 0;">发生时间：${c.occurredAt}</p>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:8px;">
        <small style="color:#92400e;font-weight:600;">💡 改进建议</small>
        <ul style="margin:6px 0 0;padding-left:20px;font-size:12px;color:#475467;">
          ${firstAttribution.improvementSuggestions.map(s => `<li style="margin-bottom:2px;">${s}</li>`).join('')}
        </ul>
      </div>
    </div>
  ` : '';
  const firstBottleneckDept = bottleneckDeptItemDetails[bottleneckReports[0]?.item] || null;
  const bottleneckDeptDetailHtml = firstBottleneckDept ? `
    <div class="depth-section" style="background:#faf5ff;border:1px solid #ddd6fe;">
      <h3 style="color:#5b21b6;">🏢 部门处置明细 · ${firstBottleneckDept.departmentBreakdown.length}个部门</h3>
      <div class="detail-grid">
        ${firstBottleneckDept.departmentBreakdown.map(dept => `
          <div class="detail-item" style="border-left:3px solid #8b5cf6;">
            <strong>${dept.dept}</strong>
            <span style="font-size:11px;color:#6b21a8;">责任人：${dept.responsiblePerson}</span>
            <div style="font-size:11px;color:#475467;margin-top:4px;">
              处置 <strong>${dept.disposalCount}</strong> 件 · 平均耗时 <strong style="color:#92400e;">${dept.avgDisposalHours}h</strong>
            </div>
            <p style="font-size:10px;color:#6b7280;margin-top:2px;">堵点原因：${dept.bottleneckReason}</p>
            <p style="font-size:10px;color:#065f46;margin-top:2px;">💡 ${dept.improvement}</p>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:8px;">
        <small style="font-weight:600;color:#4c1d95;">各节点耗时分布：</small>
        <div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;">
          ${Object.entries(firstBottleneckDept.nodeBottleneck).map(([node, info]) => `
            <div style="flex:1;min-width:100px;padding:6px 8px;background:white;border:1px solid #e9d5ff;border-radius:4px;">
              <div style="font-size:11px;font-weight:600;color:#581c87;">${node}</div>
              <div style="font-size:10px;color:#6b7280;margin-top:2px;">平均 ${info.avgHours}h · ${info.volume === '高' ? '<span style="color:#dc2626;">' : info.volume === '中' ? '<span style="color:#f59e0b;">' : '<span style="color:#22c55e;">'}${info.volume}</span>量</div>
              <div style="font-size:9px;color:#9ca3af;margin-top:1px;">${info.bottleneck}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  ` : '';

  const firstAppId = apps[0]?.id || 'app-20260614-001';
  const firstApprovals = firstFlow.approvalOpinions;
  const workflowActionsHtml = firstFlow.workflowActions ? `
    <div class="depth-section" style="background:linear-gradient(135deg,#eff6ff 0%,#ecfeff 100%);border:1px solid #bfdbfe;">
      <h3 style="color:#1e40af;">🎯 业务动作 · 可操作按钮</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
        ${firstFlow.workflowActions.available.map(act => `
          <button class="${act.type === 'primary' ? '' : act.type === 'warn' ? '' : act.type === 'danger' ? '' : 'secondary'}" 
                  style="${act.type === 'primary' ? 'background:#2563eb;' : act.type === 'warn' ? 'background:#d97706;' : act.type === 'danger' ? 'background:#dc2626;' : 'background:#64748b;'} color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;"
                  onclick="alert('【模拟操作】${act.label}\\n\\n${act.tip || ''}')" title="${act.tip || ''}">
            ${act.label}
          </button>
        `).join('')}
      </div>
      ${firstFlow.workflowActions.disabled && firstFlow.workflowActions.disabled.length > 0 ? `
        <div style="margin-top:10px;padding-top:10px;border-top:1px dashed #93c5fd;">
          <small style="color:#647485;font-weight:600;">🔒 暂不可用操作：</small>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">
            ${firstFlow.workflowActions.disabled.map(act => `
              <span style="padding:6px 12px;background:#f1f5f9;color:#94a3b8;border-radius:6px;font-size:12px;border:1px dashed #cbd5e1;" title="${act.reason}">
                ${act.label} · <small>${act.reason}</small>
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  ` : '';
  const operationLogsHtml = firstFlow.operationLogs && firstFlow.operationLogs.length > 0 ? `
    <div class="depth-section">
      <h3>📋 操作日志 · ${firstFlow.operationLogs.length}条记录</h3>
      <div style="max-height:300px;overflow-y:auto;">
        ${firstFlow.operationLogs.map((log, i) => `
          <div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid #f0f2f5;${i === 0 ? 'border-top:1px solid #f0f2f5;' : ''}">
            <div style="width:4px;background:${log.result === 'SUCCESS' ? '#10b981' : log.result === 'REJECT' ? '#ef4444' : log.result === 'FALLBACK' ? '#f59e0b' : log.result === 'WARNING' ? '#f59e0b' : log.result === 'PENDING' ? '#3b82f6' : '#6b7280'};border-radius:2px;flex-shrink:0;"></div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong style="font-size:13px;color:#172033;">${log.action}</strong>
                <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${log.result === 'SUCCESS' ? '#dcfce7' : log.result === 'REJECT' ? '#fee2e2' : log.result === 'WARNING' ? '#fef3c7' : log.result === 'PENDING' ? '#dbeafe' : '#f1f5f9'};color:${log.result === 'SUCCESS' ? '#166534' : log.result === 'REJECT' ? '#991b1b' : log.result === 'WARNING' ? '#92400e' : log.result === 'PENDING' ? '#1e40af' : '#475569'};">${log.result}</span>
              </div>
              <div style="font-size:12px;color:#667085;margin-top:2px;">
                <span style="font-weight:500;color:#344054;">${log.operator}</span>
                <small style="color:#98a2b3;">（${log.operatorType === 'APPLICANT' ? '申请人' : log.operatorType === 'STAFF' ? '工作人员' : log.operatorType === 'SUPERVISOR' ? '督办人' : '系统'}）</small>
                · ${log.operatedAt} · 节点：${log.node}
              </div>
              <p style="font-size:12px;color:#475467;margin:4px 0 0;">${log.note}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const restartRecordsHtml = restartRecords[firstApplicationId] && restartRecords[firstApplicationId].length > 0 ? `
    <div class="depth-section" style="background:#fffbeb;border:1px solid #fcd34d;">
      <h3 style="color:#92400e;">🔄 重启办件记录 · ${restartRecords[firstApplicationId].length}条</h3>
      ${restartRecords[firstApplicationId].map(r => `
        <div style="padding:10px;background:white;border-radius:6px;border:1px solid #fde68a;margin-top:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="color:#92400e;">${r.restartType === 'REVIEW_REOPEN' ? '复审重启' : '纠错重启'}</strong>
            <span class="badge ${r.currentStatus === 'PENDING' ? 'warn' : ''}" style="font-size:11px;">${r.currentStatus === 'PENDING' ? '待审核' : '已重启'}</span>
          </div>
          <p style="font-size:12px;color:#475467;margin:6px 0 0;"><strong>重启原因：</strong>${r.restartReason}</p>
          <div class="detail-grid" style="margin-top:8px;">
            <div class="detail-item" style="border-left:none;"><strong>发起人</strong><span>${r.restartedBy}</span></div>
            <div class="detail-item" style="border-left:none;"><strong>发起部门</strong><span>${r.restartDept}</span></div>
            <div class="detail-item" style="border-left:none;"><strong>发起时间</strong><span>${r.restartedAt}</span></div>
            <div class="detail-item" style="border-left:none;"><strong>回退至节点</strong><span style="color:#b54708;">${r.rollbackToNode === 'approval' ? '部门协同审批' : r.rollbackToNode}</span></div>
          </div>
          ${r.auditRequired ? `<p style="font-size:12px;color:#b45309;margin-top:6px;padding:6px 8px;background:#fef3c7;border-radius:4px;">📝 ${r.auditNote}</p>` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';

  const printRecordsHtml = printRecords[firstApplicationId] && printRecords[firstApplicationId].length > 0 ? `
    <div class="depth-section">
      <h3>🖨️ 证照打印记录 · ${printRecords[firstApplicationId].length}次</h3>
      ${printRecords[firstApplicationId].map(p => `
        <div style="padding:10px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;margin-top:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong>${p.printType === 'CERTIFICATE_COPY' ? '证照副本打印' : p.printType}</strong>
            <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:#dcfce7;color:#166534;">${p.status === 'SUCCESS' ? '打印成功' : p.status}</span>
          </div>
          <div class="detail-grid" style="margin-top:8px;">
            <div class="detail-item" style="border-left:none;"><strong>打印渠道</strong><span>${p.printChannel === 'SELF_SERVICE_TERMINAL' ? '自助终端' : p.printChannel}</span></div>
            <div class="detail-item" style="border-left:none;"><strong>打印地点</strong><span style="font-size:11px;">${p.printLocation}</span></div>
            <div class="detail-item" style="border-left:none;"><strong>打印人</strong><span>${p.printedBy}</span></div>
            <div class="detail-item" style="border-left:none;"><strong>打印时间</strong><span>${p.printedAt}</span></div>
            <div class="detail-item" style="border-left:none;"><strong>回执编号</strong><span style="font-family:monospace;font-size:11px;color:#1570EF;">${p.receiptNumber}</span></div>
            <div class="detail-item" style="border-left:none;"><strong>验证码</strong><span style="font-family:monospace;font-size:11px;">${p.verificationCode}</span></div>
          </div>
          <div style="margin-top:6px;font-size:11px;color:#667085;">
            ${p.paperSize} · ${p.colorMode === 'COLOR' ? '彩色' : '黑白'} · ${p.hasAntiCounterfeit ? '含防伪标识' : ''} · 有效期 ${p.validDays} 天
          </div>
        </div>
      `).join('')}
    </div>
  ` : '';

  const printWatermarkHtml = printWatermarkRules['CERTIFICATE_COPY'] ? `
    <div class="depth-section" style="background:#f0f9ff;border:1px solid #bae6fd;">
      <h3 style="color:#075985;">💧 打印水印规则</h3>
      <div style="padding:10px;background:white;border-radius:6px;border:1px solid #e0f2fe;margin-top:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong style="color:#0369a1;">${printWatermarkRules['CERTIFICATE_COPY'].watermarkType === 'FULL_PAGE_DIAGONAL' ? '全页面斜向水印' : printWatermarkRules['CERTIFICATE_COPY'].watermarkType}</strong>
          <span class="badge" style="font-size:11px;">${printWatermarkRules['CERTIFICATE_COPY'].watermarkEnabled ? '已启用' : '未启用'}</span>
        </div>
        <p style="font-size:12px;color:#475467;margin:6px 0 0;">水印内容：${printWatermarkRules['CERTIFICATE_COPY'].watermarkContent}</p>
        <div class="detail-grid" style="margin-top:8px;">
          <div class="detail-item" style="border-left:none;"><strong>字号</strong><span>${printWatermarkRules['CERTIFICATE_COPY'].fontSize}px</span></div>
          <div class="detail-item" style="border-left:none;"><strong>透明度</strong><span>${printWatermarkRules['CERTIFICATE_COPY'].opacity * 100}%</span></div>
          <div class="detail-item" style="border-left:none;"><strong>角度</strong><span>${printWatermarkRules['CERTIFICATE_COPY'].angle}°</span></div>
          <div class="detail-item" style="border-left:none;"><strong>重印限制</strong><span>${printWatermarkRules['CERTIFICATE_COPY'].reprintLimit}次</span></div>
        </div>
        <div style="margin-top:6px;">
          <small style="font-weight:600;color:#344054;">附加标识：</small>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:2px;">
            ${printWatermarkRules['CERTIFICATE_COPY'].additionalMarkings.map(m => `<span style="font-size:10px;padding:2px 6px;background:#f0f9ff;border-radius:10px;color:#0369a1;">${m}</span>`).join('')}
          </div>
        </div>
        <p style="font-size:10px;color:#98a2b3;margin-top:8px;text-align:right;">依据：${printWatermarkRules['CERTIFICATE_COPY'].ruleSource}</p>
      </div>
    </div>
  ` : '';

  const auditReviewResultHtml = auditReviewResults[firstApplicationId] ? `
    <div class="depth-section" style="background:#f0fdf4;border:1px solid #bbf7d0;">
      <h3 style="color:#166534;">✅ 审计复查结果 · ${auditReviewResults[firstApplicationId].auditType === 'FULL_PROCESS_AUDIT' ? '全流程审计' : '专项审计'}</h3>
      <div style="display:flex;gap:12px;align-items:center;margin-top:8px;">
        <div style="flex:1;">
          <div style="font-size:12px;color:#667085;">审计结论</div>
          <div style="font-size:18px;font-weight:700;color:${auditReviewResults[firstApplicationId].auditConclusion === 'PASS' ? '#16a34a' : '#ca8a04'};">${auditReviewResults[firstApplicationId].auditConclusion === 'PASS' ? '通过' : '待确认'}</div>
        </div>
        ${auditReviewResults[firstApplicationId].overallScore > 0 ? `
          <div style="text-align:right;">
            <div style="font-size:12px;color:#667085;">综合评分</div>
            <div style="font-size:24px;font-weight:700;color:#15803d;">${auditReviewResults[firstApplicationId].overallScore}<small style="font-size:12px;font-weight:400;color:#667085;">/100</small></div>
          </div>
        ` : ''}
      </div>
      <div style="margin-top:8px;">
        <small style="font-weight:600;color:#344054;">审计项明细：</small>
        ${auditReviewResults[firstApplicationId].auditItems.map(item => `
          <div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px;">
            <span style="color:${item.result === 'PASS' ? '#10b981' : '#f59e0b'};font-size:14px;">${item.result === 'PASS' ? '✓' : '○'}</span>
            <span style="color:#344054;">${item.item}</span>
            <small style="color:#98a2b3;">${item.note}</small>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:8px;padding:8px;background:#dcfce7;border-radius:6px;font-size:12px;color:#166534;">
        <strong>审计意见：</strong>${auditReviewResults[firstApplicationId].reviewRemark}
      </div>
      <div style="margin-top:6px;font-size:11px;color:#667085;text-align:right;">
        审计人：${auditReviewResults[firstApplicationId].auditor}（${auditReviewResults[firstApplicationId].auditorDept}）· ${auditReviewResults[firstApplicationId].auditedAt}
      </div>
    </div>
  ` : '';

  const logLiabilityHtml = logLiabilityChain[firstApplicationId] ? `
    <div class="depth-section" style="background:#fafafa;border:1px solid #d4d4d4;">
      <h3 style="color:#525252;">⚖️ 日志追责链路 · ${logLiabilityChain[firstApplicationId].totalLiabilityNodes}个责任节点</h3>
      <p style="font-size:12px;color:#525252;margin-top:4px;">责任原则：${logLiabilityChain[firstApplicationId].liabilityPrinciple}</p>
      <div style="margin-top:8px;">
        ${logLiabilityChain[firstApplicationId].liabilityChain.map(node => `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:white;border:1px solid #e5e5e5;border-radius:4px;margin-bottom:4px;">
            <div style="width:8px;height:8px;border-radius:50%;background:${node.riskLevel === 'HIGH' ? '#dc2626' : node.riskLevel === 'MEDIUM' ? '#f59e0b' : '#22c55e'};flex-shrink:0;"></div>
            <div style="flex:1;">
              <strong style="font-size:12px;color:#172033;">${node.node}</strong>
              <small style="color:#667085;margin-left:8px;">${node.responsible}</small>
            </div>
            <span style="font-size:10px;color:${node.riskLevel === 'HIGH' ? '#dc2626' : node.riskLevel === 'MEDIUM' ? '#f59e0b' : '#16a34a'};">${node.liability}</span>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:6px;text-align:right;font-size:11px;color:#737373;">
        高风险节点 ${logLiabilityChain[firstApplicationId].highRiskCount} 个 · 全链路可追溯
      </div>
    </div>
  ` : '';

  const approvalOpinionsHtml = firstApprovals.length > 0 ? `
    <div class="depth-section">
      <h3>部门审批意见 · ${firstApprovals.filter(o => o.status === 'APPROVED').length}/${firstApprovals.length} 已通过</h3>
      <div class="detail-grid">
        ${firstApprovals.map(op => `
          <div class="detail-item" style="${op.status === 'PENDING' ? 'border-left: 3px solid #f59e0b;' : 'border-left: 3px solid #10b981;'}">
            <strong>${op.dept}</strong>
            <span>${op.handler} · ${op.signedAt || '待签署'}</span>
            <p style="margin:4px 0 0;font-size:12px;color:#475467;">${op.opinion}</p>
            <span class="badge ${op.status === 'APPROVED' ? '' : 'warn'}" style="margin-top:6px;">${op.status === 'APPROVED' ? '已通过' : '待审批'}</span>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const supplementHtml = firstFlow.supplementRecords && firstFlow.supplementRecords.length > 0 ? `
    <div class="depth-section">
      <h3>材料补正记录 · 共 ${firstFlow.supplementRecords.length} 条</h3>
      ${firstFlow.supplementRecords.map(s => `
        <div class="detail-item" style="border-left: 3px solid #f59e0b;">
          <strong>${s.material}：${s.issue}</strong>
          <div class="detail-grid" style="margin-top:8px;">
            <div class="detail-item" style="border-left:none;"><strong>发起部门</strong><span>${s.initiatorDept}</span></div>
            <div class="detail-item" style="border-left:none;"><strong>发起人</strong><span>${s.initiatedBy}</span></div>
            <div class="detail-item" style="border-left:none;"><strong>发起时间</strong><span>${s.initiatedAt}</span></div>
            <div class="detail-item" style="border-left:none;"><strong>补正时限</strong><span style="color:#b54708;">${s.deadline}</span></div>
            <div class="detail-item" style="border-left:none;"><strong>当前状态</strong><span>${s.status === 'PENDING_SUBMIT' ? '<span class="badge warn">待申请人提交</span>' : '<span class="badge">已完成</span>'}</span></div>
            <div class="detail-item" style="border-left:none;"><strong>复核状态</strong><span>${s.recheckedAt ? `已复核·${s.recheckedBy}·${s.recheckResult}` : '<span class="badge warn">待复核</span>'}</span></div>
          </div>
          <p style="margin-top:8px;font-size:12px;color:#475467;background:#fff7ed;padding:6px 8px;border-radius:4px;">
            <strong>节点回退轨迹：</strong>${s.nodeRollback}
          </p>
          <ul class="timeline-list" style="margin-top:6px;">
            ${s.rollbackHistory.map(r => `
              <li class="${r.triggeredAt ? 'done' : 'pending'}" style="font-size:12px;">
                <strong>${r.from} → ${r.to}</strong>
                <small>${r.triggeredAt || '待触发'} · ${r.reason}</small>
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  ` : '';

  const responsibilityChainHtml = `
    <div class="depth-section">
      <h3>全节点责任链 · 端到端可追溯（${firstFlow.fullResponsibilityChain.length}个节点）</h3>
      <ul class="timeline-list">
        ${firstFlow.fullResponsibilityChain.map(node => `
          <li class="${node.status === 'DONE' ? 'done' : node.status === 'RUNNING' ? 'pending' : ''}" style="${node.status === 'WAITING' ? 'opacity:0.5;' : ''}">
            <strong style="color:#172033;">${node.nodeLabel}</strong>
            <small style="color:#667085;display:block;">
              ${node.startedAt}${node.finishedAt ? ` ~ ${node.finishedAt}` : ' · 进行中'}
              · 责任人：<span style="color:#1570EF;font-weight:600;">${node.responsiblePerson}</span>
              · 操作：${node.operation || '-'}
            </small>
            ${node.abnormal ? `<p style="margin:4px 0 0;font-size:12px;color:#b54708;background:#fff7ed;padding:4px 8px;border-radius:4px;">⚠️ 异常[${node.abnormal.type}]：${node.abnormal.description}</p>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  `;

  const abnormalChainHtml = firstFlow.abnormalDisposalChain.length > 0 ? `
    <div class="depth-section">
      <h3>异常处置链 · 共 ${firstFlow.abnormalDisposalChain.length} 条异常</h3>
      ${firstFlow.abnormalDisposalChain.map(a => `
        <div class="detail-item" style="border-left: 3px solid #dc2626;">
          <strong>${a.nodeLabel} · ${a.abnormalType}</strong>
          <div class="detail-grid" style="margin-top:8px;">
            <div class="detail-item" style="border-left:none;"><strong>异常描述</strong><span>${a.abnormalDescription}</span></div>
            <div class="detail-item" style="border-left:none;"><strong>触发时间</strong><span>${a.triggerTime}</span></div>
            ${a.disposalPerson ? `<div class="detail-item" style="border-left:none;"><strong>处置责任人</strong><span style="color:#b54708;font-weight:600;">${a.disposalPerson}</span></div>` : ''}
            ${a.disposalDeadline ? `<div class="detail-item" style="border-left:none;"><strong>处置时限</strong><span style="color:#b54708;font-weight:600;">${a.disposalDeadline}</span></div>` : ''}
            ${a.escalationPath ? `<div class="detail-item" style="border-left:none;"><strong>升级路径</strong><span style="font-size:12px;">${a.escalationPath}</span></div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  ` : '';

  const materialHtml = firstFlow.materialVerification.length > 0 ? `
    <div class="depth-section">
      <h3>材料核验结论 · 共 ${firstFlow.materialVerification.length} 项</h3>
      <div class="detail-grid">
        ${firstFlow.materialVerification.map(m => `
          <div class="detail-item" style="${m.verified ? 'border-left: 3px solid #10b981;' : 'border-left: 3px solid #f59e0b;'}">
            <div style="display:flex;align-items:center;gap:6px;">
              <strong>${m.materialName}</strong>
              ${m.verified ? '<span class="badge">已验真</span>' : '<span class="badge warn">待补正</span>'}
            </div>
            <span style="font-size:12px;color:#667085;">核验方式：${m.verifyMethod}</span>
            <p style="margin:4px 0 0;font-size:12px;color:${m.verified ? '#137333' : '#9a5b00'};">${m.verifyResult}</p>
            <small style="color:#98a2b3;">核验时间：${m.verifiedAt}</small>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const certHtml = thirdFlow.certificateDetail ? `
    <div class="depth-section">
      <h3>电子证照签发确认 · ${thirdAppId}</h3>
      <div style="margin-bottom:8px;padding:6px 10px;background:#ecfdf3;border-radius:4px;font-size:12px;color:#137333;font-weight:600;">
        ✅ 展示条件：四部门会签全部通过 + 材料全部验真 + 无待补正项
      </div>
      <div class="detail-grid">
        <div class="detail-item"><strong>证照编号</strong><span>${thirdFlow.certificateDetail.certificateNo}</span></div>
        <div class="detail-item"><strong>证照类型</strong><span>${thirdFlow.certificateDetail.certificateType}</span></div>
        <div class="detail-item"><strong>签发机关</strong><span>${thirdFlow.certificateDetail.issuer}</span></div>
        <div class="detail-item"><strong>签发时间</strong><span>${thirdFlow.certificateDetail.issuedAt}</span></div>
        <div class="detail-item"><strong>签发确认人</strong><span>${thirdFlow.certificateDetail.confirmedBy}</span></div>
        <div class="detail-item"><strong>确认时间</strong><span>${thirdFlow.certificateDetail.confirmedAt}</span></div>
        <div class="detail-item"><strong>有效期</strong><span>${thirdFlow.certificateDetail.validFrom} ~ ${thirdFlow.certificateDetail.validTo}</span></div>
        <div class="detail-item"><strong>印章/二维码</strong><span>电子印章已加盖 · 核验码已生成</span></div>
      </div>
    </div>
  ` : '';

  const pushReceiptHtml = thirdFlow.resultPushReceipt ? `
    <div class="depth-section">
      <h3>结果推送与送达回执 · ${thirdAppId}</h3>
      <div style="margin-bottom:8px;padding:6px 10px;background:#ecfdf3;border-radius:4px;font-size:12px;color:#137333;font-weight:600;">
        ✅ 展示条件：证照已签发确认
      </div>
      <div class="detail-grid">
        <div class="detail-item"><strong>推送渠道</strong><span>短信 / 微信 / 小程序</span></div>
        <div class="detail-item"><strong>推送时间</strong><span>${thirdFlow.resultPushReceipt.pushedAt}</span></div>
        <div class="detail-item"><strong>送达回执号</strong><span>${thirdFlow.resultPushReceipt.deliveryReceiptNo}</span></div>
        <div class="detail-item"><strong>申请人确认</strong><span>${thirdFlow.resultPushReceipt.applicantReceived ? '已确认' : '待确认'}</span></div>
        <div class="detail-item"><strong>确认时间</strong><span>${thirdFlow.resultPushReceipt.receiptConfirmedAt || '-'}</span></div>
        <div class="detail-item"><strong>重试次数</strong><span>${thirdFlow.resultPushReceipt.retryAttempts} 次</span></div>
        <div class="detail-item"><strong>短信状态</strong><span>${thirdFlow.resultPushReceipt.smsStatus === 'DELIVERED' ? '已送达' : '发送中'}</span></div>
        <div class="detail-item"><strong>微信状态</strong><span>${thirdFlow.resultPushReceipt.wechatStatus === 'READ' ? '已读' : '已送达'}</span></div>
      </div>
    </div>
  ` : '';

  const firstBranches = firstFlow.branchRecords;
  const branchRecordsHtml = firstBranches.length > 0 ? `
    <div class="depth-section">
      <h3>办件分支追溯 · 共 ${firstBranches.length} 条</h3>
      <ul class="timeline-list">
        ${firstBranches.map(b => `
          <li class="${b.resolved ? 'done' : 'pending'}">
            <strong style="color:#172033;">${b.label}</strong>
            <small style="color:#667085;display:block;">${b.triggeredAt} · ${b.triggeredBy}</small>
            <p style="margin:4px 0 0;font-size:13px;color:#475467;">${b.description}</p>
            <span class="badge ${b.resolved ? '' : 'warn'}" style="margin-top:4px;">${b.resolved ? '已完成' : '进行中'}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';

  const timeoutAppId = 'app-20260614-002';
  const timeoutFlow = applicationFlow(timeoutAppId);
  const disposal = timeoutFlow.disposalPerson;
  const disposalHtml = disposal ? `
    <div class="depth-section">
      <h3>处置责任人</h3>
      <div class="detail-grid">
        <div class="detail-item"><strong>处置人</strong><span>${disposal.name}</span></div>
        <div class="detail-item"><strong>所属部门</strong><span>${disposal.department}</span></div>
        <div class="detail-item"><strong>分派时间</strong><span>${disposal.assignedAt}</span></div>
        <div class="detail-item"><strong>处置时限</strong><span style="color:#b54708;font-weight:600;">${disposal.disposalDeadline}（剩${Math.floor(disposal.countdownMinutes / 60)}小时）</span></div>
        <div class="detail-item"><strong>职责</strong><span>${disposal.responsibility}</span></div>
        <div class="detail-item"><strong>升级路径</strong><span style="font-size:12px;">${disposal.escalationPath}</span></div>
      </div>
    </div>
  ` : '';

  const timeoutResponsibilityChainHtml = `
    <div class="depth-section">
      <h3>超时办件全责任链 · ${timeoutAppId}</h3>
      <ul class="timeline-list">
        ${timeoutFlow.fullResponsibilityChain.map(node => `
          <li class="${node.status === 'DONE' ? 'done' : node.status === 'RUNNING' ? 'pending' : ''}" style="${node.status === 'WAITING' ? 'opacity:0.5;' : ''}">
            <strong style="color:#172033;">${node.nodeLabel}</strong>
            <small style="color:#667085;display:block;">责任人：<span style="color:#1570EF;font-weight:600;">${node.responsiblePerson}</span> · ${node.operation || '-'}</small>
            ${node.abnormal ? `<p style="margin:4px 0 0;font-size:12px;color:#b54708;background:#fff7ed;padding:4px 8px;border-radius:4px;">⚠️ 异常：${node.abnormal.description}</p>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  `;

  const supervs = timeoutFlow.supervisionRecords;
  const supervisionHtml = supervs.length > 0 ? `
    <div class="depth-section">
      <h3>部门催办记录 · 共 ${supervs.length} 条</h3>
      <ul class="timeline-list">
        ${supervs.map(s => `
          <li class="${s.responseStatus === 'RESPONDED' ? 'done' : 'pending'}">
            <strong style="color:#172033;">${s.supervisor}（${s.supervisorDept}）</strong>
            <small style="color:#667085;display:block;">${s.supervisedAt} · ${s.supervisionLevel === 'URGENT' ? '紧急督办' : '常规催办'}</small>
            <p style="margin:4px 0 0;font-size:13px;color:#475467;">${s.content}</p>
            ${s.responseStatus === 'RESPONDED' ? `<p style="margin:6px 0 0;font-size:12px;color:#137333;">回复：${s.responseContent}（${s.responder}）</p>` : '<p style="margin:6px 0 0;font-size:12px;color:#9a5b00;">等待回复中...</p>'}
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';

  const notifRetry = notificationRetryTraces['app-20260614-001'];
  const notifRetryHtml = notifRetry ? `
    <div class="depth-section">
      <h3>通知失败重发追踪</h3>
      <div class="detail-grid">
        <div class="detail-item"><strong>失败次数</strong><span>${notifRetry.failedCount} 次</span></div>
        <div class="detail-item"><strong>重发次数</strong><span>${notifRetry.retryCount} 次</span></div>
        <div class="detail-item"><strong>重发成功</strong><span>${notifRetry.retrySuccessCount} 次</span></div>
        <div class="detail-item"><strong>待重发</strong><span>${notifRetry.pendingRetry ? '是' : '否'}</span></div>
      </div>
    </div>
  ` : '';

  const deliveryTrace = deliveryTraces['app-20260614-003'];
  const deliveryTraceHtml = deliveryTrace ? `
    <div class="depth-section">
      <h3>三渠道送达明细</h3>
      <div class="detail-grid">
        <div class="detail-item"><strong>短信</strong><span>发送${deliveryTrace.sms.sent} · 送达${deliveryTrace.sms.delivered} · 已读${deliveryTrace.sms.read}</span></div>
        <div class="detail-item"><strong>微信</strong><span>发送${deliveryTrace.wechat.sent} · 送达${deliveryTrace.wechat.delivered} · 已读${deliveryTrace.wechat.read}</span></div>
        <div class="detail-item"><strong>小程序</strong><span>发送${deliveryTrace.miniProgram.sent} · 送达${deliveryTrace.miniProgram.delivered} · 已读${deliveryTrace.miniProgram.read}</span></div>
      </div>
    </div>
  ` : '';

  const applicantConf = applicantConfirmations['app-20260614-003'];
  const applicantConfHtml = applicantConf ? `
    <div class="depth-section">
      <h3>申请人确认</h3>
      <div class="detail-grid">
        <div class="detail-item"><strong>确认状态</strong><span>${applicantConf.confirmed ? '已确认' : '待确认'}</span></div>
        <div class="detail-item"><strong>确认时间</strong><span>${applicantConf.confirmedAt || '-'}</span></div>
        <div class="detail-item"><strong>确认方式</strong><span>${applicantConf.confirmMethod === 'miniProgram' ? '小程序' : applicantConf.confirmMethod || '-'}</span></div>
        <div class="detail-item"><strong>回执编号</strong><span>${applicantConf.receiptNo || '-'}</span></div>
      </div>
      ${applicantConf.confirmed ? `<p style="margin-top:8px;font-size:12px;color:#475467;">确认内容：${applicantConf.confirmationContent}</p>` : ''}
    </div>
  ` : '';

  const firstNotice = timeoutAuditRecords[0];
  const noticeDisposal = firstNotice?.disposalRecordId ? notificationDisposalRecords[firstNotice.disposalRecordId] : null;
  const notificationLinkageHtml = firstNotice ? `
    <div class="depth-section">
      <h3>🔗 通知记录联动 · 节点/部门/处置</h3>
      <div class="detail-grid" style="margin-top:8px;">
        <div class="detail-item"><strong>通知类型</strong><span>${firstNotice.notificationType === 'SUPPLEMENT_NOTICE' ? '材料补正通知' : firstNotice.notificationType === 'TIMEOUT_WARNING' ? '超时预警通知' : firstNotice.notificationType === 'RESULT_NOTICE' ? '结果通知' : firstNotice.notificationType === 'MATERIAL_RECEIVED' ? '材料接收通知' : firstNotice.notificationType}</span></div>
        <div class="detail-item"><strong>紧急程度</strong><span style="color:${firstNotice.urgencyLevel === 'HIGH' ? '#dc2626' : firstNotice.urgencyLevel === 'NORMAL' ? '#f59e0b' : '#6b7280'};font-weight:600;">${firstNotice.urgencyLevel === 'HIGH' ? '🔴 紧急' : firstNotice.urgencyLevel === 'NORMAL' ? '🟡 一般' : '🟢 低'}</span></div>
        <div class="detail-item"><strong>关联办件节点</strong><span>${firstNotice.nodeLabel}（${firstNotice.node}）</span></div>
        <div class="detail-item"><strong>责任部门</strong><span>${firstNotice.responsibleDept}</span></div>
        <div class="detail-item"><strong>责任人</strong><span>${firstNotice.responsiblePerson}</span></div>
        <div class="detail-item"><strong>通知状态</strong><span>${firstNotice.status === 'SENT' ? '已发送' : firstNotice.status === 'DELIVERED' ? '已送达' : firstNotice.status}</span></div>
      </div>
      ${noticeDisposal ? `
        <div style="margin-top:10px;padding:10px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="color:#172033;font-size:13px;">📋 处置记录详情</strong>
            <span class="badge ${noticeDisposal.disposalStatus === 'IN_PROGRESS' ? '' : 'warn'}" style="${noticeDisposal.disposalStatus === 'IN_PROGRESS' ? '' : noticeDisposal.disposalStatus === 'PENDING' ? 'background:#fef3c7;color:#92400e;' : 'background:#fee2e2;color:#991b1b;'}">${noticeDisposal.disposalStatus === 'IN_PROGRESS' ? '处置中' : noticeDisposal.disposalStatus === 'PENDING' ? '待处置' : '已完成'}</span>
          </div>
          <div class="detail-grid" style="margin-top:6px;">
            <div class="detail-item"><strong>处置类型</strong><span>${noticeDisposal.disposalType === 'SUPPLEMENT_REVIEW' ? '补正复核' : noticeDisposal.disposalType === 'TIMEOUT_COORDINATION' ? '超时协调' : noticeDisposal.disposalType === 'MATERIAL_REVIEW' ? '材料复核' : noticeDisposal.disposalType}</span></div>
            <div class="detail-item"><strong>处置人</strong><span>${noticeDisposal.disposedBy || '待分配'}</span></div>
          </div>
          <p style="font-size:12px;color:#667085;margin:6px 0 0;">处置说明：${noticeDisposal.disposalNote}</p>
          <p style="font-size:12px;color:#92400e;margin:4px 0 0;">⏰ 预计完成时间：${noticeDisposal.expectedCompletionAt || '待定'}</p>
        </div>
      ` : ''}
    </div>
  ` : '';

  const riskLevel = timeoutRiskLevels[timeoutAppId];
  const riskLevelHtml = riskLevel ? `
    <div class="depth-section">
      <h3>风险等级判定</h3>
      <div class="detail-item" style="border-left: 4px solid ${riskLevel.riskLevel === 3 ? '#dc2626' : riskLevel.riskLevel === 2 ? '#ea580c' : '#f59e0b'};">
        <span class="risk-badge risk-${riskLevel.riskLevel}">${riskLevel.riskLevelLabel}</span>
        <p style="margin:6px 0 0;font-size:13px;color:#475467;">${riskLevel.riskDescription}</p>
        ${riskLevel.nextEscalationAt ? `<p style="margin:4px 0 0;font-size:12px;color:#9a3412;">下次升级：${riskLevel.nextEscalationAt} - ${riskLevel.escalationAction}</p>` : ''}
      </div>
    </div>
  ` : '';

  const firstItemCode = items[0]?.item_code || '114401000001';
  const timeLimit = handlingTimeLimits[firstItemCode];
  const timeLimitHtml = timeLimit ? `
    <div class="depth-section">
      <h3>办理时限明细</h3>
      <div class="detail-grid">
        <div class="detail-item"><strong>法定时限</strong><span>${timeLimit.statutoryTimeLimit}</span></div>
        <div class="detail-item"><strong>承诺时限</strong><span>${timeLimit.promiseTimeLimit}</span></div>
      </div>
      <ul class="timeline-list" style="margin-top:10px;">
        ${timeLimit.breakdown.map(b => `
          <li class="done">
            <strong style="color:#172033;">${b.stage}（${b.days}个工作日）</strong>
            <p style="margin:4px 0 0;font-size:13px;color:#475467;">${b.description}</p>
          </li>
        `).join('')}
      </ul>
      <p style="margin-top:8px;font-size:12px;color:#667085;">法律依据：${timeLimit.legalBasis}</p>
    </div>
  ` : '';

  const conditions = applicableConditions[firstItemCode];
  const conditionsHtml = conditions && conditions.length > 0 ? `
    <div class="depth-section">
      <h3>适用条件 · 共 ${conditions.length} 项</h3>
      <div class="detail-grid">
        ${conditions.map(c => `
          <div class="detail-item" style="${c.verified ? 'border-left: 3px solid #10b981;' : 'border-left: 3px solid #d1d5db;'}">
            <strong>${c.condition}</strong>
            <span class="badge ${c.type === 'REQUIRED' ? '' : 'warn'}">${c.type === 'REQUIRED' ? '必备' : '可选替代'}</span>
            <p style="margin:4px 0 0;font-size:12px;color:#475467;">${c.description}</p>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const firstForm = formTemplates.find(f => f.itemCode === firstItemCode);
  const formChangelog = firstForm ? formFieldChangeLogs[firstForm.id] || [] : [];
  const formChangelogHtml = formChangelog.length > 0 ? `
    <div class="depth-section">
      <h3>电子表单版本变更 · 共 ${formChangelog.length} 个版本</h3>
      <ul class="timeline-list">
        ${formChangelog.map(log => `
          <li class="done">
            <strong style="color:#172033;">${log.version} · ${log.changedAt}</strong>
            <small style="color:#667085;display:block;">变更人：${log.changedBy}</small>
            <p style="margin:4px 0 0;font-size:13px;color:#475467;">变更内容：${log.changes}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#667085;">变更原因：${log.reason}</p>
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';

  const materialVerify = materialVerificationResults['app-20260614-001'];
  const materialVerifyHtml = materialVerify && materialVerify.length > 0 ? `
    <div class="depth-section">
      <h3>材料核验结论 · 共 ${materialVerify.length} 项</h3>
      <div class="detail-grid">
        ${materialVerify.map(m => `
          <div class="detail-item" style="${m.verified ? 'border-left: 3px solid #10b981;' : 'border-left: 3px solid #f59e0b;'}">
            <strong>${m.materialName}</strong>
            <span class="badge ${m.verified ? '' : 'warn'}">${m.verified ? '核验通过' : '待补正'}</span>
            <p style="margin:4px 0 0;font-size:12px;color:#475467;">核验方式：${m.verifyMethod}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#667085;">核验结果：${m.verifyResult}</p>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const templateReviews = firstForm ? templateReviewRecords[firstForm.id] || [] : [];
  const templateReviewHtml = templateReviews.length > 0 ? `
    <div class="depth-section">
      <h3>模板复查记录 · 共 ${templateReviews.length} 条</h3>
      <ul class="timeline-list">
        ${templateReviews.map(r => `
          <li class="${r.reviewResult === 'PASSED' ? 'done' : 'pending'}">
            <strong style="color:#172033;">${r.reviewer}</strong>
            <small style="color:#667085;display:block;">${r.reviewedAt} · 版本 ${r.version}</small>
            <span class="badge ${r.reviewResult === 'PASSED' ? '' : 'warn'}">${r.reviewResult === 'PASSED' ? '通过' : '待审核'}</span>
            ${r.reviewOpinion ? `<p style="margin:4px 0 0;font-size:12px;color:#475467;">意见：${r.reviewOpinion}</p>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';

  const firstItem = items[0];
  const firstItemAudit = firstItem?.standardAuditRecords;
  const timeLimitChangesHtml = firstItemAudit?.timeLimitChanges && firstItemAudit.timeLimitChanges.length > 0 ? `
    <div class="depth-section">
      <h3>⏰ 办理时限变更记录 · ${firstItemAudit.timeLimitChanges.length}条</h3>
      ${firstItemAudit.timeLimitChanges.map((c, i) => `
        <div style="padding:10px;border:1px solid #e5e7eb;border-radius:8px;margin-top:8px;background:${i === 0 ? '#ecfdf5' : '#f9fafb'};border-left:4px solid ${c.status === 'EFFECTIVE' ? '#10b981' : '#9ca3af'};">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="color:#172033;">版本 ${c.version} · ${c.status === 'EFFECTIVE' ? '现行有效' : '已废止'}</strong>
            <span class="badge ${c.changeType === 'PROMISE_SHORTEN' ? '' : 'warn'}" style="${c.changeType === 'PROMISE_SHORTEN' ? 'background:#dcfce7;color:#166534;' : ''}">
              ${c.changeType === 'PROMISE_SHORTEN' ? '承诺时限压缩' : c.changeType === 'STANDARD_ADJUST' ? '标准调整' : c.changeType}
            </span>
          </div>
          <p style="font-size:13px;color:#475467;margin:6px 0;">
            <strong>从 ${c.fromDays} 个工作日 → ${c.toDays} 个工作日</strong>
            <small style="color:#667085;margin-left:8px;">压缩比例：${Math.round((1 - c.toDays / c.fromDays) * 100)}%</small>
          </p>
          <p style="font-size:12px;color:#667085;margin:4px 0;">变更原因：${c.reason}</p>
          <p style="font-size:12px;color:#98a2b3;margin:4px 0 0;">依据：${c.basis} · 变更人：${c.changedBy} · ${c.changedAt}</p>
        </div>
      `).join('')}
    </div>
  ` : '';
  const materialFailuresHtml = firstItemAudit?.materialVerifyFailures && firstItemAudit.materialVerifyFailures.length > 0 ? `
    <div class="depth-section">
      <h3>📄 材料核验失败分析 · ${firstItemAudit.materialVerifyFailures.length}类高发问题</h3>
      ${firstItemAudit.materialVerifyFailures.map(f => `
        <div style="padding:10px;border:1px solid #fee2e2;border-radius:8px;margin-top:8px;background:#fef2f2;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="color:#991b1b;">${f.material} · ${f.failReason}</strong>
            <span style="font-weight:700;color:#dc2626;">月失败 ${f.failCountMonth} 次 · 失败率 ${f.failRate}</span>
          </div>
          <p style="font-size:12px;color:#991b1b;margin:6px 0 0;">高发区域：${f.topOccurrences.join('，')}</p>
          <p style="font-size:12px;color:#667085;margin:4px 0 0;">优化动作：${f.improvementAction}</p>
          <p style="font-size:11px;color:#10b981;margin:4px 0 0;">📈 近30天趋势：${f.last30DaysTrend}</p>
        </div>
      `).join('')}
    </div>
  ` : '';

  const materialFailureSamplesHtml = materialVerifyFailureSamples[firstItem?.item_code] && materialVerifyFailureSamples[firstItem?.item_code].length > 0 ? `
    <div class="depth-section" style="background:#fef2f2;border:1px solid #fecaca;">
      <h3 style="color:#991b1b;">🔍 材料电子化校验失败样本 · ${materialVerifyFailureSamples[firstItem?.item_code].length}类</h3>
      <div class="detail-grid">
        ${materialVerifyFailureSamples[firstItem?.item_code].map(sample => `
          <div class="detail-item" style="border-left:3px solid #ef4444;">
            <strong>${sample.materialName}：${sample.failType === 'OCR_RECOGNITION_FAIL' ? 'OCR识别失败' : sample.failType === 'FORMAT_VALIDATION_FAIL' ? '格式校验失败' : sample.failType === 'FACE_MISMATCH' ? '人脸不匹配' : sample.failType}</strong>
            <p style="font-size:11px;color:#667085;margin:4px 0 0;">${sample.failReason}</p>
            <div style="margin-top:4px;font-size:11px;color:#475467;">
              <span style="color:#b91c1c;font-weight:600;">失败率 ${sample.failRate}</span>
              · 月发 ${sample.sampleCount} 件
            </div>
            <p style="font-size:10px;color:#065f46;margin-top:4px;">💡 ${sample.suggestion}</p>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const conditionHitRecordsHtml = conditionHitRecords[firstItem?.item_code] ? `
    <div class="depth-section" style="background:#f0fdf4;border:1px solid #86efac;">
      <h3 style="color:#166534;">📊 适用条件命中记录 · 月 ${conditionHitRecords[firstItem?.item_code].totalApplications.toLocaleString()} 件</h3>
      <div class="detail-grid">
        ${conditionHitRecords[firstItem?.item_code].hitRateByCondition.map(cond => `
          <div class="detail-item" style="border-left:3px solid #22c55e;">
            <strong>${cond.condition}</strong>
            <div style="margin-top:4px;">
              <div style="display:flex;justify-content:space-between;font-size:11px;">
                <span style="color:#475467;">命中数：${cond.hitCount.toLocaleString()}</span>
                <span style="font-weight:600;color:#16a34a;">${cond.hitRate}</span>
              </div>
              <div style="height:4px;background:#dcfce7;border-radius:2px;margin-top:2px;overflow:hidden;">
                <div style="height:100%;width:${parseFloat(cond.hitRate.replace('%',''))}%;background:#22c55e;border-radius:2px;"></div>
              </div>
            </div>
            ${cond.missReason ? `<p style="font-size:10px;color:#92400e;margin-top:4px;">未通过原因：${cond.missReason}</p>` : ''}
          </div>
        `).join('')}
      </div>
      <div style="margin-top:8px;padding:6px 8px;background:#dcfce7;border-radius:4px;font-size:11px;color:#166534;">
        三条件同时命中：${conditionHitRecords[firstItem?.item_code].multipleConditionHit.threeConditionsHitRate}（${conditionHitRecords[firstItem?.item_code].multipleConditionHit.threeConditionsHit.toLocaleString()}件）
        · 全部条件命中：${conditionHitRecords[firstItem?.item_code].multipleConditionHit.allConditionsHitRate}（${conditionHitRecords[firstItem?.item_code].multipleConditionHit.allConditionsHit.toLocaleString()}件）
      </div>
    </div>
  ` : '';

  const formVersionDiffsHtml = firstItemAudit?.formVersionDiffs && firstItemAudit.formVersionDiffs.length > 0 ? `
    <div class="depth-section">
      <h3>📋 表单版本差异对比 · ${firstItemAudit.formVersionDiffs.length}个历史版本</h3>
      ${firstItemAudit.formVersionDiffs.map(d => `
        <div style="padding:10px;border:1px solid #e0e7ff;border-radius:8px;margin-top:8px;background:#eef2ff;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="color:#3730a3;">${d.fromVersion} → ${d.toVersion}</strong>
            <span style="font-size:12px;color:#6366f1;font-weight:600;">${d.changeCount} 处字段变更</span>
          </div>
          <div style="margin-top:6px;">
            ${d.diffFields.map(f => `
              <span style="display:inline-block;padding:2px 8px;margin:2px 4px 2px 0;border-radius:4px;font-size:11px;
                background:${f.type === 'ADD' ? '#dcfce7;color:#166534;' : f.type === 'REMOVE' ? '#fee2e2;color:#991b1b;' : f.type === 'VALIDATION' ? '#fef3c7;color:#92400e;' : '#dbeafe;color:#1e40af'};">
                ${f.type === 'ADD' ? '➕ 新增' : f.type === 'REMOVE' ? '➖ 移除' : f.type === 'VALIDATION' ? '✓ 校验' : '🎨 展示'}：${f.field}
              </span>
            `).join('')}
          </div>
          <p style="font-size:12px;color:#667085;margin:6px 0 0;">更新人：${d.updatedBy} · ${d.updatedAt} · 复查：${d.reviewer}（${d.reviewStatus === 'REVIEWED' ? '已复查' : '待复查'}）</p>
        </div>
      `).join('')}
    </div>
  ` : '';
  const conditionConflictsHtml = firstItemAudit?.applicableConditionConflicts && firstItemAudit.applicableConditionConflicts.length > 0 ? `
    <div class="depth-section">
      <h3>⚖️ 适用条件冲突与解决 · ${firstItemAudit.applicableConditionConflicts.length}项</h3>
      ${firstItemAudit.applicableConditionConflicts.map(c => `
        <div style="padding:10px;border:1px solid #fed7aa;border-radius:8px;margin-top:8px;background:#fff7ed;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="color:#9a3412;">${c.condition}</strong>
            <span class="badge ${c.resolutionStatus === 'RESOLVED' ? '' : 'warn'}" style="${c.resolutionStatus === 'RESOLVED' ? 'background:#dcfce7;color:#166534;' : ''}">
              ${c.resolutionStatus === 'RESOLVED' ? '已解决' : '待解决'}
            </span>
          </div>
          <p style="font-size:12px;color:#9a3412;margin:6px 0;"><strong>冲突来源：</strong>${c.conflictSource}</p>
          <p style="font-size:12px;color:#475467;margin:4px 0;"><strong>冲突描述：</strong>${c.description}</p>
          <p style="font-size:12px;color:#166534;margin:4px 0 0;"><strong>解决方案：</strong>${c.resolution}</p>
          <p style="font-size:11px;color:#667085;margin:4px 0 0;">解决人：${c.resolvedBy} · ${c.resolvedAt} · 依据：${c.relatedPolicy}</p>
        </div>
      `).join('')}
    </div>
  ` : '';
  const auditSummaryHtml = firstItemAudit?.auditSummary ? `
    <div class="depth-section" style="background:linear-gradient(135deg,#f0fdf4 0%,#ecfeff 100%);border:1px solid #86efac;">
      <h3 style="color:#166534;">📊 标准化审计总览</h3>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px;">
        <div style="padding:8px;text-align:center;background:white;border-radius:6px;">
          <div style="font-size:20px;font-weight:700;color:#2563eb;">${firstItemAudit.auditSummary.totalTimeLimitChanges}</div>
          <div style="font-size:11px;color:#667085;">时限变更</div>
        </div>
        <div style="padding:8px;text-align:center;background:white;border-radius:6px;">
          <div style="font-size:20px;font-weight:700;color:#dc2626;">${firstItemAudit.auditSummary.totalMaterialFailures}</div>
          <div style="font-size:11px;color:#667085;">材料失败类型</div>
        </div>
        <div style="padding:8px;text-align:center;background:white;border-radius:6px;">
          <div style="font-size:20px;font-weight:700;color:#7c3aed;">${firstItemAudit.auditSummary.totalFormVersionDiffs}</div>
          <div style="font-size:11px;color:#667085;">表单版本变更</div>
        </div>
        <div style="padding:8px;text-align:center;background:white;border-radius:6px;">
          <div style="font-size:20px;font-weight:700;color:#f59e0b;">${firstItemAudit.auditSummary.totalConditionConflicts}</div>
          <div style="font-size:11px;color:#667085;">条件冲突</div>
        </div>
      </div>
      <p style="font-size:12px;color:#667085;margin-top:8px;">
        最近审计：${firstItemAudit.auditSummary.lastAuditDate} · 审计人：${firstItemAudit.auditSummary.auditor} · 标准合规度：<strong style="color:#166534;">${firstItemAudit.auditSummary.standardCompliance}</strong>
      </p>
    </div>
  ` : '';
  const standardReview承接Html = firstItem && firstItemAudit?.auditSummary ? `
    <div style="padding:10px 14px;background:#f3f4f6;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <p style="font-size:13px;font-weight:600;color:#374151;">📋 以下为【${firstItem.item_name}】的标准化复查详情</p>
          <p style="font-size:11px;color:#6b7280;margin-top:2px;">快速摘要：时限变更 ${firstItemAudit.auditSummary.totalTimeLimitChanges} 条 · 材料失败 ${firstItemAudit.auditSummary.totalMaterialFailures} 类 · 表单差异 ${firstItemAudit.auditSummary.totalFormVersionDiffs} 个 · 条件冲突 ${firstItemAudit.auditSummary.totalConditionConflicts} 项</p>
        </div>
        <span style="font-size:11px;padding:3px 10px;border-radius:12px;background:#d1d5db;color:#374151;font-weight:500;">事项编码：${firstItem.item_code}</span>
      </div>
    </div>
  ` : '';

  const nfcDetailHtml = `
    <div class="depth-section">
      <h3>NFC 降级受理规则</h3>
      <p style="font-size:13px;color:#475467;margin-bottom:8px;">${nfcDegradationDetail.degradationReason}</p>
      <div class="detail-grid">
        <div class="detail-item"><strong>降级时间</strong><span>${nfcDegradationDetail.degradationSince}</span></div>
        <div class="detail-item"><strong>影响服务</strong><span style="font-size:12px;">${nfcDegradationDetail.affectedServices.join('、')}</span></div>
      </div>
    </div>
    <div class="depth-section">
      <h3>替代核验方式 · 共 ${nfcDegradationDetail.alternativeVerification.length} 种</h3>
      <div class="detail-grid">
        ${nfcDegradationDetail.alternativeVerification.map(alt => `
          <div class="detail-item" style="border-left: 3px solid #0a5c75;">
            <strong>${alt.name}</strong>
            <p style="margin:4px 0 0;font-size:12px;color:#475467;">${alt.description}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#667085;">${alt.additionalSteps}</p>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="depth-section">
      <h3>人工兜底路径</h3>
      <div class="detail-grid">
        <div class="detail-item"><strong>窗口办理</strong><span>${nfcDegradationDetail.fallbackPath.manualReview.window}</span></div>
        <div class="detail-item"><strong>服务时间</strong><span>${nfcDegradationDetail.fallbackPath.manualReview.workingHours}</span></div>
        <div class="detail-item"><strong>所需材料</strong><span style="font-size:12px;">${nfcDegradationDetail.fallbackPath.manualReview.requiredMaterials.join('、')}</span></div>
        <div class="detail-item"><strong>预计耗时</strong><span>${nfcDegradationDetail.fallbackPath.manualReview.estimatedTime}</span></div>
      </div>
    </div>
    <div class="depth-section">
      <h3>授权凭证与二次核验</h3>
      <div class="detail-grid">
        <div class="detail-item"><strong>临时令牌</strong><span>已发放 ${nfcDegradationDetail.authorizationCredentials[0]?.issuedCount || 0} 个 · 有效期24小时</span></div>
        <div class="detail-item"><strong>高风险二次核验</strong><span>${nfcDegradationDetail.highRiskSecondaryVerification.enabled ? '已启用' : '未启用'}</span></div>
      </div>
      <p style="margin-top:6px;font-size:12px;color:#667085;">触发场景：${nfcDegradationDetail.highRiskSecondaryVerification.triggeredScenarios.join('、')}</p>
    </div>
  `;

  const firstPolicyId = policyRows[0]?.id || 'pol-001';
  const policyAudit = policyPublishAudits[firstPolicyId];
  const policyVersions = policyVersionOrigins[firstPolicyId] || [];
  const policyAuditHtml = policyAudit ? `
    <div class="depth-section">
      <h3>发布复核</h3>
      <div class="detail-grid">
        <div class="detail-item"><strong>发布状态</strong><span class="badge">${policyAudit.publishStatus === 'PUBLISHED' ? '已发布' : '待审核'}</span></div>
        <div class="detail-item"><strong>版本</strong><span>${policyAudit.version}</span></div>
        <div class="detail-item"><strong>发布人</strong><span>${policyAudit.publisher || '待发布'}</span></div>
        <div class="detail-item"><strong>审核人</strong><span>${policyAudit.reviewer}</span></div>
        <div class="detail-item"><strong>问答命中率</strong><span>${policyAudit.qaPassRate}</span></div>
        <div class="detail-item"><strong>发布时间</strong><span>${policyAudit.publishedAt || '-'}</span></div>
      </div>
      ${policyAudit.reviewOpinion ? `<p style="margin-top:8px;font-size:12px;color:#475467;">审核意见：${policyAudit.reviewOpinion}</p>` : ''}
    </div>
  ` : '';

  const policyVersionHtml = policyVersions.length > 0 ? `
    <div class="depth-section">
      <h3>版本来源追溯 · 共 ${policyVersions.length} 个版本</h3>
      <ul class="timeline-list">
        ${policyVersions.map(v => `
          <li class="done">
            <strong style="color:#172033;">${v.version} · ${v.updatedAt}</strong>
            <p style="margin:4px 0 0;font-size:13px;color:#475467;">来源：${v.source}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#667085;">变更：${v.changeSummary}</p>
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';

  const firstOpenApiAppId = 'mini-gz-001';
  const openApiScopes = openApiScopeDetails[firstOpenApiAppId] || [];
  const openApiScopeHtml = openApiScopes.length > 0 ? `
    <div class="depth-section">
      <h3>授权范围明细 · ${firstOpenApiAppId}</h3>
      <div class="detail-grid">
        ${openApiScopes.map(s => `
          <div class="detail-item">
            <strong>${s.scope}</strong>
            <span class="badge">${s.permission}</span>
            <p style="margin:4px 0 0;font-size:12px;color:#475467;">${s.description}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#667085;">${s.apiCount}个接口 · 日限${s.dailyLimit.toLocaleString()}次</p>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const openApiExceptionHtml = openApiExceptionLogs.length > 0 ? `
    <div class="depth-section">
      <h3>异常调用审计 · 共 ${openApiExceptionLogs.length} 条</h3>
      <ul class="timeline-list">
        ${openApiExceptionLogs.slice(0, 3).map(e => `
          <li class="${e.status === 'RESOLVED' ? 'done' : 'pending'}">
            <strong style="color:#172033;">${e.appId}</strong>
            <small style="color:#667085;display:block;">${e.occurredAt} · ${e.endpoint}</small>
            <span class="badge ${e.status === 'RESOLVED' ? '' : 'warn'}">${e.status === 'RESOLVED' ? '已解决' : '处理中'}</span>
            <p style="margin:4px 0 0;font-size:12px;color:#475467;">${e.errorType}：${e.errorMessage}</p>
            ${e.resolution ? `<p style="margin:2px 0 0;font-size:12px;color:#137333;">处置：${e.resolution}</p>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';

  const openApiPendingHtml = openApiPendingAuthorizations.length > 0 ? `
    <div class="depth-section">
      <h3>待审核授权申请 · 共 ${openApiPendingAuthorizations.length} 条</h3>
      <ul class="timeline-list">
        ${openApiPendingAuthorizations.map(p => `
          <li class="pending">
            <strong style="color:#172033;">${p.appName}</strong>
            <small style="color:#667085;display:block;">${p.appId} · ${p.appliedAt}申请</small>
            <span class="badge warn">${p.status === 'REVIEWING' ? '审核中' : '待审核'}</span>
            <p style="margin:4px 0 0;font-size:12px;color:#475467;">申请范围：${p.applyScopes}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#667085;">申请事由：${p.applyReason}</p>
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';

  const bottleneckHeatmapHtml = `
    <div class="depth-section">
      <h3>热力明细 · ${bottleneckHeatmapData.totalDataPoints} 个数据点</h3>
      <p style="font-size:12px;color:#667085;margin-bottom:8px;">高峰时段：${bottleneckHeatmapData.peakHours.join('、')}</p>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${bottleneckHeatmapData.items.slice(0, 2).map(item => `
          <div>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px;">
              <span style="color:#475467;">${item.name}</span>
              <span style="color:#0a5c75;font-weight:600;">${item.data.reduce((a, b) => a + b, 0).toLocaleString()} 次/日</span>
            </div>
            <div style="height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden;display:flex;">
              ${item.data.slice(8, 18).map((val, i) => {
                const maxVal = Math.max(...item.data);
                const pct = (val / maxVal) * 100;
                return `<div style="flex:1;background:${val > maxVal * 0.7 ? '#ea580c' : val > maxVal * 0.4 ? '#f59e0b' : '#10b981'};height:${Math.max(pct * 0.08, 20)}%;"></div>`;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const attrItem = '居住证办理';
  const attribution = bottleneckAttribution[attrItem];
  const attributionHtml = attribution ? `
    <div class="depth-section">
      <h3>堵点归因分析</h3>
      <div class="detail-grid">
        <div class="detail-item"><strong>主要成因</strong><span style="color:#dc2626;">${attribution.primaryCause}</span></div>
        <div class="detail-item"><strong>次要成因</strong><span>${attribution.secondaryCause}</span></div>
      </div>
      <div class="depth-section" style="margin-top:10px;padding-top:10px;border-top:1px dashed #e2e8f0;">
        <h4 style="margin:0 0 8px;font-size:13px;color:#0a5c75;">统计显著性检验</h4>
        <div class="detail-grid">
          ${Object.entries(attribution.correlation).map(([key, val]) => `
            <div class="detail-item">
              <strong>${key === 'materialMissingRate' ? '材料缺失率相关性' : '部门数量相关性'}</strong>
              <span>Pearson r = ${val.pearson} · P值 = ${val.pValue}</span>
              <p style="margin:2px 0 0;font-size:12px;color:${val.significant ? '#137333' : '#9a5b00'};">${val.significant ? '统计显著' : '统计不显著'}</p>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="depth-section" style="margin-top:10px;padding-top:10px;border-top:1px dashed #e2e8f0;">
        <h4 style="margin:0 0 8px;font-size:13px;color:#0a5c75;">典型案例 · ${attribution.caseStudies.length} 个</h4>
        <ul class="timeline-list">
          ${attribution.caseStudies.map(c => `
            <li class="done">
              <strong style="color:#172033;">${c.caseId}</strong>
              <span class="badge warn">${c.impact}</span>
              <p style="margin:4px 0 0;font-size:12px;color:#475467;">${c.description}</p>
              <p style="margin:2px 0 0;font-size:12px;color:#137333;">结果：${c.outcome}</p>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  ` : '';

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>广州市统一政务服务移动端后端支撑平台</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f7fb; color: #172033; }
    header { background: #0a5c75; color: white; padding: 18px 28px; display: flex; justify-content: space-between; align-items: center; gap: 16px; position: sticky; top: 0; z-index: 5; }
    h1 { margin: 0; font-size: 22px; }
    h2 { margin: 0 0 12px; font-size: 18px; }
    h3 { margin: 0 0 8px; font-size: 15px; }
    .sub { margin-top: 4px; color: #d9f1f7; font-size: 13px; }
    main { padding: 24px; max-width: 1360px; margin: 0 auto; }
    .grid { display: grid; gap: 16px; }
    .stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .columns { grid-template-columns: 1.25fr .75fr; align-items: start; }
    .card { background: white; border: 1px solid #dfe7f0; border-radius: 8px; padding: 18px; box-shadow: 0 10px 24px rgba(22, 32, 51, .05); }
    .stat { display: flex; flex-direction: column; gap: 6px; }
    .stat strong { font-size: 28px; color: #0a5c75; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px 8px; border-bottom: 1px solid #edf1f6; text-align: left; vertical-align: top; }
    th { color: #667085; font-size: 12px; background: #f8fafc; }
    .badge { display: inline-flex; border-radius: 999px; padding: 4px 9px; font-size: 12px; background: #e7f6ed; color: #137333; font-weight: 700; white-space: nowrap; }
    .warn { background: #fff4df; color: #9a5b00; }
    .list { display: grid; gap: 10px; }
    .item { border: 1px solid #edf1f6; border-radius: 8px; padding: 12px; background: #fbfdff; }
    .item p { margin: 6px 0 0; color: #607086; font-size: 13px; }
    .toolbar { display: flex; gap: 10px; align-items: center; }
    input { width: 320px; max-width: 100%; border: 1px solid #bfd0dd; border-radius: 8px; padding: 10px 12px; }
    button { border: 0; border-radius: 8px; padding: 8px 12px; background: #ffb703; color: #162033; font-weight: 700; cursor: pointer; }
    button.secondary { background: #e8f3f7; color: #0a5c75; }
    button.link { background: #ffffff; color: #0a5c75; }
    .target-state { border: 1px solid #b9d9e7; background: #f2fbff; color: #0a5c75; border-radius: 8px; padding: 12px 14px; font-weight: 700; }
    pre { white-space: pre-wrap; background: #101828; color: #dbeafe; border-radius: 8px; padding: 12px; min-height: 100px; max-height: 300px; overflow: auto; }
    .flow { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    .flow-card { border: 1px solid #dceaf1; border-radius: 8px; padding: 12px; background: #fbfeff; min-height: 132px; }
    .flow-card strong { display: block; margin: 8px 0 4px; color: #132238; }
    .flow-card small, .flow-card p { color: #607086; }
    .flow-card p { margin: 8px 0 0; font-size: 12px; line-height: 1.5; }
    .flow-status { display: inline-flex; padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #e7f6ed; color: #137333; }
    .flow-status.running { background: #fff4df; color: #9a5b00; }
    .flow-status.waiting { background: #eef2f7; color: #475467; }
    .section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .depth-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid #edf1f6; }
    .depth-section h3 { color: #0a5c75; margin-bottom: 10px; }
    .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .detail-item { padding: 8px 12px; background: #f8fafc; border-radius: 6px; font-size: 13px; }
    .detail-item strong { display: block; color: #475467; font-size: 12px; font-weight: 500; margin-bottom: 2px; }
    .detail-item span { color: #172033; font-weight: 600; }
    .timeline-list { list-style: none; padding: 0; margin: 0; }
    .timeline-list li { position: relative; padding: 10px 0 10px 20px; border-left: 2px solid #e2e8f0; }
    .timeline-list li:before { content: ''; position: absolute; left: -6px; top: 14px; width: 10px; height: 10px; border-radius: 50%; background: #0a5c75; }
    .timeline-list li.done:before { background: #137333; }
    .timeline-list li.pending:before { background: #9a5b00; }
    .risk-badge { padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 700; }
    .risk-1 { background: #fef3c7; color: #92400e; }
    .risk-2 { background: #fed7aa; color: #9a3412; }
    .risk-3 { background: #fecaca; color: #991b1b; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 720px) { .two-col { grid-template-columns: 1fr; } .detail-grid { grid-template-columns: 1fr; } }
    @media (max-width: 1050px) { .stats, .columns, .flow { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 720px) { .stats, .columns, .flow { grid-template-columns: 1fr; } header { align-items: flex-start; flex-direction: column; } }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>广州市统一政务服务移动端后端支撑平台</h1>
      <div class="sub">事项标准化管理 · 多源身份认证 · 全流程线上办件 · 电子证照签发 · 开放 API</div>
    </div>
    <div class="toolbar">
      <input id="q" type="search" placeholder="搜索事项编码、办件、政策文件、后台报表..." onkeydown="if(event.key === 'Enter') runSearch()" />
      <button onclick="runSearch()">搜索筛选</button>
      <button class="link" onclick="showAdminDashboard()">管理后台</button>
    </div>
  </header>
  <main class="grid">
    <section id="admin-dashboard" class="target-state">
      管理后台数据概览：事项标准化、办件流转、身份认证、政策语料、开放接口与运营数据统一看板
    </section>
    <section class="grid stats">
      <div class="card stat"><span>标准化事项</span><strong>${items.length}</strong><small>事项编码/材料清单/电子表单模板</small></div>
      <div class="card stat"><span>线上办件</span><strong>${apps.length}</strong><small>预约、材料上传、智能预审、部门协同审批</small></div>
      <div class="card stat"><span>政策语料</span><strong>${policyCorpus.reduce((sum, item) => sum + item.qaPairs, 0)}</strong><small>结构化字段与 AI 问答训练语料</small></div>
      <div class="card stat"><span>开放接口调用</span><strong>${openApiApps.reduce((sum, item) => sum + item.callsToday, 0).toLocaleString()}</strong><small>第三方小程序授权调用</small></div>
    </section>

    <section class="card">
      <div class="section-head">
        <div>
          <h2>办件连续流转工作台</h2>
          <div class="sub" style="color:#607086;margin-top:6px;padding:8px 12px;background:${firstFlow.canShowClosedLoop ? '#ecfdf3' : '#fff7ed'};border-radius:6px;font-size:12px;border-left:4px solid ${firstFlow.canShowClosedLoop ? '#10b981' : '#f59e0b'};">
            📋 当前办件状态：<strong>${firstFlow.workflowStage}</strong> | 审批会签进度：${firstFlow.jointSignProgress} | 闭环状态：${firstFlow.canShowClosedLoop ? '✅ 已形成闭环（可复核）' : '⏳ 审批未完成，暂不生成签发/推送记录'}
          </div>
        </div>
        <div class="actions">
          <button onclick="show('/api/applications/${firstApplicationId}/flow')">查看流转 API</button>
          <button class="secondary" onclick="show('/api/admin/notifications')">超时通知留痕</button>
        </div>
      </div>
      <div class="grid flow">${flowCards}</div>
      ${workflowActionsHtml}
      <div class="two-col">
        ${approvalOpinionsHtml}
        ${certHtml}
      </div>
      ${pushReceiptHtml}
      ${branchRecordsHtml}
      ${materialHtml}
      ${supplementHtml}
      ${responsibilityChainHtml}
      ${abnormalChainHtml}
      ${operationLogsHtml}
      ${restartRecordsHtml}
      ${printRecordsHtml}
      ${printWatermarkHtml}
      ${auditReviewResultHtml}
      ${logLiabilityHtml}
    </section>

<section class="grid columns">
  <div class="card">
    <h2>办件全生命周期追踪</h2>
    <table>
      <thead><tr><th>办件号</th><th>申请人</th><th>事项</th><th>流转阶段</th><th>状态</th><th>到期</th><th>风险等级</th><th>责任链·异常·闭环</th></tr></thead>
      <tbody>${appRows}</tbody>
    </table>
    ${timeoutResponsibilityChainHtml}
    ${disposalHtml}
    ${supervisionHtml}
    ${riskLevelHtml}
    ${notifRetryHtml}
  </div>
  <div class="card">
    <h2>身份认证接入状态</h2>
    <div class="list">${integrationRows}</div>
    ${authChainHtml}
    ${nfcDetailHtml}
    ${authFailureHtml}
    ${secondaryVerifyHtml}
    ${crossPlatformMapHtml}
    ${highRiskAuthHtml}
  </div>
</section>

<section class="card">
  <div class="section-head">
    <h2>事项标准化操作区</h2>
    <button onclick="show('/api/service-items/forms')">电子表单模板 API</button>
  </div>
  <table>
    <thead><tr><th>事项编码</th><th>事项名称</th><th>部门</th><th>材料清单·核验规则</th><th>电子表单·版本</th><th>办理时限</th><th>标准化复查</th><th>操作</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  ${standardReview承接Html}
  ${auditSummaryHtml}
  <div class="two-col">
    ${timeLimitHtml}
    ${conditionsHtml}
  </div>
  ${timeLimitChangesHtml}
  ${materialFailuresHtml}
  ${materialFailureSamplesHtml}
  ${conditionHitRecordsHtml}
  ${formVersionDiffsHtml}
  ${conditionConflictsHtml}
  ${formChangelogHtml}
  ${templateReviewHtml}
</section>

<section class="card">
  <div class="section-head">
    <h2>政策文件结构化入库与 AI 问答训练</h2>
    <button onclick="show('/api/policies/training-corpus')">语料管理 API</button>
  </div>
  <table>
    <thead><tr><th>政策文件</th><th>分类</th><th>结构化字段</th><th>切片数</th><th>问答对</th><th>训练状态</th></tr></thead>
    <tbody>${corpusRows}</tbody>
  </table>
  <div class="two-col">
    ${policyAuditHtml}
    ${policyVersionHtml}
  </div>
  ${policyLinkageHtml}
  ${qaHitHtml}
</section>

<section class="grid columns">
  <div class="card">
    <div class="section-head">
      <h2>第三方小程序授权调用</h2>
      <button onclick="show('/api/open-api/apps')">开放平台 API</button>
    </div>
    <table>
      <thead><tr><th>AppID</th><th>应用</th><th>授权范围</th><th>今日调用</th><th>状态</th></tr></thead>
      <tbody>${apiRows}</tbody>
    </table>
    ${openApiDepthHtml}
    ${openApiScopeHtml}
    ${interceptRulesHtml}
    ${receiptTracesHtml}
    ${openApiExceptionHtml}
    ${openApiPendingHtml}
  </div>
  <div class="card">
    <div class="section-head">
      <h2>超时预警与通知留痕</h2>
      <button onclick="show('/api/admin/notifications')">通知记录 API</button>
    </div>
    <table>
      <thead><tr><th>办件号</th><th>渠道</th><th>接收方</th><th>内容</th><th>时间</th><th>审计</th></tr></thead>
      <tbody>${noticeRows}</tbody>
    </table>
    ${deliveryTraceHtml}
    ${applicantConfHtml}
    ${notificationLinkageHtml}
  </div>
</section>

<section class="card">
  <div class="section-head">
    <h2>高频事项堵点报表明细</h2>
    <button onclick="show('/api/admin/bottleneck/report')">堵点报表 API</button>
  </div>
  <table>
    <thead><tr><th>事项</th><th>使用量</th><th>材料补正率</th><th>部门协同耗时</th><th>堵点</th><th>处置动作</th><th>可复查明细</th></tr></thead>
    <tbody>${bottleneckRows}</tbody>
  </table>
  ${bottleneckLinkageHtml}
  ${bottleneckNodeDetailHtml}
  ${bottleneckDeptDetailHtml}
  ${bottleneckHeatmapHtml}
  ${attributionHtml}
</section>

    <section class="card">
      <h2>接口验证</h2>
      <div class="actions">
        <button onclick="checkHealth()">检查 /api/health</button>
        <button onclick="show('/api/applications/${firstApplicationId}/flow')">办件流转</button>
        <button onclick="show('/api/admin/integrations')">认证链路</button>
        <button onclick="show('/api/admin/bottleneck/report')">堵点分析</button>
      </div>
      <h3 id="status-title" style="margin-top:12px">接口响应 / 健康检查</h3>
      <pre id="result">等待操作...</pre>
    </section>
  </main>
  <script>
    const apiBase = 'http://${BACKEND_HOST}:${BACKEND_PORT}';
    function setState(hash, label) {
      window.history.replaceState(null, '', hash);
      document.getElementById('status-title').textContent = label;
    }
    async function show(path, label = '接口响应') {
      setState('#api-response', label);
      const res = await fetch(apiBase + path);
      document.getElementById('result').textContent = JSON.stringify(await res.json(), null, 2);
    }
    function checkHealth() { show('/api/health', '接口响应 / 健康检查'); }
    function showAdminDashboard() {
      setState('#admin-dashboard', '管理后台 / 数据概览');
      document.getElementById('result').textContent = JSON.stringify({
        success: true,
        section: '管理后台数据概览',
        metrics: {
          serviceItems: ${items.length},
          applications: ${apps.length},
          policyCorpus: ${policyCorpus.reduce((sum, item) => sum + item.qaPairs, 0)},
          openApiCallsToday: ${openApiApps.reduce((sum, item) => sum + item.callsToday, 0)},
        },
      }, null, 2);
      document.getElementById('admin-dashboard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function runSearch() {
      const q = encodeURIComponent(document.getElementById('q').value || '居住证');
      show('/api/search?q=' + q, '搜索结果 / 查询结果');
    }
    checkHealth();
  </script>
</body>
</html>`;
}

function handleFrontend(req, res) {
  const url = new URL(req.url || '/', `http://${FRONTEND_HOST}:${FRONTEND_PORT}`);
  if (url.pathname === '/' || url.pathname === '/index.html') {
    return sendHtml(res, pageHtml());
  }
  return sendHtml(res, pageHtml());
}

function startBackend() {
  const server = http.createServer(handleBackend);
  server.listen(BACKEND_PORT, BACKEND_HOST, () => {
    console.log(`[backend] ready http://${BACKEND_HOST}:${BACKEND_PORT}`);
  });
  return server;
}

function startFrontend() {
  const server = http.createServer(handleFrontend);
  server.listen(FRONTEND_PORT, FRONTEND_HOST, () => {
    console.log(`[frontend] ready http://${FRONTEND_HOST}:${FRONTEND_PORT}`);
  });
  return server;
}

const servers = [];
if (mode === 'backend' || mode === 'both') servers.push(startBackend());
if (mode === 'frontend' || mode === 'both') servers.push(startFrontend());

function shutdown(signal) {
  console.log(`${signal} received`);
  let remaining = servers.length;
  if (remaining === 0) process.exit(0);
  for (const server of servers) {
    server.close(() => {
      remaining -= 1;
      if (remaining === 0) process.exit(0);
    });
  }
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
