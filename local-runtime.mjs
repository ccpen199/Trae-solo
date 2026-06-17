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
    return {
      ...item,
      handlingTimeLimit: handlingTimeLimits[item.item_code] || null,
      applicableConditions: applicableConditions[item.item_code] || [],
      formTemplate: form || null,
      formFieldChangeLog: formLog,
      materialVerificationRule: materialVerificationRules[item.item_code] || [],
      templateReviewRecords: reviewRecords,
      standardReviewReady: form && formLog.length > 0 && reviewRecords.length > 0,
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
  { id: 'ntc-001', applicationId: 'app-20260614-001', channel: '微信服务通知', receiver: '陈女士', message: '智能预审需补充居住证明', sentAt: '2026-06-15 09:12', status: 'SENT', audit: '自动触发+后台留痕' },
  { id: 'ntc-002', applicationId: 'app-20260614-002', channel: '短信', receiver: '广州政务小程序', message: '部门协同审批剩余 18 小时', sentAt: '2026-06-15 10:03', status: 'SENT', audit: '超时预警规则 R-2024-07' },
  { id: 'ntc-003', applicationId: 'app-20260614-003', channel: '小程序订阅消息', receiver: '李先生', message: '电子证照已签发，可下载', sentAt: '2026-06-14 16:30', status: 'DELIVERED', audit: '证照签发回调' },
];

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
  { id: 'corp-001', policyId: 'pol-001', field: '事项编码规则', chunks: 36, trained: true, qaPairs: 128, lastTrainedAt: '2026-06-14 21:10' },
  { id: 'corp-002', policyId: 'pol-002', field: '电子证照调用边界', chunks: 24, trained: true, qaPairs: 76, lastTrainedAt: '2026-06-12 18:40' },
  { id: 'corp-003', policyId: 'pol-003', field: '实名核验问答语料', chunks: 19, trained: false, qaPairs: 42, lastTrainedAt: '待训练' },
];

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
    auditTrail: [
      { traceId: 'TRACE-FACE-20260615-00512', appId: 'mini-gz-001', userId: 'user-20260614-003', verifiedAt: '2026-06-15 08:20', result: 'SUCCESS', similarity: 96.4, livenessScore: 98.2, note: '居住证二次核验通过' },
      { traceId: 'TRACE-FACE-20260615-00511', appId: 'bank-verify-006', userId: 'user-20260613-088', verifiedAt: '2026-06-15 08:18', result: 'FAIL', similarity: 72.1, livenessScore: 0, note: '疑似照片攻击，已转人工复核' },
    ],
    dailyStats: { todayCalls: 4862, successCount: 4799, failCount: 63, avgLatencyMs: 142 },
    reviewAvailable: true,
  },
  {
    name: '社保卡 NFC', status: 'DEGRADED', latency: '320ms', successRate: '96.40%', scope: '社保卡申领/补换卡',
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
    auditTrail: [
      { traceId: 'TRACE-IDNET-20260615-01208', appId: 'mini-gz-001', userId: 'user-20260614-002', verifiedAt: '2026-06-15 09:03', result: 'SUCCESS', matchScore: 99.8, source: '公安人口信息库', note: 'NFC降级替代核验通过' },
      { traceId: 'TRACE-IDNET-20260615-01207', appId: 'mini-gz-001', userId: 'user-20260614-001', verifiedAt: '2026-06-15 08:31', result: 'SUCCESS', matchScore: 99.5, source: '公安人口信息库', note: '材料补正后重新核验' },
    ],
    dailyStats: { todayCalls: 18920, successCount: 18749, failCount: 171, avgLatencyMs: 103 },
    reviewAvailable: true,
  },
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
  { appId: 'mini-gz-001', name: '广州政务小程序', scopes: 'service-items,applications,certificates', callsToday: 12860, status: 'AUTHORIZED' },
  { appId: 'street-portal-018', name: '街镇综合受理端', scopes: 'applications,notifications', callsToday: 4820, status: 'AUTHORIZED' },
  { appId: 'bank-verify-006', name: '银行证照核验插件', scopes: 'certificates.read', callsToday: 936, status: 'LIMITED' },
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
  { id: 'exc-001', appId: 'mini-gz-001', endpoint: 'GET /api/v1/applications', errorType: 'RATE_LIMIT_EXCEEDED', errorMessage: '超出今日调用次数限制', occurredAt: '2026-06-15 08:45', status: 'RESOLVED', resolution: '已临时提升调用限额' },
  { id: 'exc-002', appId: 'bank-verify-006', endpoint: 'GET /api/v1/certificates/verify', errorType: 'SIGNATURE_INVALID', errorMessage: 'API签名验证失败', occurredAt: '2026-06-15 09:20', status: 'RESOLVED', resolution: '已通知对方更新签名算法' },
  { id: 'exc-003', appId: 'street-portal-018', endpoint: 'POST /api/v1/applications', errorType: 'PARAM_VALIDATION_FAILED', errorMessage: '缺少必填字段itemCode', occurredAt: '2026-06-15 10:15', status: 'INVESTIGATING', resolution: '正在排查对接系统参数问题' },
];

const openApiPendingAuthorizations = [
  { id: 'pending-001', appId: 'hospital-health-002', appName: '医院预约挂号平台', applyScopes: 'service-items.read,applications.read', applyReason: '就医预约需要核验参保身份', applicant: '广州市某三甲医院', appliedAt: '2026-06-14', status: 'PENDING' },
  { id: 'pending-002', appId: 'tax-service-009', appName: '税务服务小程序', applyScopes: 'certificates.read,user-info.read', applyReason: '办税需验证法人身份和营业执照', applicant: '广州市税务局', appliedAt: '2026-06-13', status: 'REVIEWING' },
];

const bottleneckReports = [
  {
    item: '居住证办理', usage: 12860, materialFixRate: '18.2%', avgDepartmentHours: 14.6, bottleneck: '居住证明补正', action: '上线材料样例与OCR预检',
    reviewDetail: {
      heatmapDataId: 'heatmap-jzz',
      attributionId: 'attr-jzz',
      topPeakHours: ['周一 10:00-11:30', '周四 14:30-16:00'],
      sampleCases: [
        { caseId: 'CASE-JZZ-001', applicant: '陈女士', occurredAt: '2026-06-15', issue: '居住证明缺备案编号', resolution: '系统自动发起补正，待申请人补充后5分钟内完成复核' },
        { caseId: 'CASE-JZZ-002', applicant: '黄先生', occurredAt: '2026-06-14', issue: '合同出租方信息不一致', resolution: '人工核实后通过告知承诺制办理' },
      ],
      improvementSuggestions: [
        '上线材料自动预检提示，减少现场发现率',
        '与住建部门打通备案数据自动核验接口',
        '推广告知承诺制替代纸质材料',
      ],
    },
  },
  {
    item: '社保卡申领', usage: 9820, materialFixRate: '9.4%', avgDepartmentHours: 10.2, bottleneck: '身份核验重试', action: 'NFC降级到身份证联网核查',
    reviewDetail: {
      heatmapDataId: 'heatmap-sbk',
      attributionId: 'attr-sbk',
      topPeakHours: ['周二 09:30-11:00', '周五 15:00-16:30'],
      sampleCases: [
        { caseId: 'CASE-SBK-001', applicant: '社保卡申领批量件', occurredAt: '2026-06-15', issue: 'NFC读卡失败触发降级', resolution: '自动发放临时授权凭证，身份证联网核查通过' },
      ],
      improvementSuggestions: [
        '加速NFC模块固件升级计划',
        '增加NFC读卡器部署密度',
        '优化降级自动切换体验',
      ],
    },
  },
  {
    item: '营业执照设立登记', usage: 7540, materialFixRate: '22.8%', avgDepartmentHours: 21.5, bottleneck: '住所证明复核', action: '增加街镇协同审批提醒',
    reviewDetail: {
      heatmapDataId: 'heatmap-yyzz',
      attributionId: 'attr-yyzz',
      topPeakHours: ['周三 10:00-12:00'],
      sampleCases: [
        { caseId: 'CASE-YYZZ-001', applicant: '某餐饮公司', occurredAt: '2026-06-14', issue: '住所产权证明不清', resolution: '街镇协查后3个工作日完成复核' },
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
  const apiRows = openApiApps.map((app) => `<tr><td>${app.appId}</td><td>${app.name}</td><td>${app.scopes}</td><td>${app.callsToday.toLocaleString()}</td><td><span class="badge">${app.status}</span></td></tr>`).join('');
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
        ` : '<small style="color:#98a2b3;">明细待补充</small>'}
      </td>
    </tr>
  `).join('');
  const noticeRows = timeoutAuditRecords.map((item) => `<tr><td>${item.applicationId}</td><td>${item.channel}</td><td>${item.receiver}</td><td>${item.message}</td><td>${item.sentAt}</td><td>${item.audit}</td></tr>`).join('');

  const firstAppId = apps[0]?.id || 'app-20260614-001';
  const firstApprovals = firstFlow.approvalOpinions;
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
    ${nfcDetailHtml}
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
  <div class="two-col">
    ${timeLimitHtml}
    ${conditionsHtml}
  </div>
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
    ${openApiScopeHtml}
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
