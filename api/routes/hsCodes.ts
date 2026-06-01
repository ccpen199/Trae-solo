import express from 'express';
import {
  getAllHSCodes,
  getHSCodeById,
  getHSCodeByCode,
  searchHSCodes,
  createHSCode,
  updateHSCode,
  deactivateHSCode,
} from '../models/hsCode.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const codes = getAllHSCodes();
    res.json({ success: true, data: codes });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取 HS 编码列表失败' });
  }
});

router.get('/search', (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ success: false, error: '搜索关键词不能为空' });
    }
    const codes = searchHSCodes(query);
    res.json({ success: true, data: codes });
  } catch (error) {
    res.status(500).json({ success: false, error: '搜索失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const code = getHSCodeById(id);
    if (!code) {
      return res.status(404).json({ success: false, error: 'HS 编码不存在' });
    }
    res.json({ success: true, data: code });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取 HS 编码失败' });
  }
});

router.get('/code/:hsCode', (req, res) => {
  try {
    const hsCode = req.params.hsCode;
    const code = getHSCodeByCode(hsCode);
    if (!code) {
      return res.status(404).json({ success: false, error: 'HS 编码不存在' });
    }
    res.json({ success: true, data: code });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取 HS 编码失败' });
  }
});

router.post('/', (req, res) => {
  try {
    const { hs_code, category, material, description, version } = req.body;
    if (!hs_code || !category) {
      return res.status(400).json({ success: false, error: 'HS 编码和分类为必填项' });
    }
    const id = createHSCode({
      hs_code,
      category,
      material,
      description,
      version: version || 1,
    });
    res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建 HS 编码失败' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = getHSCodeById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'HS 编码不存在' });
    }
    updateHSCode(id, req.body);
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新 HS 编码失败' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = getHSCodeById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'HS 编码不存在' });
    }
    deactivateHSCode(id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除 HS 编码失败' });
  }
});

export default router;
