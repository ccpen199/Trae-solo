import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';

export const AUDIT_ACTIONS = {
  SUBMIT_REQUEST: '提交开票申请',
  VERIFY_TAX: '校验税号',
  APPROVE: '审批通过',
  REJECT: '审批拒绝',
  ISSUE_INVOICE: '一键开票',
  DELIVER: '交付发票',
  SETTLE: '结票',
  RED_CREDIT_REQUEST: '红冲申请',
  RED_CREDIT_EXECUTE: '执行红冲',
  RED_CREDIT_SUBMIT: '上报红冲',
  QUOTA_CHECK: '额度检查',
  QUOTA_ALERT: '额度提醒',
  REPORT_GENERATE: '生成报表'
};

export const INVOICE_STATUSES = {
  PENDING: 'pending',
  PENDING_NAME: '待开票',
  APPROVED: 'approved',
  APPROVED_NAME: '待开票',
  ISSUED: 'issued',
  ISSUED_NAME: '已开票',
  DELIVERED: 'delivered',
  DELIVERED_NAME: '已交付',
  SETTLED: 'settled',
  SETTLED_NAME: '已结票',
  REJECTED: 'rejected',
  REJECTED_NAME: '已拒绝',
  RED_CREDITED: 'red_credited',
  RED_CREDITED_NAME: '已红冲'
};

export const STATUS_MAP = {
  'pending': '待开票',
  'approved': '待开票',
  'issued': '已开票',
  'delivered': '已交付',
  'settled': '已结票',
  'rejected': '已拒绝',
  'red_credited': '已红冲'
};

export const recordAuditLog = (params) => {
  const {
    invoiceId,
    orderNo,
    action,
    operator,
    fromStatus,
    toStatus,
    details,
    ipAddress
  } = params;

  const logId = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO audit_logs (
      id, invoice_id, order_no, action, operator_id, 
      operator_name, operator_role, from_status, to_status,
      details, ip_address, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    logId,
    invoiceId || null,
    orderNo || null,
    action,
    operator.id,
    operator.name,
    operator.role,
    fromStatus ? STATUS_MAP[fromStatus] || fromStatus : null,
    toStatus ? STATUS_MAP[toStatus] || toStatus : null,
    details ? JSON.stringify(details) : null,
    ipAddress || null,
    now
  );

  return logId;
};

export const getInvoiceStatusName = (status) => {
  return STATUS_MAP[status] || status;
};
