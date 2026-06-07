import { Router } from 'express';
import db from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'customs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

function generateIntlOrderNo() {
  const prefix = 'INT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

router.post('/order', (req, res) => {
  try {
    const { user_id, customs_info, goods_decl, destination_country, destination_city, declared_value, currency } = req.body;

    if (!user_id || !destination_country) {
      return res.status(400).json({ error: '用户ID和目的地不能为空' });
    }

    const orderNo = generateIntlOrderNo();

    const stmt = db.prepare(`
      INSERT INTO intl_order (order_no, user_id, customs_info, goods_decl, destination_country, destination_city, declared_value, currency)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      orderNo,
      user_id,
      JSON.stringify(customs_info || {}),
      JSON.stringify(goods_decl || {}),
      destination_country,
      destination_city || '',
      declared_value || 0,
      currency || 'USD'
    );

    const order = db.prepare('SELECT * FROM intl_order WHERE id = ?').get(result.lastInsertRowid);
    order.customs_info = JSON.parse(order.customs_info || '{}');
    order.goods_decl = JSON.parse(order.goods_decl || '{}');

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/customs', upload.single('file'), (req, res) => {
  try {
    const { id } = req.params;
    const { doc_type } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' });
    }

    const stmt = db.prepare(`
      INSERT INTO customs_doc (order_id, doc_type, file_path, status)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(id, doc_type || 'general', req.file.path, 'uploaded');

    const doc = db.prepare('SELECT * FROM customs_doc WHERE id = ?').get(result.lastInsertRowid);
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/doc/template', (req, res) => {
  try {
    const { doc_type = 'invoice' } = req.query;

    const templates = {
      invoice: {
        name: '商业发票模板',
        fields: [
          { name: 'shipper', label: '发件人信息', required: true },
          { name: 'consignee', label: '收件人信息', required: true },
          { name: 'goods_desc', label: '货物描述', required: true },
          { name: 'quantity', label: '数量', required: true },
          { name: 'unit_price', label: '单价', required: true },
          { name: 'total_value', label: '总价值', required: true },
          { name: 'currency', label: '币种', required: true },
          { name: 'hs_code', label: 'HS编码', required: false }
        ]
      },
      packing_list: {
        name: '装箱单模板',
        fields: [
          { name: 'shipper', label: '发件人信息', required: true },
          { name: 'consignee', label: '收件人信息', required: true },
          { name: 'package_count', label: '件数', required: true },
          { name: 'gross_weight', label: '毛重', required: true },
          { name: 'net_weight', label: '净重', required: true },
          { name: 'dimensions', label: '尺寸', required: false }
        ]
      },
      declaration: {
        name: '报关单模板',
        fields: [
          { name: 'declarant', label: '申报人信息', required: true },
          { name: 'goods', label: '货物信息', required: true },
          { name: 'quantity', label: '数量', required: true },
          { name: 'value', label: '价值', required: true },
          { name: 'country_of_origin', label: '原产国', required: true }
        ]
      }
    };

    res.json(templates[doc_type] || templates.invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/ticket', (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, subject, description, priority } = req.body;

    if (!user_id || !subject) {
      return res.status(400).json({ error: '用户ID和主题不能为空' });
    }

    const stmt = db.prepare(`
      INSERT INTO consult_ticket (order_id, user_id, subject, description, priority)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(id || null, user_id, subject, description || '', priority || 'normal');

    const ticket = db.prepare('SELECT * FROM consult_ticket WHERE id = ?').get(result.lastInsertRowid);
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tickets/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const tickets = db.prepare('SELECT * FROM consult_ticket WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
