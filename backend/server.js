require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
if (!fs.existsSync(dbPath)) {
  require('./database/init');
}

const app = express();
const PORT = process.env.BACKEND_PORT || 58844;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48844}`,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

const Database = require('better-sqlite3');
const db = new Database(dbPath);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/contracts', (req, res) => {
  try {
    const contracts = db.prepare('SELECT * FROM contracts ORDER BY created_at DESC').all();
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contracts', (req, res) => {
  try {
    const { contract_no, contract_name, owner_unit, construction_unit, supervision_unit, total_amount } = req.body;
    const result = db.prepare(`
      INSERT INTO contracts (contract_no, contract_name, owner_unit, construction_unit, supervision_unit, total_amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(contract_no, contract_name, owner_unit, construction_unit, supervision_unit, total_amount);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/contracts/:id/sections', (req, res) => {
  try {
    const sections = db.prepare('SELECT * FROM sections WHERE contract_id = ?').all(req.params.id);
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/change-requests', (req, res) => {
  try {
    const changes = db.prepare(`
      SELECT cr.*, c.contract_name, s.section_name,
             (SELECT COUNT(*) FROM change_attachments WHERE change_id = cr.id) as attachment_count
      FROM change_requests cr
      LEFT JOIN contracts c ON cr.contract_id = c.id
      LEFT JOIN sections s ON cr.section_id = s.id
      ORDER BY cr.created_at DESC
    `).all();
    res.json(changes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/change-requests/:id', (req, res) => {
  try {
    const change = db.prepare(`
      SELECT cr.*, c.contract_name, s.section_name
      FROM change_requests cr
      LEFT JOIN contracts c ON cr.contract_id = c.id
      LEFT JOIN sections s ON cr.section_id = s.id
      WHERE cr.id = ?
    `).get(req.params.id);
    
    if (change) {
      change.attachments = db.prepare('SELECT * FROM change_attachments WHERE change_id = ?').all(req.params.id);
    }
    
    res.json(change);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/change-requests', (req, res) => {
  try {
    const { contract_id, section_id, title, change_reason, impact_scope, drawing_reference, estimated_amount, created_by, creator_name } = req.body;
    
    if (!contract_id || !title || !change_reason || !impact_scope || !estimated_amount) {
      return res.status(400).json({ error: '必填项不能为空' });
    }

    const changeNo = 'BG-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    
    const result = db.prepare(`
      INSERT INTO change_requests (change_no, contract_id, section_id, title, change_reason, impact_scope, drawing_reference, estimated_amount, status, created_by, creator_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)
    `).run(changeNo, contract_id, section_id || null, title, change_reason, impact_scope, drawing_reference || null, estimated_amount, created_by || null, creator_name || null);
    
    res.json({ id: result.lastInsertRowid, change_no: changeNo, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/change-requests/:id', (req, res) => {
  try {
    const { contract_id, section_id, title, change_reason, impact_scope, drawing_reference, estimated_amount } = req.body;
    
    db.prepare(`
      UPDATE change_requests 
      SET contract_id = ?, section_id = ?, title = ?, change_reason = ?, impact_scope = ?, drawing_reference = ?, estimated_amount = ?
      WHERE id = ?
    `).run(contract_id, section_id || null, title, change_reason, impact_scope, drawing_reference || null, estimated_amount, req.params.id);
    
    res.json({ id: req.params.id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/change-requests/:id/submit', (req, res) => {
  try {
    const change = db.prepare('SELECT * FROM change_requests WHERE id = ?').get(req.params.id);
    
    if (!change) {
      return res.status(404).json({ error: '变更申请不存在' });
    }

    const attachments = db.prepare('SELECT * FROM change_attachments WHERE change_id = ?').all(req.params.id);
    const hasPhotos = attachments.some(a => a.attachment_type === 'photo');
    const hasDrawings = change.drawing_reference || attachments.some(a => a.attachment_type === 'drawing');

    if (!hasPhotos) {
      return res.status(400).json({ error: '资料不全：必须上传现场照片才能提交审批' });
    }

    db.prepare("UPDATE change_requests SET status = 'pending_approval', submitted_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);

    const workflowResult = db.prepare(`
      INSERT INTO approval_workflows (business_type, business_id, current_stage, overall_status)
      VALUES ('change', ?, 'construction', 'pending')
    `).run(req.params.id);

    const stages = ['construction', 'supervision', 'owner', 'cost'];
    const roles = { construction: '施工单位', supervision: '监理单位', owner: '业主方', cost: '成本部门' };
    
    const insertApproval = db.prepare(`
      INSERT INTO approval_records (workflow_id, stage, approver_role, status)
      VALUES (?, ?, ?, ?)
    `);

    stages.forEach((stage, index) => {
      insertApproval.run(workflowResult.lastInsertRowid, stage, roles[stage], index === 0 ? 'pending' : 'waiting');
    });

    res.json({ success: true, message: '已提交审批' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/change-requests/:id/attachments', (req, res) => {
  try {
    const { file_name, file_path, file_type, file_size, attachment_type } = req.body;
    const result = db.prepare(`
      INSERT INTO change_attachments (change_id, file_name, file_path, file_type, file_size, attachment_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.params.id, file_name, file_path, file_type, file_size, attachment_type);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/change-requests/:id/attachments', (req, res) => {
  try {
    const attachments = db.prepare('SELECT * FROM change_attachments WHERE change_id = ?').all(req.params.id);
    res.json(attachments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/change-requests/:changeId/attachments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM change_attachments WHERE id = ? AND change_id = ?').run(req.params.id, req.params.changeId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/visa-forms', (req, res) => {
  try {
    const visas = db.prepare(`
      SELECT vf.*, c.contract_name, s.section_name, cr.title as change_title,
             (SELECT COUNT(*) FROM visa_attachments WHERE visa_id = vf.id) as attachment_count
      FROM visa_forms vf
      LEFT JOIN contracts c ON vf.contract_id = c.id
      LEFT JOIN sections s ON vf.section_id = s.id
      LEFT JOIN change_requests cr ON vf.change_id = cr.id
      ORDER BY vf.created_at DESC
    `).all();
    res.json(visas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/visa-forms/:id', (req, res) => {
  try {
    const visa = db.prepare(`
      SELECT vf.*, c.contract_name, s.section_name, cr.title as change_title
      FROM visa_forms vf
      LEFT JOIN contracts c ON vf.contract_id = c.id
      LEFT JOIN sections s ON vf.section_id = s.id
      LEFT JOIN change_requests cr ON vf.change_id = cr.id
      WHERE vf.id = ?
    `).get(req.params.id);
    
    if (visa) {
      visa.attachments = db.prepare('SELECT * FROM visa_attachments WHERE visa_id = ?').all(req.params.id);
    }
    
    res.json(visa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/visa-forms', (req, res) => {
  try {
    const { change_request_id, contract_id, item_name, quantity, unit_price, calculation_formula, responsible_unit, description, created_by, creator_name } = req.body;
    
    if (!contract_id || !item_name || !quantity || !unit_price) {
      return res.status(400).json({ error: '必填项不能为空' });
    }

    const total_amount = parseFloat(quantity) * parseFloat(unit_price);
    const visaNo = 'QZ-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    
    const result = db.prepare(`
      INSERT INTO visa_forms (visa_no, change_id, contract_id, project_name, quantity, unit, unit_price, calculation_formula, total_amount, responsible_unit, created_by, creator_name, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `).run(
      visaNo, 
      change_request_id || null, 
      contract_id, 
      item_name, 
      parseFloat(quantity) || 0, 
      '项', 
      parseFloat(unit_price) || 0, 
      calculation_formula || '', 
      total_amount, 
      responsible_unit || '',
      created_by || null,
      creator_name || null
    );
    
    res.json({ id: result.lastInsertRowid, visa_no: visaNo, total_amount, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/visa-forms/:id', (req, res) => {
  try {
    const { change_id, contract_id, section_id, project_name, quantity, unit, unit_price, calculation_formula, responsible_unit } = req.body;
    const total_amount = quantity * unit_price;
    
    db.prepare(`
      UPDATE visa_forms 
      SET change_id = ?, contract_id = ?, section_id = ?, project_name = ?, quantity = ?, unit = ?, unit_price = ?, calculation_formula = ?, total_amount = ?, responsible_unit = ?
      WHERE id = ?
    `).run(change_id || null, contract_id, section_id || null, project_name, quantity, unit, unit_price, calculation_formula, total_amount, responsible_unit, req.params.id);
    
    res.json({ id: req.params.id, total_amount, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/visa-forms/:id/submit', (req, res) => {
  try {
    db.prepare("UPDATE visa_forms SET status = 'pending_cost_review' WHERE id = ?").run(req.params.id);
    res.json({ success: true, message: '已提交造价复核' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/visa-forms/:id/cost-review', (req, res) => {
  try {
    const { action, comment, reviewer_name, adjusted_amount } = req.body;
    
    if (action === 'return') {
      db.prepare(`
        UPDATE visa_forms 
        SET cost_review_status = 'rejected', cost_review_comment = ?, cost_reviewed_at = CURRENT_TIMESTAMP, status = 'returned'
        WHERE id = ?
      `).run(comment, req.params.id);
      res.json({ success: true, message: '已退回修改' });
    } else {
      const finalAmount = adjusted_amount ? parseFloat(adjusted_amount) : null;
      
      if (finalAmount) {
        db.prepare(`
          UPDATE visa_forms 
          SET cost_review_status = 'approved', cost_review_comment = ?, cost_reviewed_at = CURRENT_TIMESTAMP, status = 'pending_approval', total_amount = ?
          WHERE id = ?
        `).run(comment, finalAmount, req.params.id);
      } else {
        db.prepare(`
          UPDATE visa_forms 
          SET cost_review_status = 'approved', cost_review_comment = ?, cost_reviewed_at = CURRENT_TIMESTAMP, status = 'pending_approval'
          WHERE id = ?
        `).run(comment, req.params.id);
      }

      const visa = db.prepare('SELECT total_amount FROM visa_forms WHERE id = ?').get(req.params.id);
      
      const workflowResult = db.prepare(`
        INSERT INTO approval_workflows (business_type, business_id, current_stage, overall_status)
        VALUES ('visa', ?, 'construction', 'pending')
      `).run(req.params.id);

      let stages = ['construction', 'supervision', 'owner'];
      if (visa.total_amount > 100000) {
        stages.push('cost');
      }
      
      const roles = { construction: '施工单位', supervision: '监理单位', owner: '业主方', cost: '成本部门' };
      const insertApproval = db.prepare(`
        INSERT INTO approval_records (workflow_id, stage, approver_role, status, is_escalated)
        VALUES (?, ?, ?, ?, ?)
      `);

      stages.forEach((stage, index) => {
        const isEscalated = stage === 'cost' ? 1 : 0;
        insertApproval.run(workflowResult.lastInsertRowid, stage, roles[stage], index === 0 ? 'pending' : 'waiting', isEscalated);
      });

      res.json({ success: true, message: '造价复核通过，已进入审批流程', escalated: visa.total_amount > 100000 });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/visa-forms/:id/attachments', (req, res) => {
  try {
    const { file_name, file_path, file_type, file_size } = req.body;
    const result = db.prepare(`
      INSERT INTO visa_attachments (visa_id, file_name, file_path, file_type, file_size)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.params.id, file_name, file_path, file_type, file_size);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/visa-forms/:id/attachments', (req, res) => {
  try {
    const attachments = db.prepare('SELECT * FROM visa_attachments WHERE visa_id = ?').all(req.params.id);
    res.json(attachments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/visa-forms/:visaId/attachments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM visa_attachments WHERE id = ? AND visa_id = ?').run(req.params.id, req.params.visaId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/approvals', (req, res) => {
  try {
    const { business_type } = req.query;
    let sql = `
      SELECT aw.*,
        CASE 
          WHEN aw.business_type = 'change' THEN cr.title
          WHEN aw.business_type = 'visa' THEN vf.project_name
        END as business_title,
        CASE 
          WHEN aw.business_type = 'change' THEN cr.estimated_amount
          WHEN aw.business_type = 'visa' THEN vf.total_amount
        END as amount
      FROM approval_workflows aw
      LEFT JOIN change_requests cr ON aw.business_type = 'change' AND aw.business_id = cr.id
      LEFT JOIN visa_forms vf ON aw.business_type = 'visa' AND aw.business_id = vf.id
    `;
    if (business_type) {
      sql += ' WHERE aw.business_type = ?';
    }
    sql += ' ORDER BY aw.created_at DESC';
    
    const workflows = business_type ? db.prepare(sql).all(business_type) : db.prepare(sql).all();
    res.json(workflows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/approvals/:id', (req, res) => {
  try {
    const workflow = db.prepare('SELECT * FROM approval_workflows WHERE id = ?').get(req.params.id);
    if (workflow) {
      workflow.records = db.prepare('SELECT * FROM approval_records WHERE workflow_id = ? ORDER BY id').all(req.params.id);
    }
    res.json(workflow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/approvals/:id/approve', (req, res) => {
  try {
    const { stage, opinion, approver_name, approval_amount } = req.body;
    
    db.prepare(`
      UPDATE approval_records 
      SET status = 'approved', opinion = ?, approver_name = ?, approval_amount = ?, approved_at = CURRENT_TIMESTAMP
      WHERE workflow_id = ? AND stage = ?
    `).run(opinion, approver_name, approval_amount, req.params.id, stage);

    const records = db.prepare('SELECT * FROM approval_records WHERE workflow_id = ? ORDER BY id').all(req.params.id);
    const currentIndex = records.findIndex(r => r.stage === stage);
    
    if (currentIndex < records.length - 1) {
      const nextStage = records[currentIndex + 1].stage;
      db.prepare('UPDATE approval_workflows SET current_stage = ? WHERE id = ?').run(nextStage, req.params.id);
      db.prepare("UPDATE approval_records SET status = 'pending' WHERE workflow_id = ? AND stage = ?").run(req.params.id, nextStage);
      res.json({ success: true, message: '审批通过，进入下一阶段', next_stage: nextStage });
    } else {
      db.prepare("UPDATE approval_workflows SET overall_status = 'approved', current_stage = 'completed' WHERE id = ?").run(req.params.id);
      
      const workflow = db.prepare('SELECT * FROM approval_workflows WHERE id = ?').get(req.params.id);
      if (workflow.business_type === 'change') {
        db.prepare("UPDATE change_requests SET status = 'approved' WHERE id = ?").run(workflow.business_id);
      } else if (workflow.business_type === 'visa') {
        db.prepare("UPDATE visa_forms SET status = 'approved' WHERE id = ?").run(workflow.business_id);
      }
      
      res.json({ success: true, message: '审批完成' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/approvals/:id/reject', (req, res) => {
  try {
    const { stage, opinion, approver_name } = req.body;
    
    db.prepare(`
      UPDATE approval_records 
      SET status = 'rejected', opinion = ?, approver_name = ?, approved_at = CURRENT_TIMESTAMP
      WHERE workflow_id = ? AND stage = ?
    `).run(opinion, approver_name, req.params.id, stage);

    db.prepare("UPDATE approval_workflows SET overall_status = 'rejected', current_stage = ? WHERE id = ?").run(stage, req.params.id);
    
    const workflow = db.prepare('SELECT * FROM approval_workflows WHERE id = ?').get(req.params.id);
    if (workflow.business_type === 'change') {
      db.prepare("UPDATE change_requests SET status = 'rejected' WHERE id = ?").run(workflow.business_id);
    } else if (workflow.business_type === 'visa') {
      db.prepare("UPDATE visa_forms SET status = 'rejected' WHERE id = ?").run(workflow.business_id);
    }
    
    res.json({ success: true, message: '已驳回' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/settlement-basis', (req, res) => {
  try {
    const settlements = db.prepare(`
      SELECT sb.*, c.contract_name, vf.project_name, vf.visa_no, cr.title as change_title
      FROM settlement_basis sb
      LEFT JOIN contracts c ON sb.contract_id = c.id
      LEFT JOIN visa_forms vf ON sb.visa_id = vf.id
      LEFT JOIN change_requests cr ON sb.change_id = cr.id
      ORDER BY sb.created_at DESC
    `).all();
    res.json(settlements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settlement-basis', (req, res) => {
  try {
    const { visa_id, change_id, contract_id, final_amount, adjustment_reason, adjustment_amount } = req.body;
    
    const settlementNo = 'JS-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    
    const result = db.prepare(`
      INSERT INTO settlement_basis (settlement_no, visa_id, change_id, contract_id, final_amount, adjustment_reason, adjustment_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(settlementNo, visa_id, change_id || null, contract_id, final_amount, adjustment_reason || null, adjustment_amount || 0);
    
    res.json({ id: result.lastInsertRowid, settlement_no: settlementNo, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settlement-basis/:id/archive', (req, res) => {
  try {
    db.prepare('UPDATE settlement_basis SET is_archived = 1, archived_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: '已归档' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/settlement-basis/:id', (req, res) => {
  try {
    const settlement = db.prepare(`
      SELECT sb.*, c.contract_name, vf.*, cr.title as change_title, cr.change_no
      FROM settlement_basis sb
      LEFT JOIN contracts c ON sb.contract_id = c.id
      LEFT JOIN visa_forms vf ON sb.visa_id = vf.id
      LEFT JOIN change_requests cr ON sb.change_id = cr.id
      WHERE sb.id = ?
    `).get(req.params.id);
    
    if (settlement) {
      const workflow = db.prepare(`
        SELECT aw.* FROM approval_workflows aw
        WHERE aw.business_type = 'visa' AND aw.business_id = ?
      `).get(settlement.visa_id);
      
      if (workflow) {
        settlement.approval_records = db.prepare('SELECT * FROM approval_records WHERE workflow_id = ?').all(workflow.id);
      }
    }
    
    res.json(settlement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, name, role, department FROM users').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.prepare('SELECT id, username, name, role, department FROM users WHERE username = ? AND password = ?').get(username, password);
    
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, error: '用户名或密码错误' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/stats', (req, res) => {
  try {
    const changeCount = db.prepare('SELECT COUNT(*) as count FROM change_requests').get().count;
    const visaCount = db.prepare('SELECT COUNT(*) as count FROM visa_forms').get().count;
    const pendingApproval = db.prepare("SELECT COUNT(*) as count FROM approval_workflows WHERE overall_status = 'pending'").get().count;
    const totalAmount = db.prepare('SELECT COALESCE(SUM(final_amount), 0) as total FROM settlement_basis').get().total;
    
    res.json({
      change_count: changeCount,
      visa_count: visaCount,
      pending_approval: pendingApproval,
      total_settlement_amount: totalAmount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`);
});
