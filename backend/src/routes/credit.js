const express = require('express');
const router = express.Router();
const { db } = require('../models/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.resolve(__dirname, process.env.UPLOAD_DIR || '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });

const getMetaForRecord = (record) => {
  const metaMap = {
    '行政处罚': {
      source: '全国建筑市场监管公共服务平台',
      sourceUrl: 'http://jzsc.mohurd.gov.cn',
      regulation: '《建筑市场信用管理暂行办法》（建市〔2017〕241号）',
      regulationUrl: 'http://jzsj.ryzf.jiangsu.gov.cn/art/2018/1/5/art_69275_7428087.html'
    },
    '失信被执行人': {
      source: '中国执行信息公开网',
      sourceUrl: 'http://zxgk.court.gov.cn',
      regulation: '《关于对失信被执行人实施联合惩戒的合作备忘录》（发改财金〔2016〕141号）',
      regulationUrl: 'https://www.ndrc.gov.cn/fzggw/jgsj/cgss/sfgz/201601/t20160120_1164904.html'
    },
    '经营异常': {
      source: '国家企业信用信息公示系统',
      sourceUrl: 'http://www.gsxt.gov.cn',
      regulation: '《企业经营异常名录管理暂行办法》（国家工商行政管理总局令第68号）',
      regulationUrl: 'https://www.samr.gov.cn/zwgk/fgwj/jyfgs/201410/t20141020_140650.html'
    },
    '拖欠农民工工资': {
      source: '全国根治拖欠农民工工资工作领导小组办公室',
      sourceUrl: 'http://www.mohrss.gov.cn',
      regulation: '《保障农民工工资支付条例》（国务院令第724号）',
      regulationUrl: 'https://www.gov.cn/zhengce/content/2020-01/07/content_5467238.htm'
    },
    '重大税收违法': {
      source: '国家税务总局重大税收违法失信案件信息公布栏',
      sourceUrl: 'http://www.chinatax.gov.cn',
      regulation: '《重大税收违法失信主体信息公布管理办法》（国家税务总局令第54号）',
      regulationUrl: 'http://www.chinatax.gov.cn/chinatax/n810341/n810755/c5169731/content.html'
    },
    '信用优良': {
      source: '全国建筑市场监管公共服务平台',
      sourceUrl: 'http://jzsc.mohurd.gov.cn',
      regulation: '《建筑市场信用管理暂行办法》（建市〔2017〕241号）',
      regulationUrl: 'http://jzsj.ryzf.jiangsu.gov.cn/art/2018/1/5/art_69275_7428087.html'
    }
  };
  
  const meta = metaMap[record.credit_type] || {
    source: '全国建筑市场监管公共服务平台',
    sourceUrl: 'http://jzsc.mohurd.gov.cn',
    regulation: '《建筑市场信用管理暂行办法》（建市〔2017〕241号）',
    regulationUrl: 'http://jzsj.ryzf.jiangsu.gov.cn/art/2018/1/5/art_69275_7428087.html'
  };
  
  return {
    ...meta,
    updatedAt: record.updated_at || record.created_at,
    dataFetchedAt: new Date().toISOString()
  };
};

router.get('/credit-records', (req, res) => {
  const { status, repairStatus, page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let sql = `
    SELECT c.*, e.name as enterprise_name, e.unified_social_credit,
           julianday(c.display_deadline) - julianday('now') as days_remaining
    FROM credit_records c
    JOIN enterprises e ON c.enterprise_id = e.id
    WHERE 1=1
  `;
  let countSql = `SELECT COUNT(*) as count FROM credit_records WHERE 1=1`;
  let params = [];
  let countParams = [];
  
  if (status) {
    sql += ` AND c.status = ?`;
    countSql += ` AND status = ?`;
    params.push(status);
    countParams.push(status);
  }
  
  if (repairStatus) {
    sql += ` AND c.repair_status = ?`;
    countSql += ` AND repair_status = ?`;
    params.push(repairStatus);
    countParams.push(repairStatus);
  }
  
  sql += ` ORDER BY c.effective_date DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(pageSize), offset);
  
  const list = db.prepare(sql).all(...params);
  const { count } = db.prepare(countSql).get(...countParams);
  
  res.json({
    list: list.map(item => ({
      ...item,
      days_remaining: Math.max(0, Math.floor(item.days_remaining || 0)),
      _meta: getMetaForRecord(item)
    })),
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.post('/:id/apply-repair', upload.single('proof'), (req, res) => {
  const { id } = req.params;
  const { applicant, description } = req.body;
  
  const record = db.prepare(`SELECT * FROM credit_records WHERE id = ?`).get(id);
  if (!record) {
    return res.status(404).json({ error: '信用记录不存在' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: '请上传主管部门盖章证明文件' });
  }
  
  const now = new Date().toISOString();
  
  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE credit_records
      SET repair_status = '待审核',
          repair_proof = ?
      WHERE id = ?
    `).run(req.file.path, id);
    
    const result = db.prepare(`
      INSERT INTO credit_repair_applications (
        credit_record_id, enterprise_id, applicant, description,
        proof_file, status, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      record.enterprise_id,
      applicant || '系统用户',
      description || '申请信用修复，已完成整改并提交证明材料',
      req.file.path,
      'pending',
      now
    );
    
    return result.lastInsertRowid;
  });
  
  try {
    const applicationId = tx();
    res.json({
      success: true,
      applicationId,
      message: '修复申请已提交，等待人工复核',
      proofPath: req.file.path
    });
  } catch (e) {
    res.status(500).json({ error: '提交修复申请失败: ' + e.message });
  }
});

router.get('/repair-pending', (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;
  
  const list = db.prepare(`
    SELECT a.*, c.description as credit_description, c.credit_type,
           c.display_deadline, c.effective_date,
           e.name as enterprise_name, e.unified_social_credit
    FROM credit_repair_applications a
    JOIN credit_records c ON a.credit_record_id = c.id
    JOIN enterprises e ON a.enterprise_id = e.id
    WHERE a.status = 'pending'
    ORDER BY a.submitted_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(pageSize), offset);
  
  const { count } = db.prepare(`
    SELECT COUNT(*) as count FROM credit_repair_applications WHERE status = 'pending'
  `).get();
  
  res.json({
    list,
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.post('/:id/review-repair', (req, res) => {
  const { id } = req.params;
  const { approved, reviewComment, reviewerId } = req.body;
  
  const application = db.prepare(`
    SELECT a.*, c.repair_status
    FROM credit_repair_applications a
    JOIN credit_records c ON a.credit_record_id = c.id
    WHERE a.id = ?
  `).get(id);
  
  if (!application) {
    return res.status(404).json({ error: '修复申请不存在' });
  }
  
  if (application.status !== 'pending') {
    return res.status(400).json({ error: '该申请已完成审核' });
  }
  
  const now = new Date().toISOString();
  const newStatus = approved ? 'approved' : 'rejected';
  const creditRecordStatus = approved ? '已修复' : '审核不通过';
  const creditStatus = approved ? '已修复' : undefined;
  
  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE credit_repair_applications
      SET status = ?,
          review_comment = ?,
          reviewed_by = ?,
          reviewed_at = ?
      WHERE id = ?
    `).run(newStatus, reviewComment || '', reviewerId || 1, now, id);
    
    const updateCreditSql = creditStatus
      ? `UPDATE credit_records SET repair_status = ?, status = ?, repair_reviewed_by = ?, repair_reviewed_at = ? WHERE id = ?`
      : `UPDATE credit_records SET repair_status = ?, repair_reviewed_by = ?, repair_reviewed_at = ? WHERE id = ?`;
    
    const updateParams = creditStatus
      ? [creditRecordStatus, creditStatus, reviewerId || 1, now, application.credit_record_id]
      : [creditRecordStatus, reviewerId || 1, now, application.credit_record_id];
    
    db.prepare(updateCreditSql).run(...updateParams);
  });
  
  try {
    tx();
    res.json({
      success: true,
      message: approved ? '修复审核通过，信用记录已更新' : '修复审核不通过'
    });
  } catch (e) {
    res.status(500).json({ error: '审核失败: ' + e.message });
  }
});

router.get('/repair-applications', (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let sql = `
    SELECT a.*, c.description as credit_description, c.credit_type,
           c.display_deadline, c.effective_date, c.status as credit_status,
           e.name as enterprise_name, e.unified_social_credit
    FROM credit_repair_applications a
    JOIN credit_records c ON a.credit_record_id = c.id
    JOIN enterprises e ON a.enterprise_id = e.id
    WHERE 1=1
  `;
  let countSql = `SELECT COUNT(*) as count FROM credit_repair_applications WHERE 1=1`;
  let params = [];
  let countParams = [];
  
  if (status) {
    sql += ` AND a.status = ?`;
    countSql += ` AND status = ?`;
    params.push(status);
    countParams.push(status);
  }
  
  sql += ` ORDER BY a.submitted_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(pageSize), offset);
  
  const list = db.prepare(sql).all(...params);
  const { count } = db.prepare(countSql).get(...countParams);
  
  const statusMap = {
    'pending': '待审核',
    'approved': '已通过',
    'rejected': '已驳回'
  };
  
  res.json({
    list: list.map(item => ({
      ...item,
      status_text: statusMap[item.status] || item.status
    })),
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/:id/countdown', (req, res) => {
  const record = db.prepare(`
    SELECT *, julianday(display_deadline) - julianday('now') as days_remaining
    FROM credit_records WHERE id = ?
  `).get(req.params.id);
  
  if (!record) {
    return res.status(404).json({ error: '信用记录不存在' });
  }
  
  const daysRemaining = Math.max(0, Math.floor(record.days_remaining || 0));
  const hoursRemaining = Math.max(0, Math.floor((record.days_remaining - daysRemaining) * 24));
  const minutesRemaining = Math.max(0, Math.floor(((record.days_remaining - daysRemaining) * 24 - hoursRemaining) * 60));
  
  res.json({
    id: record.id,
    creditType: record.credit_type,
    description: record.description,
    displayDeadline: record.display_deadline,
    daysRemaining,
    hoursRemaining,
    minutesRemaining,
    isExpired: daysRemaining <= 0,
    regulation: '根据《建筑市场信用管理暂行办法》，失信信息公示期限为3年，期满自动下架'
  });
});

module.exports = router;
