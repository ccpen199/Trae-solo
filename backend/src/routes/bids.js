const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { checkBusinessRules, logException, addLedgerRecord } = require('../middleware/auth');

function createBidsRouter(db, auth, requirePermission) {
  const router = express.Router();

  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
  });
  const upload = multer({ storage });

  router.get('/', auth, requirePermission(db, 'read', 'bid'), (req, res) => {
    try {
      const { status, owner_id, start_date, end_date, exception_reason, page = 1, pageSize = 20 } = req.query;
      
      let whereClause = ['1=1'];
      let params = [];

      if (status) { whereClause.push('b.status = ?'); params.push(status); }
      if (owner_id) { whereClause.push('b.owner_id = ?'); params.push(parseInt(owner_id)); }
      if (start_date) { whereClause.push('b.created_at >= ?'); params.push(start_date); }
      if (end_date) { whereClause.push('b.created_at <= ?'); params.push(end_date); }
      if (exception_reason) { whereClause.push('b.exception_reason LIKE ?'); params.push(`%${exception_reason}%`); }

      const offset = (page - 1) * pageSize;
      params.push(parseInt(pageSize), offset);

      const bids = db.prepare(`
        SELECT b.*, 
               u1.real_name as creator_name,
               u2.real_name as owner_name,
               rv.version as rule_version,
               COUNT(DISTINCT bi.id) as item_count,
               COUNT(DISTINCT r.id) as response_count,
               COUNT(DISTINCT mc.id) as missing_count
        FROM bids b
        LEFT JOIN users u1 ON b.created_by = u1.id
        LEFT JOIN users u2 ON b.owner_id = u2.id
        LEFT JOIN rule_versions rv ON b.rule_version_id = rv.id
        LEFT JOIN bid_items bi ON b.id = bi.bid_id
        LEFT JOIN responses r ON b.id = r.bid_id
        LEFT JOIN missing_checks mc ON b.id = mc.bid_id AND mc.is_missing = 1
        WHERE ${whereClause.join(' AND ')}
        GROUP BY b.id
        ORDER BY b.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params);

      const total = db.prepare(`
        SELECT COUNT(*) as count FROM bids b WHERE ${whereClause.join(' AND ')}
      `).get(...params.slice(0, -2));

      res.json({ list: bids, total: total.count });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id', auth, requirePermission(db, 'read', 'bid'), (req, res) => {
    try {
      const bid = db.prepare(`
        SELECT b.*, 
               u1.real_name as creator_name,
               u2.real_name as owner_name,
               rv.version as rule_version
        FROM bids b
        LEFT JOIN users u1 ON b.created_by = u1.id
        LEFT JOIN users u2 ON b.owner_id = u2.id
        LEFT JOIN rule_versions rv ON b.rule_version_id = rv.id
        WHERE b.id = ?
      `).get(req.params.id);

      if (!bid) {
        return res.status(404).json({ error: '标书不存在' });
      }

      const items = db.prepare('SELECT * FROM bid_items WHERE bid_id = ? ORDER BY id').all(req.params.id);
      const responses = db.prepare(`
        SELECT r.*, u.real_name as reviewer_name
        FROM responses r
        LEFT JOIN users u ON r.reviewer_id = u.id
        WHERE r.bid_id = ?
      `).all(req.params.id);
      const qualifications = db.prepare(`
        SELECT bq.*, q.name, q.type, q.level, q.status as qual_status, q.expiry_date
        FROM bid_qualifications bq
        JOIN qualifications q ON bq.qualification_id = q.id
        WHERE bq.bid_id = ?
      `).all(req.params.id);
      const missingChecks = db.prepare(`
        SELECT mc.*, u.real_name as resolver_name
        FROM missing_checks mc
        LEFT JOIN users u ON mc.resolved_by = u.id
        WHERE mc.bid_id = ?
      `).all(req.params.id);
      const statusHistory = db.prepare(`
        SELECT st.*, u.real_name as operator_name
        FROM status_transitions st
        LEFT JOIN users u ON st.operator_id = u.id
        WHERE st.bid_id = ?
        ORDER BY st.created_at DESC
      `).all(req.params.id);

      res.json({
        bid,
        items,
        responses,
        qualifications,
        missingChecks,
        statusHistory
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/', auth, requirePermission(db, 'create', 'bid'), (req, res) => {
    try {
      const { project_name, purchaser, bid_deadline, budget_amount, owner_id } = req.body;
      
      if (!project_name) {
        return res.status(400).json({ error: '项目名称必填' });
      }

      const activeRule = db.prepare('SELECT * FROM rule_versions WHERE is_active = 1').get();
      const bidNo = `BID-${Date.now()}`;

      const result = db.prepare(`
        INSERT INTO bids (bid_no, project_name, purchaser, bid_deadline, budget_amount, 
                          rule_version_id, created_by, owner_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')
      `).run(
        bidNo, project_name, purchaser || null, bid_deadline || null, budget_amount || null,
        activeRule?.id || null, req.user.id, owner_id || req.user.id
      );

      addLedgerRecord(db, {
        bid_id: result.lastInsertRowid,
        action_type: 'create',
        action_detail: `创建标书: ${project_name}`,
        status: 'success',
        operator_id: req.user.id,
        owner_id: owner_id || req.user.id,
        rule_version: activeRule?.version
      });

      db.prepare(`
        INSERT INTO status_transitions (bid_id, from_status, to_status, transition_reason, operator_id)
        VALUES (?, 'none', 'draft', '创建标书', ?)
      `).run(result.lastInsertRowid, req.user.id);

      res.json({ id: result.lastInsertRowid, bid_no: bidNo });
    } catch (error) {
      logException(db, {
        operation: 'create_bid',
        error_type: 'database',
        error_message: error.message,
        raw_request: req.body,
        operator_id: req.user?.id
      });
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:id/upload', auth, upload.single('file'), (req, res) => {
    try {
      const bidId = req.params.id;
      const ruleCheck = checkBusinessRules(db, bidId, 'upload');
      
      if (!ruleCheck.valid) {
        return res.status(400).json({ error: ruleCheck.reason });
      }

      if (!req.file) {
        return res.status(400).json({ error: '未上传文件' });
      }

      db.prepare(`
        UPDATE bids 
        SET attachment_path = ?, status = 'uploaded', current_node = 'parsing', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.file.path, bidId);

      db.prepare(`
        INSERT INTO attachments (bid_id, file_name, file_path, file_size, file_type, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(bidId, req.file.originalname, req.file.path, req.file.size, req.file.mimetype, req.user.id);

      db.prepare(`
        INSERT INTO status_transitions (bid_id, from_status, to_status, transition_reason, operator_id)
        VALUES (?, 'draft', 'uploaded', '上传招标文件', ?)
      `).run(bidId, req.user.id);

      addLedgerRecord(db, {
        bid_id: bidId,
        action_type: 'upload',
        action_detail: `上传文件: ${req.file.originalname}`,
        status: 'success',
        operator_id: req.user.id,
        rule_version: ruleCheck.activeRule?.version
      });

      res.json({ success: true, file: req.file });
    } catch (error) {
      logException(db, {
        bid_id: req.params.id,
        operation: 'upload_file',
        error_type: 'upload',
        error_message: error.message,
        operator_id: req.user?.id
      });
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:id/parse', auth, requirePermission(db, 'parse', 'bid'), (req, res) => {
    try {
      const bidId = req.params.id;
      const ruleCheck = checkBusinessRules(db, bidId, 'parse');
      
      if (!ruleCheck.valid) {
        return res.status(400).json({ error: ruleCheck.reason });
      }

      const { simulate_error } = req.body;
      
      if (simulate_error === 'pdf_parse_failure') {
        logException(db, {
          bid_id: bidId,
          operation: 'parse_bid',
          error_type: 'pdf_parse_failure',
          error_message: 'PDF表格解析失败: 表格结构复杂，无法识别列边界',
          raw_request: JSON.stringify(req.body),
          operator_id: req.user.id
        });
        addLedgerRecord(db, {
          bid_id: bidId,
          action_type: 'parse',
          action_detail: '标书解析失败',
          status: 'failed',
          operator_id: req.user.id,
          exception_reason: 'PDF表格解析失败',
          rule_version: ruleCheck.activeRule?.version
        });
        return res.status(400).json({ error: 'PDF表格解析失败: 表格结构复杂，无法识别列边界' });
      }

      const parsedItems = [
        { section: '商务部分', item_no: '1.1', item_content: '企业营业执照', score_weight: 5, requirement_level: 'basic', is_required: 1 },
        { section: '商务部分', item_no: '1.2', item_content: '近三年财务审计报告', score_weight: 8, requirement_level: 'basic', is_required: 1 },
        { section: '商务部分', item_no: '1.3', item_content: 'ISO9001质量管理体系认证', score_weight: 6, requirement_level: 'preferred', is_required: 0 },
        { section: '技术部分', item_no: '2.1', item_content: '项目实施方案', score_weight: 15, requirement_level: 'core', is_required: 1 },
        { section: '技术部分', item_no: '2.2', item_content: '项目经理资质要求', score_weight: 10, requirement_level: 'core', is_required: 1 },
        { section: '技术部分', item_no: '2.3', item_content: '类似项目业绩', score_weight: 12, requirement_level: 'core', is_required: 1 },
        { section: '资质要求', item_no: '3.1', item_content: '建筑工程施工总承包一级资质', score_weight: 20, requirement_level: 'basic', is_required: 1 },
        { section: '资质要求', item_no: '3.2', item_content: '安全生产许可证', score_weight: 10, requirement_level: 'basic', is_required: 1 },
        { section: '价格部分', item_no: '4.1', item_content: '报价合理性', score_weight: 14, requirement_level: 'core', is_required: 1 }
      ];

      const insertItem = db.prepare(`
        INSERT INTO bid_items (bid_id, section, item_no, item_content, score_weight, requirement_level, is_required, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
      `);

      parsedItems.forEach(item => {
        insertItem.run(bidId, item.section, item.item_no, item.item_content, item.score_weight, item.requirement_level, item.is_required);
      });

      const missingItems = [
        { check_type: 'document', item_name: '法人授权委托书', severity: 'error', suggestion: '请上传法定代表人签字的授权委托书' },
        { check_type: 'document', item_name: '投标保证金凭证', severity: 'warning', suggestion: '确认是否已缴纳投标保证金' }
      ];

      const insertMissing = db.prepare(`
        INSERT INTO missing_checks (bid_id, check_type, item_name, severity, suggestion)
        VALUES (?, ?, ?, ?, ?)
      `);

      missingItems.forEach(item => {
        insertMissing.run(bidId, item.check_type, item.item_name, item.severity, item.suggestion);
      });

      db.prepare(`
        UPDATE bids 
        SET status = 'parsed', current_node = 'matching', previous_node = 'upload', previous_conclusion = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(bidId);

      db.prepare(`
        INSERT INTO status_transitions (bid_id, from_status, to_status, transition_reason, operator_id)
        VALUES (?, 'uploaded', 'parsed', '标书解析完成', ?)
      `).run(bidId, req.user.id);

      addLedgerRecord(db, {
        bid_id: bidId,
        action_type: 'parse',
        action_detail: `解析完成，提取 ${parsedItems.length} 个评分项`,
        status: 'success',
        operator_id: req.user.id,
        rule_version: ruleCheck.activeRule?.version,
        metadata_json: { item_count: parsedItems.length }
      });

      res.json({ success: true, items: parsedItems, missing_count: missingItems.length });
    } catch (error) {
      logException(db, {
        bid_id: req.params.id,
        operation: 'parse_bid',
        error_type: 'parse_error',
        error_message: error.message,
        raw_request: JSON.stringify(req.body),
        operator_id: req.user?.id
      });
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:id/match', auth, requirePermission(db, 'match', 'qualification'), (req, res) => {
    try {
      const bidId = req.params.id;
      const ruleCheck = checkBusinessRules(db, bidId, 'match');
      
      if (!ruleCheck.valid) {
        return res.status(400).json({ error: ruleCheck.reason });
      }

      const { simulate_error } = req.body;
      
      if (simulate_error === 'version_conflict') {
        logException(db, {
          bid_id: bidId,
          operation: 'match_qualification',
          error_type: 'version_conflict',
          error_message: '版本冲突: 检测到其他用户已更新此标书',
          raw_request: JSON.stringify(req.body),
          operator_id: req.user.id
        });
        return res.status(409).json({ error: '版本冲突: 检测到其他用户已更新此标书，请刷新后重试' });
      }

      const qualifications = db.prepare('SELECT * FROM qualifications').all();
      const matchedQuals = [];

      const insertMatch = db.prepare(`
        INSERT INTO bid_qualifications (bid_id, qualification_id, match_score, is_required, status, remark)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      qualifications.forEach(qual => {
        let matchScore = 0;
        let status = 'matched';
        let remark = '';

        if (qual.name.includes('建筑工程')) {
          matchScore = 95;
        } else if (qual.name.includes('ISO9001')) {
          matchScore = 88;
        } else if (qual.name.includes('高新技术')) {
          matchScore = 75;
        } else {
          matchScore = 60;
        }

        if (qual.status === 'expired') {
          status = 'warning';
          remark = '资质已过期';
        }

        insertMatch.run(bidId, qual.id, matchScore, qual.type === '施工资质' ? 1 : 0, status, remark);
        matchedQuals.push({ ...qual, matchScore, status, remark });
      });

      db.prepare(`
        UPDATE bids 
        SET status = 'matched', current_node = 'responding', previous_node = 'parsing', previous_conclusion = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(bidId);

      db.prepare(`
        INSERT INTO status_transitions (bid_id, from_status, to_status, transition_reason, operator_id)
        VALUES (?, 'parsed', 'matched', '资质匹配完成', ?)
      `).run(bidId, req.user.id);

      addLedgerRecord(db, {
        bid_id: bidId,
        action_type: 'match',
        action_detail: `资质匹配完成，共匹配 ${matchedQuals.length} 项资质`,
        status: 'success',
        operator_id: req.user.id,
        rule_version: ruleCheck.activeRule?.version,
        metadata_json: { matched_count: matchedQuals.length }
      });

      res.json({ success: true, qualifications: matchedQuals });
    } catch (error) {
      logException(db, {
        bid_id: req.params.id,
        operation: 'match_qualification',
        error_type: 'match_error',
        error_message: error.message,
        raw_request: JSON.stringify(req.body),
        operator_id: req.user?.id
      });
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:id/generate', auth, requirePermission(db, 'generate', 'response'), (req, res) => {
    try {
      const bidId = req.params.id;
      const ruleCheck = checkBusinessRules(db, bidId, 'generate');
      
      if (!ruleCheck.valid) {
        return res.status(400).json({ error: ruleCheck.reason });
      }

      const { simulate_error } = req.body;
      
      if (simulate_error === 'missing_answers') {
        logException(db, {
          bid_id: bidId,
          operation: 'generate_response',
          error_type: 'missing_answers',
          error_message: '检测到评分项漏答: 项目经理资质要求、类似项目业绩未生成响应',
          raw_request: JSON.stringify(req.body),
          operator_id: req.user.id
        });
        addLedgerRecord(db, {
          bid_id: bidId,
          action_type: 'generate',
          action_detail: '响应生成存在漏答项',
          status: 'warning',
          operator_id: req.user.id,
          exception_reason: '评分项漏答',
          rule_version: ruleCheck.activeRule?.version
        });
        return res.status(400).json({ 
          error: '检测到评分项漏答',
          missing_items: ['项目经理资质要求', '类似项目业绩']
        });
      }

      const items = db.prepare('SELECT * FROM bid_items WHERE bid_id = ?').all(bidId);
      const responses = [];

      const insertResponse = db.prepare(`
        INSERT INTO responses (bid_item_id, bid_id, ai_generated, content, status, created_by)
        VALUES (?, ?, ?, ?, 'draft', ?)
      `);

      items.forEach(item => {
        const aiContent = `针对【${item.item_content}】的AI生成响应：\n\n1. 企业具备相应的资质和能力\n2. 提供相关证明材料\n3. 满足招标文件要求\n\n此响应由AI自动生成，请人工审核后使用。`;
        
        insertResponse.run(item.id, bidId, aiContent, aiContent, req.user.id);
        responses.push({ bid_item_id: item.id, content: aiContent });
      });

      db.prepare(`
        UPDATE bids 
        SET status = 'generated', current_node = 'reviewing', previous_node = 'responding', previous_conclusion = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(bidId);

      db.prepare(`
        INSERT INTO status_transitions (bid_id, from_status, to_status, transition_reason, operator_id)
        VALUES (?, 'matched', 'generated', '响应生成完成', ?)
      `).run(bidId, req.user.id);

      addLedgerRecord(db, {
        bid_id: bidId,
        action_type: 'generate',
        action_detail: `生成 ${responses.length} 条响应内容`,
        status: 'success',
        operator_id: req.user.id,
        rule_version: ruleCheck.activeRule?.version
      });

      res.json({ success: true, responses });
    } catch (error) {
      logException(db, {
        bid_id: req.params.id,
        operation: 'generate_response',
        error_type: 'generate_error',
        error_message: error.message,
        raw_request: JSON.stringify(req.body),
        operator_id: req.user?.id
      });
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:id/review', auth, requirePermission(db, 'review', 'response'), (req, res) => {
    try {
      const bidId = req.params.id;
      const { response_id, status, comment } = req.body;

      if (!response_id || !status) {
        return res.status(400).json({ error: '参数不完整' });
      }

      db.prepare(`
        UPDATE responses 
        SET status = ?, review_comment = ?, reviewer_id = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ? AND bid_id = ?
      `).run(status, comment || null, req.user.id, response_id, bidId);

      addLedgerRecord(db, {
        bid_id: bidId,
        action_type: 'review',
        action_detail: `审核响应 #${response_id}: ${status}`,
        status: 'success',
        operator_id: req.user.id,
        reviewer_id: req.user.id
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:id/export', auth, requirePermission(db, 'export', 'bid'), (req, res) => {
    try {
      const bidId = req.params.id;
      const ruleCheck = checkBusinessRules(db, bidId, 'export');
      
      if (!ruleCheck.valid) {
        return res.status(400).json({ error: ruleCheck.reason });
      }

      const bid = db.prepare('SELECT * FROM bids WHERE id = ?').get(bidId);
      const items = db.prepare('SELECT * FROM bid_items WHERE bid_id = ?').all(bidId);
      const responses = db.prepare('SELECT * FROM responses WHERE bid_id = ?').all(bidId);
      const qualifications = db.prepare(`
        SELECT bq.*, q.name FROM bid_qualifications bq JOIN qualifications q ON bq.qualification_id = q.id WHERE bq.bid_id = ?
      `).all(bidId);

      const exportData = {
        bid,
        items,
        responses,
        qualifications,
        export_time: new Date().toISOString(),
        exported_by: req.user.real_name
      };

      db.prepare(`
        UPDATE bids 
        SET status = 'exported', current_node = 'completed', previous_node = 'reviewing', previous_conclusion = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(bidId);

      db.prepare(`
        INSERT INTO status_transitions (bid_id, from_status, to_status, transition_reason, operator_id)
        VALUES (?, ?, 'exported', '标书导出完成', ?)
      `).run(bidId, bid.status, req.user.id);

      addLedgerRecord(db, {
        bid_id: bidId,
        action_type: 'export',
        action_detail: '标书导出完成',
        status: 'success',
        operator_id: req.user.id,
        rule_version: ruleCheck.activeRule?.version
      });

      res.json({ 
        success: true, 
        data: exportData,
        message: '导出数据已生成，可下载'
      });
    } catch (error) {
      logException(db, {
        bid_id: req.params.id,
        operation: 'export_bid',
        error_type: 'export_error',
        error_message: error.message,
        raw_request: JSON.stringify(req.body),
        operator_id: req.user?.id
      });
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/:id', auth, requirePermission(db, 'update', 'bid'), (req, res) => {
    try {
      const bidId = req.params.id;
      const { project_name, purchaser, bid_deadline, budget_amount, owner_id } = req.body;

      db.prepare(`
        UPDATE bids 
        SET project_name = ?, purchaser = ?, bid_deadline = ?, budget_amount = ?, owner_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(project_name, purchaser || null, bid_deadline || null, budget_amount || null, owner_id || req.user.id, bidId);

      addLedgerRecord(db, {
        bid_id: bidId,
        action_type: 'update',
        action_detail: `更新标书信息: ${project_name}`,
        status: 'success',
        operator_id: req.user.id,
        owner_id: owner_id
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createBidsRouter;
