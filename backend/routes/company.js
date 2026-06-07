import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/list', (req, res) => {
  try {
    const companies = db.prepare('SELECT * FROM express_company WHERE is_active = 1').all();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const company = db.prepare('SELECT * FROM express_company WHERE id = ?').get(req.params.id);
    if (!company) {
      return res.status(404).json({ error: '快递公司不存在' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, code, logo_url, metadata } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: '名称和代码不能为空' });
    }

    const stmt = db.prepare('INSERT INTO express_company (name, code, logo_url, metadata) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name, code, logo_url || '', JSON.stringify(metadata || {}));

    const company = db.prepare('SELECT * FROM express_company WHERE id = ?').get(result.lastInsertRowid);
    res.json(company);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: '该快递公司代码已存在' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.put('/:id', (req, res) => {
  try {
    const { name, logo_url, is_active, metadata } = req.body;
    const stmt = db.prepare('UPDATE express_company SET name = ?, logo_url = ?, is_active = ?, metadata = ? WHERE id = ?');
    stmt.run(name, logo_url || '', is_active, JSON.stringify(metadata || {}), req.params.id);

    const company = db.prepare('SELECT * FROM express_company WHERE id = ?').get(req.params.id);
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
