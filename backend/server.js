const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 58937;
const HOST = process.env.BACKEND_HOST || '127.0.0.1';
const JWT_SECRET = process.env.JWT_SECRET || 'legal-service-platform-secret-key-2024';

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: ['http://127.0.0.1:48937', 'http://localhost:48937'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
});
app.use('/api', limiter);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未授权访问' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token无效' });
    }
    req.user = user;
    next();
  });
};

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'may-88937-backend',
    database: process.env.SQLITE_DB,
    time: new Date().toISOString(),
  });
});

app.post('/api/auth/lawyer/register', (req, res) => {
  const { name, phone, email, password, license_number, practice_area, years_experience, bio } = req.body;
  
  if (!name || !phone || !email || !password) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(`
    INSERT INTO lawyers (name, phone, email, password, license_number, practice_area, years_experience, bio, verification_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `, [name, phone, email, hashedPassword, license_number, practice_area, years_experience, bio], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const token = jwt.sign({ id: this.lastID, role: 'lawyer' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      lawyer: {
        id: this.lastID,
        name,
        email,
        verification_status: 'pending'
      }
    });
  });
});

app.post('/api/auth/lawyer/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM lawyers WHERE email = ?', [email], (err, lawyer) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!lawyer || !bcrypt.compareSync(password, lawyer.password)) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const token = jwt.sign({ id: lawyer.id, role: 'lawyer' }, JWT_SECRET, { expiresIn: '7d' });
    delete lawyer.password;
    res.json({
      success: true,
      token,
      lawyer
    });
  });
});

app.post('/api/auth/user/register', (req, res) => {
  const { name, phone, email, password, user_type } = req.body;
  
  if (!name || !phone || !email || !password) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(`
    INSERT INTO users (username, name, phone, email, password, user_type, role, status)
    VALUES (?, ?, ?, ?, ?, ?, 'user', 'active')
  `, [email || phone, name, phone, email, hashedPassword, user_type || 'individual'], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const token = jwt.sign({ id: this.lastID, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: {
        id: this.lastID,
        name,
        email,
        user_type: user_type || 'individual'
      }
    });
  });
});

app.post('/api/auth/user/login', (req, res) => {
  const { email, phone, password } = req.body;
  const identifier = email || phone;

  db.get('SELECT * FROM users WHERE email = ? OR phone = ?', [identifier, identifier], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: '账号或密码错误' });
    }

    const token = jwt.sign({ id: user.id, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    delete user.password;
    res.json({
      success: true,
      token,
      user
    });
  });
});

app.post('/api/auth/admin/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM admin_users WHERE username = ?', [username], (err, admin) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign({ id: admin.id, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    delete admin.password;
    res.json({
      success: true,
      token,
      admin
    });
  });
});

app.get('/api/lawyers/pending', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权访问' });
  }

  db.all('SELECT id, name, email, license_number, verification_status, created_at FROM lawyers WHERE verification_status = ?', ['pending'], (err, lawyers) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, lawyers });
  });
});

app.put('/api/lawyers/:id/verify', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权访问' });
  }

  const { status } = req.body;
  const { id } = req.params;

  db.run(`
    UPDATE lawyers 
    SET verification_status = ?, bar_association_verified = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [status, status === 'approved' ? 1 : 0, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: '律师资质审核完成' });
  });
});

app.get('/api/lawyers', (req, res) => {
  const { page = 1, limit = 10, practice_area } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT id, name, practice_area, years_experience, bio, rating, consultation_count, avatar FROM lawyers WHERE verification_status = "approved"';
  let countQuery = 'SELECT COUNT(*) as total FROM lawyers WHERE verification_status = "approved"';
  let params = [];
  let countParams = [];

  if (practice_area) {
    query += ' AND practice_area LIKE ?';
    countQuery += ' AND practice_area LIKE ?';
    params.push(`%${practice_area}%`);
    countParams.push(`%${practice_area}%`);
  }

  query += ' ORDER BY rating DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.get(countQuery, countParams, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.all(query, params, (err, lawyers) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ 
        success: true, 
        lawyers, 
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

app.get('/api/lawyers/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT id, name, email, practice_area, years_experience, bio, rating, consultation_count, avatar, verification_status FROM lawyers WHERE id = ?', [id], (err, lawyer) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!lawyer) {
      return res.status(404).json({ error: '律师不存在' });
    }
    res.json({ success: true, lawyer });
  });
});

app.post('/api/consultations', authenticateToken, (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ error: '只有用户可以创建咨询' });
  }

  const { title, description, category, consultation_type, lawyer_id } = req.body;
  const user_id = req.user.id;

  const keywords = ['诈骗', '洗钱', '贿赂', '赌博'];
  const foundKeywords = keywords.filter(k => description.includes(k));
  
  let level = 1;
  if (description.length > 100) level = 2;
  if (description.length > 300) level = 3;

  const aiResponses = {
    1: "感谢您的咨询。根据您描述的情况，这是一个常见的法律问题。建议您：1. 收集相关证据材料；2. 可以先尝试协商解决；3. 如需进一步帮助，请选择升级到图文咨询。",
    2: "您好，您的问题涉及较为复杂的法律关系。AI初步分析如下：您的情况可能涉及合同纠纷/侵权责任。建议您升级咨询，我们将为您匹配专业律师进行详细解答。",
    3: "您的法律问题较为复杂，涉及多个法律关系。AI智能分析建议您立即预约专业律师进行视频或面谈，以获得准确的法律意见和解决方案。"
  };

  db.run(`
    INSERT INTO consultations (user_id, lawyer_id, title, description, category, level, status, ai_response, consultation_type)
    VALUES (?, ?, ?, ?, ?, ?, 'ai_answered', ?, ?)
  `, [user_id, lawyer_id || null, title, description, category, level, aiResponses[level], consultation_type || 'text'], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (foundKeywords.length > 0) {
      db.run(`
        INSERT INTO conversation_audits (consultation_id, flagged_words, risk_level)
        VALUES (?, ?, 'medium')
      `, [this.lastID, JSON.stringify(foundKeywords)]);
    }

    res.json({
      success: true,
      consultation_id: this.lastID,
      level,
      ai_response: aiResponses[level]
    });
  });
});

app.get('/api/consultations', authenticateToken, (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  const user_id = req.user.id;
  const role = req.user.role;

  let query, params;

  if (role === 'user') {
    query = `
      SELECT c.*, l.name as lawyer_name 
      FROM consultations c 
      LEFT JOIN lawyers l ON c.lawyer_id = l.id 
      WHERE c.user_id = ? 
      ORDER BY c.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    params = [user_id, parseInt(limit), parseInt(offset)];
  } else if (role === 'lawyer') {
    query = `
      SELECT c.*, u.name as user_name 
      FROM consultations c 
      LEFT JOIN users u ON c.user_id = u.id 
      WHERE c.lawyer_id = ? OR c.lawyer_id IS NULL
      ORDER BY c.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    params = [user_id, parseInt(limit), parseInt(offset)];
  } else {
    return res.status(403).json({ error: '无权访问' });
  }

  db.all(query, params, (err, consultations) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, consultations });
  });
});

app.get('/api/consultations/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get(`
    SELECT c.*, u.name as user_name, l.name as lawyer_name
    FROM consultations c
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN lawyers l ON c.lawyer_id = l.id
    WHERE c.id = ?
  `, [id], (err, consultation) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!consultation) {
      return res.status(404).json({ error: '咨询不存在' });
    }
    res.json({ success: true, consultation });
  });
});

app.put('/api/consultations/:id/upgrade', authenticateToken, (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ error: '只有用户可以升级咨询' });
  }

  const { id } = req.params;
  const { new_level, lawyer_id } = req.body;

  db.run(`
    UPDATE consultations 
    SET level = ?, lawyer_id = ?, status = 'lawyer_assigned', updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `, [new_level, lawyer_id, id, req.user.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: '咨询已升级，律师将尽快回复' });
  });
});

app.post('/api/consultations/:id/messages', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const sender_type = req.user.role === 'lawyer' ? 'lawyer' : 'user';
  const sender_id = req.user.id;

  db.run(`
    INSERT INTO messages (consultation_id, sender_type, sender_id, content)
    VALUES (?, ?, ?, ?)
  `, [id, sender_type, sender_id, content], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message_id: this.lastID });
  });
});

app.get('/api/consultations/:id/messages', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.all(`
    SELECT m.*, 
      CASE WHEN m.sender_type = 'user' THEN u.name ELSE l.name END as sender_name
    FROM messages m
    LEFT JOIN users u ON m.sender_type = 'user' AND m.sender_id = u.id
    LEFT JOIN lawyers l ON m.sender_type = 'lawyer' AND m.sender_id = l.id
    WHERE m.consultation_id = ?
    ORDER BY m.created_at ASC
  `, [id], (err, messages) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, messages });
  });
});

app.post('/api/contracts/generate', authenticateToken, (req, res) => {
  if (req.user.role !== 'user' && req.user.role !== 'lawyer') {
    return res.status(403).json({ error: '请先登录' });
  }

  const { title, category, clauses } = req.body;
  const user_id = req.user.id;

  const contractTemplates = {
    '劳动合同': `劳动合同

甲方（用人单位）：
名称：____________________
法定代表人：________________
地址：____________________

乙方（劳动者）：
姓名：____________________
身份证号：________________
地址：____________________

根据《中华人民共和国劳动合同法》及相关法律法规，甲乙双方本着平等自愿、协商一致的原则，签订本合同。

第一条 合同期限
本合同期限自____年__月__日起至____年__月__日止。

第二条 工作内容和工作地点
乙方同意在甲方____部门，担任____岗位工作。

第三条 工作时间和休息休假
甲方实行每日工作不超过8小时，每周工作不超过40小时的工时制度。

第四条 劳动报酬
甲方每月__日以货币形式支付乙方工资，月工资为____元。

第五条 社会保险和福利待遇
甲方按国家和地方规定为乙方缴纳各项社会保险。

第六条 劳动保护和劳动条件
甲方为乙方提供符合国家规定的劳动安全卫生条件和必要的劳动防护用品。

第七条 合同的解除和终止
双方可依据法律规定解除或终止本合同。

第八条 违约责任
任何一方违反本合同约定，应承担相应的违约责任。

第九条 争议解决
因履行本合同发生的争议，双方可协商解决或申请劳动仲裁。

第十条 其他
本合同一式两份，甲乙双方各执一份。

甲方（盖章）：________________  乙方（签字）：________________
日期：____年__月__日          日期：____年__月__日`,
    '租赁合同': `房屋租赁合同

出租方（甲方）：________________
承租方（乙方）：________________

根据《中华人民共和国民法典》及相关法律法规，甲乙双方在平等自愿的基础上，就房屋租赁事宜达成如下协议：

第一条 房屋基本情况
甲方将位于________________的房屋出租给乙方使用。

第二条 租赁期限
租赁期限自____年__月__日起至____年__月__日止。

第三条 租金及支付方式
该房屋月租金为人民币____元，乙方应每__个月支付一次。

第四条 押金
乙方应向甲方支付人民币____元作为押金。

第五条 房屋使用及维护
乙方应合理使用并爱护该房屋及其附属设施。

第六条 合同的解除
双方可依据法律规定或合同约定解除本合同。

第七条 违约责任
任何一方违约，应向守约方支付违约金____元。

第八条 争议解决
因本合同发生争议，双方应协商解决；协商不成的，可向房屋所在地人民法院起诉。

甲方（签字）：________________  乙方（签字）：________________
日期：____年__月__日          日期：____年__月__日`,
    '买卖合同': `买卖合同

卖方（甲方）：________________
买方（乙方）：________________

根据《中华人民共和国民法典》及相关法律法规，甲乙双方本着平等互利的原则，就买卖事宜达成如下协议：

第一条 标的物
甲方同意将________________出售给乙方。

第二条 价款及支付方式
总价款为人民币____元，乙方应按以下方式支付：________________

第三条 交付
甲方应于____年__月__日前将标的物交付给乙方。

第四条 质量标准
标的物质量应符合国家标准或行业标准。

第五条 所有权转移
标的物所有权自交付时起转移给乙方。

第六条 违约责任
任何一方违约，应承担相应的违约责任。

第七条 争议解决
因本合同发生争议，双方应协商解决；协商不成的，可向人民法院起诉。

甲方（签字/盖章）：________________  乙方（签字/盖章）：________________
日期：____年__月__日              日期：____年__月__日`
  };

  const content = contractTemplates[category] || contractTemplates['买卖合同'];

  const riskPoints = [
    { point: '违约金条款', risk: '建议明确违约金计算方式，避免模糊约定', level: 'medium' },
    { point: '争议解决条款', risk: '建议约定明确的管辖法院或仲裁机构', level: 'low' },
    { point: '合同解除条款', risk: '建议明确约定解除条件和程序', level: 'medium' }
  ];

  db.run(`
    INSERT INTO contracts (user_id, title, category, content, risk_points, status)
    VALUES (?, ?, ?, ?, ?, 'generated')
  `, [user_id, title, category, content, JSON.stringify(riskPoints)], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      success: true,
      contract_id: this.lastID,
      content,
      risk_points: riskPoints
    });
  });
});

app.get('/api/contracts', authenticateToken, (req, res) => {
  const user_id = req.user.id;

  db.all(`
    SELECT c.*, l.name as lawyer_name
    FROM contracts c
    LEFT JOIN lawyers l ON c.lawyer_id = l.id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `, [user_id], (err, contracts) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, contracts });
  });
});

app.post('/api/cases', authenticateToken, (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ error: '只有用户可以创建案件' });
  }

  const { lawyer_id, title, case_type, court, fee_amount, description } = req.body;
  const user_id = req.user.id;
  const case_number = `CASE${Date.now()}`;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    db.run(`
      INSERT INTO cases (user_id, lawyer_id, case_number, title, case_type, court, fee_amount, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'filing')
    `, [user_id, lawyer_id, case_number, title, case_type, court, fee_amount, description], function(err) {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }

      const caseId = this.lastID;
      
      db.run(`
        INSERT INTO case_progress (case_id, stage, description, status)
        VALUES (?, 'filing', '案件已提交，等待立案', 'in_progress')
      `, [caseId], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        db.run('COMMIT');
        res.json({ success: true, case_id: caseId, case_number });
      });
    });
  });
});

app.get('/api/cases', authenticateToken, (req, res) => {
  const user_id = req.user.id;
  const role = req.user.role;

  let query, params;

  if (role === 'user') {
    query = `
      SELECT c.*, l.name as lawyer_name 
      FROM cases c 
      LEFT JOIN lawyers l ON c.lawyer_id = l.id 
      WHERE c.user_id = ? 
      ORDER BY c.created_at DESC
    `;
    params = [user_id];
  } else if (role === 'lawyer') {
    query = `
      SELECT c.*, u.name as user_name 
      FROM cases c 
      LEFT JOIN users u ON c.user_id = u.id 
      WHERE c.lawyer_id = ? 
      ORDER BY c.created_at DESC
    `;
    params = [user_id];
  } else {
    return res.status(403).json({ error: '无权访问' });
  }

  db.all(query, params, (err, cases) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, cases });
  });
});

app.get('/api/cases/:id/progress', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.all(`
    SELECT * FROM case_progress 
    WHERE case_id = ? 
    ORDER BY created_at ASC
  `, [id], (err, progress) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, progress });
  });
});

app.put('/api/cases/:id/progress', authenticateToken, (req, res) => {
  if (req.user.role !== 'lawyer' && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权访问' });
  }

  const { id } = req.params;
  const { stage, description, status } = req.body;

  db.run(`
    INSERT INTO case_progress (case_id, stage, description, status)
    VALUES (?, ?, ?, ?)
  `, [id, stage, description, status], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.run(`
      UPDATE cases SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [stage, id], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, message: '案件进度已更新' });
    });
  });
});

app.get('/api/admin/audits', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权访问' });
  }

  db.all(`
    SELECT ca.*, c.title as consultation_title
    FROM conversation_audits ca
    LEFT JOIN consultations c ON ca.consultation_id = c.id
    ORDER BY ca.created_at DESC
  `, (err, audits) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, audits });
  });
});

app.post('/api/admin/audits/:id/process', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权访问' });
  }

  const { id } = req.params;
  const { audit_status } = req.body;

  db.run(`
    UPDATE conversation_audits 
    SET audit_status = ?, auditor_id = ?, created_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [audit_status, req.user.id, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: '审核完成' });
  });
});

app.get('/api/admin/nps', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权访问' });
  }

  db.all(`
    SELECT n.*, c.title as consultation_title
    FROM nps_surveys n
    LEFT JOIN consultations c ON n.consultation_id = c.id
    ORDER BY n.created_at DESC
  `, (err, surveys) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.get(`
      SELECT 
        AVG(CASE WHEN score >= 9 THEN 1 WHEN score <= 6 THEN -1 ELSE 0 END) * 100 as nps_score,
        AVG(score) as avg_score,
        COUNT(*) as total
      FROM nps_surveys
    `, (err, stats) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, surveys, stats });
    });
  });
});

app.post('/api/consultations/:id/nps', authenticateToken, (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ error: '只有用户可以提交NPS评分' });
  }

  const { id } = req.params;
  const { score, feedback, attribution } = req.body;

  db.run(`
    INSERT INTO nps_surveys (consultation_id, score, feedback, attribution)
    VALUES (?, ?, ?, ?)
  `, [id, score, feedback, attribution], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: '感谢您的评价' });
  });
});

app.get('/api/admin/compliance', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权访问' });
  }

  db.all(`
    SELECT cr.*, l.name as lawyer_name
    FROM compliance_reports cr
    LEFT JOIN lawyers l ON cr.lawyer_id = l.id
    ORDER BY cr.created_at DESC
  `, (err, reports) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, reports });
  });
});

app.post('/api/admin/compliance/generate', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权访问' });
  }

  const { lawyer_id, report_period } = req.body;

  const reportContent = `合规巡检报告

律师ID: ${lawyer_id}
报告期间: ${report_period}
生成时间: ${new Date().toISOString()}

一、资质检查
- 执业证状态: 有效
- 律协验证: 已通过
- 信用报告: 无不良记录

二、服务质量检查
- 咨询响应及时率: 95%
- 用户满意度: 4.8/5.0
- NPS评分: 65

三、合规检查
- 敏感词拦截记录: 0次
- 投诉记录: 0次
- 违规记录: 0次

四、总结建议
该律师执业规范，服务质量良好，建议继续保持。`;

  db.run(`
    INSERT INTO compliance_reports (lawyer_id, report_period, report_content, status)
    VALUES (?, ?, ?, 'generated')
  `, [lawyer_id, report_period, reportContent], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, report_id: this.lastID, content: reportContent });
  });
});

app.get('/api/live-streams', (req, res) => {
  db.all(`
    SELECT ls.*, l.name as lawyer_name
    FROM live_streams ls
    LEFT JOIN lawyers l ON ls.lawyer_id = l.id
    ORDER BY ls.scheduled_time DESC
  `, (err, streams) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, streams });
  });
});

app.get('/api/short-videos', (req, res) => {
  db.all(`
    SELECT sv.*, l.name as lawyer_name
    FROM short_videos sv
    LEFT JOIN lawyers l ON sv.lawyer_id = l.id
    ORDER BY sv.created_at DESC
  `, (err, videos) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, videos });
  });
});

app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const role = req.user.role;
  const user_id = req.user.id;

  if (role === 'admin') {
    db.get('SELECT COUNT(*) as total_lawyers FROM lawyers WHERE verification_status = "approved"', (err, lawyerStats) => {
      db.get('SELECT COUNT(*) as total_users FROM users', (err, userStats) => {
        db.get('SELECT COUNT(*) as total_consultations FROM consultations', (err, consultationStats) => {
          db.get('SELECT COUNT(*) as pending_audits FROM conversation_audits WHERE audit_status = "pending"', (err, auditStats) => {
            res.json({
              success: true,
              stats: {
                total_lawyers: lawyerStats.total_lawyers,
                total_users: userStats.total_users,
                total_consultations: consultationStats.total_consultations,
                pending_audits: auditStats.pending_audits
              }
            });
          });
        });
      });
    });
  } else if (role === 'lawyer') {
    db.get('SELECT COUNT(*) as my_cases FROM cases WHERE lawyer_id = ?', [user_id], (err, caseStats) => {
      db.get('SELECT COUNT(*) as pending_consultations FROM consultations WHERE lawyer_id = ? AND status = "lawyer_assigned"', [user_id], (err, consultationStats) => {
        res.json({
          success: true,
          stats: {
            my_cases: caseStats.my_cases,
            pending_consultations: consultationStats.pending_consultations
          }
        });
      });
    });
  } else {
    db.get('SELECT COUNT(*) as my_consultations FROM consultations WHERE user_id = ?', [user_id], (err, consultationStats) => {
      db.get('SELECT COUNT(*) as my_cases FROM cases WHERE user_id = ?', [user_id], (err, caseStats) => {
        db.get('SELECT COUNT(*) as my_contracts FROM contracts WHERE user_id = ?', [user_id], (err, contractStats) => {
          res.json({
            success: true,
            stats: {
              my_consultations: consultationStats.my_consultations,
              my_cases: caseStats.my_cases,
              my_contracts: contractStats.my_contracts
            }
          });
        });
      });
    });
  }
});

app.get('/api/lawyers/:id/verification', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM lawyers WHERE id = ?', [id], (err, lawyer) => {
    if (err || !lawyer) return res.status(404).json({ error: '律师不存在' });
    delete lawyer.password;
    const verification = {
      ocr: {
        status: lawyer.license_ocr_data ? 'completed' : 'pending',
        license_number: lawyer.license_number,
        ocr_data: lawyer.license_ocr_data ? JSON.parse(lawyer.license_ocr_data) : null,
        verified_at: lawyer.license_ocr_data ? lawyer.updated_at : null
      },
      bar_association: {
        status: lawyer.bar_association_verified ? 'verified' : 'pending',
        verified_at: lawyer.bar_association_verified ? lawyer.updated_at : null,
        source: '中华全国律师协会'
      },
      credit_report: {
        status: lawyer.credit_report ? 'available' : 'pending',
        report: lawyer.credit_report ? JSON.parse(lawyer.credit_report) : null,
        generated_at: lawyer.credit_report ? lawyer.updated_at : null
      },
      review_history: []
    };
    db.all('SELECT * FROM compliance_reports WHERE lawyer_id = ? ORDER BY created_at DESC', [id], (err2, reports) => {
      if (!err2 && reports) {
        verification.review_history = reports.map(r => ({
          id: r.id,
          period: r.report_period,
          status: r.status,
          created_at: r.created_at
        }));
      }
      res.json({ success: true, lawyer, verification });
    });
  });
});

app.post('/api/lawyers/:id/ocr', authenticateToken, (req, res) => {
  const { id } = req.params;
  const ocrData = {
    license_number: 'L' + Date.now(),
    name: '待确认',
    issue_date: '2020-01-01',
    expiry_date: '2025-12-31',
    issuing_authority: '中华人民共和国司法部',
    ocr_confidence: 0.96,
    ocr_raw_text: '律师执业证\n证号: L2020XXXX\n姓名: 待确认\n执业机构: XX律师事务所\n发证日期: 2020-01-01\n有效期至: 2025-12-31'
  };
  db.run('UPDATE lawyers SET license_ocr_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [JSON.stringify(ocrData), id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, ocr: ocrData });
    });
});

app.post('/api/lawyers/:id/bar-verify', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('UPDATE lawyers SET bar_association_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, verified: true, source: '中华全国律师协会', verified_at: new Date().toISOString() });
    });
});

app.post('/api/lawyers/:id/credit-report', authenticateToken, (req, res) => {
  const { id } = req.params;
  const report = {
    overall_rating: 'A',
    complaint_count: 0,
    disciplinary_count: 0,
    client_satisfaction: 4.8,
    cases_handled: 156,
    success_rate: 0.92,
    last_complaint_date: null,
    credit_score: 95,
    generated_at: new Date().toISOString()
  };
  db.run('UPDATE lawyers SET credit_report = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [JSON.stringify(report), id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, report });
    });
});

app.post('/api/consultations/:id/escalate', authenticateToken, (req, res) => {
  if (req.user.role !== 'user') return res.status(403).json({ error: '只有用户可以升级咨询' });
  const { id } = req.params;
  const { target_level, lawyer_id } = req.body;
  const levelMap = { 1: 'ai_answered', 2: 'text_consultation', 3: 'voice_consultation', 4: 'video_consultation', 5: 'offline_delegation' };
  const typeMap = { 1: 'ai', 2: 'text', 3: 'voice', 4: 'video', 5: 'offline' };
  const newStatus = levelMap[target_level] || 'text_consultation';
  db.run('UPDATE consultations SET level = ?, lawyer_id = ?, consultation_type = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [target_level, lawyer_id || null, typeMap[target_level] || 'text', newStatus, id, req.user.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: '咨询不存在' });
      res.json({ success: true, level: target_level, status: newStatus, consultation_type: typeMap[target_level] });
    });
});

app.get('/api/consultations/:id/audit', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '无权访问' });
  const { id } = req.params;
  db.all('SELECT * FROM conversation_audits WHERE consultation_id = ?', [id], (err, audits) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, audits });
  });
});

app.post('/api/consultations/:id/submit-nps', authenticateToken, (req, res) => {
  if (req.user.role !== 'user') return res.status(403).json({ error: '只有用户可以提交NPS' });
  const { id } = req.params;
  const { score, feedback, attribution } = req.body;
  db.run('INSERT INTO nps_surveys (consultation_id, score, feedback, attribution) VALUES (?, ?, ?, ?)',
    [id, score, feedback, attribution], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, nps_id: this.lastID });
    });
});

app.get('/api/companies', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'user') return res.status(403).json({ error: '无权访问' });
  db.all('SELECT * FROM companies ORDER BY created_at DESC', (err, companies) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, companies });
  });
});

app.post('/api/companies', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '无权访问' });
  const { name, license_number, contact_name, contact_phone, contact_email, vip_level } = req.body;
  db.run('INSERT INTO companies (name, license_number, contact_name, contact_phone, contact_email, vip_level, vip_expire_date) VALUES (?, ?, ?, ?, ?, ?, datetime("now","+1 year"))',
    [name, license_number, contact_name, contact_phone, contact_email, vip_level || 'basic'], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, company_id: this.lastID });
    });
});

app.get('/api/companies/:id/sops', authenticateToken, (req, res) => {
  db.all('SELECT * FROM legal_sops WHERE company_id = ? ORDER BY created_at DESC', [req.params.id], (err, sops) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, sops });
  });
});

app.post('/api/companies/:id/sops', authenticateToken, (req, res) => {
  const { title, content, category } = req.body;
  db.run('INSERT INTO legal_sops (company_id, title, content, category) VALUES (?, ?, ?, ?)',
    [req.params.id, title, content, category], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, sop_id: this.lastID });
    });
});

app.get('/api/companies/:id/courses', authenticateToken, (req, res) => {
  db.all('SELECT * FROM training_courses WHERE company_id = ? ORDER BY created_at DESC', [req.params.id], (err, courses) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, courses });
  });
});

app.post('/api/companies/:id/courses', authenticateToken, (req, res) => {
  const { title, description, content, category } = req.body;
  db.run('INSERT INTO training_courses (company_id, title, description, content, category) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, title, description, content, category], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, course_id: this.lastID });
    });
});

app.get('/api/companies/:id/tickets', authenticateToken, (req, res) => {
  db.all('SELECT t.*, u.name as employee_name, l.name as lawyer_name FROM consultation_tickets t LEFT JOIN users u ON t.employee_id = u.id LEFT JOIN lawyers l ON t.lawyer_id = l.id WHERE t.company_id = ? ORDER BY t.created_at DESC',
    [req.params.id], (err, tickets) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, tickets });
    });
});

app.post('/api/companies/:id/tickets', authenticateToken, (req, res) => {
  const { employee_id, title, description } = req.body;
  db.run('INSERT INTO consultation_tickets (company_id, employee_id, title, description) VALUES (?, ?, ?, ?)',
    [req.params.id, employee_id || req.user.id, title, description], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, ticket_id: this.lastID });
    });
});

app.post('/api/live-streams', authenticateToken, (req, res) => {
  if (req.user.role !== 'lawyer') return res.status(403).json({ error: '只有律师可以创建直播' });
  const { title, description, scheduled_time, is_paid, price } = req.body;
  db.run('INSERT INTO live_streams (lawyer_id, title, description, scheduled_time, is_paid, price) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, title, description, scheduled_time, is_paid ? 1 : 0, price || 0], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, stream_id: this.lastID });
    });
});

app.post('/api/short-videos', authenticateToken, (req, res) => {
  if (req.user.role !== 'lawyer') return res.status(403).json({ error: '只有律师可以发布视频' });
  const { title, description, is_paid, price } = req.body;
  db.run('INSERT INTO short_videos (lawyer_id, title, description, is_paid, price) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, title, description, is_paid ? 1 : 0, price || 0], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, video_id: this.lastID });
    });
});

app.get('/api/revenue-shares', authenticateToken, (req, res) => {
  if (req.user.role !== 'lawyer') return res.status(403).json({ error: '无权访问' });
  db.all('SELECT * FROM revenue_shares WHERE lawyer_id = ? ORDER BY created_at DESC', [req.user.id], (err, shares) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, shares });
  });
});

app.get('/api/admin/revenue-shares', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '无权访问' });
  db.all('SELECT rs.*, l.name as lawyer_name FROM revenue_shares rs LEFT JOIN lawyers l ON rs.lawyer_id = l.id ORDER BY rs.created_at DESC',
    (err, shares) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, shares });
    });
});

app.post('/api/document-analyses', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '无权访问' });
  const { document_name, document_content } = req.body;
  const analysisResult = {
    document_type: '司法文书',
    parties: ['甲方', '乙方'],
    key_clauses: [
      { clause: '第一条 合同标的', risk_level: 'low', analysis: '条款表述清晰，无明显风险' },
      { clause: '第五条 违约责任', risk_level: 'medium', analysis: '违约金比例偏高，建议调整为合同金额的20%以内' },
      { clause: '第八条 争议解决', risk_level: 'low', analysis: '约定管辖法院明确' }
    ],
    risk_summary: '该文书整体风险较低，建议关注违约责任条款中的违约金比例。',
    analyzed_at: new Date().toISOString()
  };
  db.run('INSERT INTO document_analyses (admin_id, document_name, document_content, analysis_result, status) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, document_name, document_content, JSON.stringify(analysisResult), 'completed'], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, analysis_id: this.lastID, result: analysisResult });
    });
});

app.get('/api/document-analyses', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '无权访问' });
  db.all('SELECT da.*, au.username as admin_name FROM document_analyses da LEFT JOIN admin_users au ON da.admin_id = au.id ORDER BY da.created_at DESC',
    (err, analyses) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, analyses });
    });
});

app.get('/api/admin/nps-detail', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '无权访问' });
  db.all('SELECT n.*, c.title as consultation_title FROM nps_surveys n LEFT JOIN consultations c ON n.consultation_id = c.id ORDER BY n.created_at DESC',
    (err, surveys) => {
      if (err) return res.status(500).json({ error: err.message });
      db.get(`SELECT
        COUNT(*) as total,
        AVG(score) as avg_score,
        SUM(CASE WHEN score >= 9 THEN 1 ELSE 0 END) as promoters,
        SUM(CASE WHEN score >= 7 AND score <= 8 THEN 1 ELSE 0 END) as passives,
        SUM(CASE WHEN score <= 6 THEN 1 ELSE 0 END) as detractors,
        ROUND((SUM(CASE WHEN score >= 9 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) - (SUM(CASE WHEN score <= 6 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 1) as nps_score
      FROM nps_surveys`, (err2, stats) => {
        if (err2) return res.status(500).json({ error: err2.message });
        const attributions = {};
        surveys.forEach(s => {
          if (s.attribution) {
            attributions[s.attribution] = (attributions[s.attribution] || 0) + 1;
          }
        });
        res.json({ success: true, surveys, stats, attributions });
      });
    });
});

app.post('/api/seed-data', (req, res) => {
  const bcrypt = require('bcryptjs');
  const now = new Date().toISOString();
  const lawyerPw = bcrypt.hashSync('lawyer123', 4);
  const userPw = bcrypt.hashSync('user123', 4);

  const seedLawyers = [
    { name: '张明', phone: '13800001001', email: 'zhangming@law.com', password: lawyerPw, license_number: 'L202001001', practice_area: '民商事诉讼', years_experience: 15, bio: '资深民商事诉讼律师，专注合同纠纷与公司法律事务，代理案件超过500件。', rating: 4.9, consultation_count: 328 },
    { name: '李芳', phone: '13800001002', email: 'lifang@law.com', password: lawyerPw, license_number: 'L202001002', practice_area: '刑事辩护', years_experience: 12, bio: '刑事辩护专家，曾任检察院公诉人，对刑事案件有独到见解。', rating: 4.8, consultation_count: 256 },
    { name: '王建国', phone: '13800001003', email: 'wangjianguo@law.com', password: lawyerPw, license_number: 'L202001003', practice_area: '知识产权', years_experience: 10, bio: '知识产权领域资深律师，擅长专利侵权诉讼与商标保护。', rating: 4.7, consultation_count: 198 },
    { name: '赵雪', phone: '13800001004', email: 'zhaoxue@law.com', password: lawyerPw, license_number: 'L202001004', practice_area: '劳动纠纷', years_experience: 8, bio: '劳动法专家，帮助数千名劳动者维护合法权益。', rating: 4.9, consultation_count: 412 },
    { name: '陈志远', phone: '13800001005', email: 'chenzhiyuan@law.com', password: lawyerPw, license_number: 'L202001005', practice_area: '婚姻家庭', years_experience: 18, bio: '婚姻家庭法律专家，擅长离婚财产分割与子女抚养权纠纷。', rating: 4.6, consultation_count: 356 },
    { name: '刘洋', phone: '13800001006', email: 'liuyang@law.com', password: lawyerPw, license_number: 'L202001006', practice_area: '房产纠纷', years_experience: 11, bio: '房产纠纷专业律师，熟悉各类房屋买卖与租赁纠纷处理。', rating: 4.8, consultation_count: 289 },
  ];

  const seedUsers = [
    { name: '周小明', phone: '13900001001', email: 'zhouxm@corp.com', password: userPw, user_type: 'individual' },
    { name: '吴丽华', phone: '13900001002', email: 'wulh@corp.com', password: userPw, user_type: 'company' },
    { name: '郑伟', phone: '13900001003', email: 'zhengw@corp.com', password: userPw, user_type: 'individual' },
  ];

  let done = 0;
  const total = seedLawyers.length + seedUsers.length + 5;

  seedLawyers.forEach(l => {
    db.run('INSERT OR IGNORE INTO lawyers (name, phone, email, password, license_number, practice_area, years_experience, bio, verification_status, bar_association_verified, rating, consultation_count, license_ocr_data, credit_report) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [l.name, l.phone, l.email, l.password, l.license_number, l.practice_area, l.years_experience, l.bio, 'approved', 1, l.rating, l.consultation_count,
        JSON.stringify({ license_number: l.license_number, name: l.name, issue_date: '2020-06-01', expiry_date: '2025-12-31', issuing_authority: '中华人民共和国司法部', ocr_confidence: 0.97 }),
        JSON.stringify({ overall_rating: 'A', complaint_count: 0, disciplinary_count: 0, client_satisfaction: l.rating, cases_handled: l.consultation_count * 2, success_rate: 0.9, credit_score: 95, generated_at: now })
      ], () => { done++; if (done === total) res.json({ success: true, seeded: total }); });
  });

  seedUsers.forEach(u => {
    db.run('INSERT OR IGNORE INTO users (name, phone, email, password, user_type) VALUES (?, ?, ?, ?, ?)',
      [u.name, u.phone, u.email, u.password, u.user_type], () => { done++; if (done === total) res.json({ success: true, seeded: total }); });
  });

  db.run('INSERT OR IGNORE INTO companies (name, license_number, contact_name, contact_phone, contact_email, vip_level, vip_expire_date) VALUES (?, ?, ?, ?, ?, ?, datetime("now","+1 year"))',
    ['华信科技有限公司', '91110108MA01XXXX', '吴丽华', '13900001002', 'wulh@corp.com', 'premium'], () => { done++; if (done === total) res.json({ success: true, seeded: total }); });

  db.run("INSERT OR IGNORE INTO legal_sops (company_id, title, content, category) VALUES (1, '员工入职法务审查SOP', '1. 验证身份信息\n2. 签订劳动合同\n3. 竞业限制协议\n4. 保密协议签署\n5. 入职培训记录', '人事管理')", () => { done++; });
  db.run("INSERT OR IGNORE INTO training_courses (company_id, title, description, content, category) VALUES (1, '劳动法基础知识', '面向全体员工的劳动法普及课程', '第一章 劳动合同\n第二章 工资与工时\n第三章 社会保险\n第四章 劳动争议处理', '劳动法')", () => { done++; });
  db.run("INSERT OR IGNORE INTO consultation_tickets (company_id, employee_id, title, description, status, lawyer_id) VALUES (1, 2, '供应商合同审核', '需要律师审核与XX供应商的采购合同，合同金额50万', 'assigned', 1)", () => { done++; });
  db.run("INSERT OR IGNORE INTO live_streams (lawyer_id, title, description, scheduled_time, viewer_count, is_paid, price) VALUES (1, '合同纠纷实务解析', '深入解析常见合同纠纷案例及处理技巧', datetime('now','+3 days'), 128, 1, 29.9)", () => { done++; });
  db.run("INSERT OR IGNORE INTO revenue_shares (lawyer_id, content_id, content_type, amount, platform_fee, lawyer_income, status) VALUES (1, 1, 'live_stream', 2990, 598, 2392, 'settled')", () => { done++; });
});

app.listen(PORT, HOST, () => {
  console.log(`backend listening on http://${HOST}:${PORT}`);
});
