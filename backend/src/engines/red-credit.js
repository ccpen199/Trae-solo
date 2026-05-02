import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { generateInvoice } from './invoice-generator.js';

export const createRedCreditRecord = (params) => {
  const { originalInvoiceId, reason, amount, operator } = params;
  
  const originalInvoice = db.prepare(`
    SELECT * FROM invoice_requests WHERE id = ?
  `).get(originalInvoiceId);

  if (!originalInvoice) {
    throw new Error('原始发票不存在');
  }

  if (originalInvoice.status === 'red_credited') {
    throw new Error('该发票已红冲');
  }

  const redCreditId = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO red_credit_records (
      id, original_invoice_id, original_invoice_no, reason, 
      amount, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    redCreditId,
    originalInvoiceId,
    originalInvoice.invoice_no,
    reason,
    amount || originalInvoice.amount,
    'pending',
    now
  );

  return {
    id: redCreditId,
    original_invoice: originalInvoice,
    reason,
    amount: amount || originalInvoice.amount
  };
};

export const executeRedCredit = (redCreditId, operator) => {
  const redCreditRecord = db.prepare(`
    SELECT * FROM red_credit_records WHERE id = ?
  `).get(redCreditId);

  if (!redCreditRecord) {
    throw new Error('红冲记录不存在');
  }

  if (redCreditRecord.status !== 'pending') {
    throw new Error('红冲记录状态不正确');
  }

  const originalInvoice = db.prepare(`
    SELECT * FROM invoice_requests WHERE id = ?
  `).get(redCreditRecord.original_invoice_id);

  const redInvoiceData = generateInvoice(originalInvoice);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE red_credit_records 
    SET red_invoice_no = ?, red_invoice_code = ?, status = ?, red_message = ?, submitted_at = ?
    WHERE id = ?
  `).run(
    redInvoiceData.invoice_no,
    redInvoiceData.invoice_code,
    'executed',
    JSON.stringify({
      original_invoice_no: originalInvoice.invoice_no,
      red_invoice_no: redInvoiceData.invoice_no,
      tax_authority: redInvoiceData.tax_authority,
      submission_time: now
    }),
    now,
    redCreditId
  );

  db.prepare(`
    UPDATE invoice_requests 
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).run('red_credited', now, originalInvoice.id);

  return {
    red_credit_id: redCreditId,
    original_invoice_no: originalInvoice.invoice_no,
    red_invoice_no: redInvoiceData.invoice_no,
    red_invoice_code: redInvoiceData.invoice_code,
    status: 'executed',
    submitted_at: now
  };
};

export const submitRedCreditToTax = (redCreditId, operator) => {
  const redCreditRecord = db.prepare(`
    SELECT * FROM red_credit_records WHERE id = ?
  `).get(redCreditId);

  if (!redCreditRecord) {
    throw new Error('红冲记录不存在');
  }

  if (redCreditRecord.status !== 'executed') {
    throw new Error('红冲尚未执行，无法上报');
  }

  const taxSubmissionData = {
    red_invoice_no: redCreditRecord.red_invoice_no,
    original_invoice_no: redCreditRecord.original_invoice_no,
    submission_time: new Date().toISOString(),
    tax_authority: '国家税务总局电子发票服务平台',
    status: 'success',
    confirmation_no: `TAX${Date.now()}`
  };

  db.prepare(`
    UPDATE red_credit_records 
    SET status = ?, red_message = ?
    WHERE id = ?
  `).run(
    'submitted',
    JSON.stringify(taxSubmissionData),
    redCreditId
  );

  return taxSubmissionData;
};

export const getRedCreditHistory = (invoiceId) => {
  return db.prepare(`
    SELECT * FROM red_credit_records 
    WHERE original_invoice_id = ?
    ORDER BY created_at DESC
  `).all(invoiceId);
};

export default {
  createRedCreditRecord,
  executeRedCredit,
  submitRedCreditToTax,
  getRedCreditHistory
};
