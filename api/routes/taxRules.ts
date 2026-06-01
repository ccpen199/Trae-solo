import express from 'express';
import {
  getAllTaxRules,
  getTaxRuleById,
  getTaxRuleByHSCodeStringAndCountry,
  createTaxRule,
  updateTaxRule,
  deleteTaxRule,
} from '../models/taxRule.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const rules = getAllTaxRules();
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取税率规则列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rule = getTaxRuleById(id);
    if (!rule) {
      return res.status(404).json({ success: false, error: '税率规则不存在' });
    }
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取税率规则失败' });
  }
});

router.get('/lookup/:hsCode/:countryCode', (req, res) => {
  try {
    const { hsCode, countryCode } = req.params;
    const rule = getTaxRuleByHSCodeStringAndCountry(hsCode, countryCode);
    if (!rule) {
      return res.status(404).json({ success: false, error: '未找到匹配的税率规则' });
    }
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: '查询税率规则失败' });
  }
});

router.post('/', (req, res) => {
  try {
    const { hs_code_id, country_code, duty_rate, vat_rate, excise_rate, valid_from, valid_to, version } = req.body;
    if (!hs_code_id || !country_code || duty_rate === undefined || vat_rate === undefined || !valid_from) {
      return res.status(400).json({ success: false, error: '缺少必填字段' });
    }
    const id = createTaxRule({
      hs_code_id,
      country_code,
      duty_rate,
      vat_rate,
      excise_rate,
      valid_from,
      valid_to,
      version: version || 1,
    });
    res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建税率规则失败' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = getTaxRuleById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: '税率规则不存在' });
    }
    updateTaxRule(id, req.body);
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新税率规则失败' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = getTaxRuleById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: '税率规则不存在' });
    }
    deleteTaxRule(id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除税率规则失败' });
  }
});

export default router;
