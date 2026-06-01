const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 53361;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 43361}`,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const Database = require('better-sqlite3');
const fs = require('fs');
const dbPath = path.resolve(__dirname, '../data/app.sqlite');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const logOperation = (userId, userName, operation, module, params = null, result = null) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO operation_logs (id, user_id, user_name, operation, module, params, result)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(uuidv4(), userId, userName, operation, module, JSON.stringify(params), JSON.stringify(result));
  } catch (e) {
    console.error('操作日志记录失败:', e);
  }
};

const addNegotiationRecord = (negotiationId, action, status, operatorId, operatorName, content, reason = null, nextAction = null, metadata = null) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO negotiation_records (id, negotiation_id, action, status, operator_id, operator_name, content, reason, next_action, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(uuidv4(), negotiationId, action, status, operatorId, operatorName, content, reason, nextAction, metadata ? JSON.stringify(metadata) : null);
  } catch (e) {
    console.error('谈判记录添加失败:', e);
  }
};

const saveVersion = (tableName, recordId, data, changedBy, changeReason = null) => {
  try {
    const maxVersion = db.prepare(`SELECT MAX(version) as max FROM history_versions WHERE table_name = ? AND record_id = ?`)
      .get(tableName, recordId);
    const version = (maxVersion?.max || 0) + 1;
    
    const stmt = db.prepare(`
      INSERT INTO history_versions (id, table_name, record_id, version, data, changed_by, change_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(uuidv4(), tableName, recordId, version, JSON.stringify(data), changedBy, changeReason);
  } catch (e) {
    console.error('版本保存失败:', e);
  }
};

const createException = (negotiationId, exceptionType, title, description, severity) => {
  try {
    const existing = db.prepare(`
      SELECT id FROM exception_handlings 
      WHERE negotiation_id = ? AND exception_type = ? AND status != 'closed'
    `).get(negotiationId, exceptionType);
    
    if (existing) {
      return existing.id;
    }
    
    const autoBlock = severity === 'high';
    const status = autoBlock ? 'auto_blocked' : 'pending';
    const handleResult = autoBlock ? 'auto_blocked' : null;
    
    const stmt = db.prepare(`
      INSERT INTO exception_handlings (id, negotiation_id, exception_type, title, description, severity, status, handle_result, detected_at, is_auto_blocked)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const id = uuidv4();
    stmt.run(id, negotiationId, exceptionType, title, description, severity, status, handleResult, new Date().toISOString(), autoBlock ? 1 : 0);
    
    if (autoBlock) {
      addNegotiationRecord(negotiationId, 'auto_block', 'blocked', 'system', '系统',
        `系统自动拦截: ${title}`, description, '需人工介入处理后方可继续');
      
      db.prepare(`
        UPDATE negotiations SET status = 'blocked', updated_at = ? WHERE id = ?
      `).run(new Date().toISOString(), negotiationId);
    }
    
    logOperation('system', '系统', autoBlock ? '自动拦截异常' : '自动检测异常', 'exception', 
      { id, negotiationId, exceptionType, title, severity, autoBlock });
    
    return id;
  } catch (e) {
    console.error('异常创建失败:', e);
    return null;
  }
};

const checkBlockedExceptions = (negotiationId) => {
  const blocked = db.prepare(`
    SELECT COUNT(*) as count FROM exception_handlings 
    WHERE negotiation_id = ? AND status = 'auto_blocked' AND is_auto_blocked = 1
  `).get(negotiationId);
  return blocked.count > 0;
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), port: PORT });
});

app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
    res.json({ success: true, data: users });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, u.name as owner_name 
      FROM purchase_categories c 
      LEFT JOIN users u ON c.owner_id = u.id 
      WHERE c.status = 'active'
      ORDER BY c.code
    `).all();
    res.json({ success: true, data: categories });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/suppliers', (req, res) => {
  try {
    const { risk_level } = req.query;
    let sql = 'SELECT * FROM suppliers WHERE status = ?';
    const params = ['active'];
    if (risk_level) {
      sql += ' AND risk_level = ?';
      params.push(risk_level);
    }
    sql += ' ORDER BY name';
    const suppliers = db.prepare(sql).all(...params);
    res.json({ success: true, data: suppliers });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/price-history', (req, res) => {
  try {
    const { category_id, supplier_id } = req.query;
    let sql = `
      SELECT ph.*, pc.name as category_name, s.name as supplier_name, u.name as creator_name
      FROM price_history ph
      LEFT JOIN purchase_categories pc ON ph.category_id = pc.id
      LEFT JOIN suppliers s ON ph.supplier_id = s.id
      LEFT JOIN users u ON ph.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    if (category_id) {
      sql += ' AND ph.category_id = ?';
      params.push(category_id);
    }
    if (supplier_id) {
      sql += ' AND ph.supplier_id = ?';
      params.push(supplier_id);
    }
    sql += ' ORDER BY ph.effective_date DESC LIMIT 100';
    const history = db.prepare(sql).all(...params);
    res.json({ success: true, data: history });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/negotiations', (req, res) => {
  try {
    const { status, category_id, supplier_id, owner_id, keyword } = req.query;
    let sql = `
      SELECT n.*, pc.name as category_name, u.name as owner_name, a.name as auditor_name
      FROM negotiations n
      LEFT JOIN purchase_categories pc ON n.category_id = pc.id
      LEFT JOIN users u ON n.owner_id = u.id
      LEFT JOIN users a ON n.auditor_id = a.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND n.status = ?';
      params.push(status);
    }
    if (category_id) {
      sql += ' AND n.category_id = ?';
      params.push(category_id);
    }
    if (supplier_id) {
      sql += ' AND n.supplier_id = ?';
      params.push(supplier_id);
    }
    if (owner_id) {
      sql += ' AND n.owner_id = ?';
      params.push(owner_id);
    }
    if (keyword) {
      sql += ' AND (n.title LIKE ? OR n.code LIKE ? OR n.supplier_name LIKE ?)';
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }
    sql += ' ORDER BY n.created_at DESC LIMIT 100';
    
    const negotiations = db.prepare(sql).all(...params);
    res.json({ success: true, data: negotiations });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/negotiations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const negotiation = db.prepare(`
      SELECT n.*, pc.name as category_name, u.name as owner_name, a.name as auditor_name,
             c.name as creator_name
      FROM negotiations n
      LEFT JOIN purchase_categories pc ON n.category_id = pc.id
      LEFT JOIN users u ON n.owner_id = u.id
      LEFT JOIN users a ON n.auditor_id = a.id
      LEFT JOIN users c ON n.created_by = c.id
      WHERE n.id = ?
    `).get(id);
    
    if (!negotiation) {
      return res.status(404).json({ success: false, error: '谈判记录不存在' });
    }
    
    const details = db.prepare('SELECT * FROM negotiation_details WHERE negotiation_id = ?').all(id);
    const records = db.prepare('SELECT * FROM negotiation_records WHERE negotiation_id = ? ORDER BY created_at ASC').all(id);
    const exceptions = db.prepare('SELECT * FROM exception_handlings WHERE negotiation_id = ?').all(id);
    const attachments = db.prepare('SELECT * FROM attachments WHERE negotiation_id = ?').all(id);
    
    const versions = db.prepare(`
      SELECT * FROM history_versions 
      WHERE table_name = 'negotiations' AND record_id = ? 
      ORDER BY version DESC
    `).all(id);
    
    res.json({
      success: true,
      data: {
        ...negotiation,
        details,
        records,
        exceptions,
        attachments,
        versions
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/negotiations', (req, res) => {
  try {
    const { title, category_id, supplier_id, supplier_name, expected_amount, target_price, priority, owner_id, details, created_by } = req.body;
    
    const code = `NGT${new Date().toISOString().slice(0, 7).replace('-', '')}${String(Date.now()).slice(-4)}`;
    const id = uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO negotiations (id, code, title, category_id, supplier_id, supplier_name, expected_amount, target_price, priority, owner_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, code, title, category_id, supplier_id, supplier_name, expected_amount, target_price, priority || 'medium', owner_id, created_by);
    
    if (details && details.length > 0) {
      const detailStmt = db.prepare(`
        INSERT INTO negotiation_details (id, negotiation_id, item_name, spec, unit, quantity, quoted_price, quoted_amount, historical_avg_price, target_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      details.forEach(d => {
        detailStmt.run(
          uuidv4(), id, d.item_name, d.spec, d.unit, d.quantity, d.quoted_price,
          d.quantity * d.quoted_price, d.historical_avg_price, d.target_price
        );
      });
    }
    
    addNegotiationRecord(id, 'create', 'draft', created_by, req.body.creator_name || '用户', '创建谈判项目', null, '提交审核');
    logOperation(created_by, req.body.creator_name || '用户', '创建谈判', 'negotiation', { id, code });
    
    res.json({ success: true, data: { id, code } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/negotiations/:id/price-compare', (req, res) => {
  try {
    const { id } = req.params;
    const { operator_id, operator_name } = req.body;
    
    const negotiation = db.prepare('SELECT * FROM negotiations WHERE id = ?').get(id);
    if (!negotiation) {
      return res.status(404).json({ success: false, error: '谈判记录不存在' });
    }
    
    const details = db.prepare('SELECT * FROM negotiation_details WHERE negotiation_id = ?').all(id);
    
    const priceHistory = db.prepare(`
      SELECT item_name, spec, AVG(price) as avg_price
      FROM price_history 
      WHERE category_id = ? AND supplier_id = ?
      GROUP BY item_name, spec
    `).all(negotiation.category_id, negotiation.supplier_id);
    
    const results = details.map(d => {
      const history = priceHistory.find(p => p.item_name === d.item_name);
      const avgPrice = history?.avg_price || d.quoted_price;
      const deviation = ((d.quoted_price - avgPrice) / avgPrice * 100).toFixed(2);
      
      db.prepare(`
        UPDATE negotiation_details 
        SET historical_avg_price = ?, price_deviation = ?
        WHERE id = ?
      `).run(avgPrice, deviation, d.id);
      
      return {
        item_name: d.item_name,
        quoted_price: d.quoted_price,
        historical_avg_price: avgPrice,
        deviation: deviation,
        is_normal: Math.abs(deviation) <= 5
      };
    });
    
    const hasAbnormal = results.some(r => !r.is_normal);
    const abnormalItems = results.filter(r => !r.is_normal);
    const alerts = hasAbnormal ? abnormalItems.map(r => `${r.item_name}价格偏差${r.deviation}%`).join('; ') : null;
    
    if (alerts) {
      db.prepare('UPDATE negotiations SET risk_alerts = ? WHERE id = ?').run(alerts, id);
    }
    
    if (hasAbnormal) {
      abnormalItems.forEach(item => {
        if (Math.abs(item.deviation) > 10) {
          createException(id, 'price', `价格严重偏离: ${item.item_name}`, 
            `${item.item_name}报价${item.quoted_price}元，历史平均${item.historical_avg_price.toFixed(2)}元，偏差${item.deviation}%`,
            'high');
        } else if (Math.abs(item.deviation) > 5) {
          createException(id, 'price', `价格偏离预警: ${item.item_name}`,
            `${item.item_name}报价${item.quoted_price}元，历史平均${item.historical_avg_price.toFixed(2)}元，偏差${item.deviation}%`,
            'medium');
        }
      });
    }
    
    addNegotiationRecord(id, 'price_compare', negotiation.status, operator_id || 'system', operator_name || '系统', 
      `价格对比完成，${hasAbnormal ? '发现' + abnormalItems.length + '项价格异常，已自动创建异常记录' : '价格正常'}`, 
      null, hasAbnormal ? '人工复核' : '继续', { comparison_results: results });
    
    logOperation(operator_id, operator_name, '价格对比', 'negotiation', { id, results });
    
    res.json({ success: true, data: { results, hasAbnormal, alerts } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/negotiations/:id/risk-check', (req, res) => {
  try {
    const { id } = req.params;
    const { operator_id, operator_name } = req.body;
    
    const negotiation = db.prepare('SELECT * FROM negotiations WHERE id = ?').get(id);
    if (!negotiation) {
      return res.status(404).json({ success: false, error: '谈判记录不存在' });
    }
    
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(negotiation.supplier_id);
    const risks = db.prepare('SELECT * FROM supplier_risks WHERE supplier_id = ? AND status != ?').all(negotiation.supplier_id, 'resolved');
    
    const hasRisk = supplier?.risk_level === 'high' || supplier?.risk_level === 'medium' || risks.length > 0;
    
    const riskSummary = {
      supplier_risk_level: supplier?.risk_level,
      credit_rating: supplier?.credit_rating,
      active_risks: risks.length,
      risk_details: risks
    };
    
    if (hasRisk) {
      const alerts = `供应商${supplier.name}风险等级: ${supplier.risk_level}, 信用评级: ${supplier.credit_rating}, 待处理风险: ${risks.length}项`;
      db.prepare('UPDATE negotiations SET risk_alerts = COALESCE(risk_alerts || "; ", "") || ? WHERE id = ?').run(alerts, id);
      
      if (supplier?.risk_level === 'high') {
        createException(id, 'supplier', `供应商高风险: ${supplier.name}`,
          `供应商${supplier.name}风险等级为高，信用评级${supplier.credit_rating}，待处理风险${risks.length}项`,
          'high');
      } else if (supplier?.risk_level === 'medium') {
        createException(id, 'supplier', `供应商风险预警: ${supplier.name}`,
          `供应商${supplier.name}风险等级为中，信用评级${supplier.credit_rating}，待处理风险${risks.length}项`,
          'medium');
      }
      
      if (risks.length > 0) {
        risks.forEach(risk => {
          createException(id, 'supplier_risk', `风险事项: ${risk.risk_type}`,
            `风险等级: ${risk.severity}, 描述: ${risk.description}, 发现日期: ${risk.detected_date}`,
            risk.severity === 'high' ? 'high' : 'medium');
        });
      }
    }
    
    addNegotiationRecord(id, 'risk_check', negotiation.status, operator_id || 'system', operator_name || '系统',
      `风险检查完成，${hasRisk ? '发现风险，已自动创建异常记录' : '无风险'}`,
      null, hasRisk ? '人工复核' : '继续', riskSummary);
    
    logOperation(operator_id, operator_name, '风险检查', 'negotiation', { id, riskSummary });
    
    res.json({ success: true, data: { hasRisk, ...riskSummary } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/negotiations/:id/generate-strategy', (req, res) => {
  try {
    const { id } = req.params;
    const { operator_id, operator_name } = req.body;
    
    const negotiation = db.prepare('SELECT * FROM negotiations WHERE id = ?').get(id);
    if (!negotiation) {
      return res.status(404).json({ success: false, error: '谈判记录不存在' });
    }
    
    const details = db.prepare('SELECT * FROM negotiation_details WHERE negotiation_id = ?').all(id);
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(negotiation.supplier_id);
    
    const avgDeviation = details.reduce((sum, d) => sum + (d.price_deviation || 0), 0) / (details.length || 1);
    
    const strategy = {
      priceStrategy: '',
      riskControl: '',
      paymentTerms: '',
      deliveryTerms: '',
      suggestions: []
    };
    
    if (avgDeviation > 3) {
      strategy.priceStrategy = `报价高于历史平均${avgDeviation.toFixed(1)}%，建议降价目标3-5%`;
      strategy.suggestions.push('参考历史价格，提出降价要求');
    } else if (avgDeviation > 0) {
      strategy.priceStrategy = `报价略高于历史平均，建议争取2%左右优惠`;
    } else {
      strategy.priceStrategy = '报价合理，可重点关注其他条款';
    }
    
    if (supplier?.risk_level === 'high' || supplier?.risk_level === 'medium') {
      strategy.riskControl = '供应商风险较高，要求增加质保条款或预付款比例降低';
      strategy.suggestions.push('增加履约保证金条款');
    } else {
      strategy.riskControl = '供应商风险可控，按常规条款执行';
    }
    
    strategy.paymentTerms = '建议首付30%，验收后付65%，5%质保金';
    strategy.deliveryTerms = '建议明确延迟交付违约金条款';
    
    if (strategy.suggestions.length === 0) {
      strategy.suggestions.push('整体情况良好，可按计划推进谈判');
    }
    
    db.prepare('UPDATE negotiations SET negotiation_strategy = ? WHERE id = ?')
      .run(JSON.stringify(strategy), id);
    
    addNegotiationRecord(id, 'strategy_generate', negotiation.status, operator_id || 'system', operator_name || '系统',
      '谈判策略已生成', null, '提交审核', strategy);
    
    logOperation(operator_id, operator_name, '生成策略', 'negotiation', { id, strategy });
    
    res.json({ success: true, data: strategy });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/negotiations/:id/submit', (req, res) => {
  try {
    const { id } = req.params;
    const { operator_id, operator_name, auditor_id } = req.body;
    
    const negotiation = db.prepare('SELECT * FROM negotiations WHERE id = ?').get(id);
    if (!negotiation) {
      return res.status(404).json({ success: false, error: '谈判记录不存在' });
    }
    
    if (negotiation.status === 'blocked') {
      return res.status(400).json({ success: false, error: '谈判已被系统拦截，请先处理异常后再提交' });
    }
    
    if (checkBlockedExceptions(id)) {
      return res.status(400).json({ success: false, error: '存在未处理的严重异常，请先处理后再提交' });
    }
    
    if (negotiation.status !== 'draft') {
      return res.status(400).json({ success: false, error: '只有草稿状态可以提交' });
    }
    
    saveVersion('negotiations', id, negotiation, operator_id, '提交审核前版本');
    
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE negotiations 
      SET status = 'submitted', auditor_id = ?, submitted_at = ?, updated_at = ?
      WHERE id = ?
    `).run(auditor_id || 'user_003', now, now, id);
    
    addNegotiationRecord(id, 'submit', 'submitted', operator_id, operator_name, '提交审核', null, '审核人员审核');
    
    logOperation(operator_id, operator_name, '提交谈判', 'negotiation', { id });
    
    res.json({ success: true, data: { status: 'submitted' } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/negotiations/:id/review', (req, res) => {
  try {
    const { id } = req.params;
    const { operator_id, operator_name, action, reason, final_price, final_amount } = req.body;
    
    const negotiation = db.prepare('SELECT * FROM negotiations WHERE id = ?').get(id);
    if (!negotiation) {
      return res.status(404).json({ success: false, error: '谈判记录不存在' });
    }
    
    if (negotiation.status === 'blocked') {
      return res.status(400).json({ success: false, error: '谈判已被系统拦截，请先处理异常后再审核' });
    }
    
    if (checkBlockedExceptions(id)) {
      return res.status(400).json({ success: false, error: '存在未处理的严重异常，请先处理后再审核' });
    }
    
    if (negotiation.status !== 'submitted' && negotiation.status !== 'reviewing') {
      return res.status(400).json({ success: false, error: '当前状态无法审核' });
    }
    
    const now = new Date().toISOString();
    let newStatus;
    let nextAction;
    let recordAction;
    
    if (action === 'approve') {
      newStatus = 'executing';
      nextAction = '执行谈判';
      recordAction = 'review';
      
      db.prepare(`
        UPDATE negotiations 
        SET status = ?, reviewed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(newStatus, now, now, id);
    } else if (action === 'return') {
      newStatus = 'returned';
      nextAction = '修改后重新提交';
      recordAction = 'return';
      
      db.prepare(`
        UPDATE negotiations 
        SET status = ?, updated_at = ?
        WHERE id = ?
      `).run(newStatus, now, id);
    } else if (action === 'complete') {
      newStatus = 'completed';
      nextAction = '归档';
      recordAction = 'review';
      
      db.prepare(`
        UPDATE negotiations 
        SET status = ?, final_price = ?, final_amount = ?, reviewed_at = ?, completed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(newStatus, final_price, final_amount, now, now, now, id);
    } else {
      return res.status(400).json({ success: false, error: '无效的审核操作' });
    }
    
    addNegotiationRecord(id, recordAction, newStatus, operator_id, operator_name,
      action === 'approve' ? '审核通过' : action === 'return' ? '审核退回' : '审核完成',
      reason, nextAction);
    
    logOperation(operator_id, operator_name, `审核${action === 'approve' ? '通过' : action === 'return' ? '退回' : '完成'}`, 'negotiation', { id, reason });
    
    res.json({ success: true, data: { status: newStatus } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/negotiations/:id/close', (req, res) => {
  try {
    const { id } = req.params;
    const { operator_id, operator_name, reason } = req.body;
    
    const negotiation = db.prepare('SELECT * FROM negotiations WHERE id = ?').get(id);
    if (!negotiation) {
      return res.status(404).json({ success: false, error: '谈判记录不存在' });
    }
    
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE negotiations 
      SET status = 'closed', close_reason = ?, updated_at = ?
      WHERE id = ?
    `).run(reason, now, id);
    
    addNegotiationRecord(id, 'close', 'closed', operator_id, operator_name, '关闭谈判项目', reason, '已关闭');
    
    logOperation(operator_id, operator_name, '关闭谈判', 'negotiation', { id, reason });
    
    res.json({ success: true, data: { status: 'closed' } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/dashboard/stats', (req, res) => {
  try {
    const statusStats = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM negotiations 
      GROUP BY status
    `).all();
    
    const categoryStats = db.prepare(`
      SELECT pc.name as category_name, COUNT(*) as count, SUM(expected_amount) as total_amount
      FROM negotiations n
      LEFT JOIN purchase_categories pc ON n.category_id = pc.id
      GROUP BY n.category_id
    `).all();
    
    const monthlyStats = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, 
             COUNT(*) as count, 
             SUM(CASE WHEN status = 'completed' THEN final_amount ELSE expected_amount END) as amount
      FROM negotiations
      WHERE created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month
    `).all();
    
    const totalNegotiations = db.prepare('SELECT COUNT(*) as count FROM negotiations').get().count;
    const totalAmount = db.prepare('SELECT SUM(COALESCE(final_amount, expected_amount, 0)) as total FROM negotiations').get().total;
    const completedRate = db.prepare(`
      SELECT ROUND(
        (SELECT COUNT(*) FROM negotiations WHERE status IN ('completed', 'closed')) * 100.0 / 
        (SELECT COUNT(*) FROM negotiations WHERE status NOT IN ('draft')),
        1
      ) as rate
    `).get().rate || 0;
    
    res.json({
      success: true,
      data: {
        statusStats,
        categoryStats,
        monthlyStats,
        summary: {
          totalNegotiations,
          totalAmount: totalAmount || 0,
          completedRate
        }
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/configurations', (req, res) => {
  try {
    const { config_type } = req.query;
    let sql = `
      SELECT c.*, u.name as creator_name
      FROM configurations c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    if (config_type) {
      sql += ' AND c.config_type = ?';
      params.push(config_type);
    }
    sql += ' ORDER BY c.created_at DESC';
    
    const configs = db.prepare(sql).all(...params);
    res.json({ success: true, data: configs });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/configurations', (req, res) => {
  try {
    const { config_key, config_value, config_type, category_id, description, valid_from, valid_to, is_enabled, created_by } = req.body;
    
    const existing = db.prepare('SELECT id FROM configurations WHERE config_key = ?').get(config_key);
    if (existing) {
      return res.status(400).json({ success: false, error: '配置键已存在' });
    }
    
    if (['category_rule', 'owner', 'permission', 'status'].includes(config_type)) {
      if (!created_by || created_by !== 'user_001') {
        return res.status(403).json({ success: false, error: '无权限创建此类型配置' });
      }
    }
    
    const id = uuidv4();
    db.prepare(`
      INSERT INTO configurations (id, config_key, config_value, config_type, category_id, description, valid_from, valid_to, is_enabled, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, config_key, config_value, config_type, category_id, description, valid_from, valid_to, is_enabled ? 1 : 0, created_by);
    
    logOperation(created_by, '用户', '创建配置', 'configuration', { config_key, config_type });
    
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/configurations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { config_value, valid_from, valid_to, is_enabled, updated_by } = req.body;
    
    const config = db.prepare('SELECT * FROM configurations WHERE id = ?').get(id);
    if (!config) {
      return res.status(404).json({ success: false, error: '配置不存在' });
    }
    
    if (['category_rule', 'owner', 'permission', 'status'].includes(config.config_type)) {
      if (!updated_by || updated_by !== 'user_001') {
        return res.status(403).json({ success: false, error: '无权限修改此配置' });
      }
    }
    
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE configurations 
      SET config_value = ?, valid_from = ?, valid_to = ?, is_enabled = ?, updated_at = ?
      WHERE id = ?
    `).run(config_value, valid_from, valid_to, is_enabled ? 1 : 0, now, id);
    
    logOperation(updated_by, '用户', '修改配置', 'configuration', { id, config_key: config.config_key });
    
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/exceptions', (req, res) => {
  try {
    const { negotiation_id, status } = req.query;
    let sql = `
      SELECT e.*, n.title as negotiation_title, n.code as negotiation_code,
             u.name as handler_name
      FROM exception_handlings e
      LEFT JOIN negotiations n ON e.negotiation_id = n.id
      LEFT JOIN users u ON e.handler_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (negotiation_id) {
      sql += ' AND e.negotiation_id = ?';
      params.push(negotiation_id);
    }
    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY e.detected_at DESC, e.created_at DESC';
    
    const exceptions = db.prepare(sql).all(...params);
    res.json({ success: true, data: exceptions });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/exceptions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, handle_result, handler_id, handler_name, remarks } = req.body;
    
    const existing = db.prepare('SELECT * FROM exception_handlings WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: '异常记录不存在' });
    }
    
    const wasBlocked = existing.status === 'auto_blocked';
    const isResolved = status === 'resolved' || status === 'closed';
    
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE exception_handlings 
      SET status = ?, handle_result = ?, handler_id = ?, handler_name = ?, remarks = ?, handled_at = ?
      WHERE id = ?
    `).run(status, handle_result, handler_id, handler_name, remarks, now, id);
    
    if (wasBlocked && isResolved) {
      const stillBlocked = checkBlockedExceptions(existing.negotiation_id);
      if (!stillBlocked) {
        const negotiation = db.prepare('SELECT status FROM negotiations WHERE id = ?').get(existing.negotiation_id);
        const originalStatus = negotiation.status === 'blocked' ? 'draft' : negotiation.status;
        
        db.prepare(`
          UPDATE negotiations SET status = ?, updated_at = ? WHERE id = ?
        `).run(originalStatus, now, existing.negotiation_id);
        
        addNegotiationRecord(existing.negotiation_id, 'unblock', originalStatus,
          handler_id, handler_name,
          '人工介入解除拦截，谈判恢复正常',
          remarks,
          '可继续流程');
      }
    }
    
    addNegotiationRecord(existing.negotiation_id, 'exception_handle', status, 
      handler_id || 'system', handler_name || '系统', 
      `异常处理: ${existing.title} - ${handle_result}`, 
      remarks, 
      status === 'resolved' ? '已解决' : status === 'closed' ? '已关闭' : '继续处理');
    
    logOperation(handler_id, handler_name, '处理异常', 'exception', { id, status, handle_result });
    
    res.json({ success: true, data: { id, status, unblocked: wasBlocked && isResolved } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/negotiations/:id/unblock', (req, res) => {
  try {
    const { id } = req.params;
    const { operator_id, operator_name, reason } = req.body;
    
    const negotiation = db.prepare('SELECT * FROM negotiations WHERE id = ?').get(id);
    if (!negotiation) {
      return res.status(404).json({ success: false, error: '谈判记录不存在' });
    }
    
    const exceptions = db.prepare(`
      UPDATE exception_handlings 
      SET status = 'manual_review', handle_result = 'manual_review', 
          handler_id = ?, handler_name = ?, handled_at = ?, remarks = ?
      WHERE negotiation_id = ? AND status = 'auto_blocked'
    `).run(operator_id, operator_name, new Date().toISOString(), reason || '人工介入处理', id);
    
    db.prepare(`
      UPDATE negotiations SET status = 'draft', updated_at = ? WHERE id = ?
    `).run(new Date().toISOString(), id);
    
    addNegotiationRecord(id, 'manual_unblock', 'draft',
      operator_id, operator_name,
      '人工强制解除拦截',
      reason,
      '可继续流程（风险需人工把控）');
    
    logOperation(operator_id, operator_name, '人工解除拦截', 'negotiation', { id, reason });
    
    res.json({ success: true, data: { status: 'draft' } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/exceptions', (req, res) => {
  try {
    const { negotiation_id, exception_type, description, result_type, handler_id, remarks } = req.body;
    
    const id = uuidv4();
    db.prepare(`
      INSERT INTO exception_handlings (id, negotiation_id, exception_type, description, result_type, handler_id, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, negotiation_id, exception_type, description, result_type, handler_id, remarks);
    
    const negotiation = db.prepare('SELECT status FROM negotiations WHERE id = ?').get(negotiation_id);
    
    addNegotiationRecord(negotiation_id, 'execute', negotiation?.status || 'reviewing', 
      handler_id || 'system', '系统', 
      `异常处理: ${exception_type} - ${result_type}`, 
      description, 
      result_type === 'manual_review' ? '人工复核' : result_type === 'closed' ? '已关闭' : '继续观察');
    
    logOperation(handler_id, '用户', '创建异常处理', 'exception', { negotiation_id, exception_type, result_type });
    
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/operation-logs', (req, res) => {
  try {
    const { user_id, module, limit = 100 } = req.query;
    let sql = 'SELECT * FROM operation_logs WHERE 1=1';
    const params = [];
    
    if (user_id) {
      sql += ' AND user_id = ?';
      params.push(user_id);
    }
    if (module) {
      sql += ' AND module = ?';
      params.push(module);
    }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const logs = db.prepare(sql).all(...params);
    res.json({ success: true, data: logs });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/export/negotiations', (req, res) => {
  try {
    const negotiations = db.prepare(`
      SELECT n.code, n.title, n.supplier_name, pc.name as category_name, 
             n.expected_amount, n.final_amount, n.status, n.priority,
             u.name as owner_name, n.created_at, n.completed_at
      FROM negotiations n
      LEFT JOIN purchase_categories pc ON n.category_id = pc.id
      LEFT JOIN users u ON n.owner_id = u.id
      ORDER BY n.created_at DESC
    `).all();
    
    const statusMap = {
      draft: '草稿', submitted: '已提交', executing: '执行中',
      reviewing: '审核中', returned: '已退回', completed: '已完成', closed: '已关闭'
    };
    
    const data = negotiations.map(n => ({
      编号: n.code,
      标题: n.title,
      供应商: n.supplier_name,
      采购品类: n.category_name,
      预算金额: n.expected_amount,
      最终金额: n.final_amount,
      状态: statusMap[n.status] || n.status,
      优先级: n.priority === 'high' ? '高' : n.priority === 'medium' ? '中' : '低',
      负责人: n.owner_name,
      创建时间: n.created_at,
      完成时间: n.completed_at
    }));
    
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ success: false, error: err.message });
});

const checkPort = (port) => {
  try {
    const { execSync } = require('child_process');
    const result = execSync(`lsof -ti tcp:${port} 2>/dev/null || echo ""`).toString().trim();
    return result === '' ? null : result;
  } catch (e) {
    return null;
  }
};

const startServer = () => {
  const port = process.env.BACKEND_PORT || 53361;
  const occupied = checkPort(port);
  
  if (!occupied) {
    const server = app.listen(port, '127.0.0.1', () => {
      console.log(`\n========================================`);
      console.log(`  后端服务启动成功!`);
      console.log(`  地址: http://127.0.0.1:${port}`);
      console.log(`  API:  http://127.0.0.1:${port}/api`);
      console.log(`  健康检查: http://127.0.0.1:${port}/api/health`);
      console.log(`========================================\n`);
    });
    
    server.on('error', (e) => {
      console.error('启动失败:', e);
      process.exit(1);
    });
    
    return;
  }
  
  console.error('\n========================================');
  console.error(`  错误: 端口 ${port} 被 PID ${occupied} 占用!`);
  console.error('  请手动释放端口后重试');
  console.error('========================================\n');
  process.exit(1);
};

startServer();
