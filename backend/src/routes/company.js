const express = require('express');
const db = require('../db');
const { success, error, paginate } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/info', authMiddleware, (req, res) => {
  const company = db.prepare(`
    SELECT * FROM companies WHERE id = ?
  `).get(req.companyId);
  
  if (!company) {
    return res.json(error('企业不存在'));
  }
  
  res.json(success(company));
});

router.put('/info', authMiddleware, (req, res) => {
  const { name, legal_person, registered_capital, business_scope, address, city, district, longitude, latitude, industry, company_size, logo, description, business_license } = req.body;
  
  db.prepare(`
    UPDATE companies SET
      name = ?, legal_person = ?, registered_capital = ?, business_scope = ?,
      address = ?, city = ?, district = ?, longitude = ?, latitude = ?,
      industry = ?, company_size = ?, logo = ?, description = ?, business_license = ?,
      verification_status = 'pending', updated_at = datetime('now')
    WHERE id = ?
  `).run(name, legal_person, registered_capital, business_scope, address, city, district, longitude, latitude, industry, company_size, logo, description, business_license, req.companyId);
  
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.companyId);
  res.json(success(company, '更新成功，已提交审核'));
});

router.get('/credit', authMiddleware, (req, res) => {
  const company = db.prepare(`
    SELECT id, name, credit_score, compliance_score, risk_level, verification_status, verified_at
    FROM companies WHERE id = ?
  `).get(req.companyId);
  
  const records = db.prepare(`
    SELECT * FROM company_credit_records 
    WHERE company_id = ? 
    ORDER BY created_at DESC 
    LIMIT 20
  `).all(req.companyId);
  
  res.json(success({
    company,
    records
  }));
});

router.get('/verification', authMiddleware, (req, res) => {
  const { unified_social_code } = req.query;
  
  if (!unified_social_code) {
    return res.json(error('请提供统一社会信用代码'));
  }
  
  const mockResult = {
    valid: unified_social_code.length === 18,
    companyName: '智联科技有限公司',
    legalPerson: '张三',
    registeredCapital: '5000万人民币',
    establishmentDate: '2015-01-01',
    status: '存续（在营、开业、在册）',
    address: '杭州市余杭区文一西路969号',
    businessScope: '技术开发、技术服务、技术咨询、成果转让',
    verificationTime: new Date().toISOString()
  };
  
  if (mockResult.valid) {
    db.prepare(`
      UPDATE companies SET
        unified_social_code = ?, name = ?, legal_person = ?,
        registered_capital = ?, establishment_date = ?, business_scope = ?,
        address = ?, verification_status = 'verified', verified_at = datetime('now'),
        credit_score = MIN(credit_score + 10, 100), updated_at = datetime('now')
      WHERE id = ?
    `).run(unified_social_code, mockResult.companyName, mockResult.legalPerson, mockResult.registeredCapital, mockResult.establishmentDate, mockResult.businessScope, mockResult.address, req.companyId);
    
    db.prepare(`
      INSERT INTO company_credit_records (company_id, type, score_change, description, evidence)
      VALUES (?, 'verification', 10, '工商信息核验通过', ?)
    `).run(req.companyId, JSON.stringify(mockResult));
  }
  
  res.json(success(mockResult, mockResult.valid ? '核验通过' : '核验失败'));
});

module.exports = router;
