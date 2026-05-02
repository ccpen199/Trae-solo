import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_DIR = process.env.STORAGE_DIR || path.join(__dirname, '../../data/storage');

const ensureStorageDir = () => {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
};

export const storeInvoiceDocument = (invoiceId, invoiceData, pdfContent) => {
  ensureStorageDir();
  
  const docId = uuidv4();
  const now = new Date().toISOString();
  
  const invoiceDir = path.join(STORAGE_DIR, 'invoices', invoiceId);
  if (!fs.existsSync(invoiceDir)) {
    fs.mkdirSync(invoiceDir, { recursive: true });
  }

  const metadataPath = path.join(invoiceDir, 'metadata.json');
  const pdfPath = path.join(invoiceDir, 'invoice.pdf');
  const xmlPath = path.join(invoiceDir, 'invoice.xml');

  const metadata = {
    doc_id: docId,
    invoice_id: invoiceId,
    invoice_no: invoiceData.invoice_no,
    invoice_code: invoiceData.invoice_code,
    stored_at: now,
    files: {
      metadata: metadataPath,
      pdf: pdfPath,
      xml: xmlPath
    }
  };

  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  fs.writeFileSync(pdfPath, Buffer.from(pdfContent, 'base64'));
  fs.writeFileSync(xmlPath, generateInvoiceXML(invoiceData));

  return {
    doc_id: docId,
    stored_at: now,
    storage_path: invoiceDir,
    access_url: `/api/documents/invoice/${invoiceId}`
  };
};

export const getInvoiceDocument = (invoiceId) => {
  const invoiceDir = path.join(STORAGE_DIR, 'invoices', invoiceId);
  const metadataPath = path.join(invoiceDir, 'metadata.json');
  
  if (!fs.existsSync(metadataPath)) {
    return null;
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  return metadata;
};

export const linkInvoiceToOrder = (invoiceId, orderNo) => {
  const invoice = db.prepare(`
    SELECT * FROM invoice_requests WHERE id = ?
  `).get(invoiceId);

  if (!invoice) {
    throw new Error('发票不存在');
  }

  if (invoice.order_no !== orderNo) {
    throw new Error('发票与订单号不匹配');
  }

  const order = db.prepare(`
    SELECT * FROM business_orders WHERE order_no = ?
  `).get(orderNo);

  if (!order) {
    throw new Error('订单不存在');
  }

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE business_orders 
    SET status = 'settled'
    WHERE order_no = ?
  `).run(orderNo);

  db.prepare(`
    UPDATE invoice_requests 
    SET settled_at = ?, status = 'settled', updated_at = ?
    WHERE id = ?
  `).run(now, now, invoiceId);

  return {
    invoice_id: invoiceId,
    order_no: orderNo,
    linked_at: now,
    status: 'settled'
  };
};

export const createDeliveryRecord = (params) => {
  const { invoiceId, channel, recipient, operator } = params;
  const deliveryId = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO delivery_records (
      id, invoice_id, channel, recipient, status, created_at, sent_at, read_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    deliveryId,
    invoiceId,
    channel,
    recipient,
    'delivered',
    now,
    now,
    now
  );

  return {
    delivery_id: deliveryId,
    invoice_id: invoiceId,
    channel,
    recipient,
    sent_at: now,
    status: 'delivered'
  };
};

export const getDeliveryHistory = (invoiceId) => {
  return db.prepare(`
    SELECT * FROM delivery_records 
    WHERE invoice_id = ?
    ORDER BY created_at DESC
  `).all(invoiceId);
};

const generateInvoiceXML = (invoiceData) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice>
  <BasicInfo>
    <InvoiceCode>${invoiceData.invoice_code}</InvoiceCode>
    <InvoiceNo>${invoiceData.invoice_no}</InvoiceNo>
    <IssueDate>${invoiceData.issued_at}</IssueDate>
    <CheckCode>${invoiceData.check_code}</CheckCode>
    <MachineNo>${invoiceData.machine_no}</MachineNo>
  </BasicInfo>
  <TaxAuthority>${invoiceData.tax_authority}</TaxAuthority>
  <QRCode>${invoiceData.qr_code}</QRCode>
</Invoice>`;
  return xml;
};

export default {
  storeInvoiceDocument,
  getInvoiceDocument,
  linkInvoiceToOrder,
  createDeliveryRecord,
  getDeliveryHistory
};
