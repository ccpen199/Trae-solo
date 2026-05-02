import { v4 as uuidv4 } from 'uuid';

const INVOICE_CODE_PREFIX = '0110';

export const generateInvoice = (request) => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const invoiceNo = `INV${timestamp.toString().slice(-10)}`;
  const invoiceCode = `${INVOICE_CODE_PREFIX}${Math.random().toString(10).slice(2, 10)}`;
  
  const invoiceData = {
    invoice_no: invoiceNo,
    invoice_code: invoiceCode,
    invoice_url: `/invoices/pdf/${invoiceNo}.pdf`,
    qr_code: `https://inv-veri.chinatax.gov.cn/${invoiceNo}`,
    issued_at: new Date().toISOString(),
    check_code: generateCheckCode(),
    machine_no: `00${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    tax_authority: '国家税务总局'
  };

  return invoiceData;
};

export const generateInvoicePDF = (request, invoiceData) => {
  const pdfContent = {
    title: '增值税电子专用发票',
    invoice_code: invoiceData.invoice_code,
    invoice_no: invoiceData.invoice_no,
    date: invoiceData.issued_at,
    check_code: invoiceData.check_code,
    machine_no: invoiceData.machine_no,
    purchaser: {
      name: request.invoice_title,
      tax_no: request.tax_no,
      bank_account: request.bank_account || '',
      bank_name: request.bank_name || '',
      address: request.address || '',
      phone: request.phone || ''
    },
    seller: {
      name: '开票方企业有限公司',
      tax_no: '91110000MA001ABC12',
      bank_account: '11001234567890123456',
      bank_name: '中国建设银行北京分行',
      address: '北京市朝阳区建国路88号',
      phone: '010-12345678'
    },
    items: JSON.parse(request.items),
    amount: request.amount,
    tax_amount: request.amount * 0.13,
    total_amount: request.amount * 1.13,
    remarks: request.remarks || '',
    payee: '张三',
    reviewer: '李四',
    issuer: '开票系统',
    tax_authority: invoiceData.tax_authority
  };

  return Buffer.from(JSON.stringify(pdfContent, null, 2)).toString('base64');
};

const generateCheckCode = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 20; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default { generateInvoice, generateInvoicePDF };
