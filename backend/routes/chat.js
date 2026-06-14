const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

function generateSessionId() {
  return `CHAT${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

const knowledgeBase = [
  { q: '如何办理身份证', a: '请携带户口簿到户籍所在地派出所申请，年满16周岁即可办理，20个工作日可取。' },
  { q: '办理身份证需要什么材料', a: '需要提供本人户口簿、近期免冠照片，现场采集指纹和人像。' },
  { q: '身份证丢失怎么办', a: '请及时到派出所申请补领，需本人持户口簿办理。' },
  { q: '可以异地办理身份证吗', a: '四川省内已实现身份证异地办理，持户口簿或居住证即可在居住地派出所办理。' },
  { q: '办理结婚登记需要什么材料', a: '需要双方户口簿、身份证，以及三张2寸双方近期半身免冠合影照片。' },
  { q: '结婚登记需要预约吗', a: '建议提前1-2个工作日通过本平台或电话预约，避免排队等待。' },
  { q: '如何查询办件进度', a: '您可以通过"个人中心-我的办件"查看所有办件的当前进度和详细信息。' },
  { q: '办件需要多长时间', a: '不同事项办理时限不同，您可以在办事指南中查看承诺时限。' },
  { q: '如何申请营业执照', a: '登录后在"企业开办一件事"中按步骤申请，一般3个工作日可完成。' },
  { q: '办理业务收费吗', a: '大部分政务服务已免费，部分事项按规定收取工本费，具体标准见办事指南。' },
  { q: '密码忘记了怎么办', a: '可以点击登录页面的"忘记密码"，通过手机号验证重置密码。' },
  { q: '如何修改个人信息', a: '登录后在"个人中心-个人信息"中可以修改您的联系方式等信息。' },
  { q: '怎么联系人工客服', a: '您可以在对话中输入"人工"或"转人工"，我们的客服坐席会尽快为您服务。' },
  { q: '工作时间是几点', a: '政务服务中心工作时间为周一至周五9:00-17:00，网上办事大厅24小时开放。' },
  { q: '可以代别人办理吗', a: '部分事项可以委托他人办理，需提供委托书和双方身份证件。' }
];

function getAIResponse(question) {
  const q = question.toLowerCase();
  for (const item of knowledgeBase) {
    if (q.includes(item.q) || item.q.includes(q) ||
        item.q.split('').some(c => q.includes(c)) && item.q.length > 2) {
      if (q.length > 1 && (item.q.includes(q.substr(0, 3)) || q.includes(item.q.substr(0, 3)))) {
        return item.a;
      }
    }
  }
  const exactMatch = knowledgeBase.find(item =>
    item.q.includes(question) || question.includes(item.q));
  if (exactMatch) return exactMatch.a;

  if (q.includes('人工') || q.includes('客服') || q.includes('转人工')) {
    return '已为您转接人工客服，请稍候...';
  }
  if (q.includes('你好') || q.includes('您好') || q.includes('hi') || q.includes('hello')) {
    return '您好！我是政务智能客服，请问有什么可以帮助您？您可以直接描述您的问题。';
  }
  if (q.includes('谢谢') || q.includes('感谢')) {
    return '不客气！如果还有其他问题，欢迎随时咨询。';
  }
  if (q.includes('再见') || q.includes('拜拜')) {
    return '感谢您的咨询，祝您生活愉快！';
  }

  return '抱歉，我暂时无法回答您的问题。您可以尝试换一种问法，或者输入"人工"转接人工客服。';
}

router.get('/sessions', authenticateToken, (req, res) => {
  if (req.user.level === 'admin' || req.user.roles?.includes('agent')) {
    db.all('SELECT cs.*, u.real_name as user_name, u.phone as user_phone FROM chat_sessions cs LEFT JOIN users u ON cs.user_id = u.id ORDER BY cs.start_time DESC LIMIT 50',
      (err, rows) => {
        if (err) return res.status(500).json({ code: 500, message: err.message });
        res.json({ code: 200, data: rows });
      });
  } else {
    db.all('SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY start_time DESC LIMIT 20',
      [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ code: 500, message: err.message });
        res.json({ code: 200, data: rows });
      });
  }
});

router.get('/sessions/:sessionId/messages', authenticateToken, (req, res) => {
  const { sessionId } = req.params;

  db.get('SELECT * FROM chat_sessions WHERE session_id = ?', [sessionId], (err, session) => {
    if (err || !session) return res.status(404).json({ code: 404, message: '会话不存在' });
    if (req.user.level !== 'admin' && session.user_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权限查看此会话' });
    }

    db.all('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC', [sessionId],
      (err, rows) => {
        if (err) return res.status(500).json({ code: 500, message: err.message });
        res.json({ code: 200, data: rows });
      });
  });
});

router.post('/sessions', authenticateToken, (req, res) => {
  const { service_type } = req.body;
  const sessionId = generateSessionId();

  db.run('INSERT INTO chat_sessions (session_id, user_id, service_type, status) VALUES (?, ?, ?, ?)',
    [sessionId, req.user.id, service_type || 'general', 'active'],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, data: { session_id: sessionId } });
    });
});

router.post('/sessions/:sessionId/messages', authenticateToken, (req, res) => {
  const { sessionId } = req.params;
  const { content, message_type = 'text' } = req.body;

  if (!content) {
    return res.status(400).json({ code: 400, message: '消息内容不能为空' });
  }

  db.get('SELECT * FROM chat_sessions WHERE session_id = ?', [sessionId], (err, session) => {
    if (err || !session) return res.status(404).json({ code: 404, message: '会话不存在' });
    if (req.user.level !== 'admin' && session.user_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权限操作此会话' });
    }

    const senderType = (req.user.level === 'admin' || req.user.role === 'agent') ? 'agent' : 'user';

    db.run('INSERT INTO chat_messages (session_id, user_id, message_type, content, sender_type, sender_name) VALUES (?, ?, ?, ?, ?, ?)',
      [sessionId, req.user.id, message_type, content, senderType, req.user.real_name],
      function(err) {
        if (err) return res.status(500).json({ code: 500, message: err.message });

        if (senderType === 'user') {
          const aiResponse = getAIResponse(content);

          setTimeout(() => {
            db.run('INSERT INTO chat_messages (session_id, message_type, content, sender_type, sender_name, is_read) VALUES (?, ?, ?, ?, ?, ?)',
              [sessionId, 'text', aiResponse, 'ai', '智能客服', 0]);
          }, 500);

          res.json({
            code: 200,
            data: {
              id: this.lastID,
              ai_response: aiResponse
            },
            message: '发送成功'
          });
        } else {
          res.json({ code: 200, data: { id: this.lastID }, message: '发送成功' });
        }
      });
  });
});

router.put('/sessions/:sessionId/end', authenticateToken, (req, res) => {
  const { sessionId } = req.params;
  const now = new Date().toISOString();

  db.run('UPDATE chat_sessions SET status = ?, end_time = ? WHERE session_id = ?',
    ['ended', now, sessionId], (err) => {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, message: '会话已结束' });
    });
});

router.get('/faq', (req, res) => {
  const { category, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = 'SELECT * FROM faq_items WHERE status = 1';
  let params = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY sort_order ASC, id ASC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    db.get('SELECT COUNT(*) as total FROM faq_items WHERE status = 1', (err, countRow) => {
      res.json({
        code: 200,
        data: {
          list: rows,
          total: countRow.total,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    });
  });
});

router.post('/faq', authenticateToken, requireRole(['super_admin', 'province_admin']), auditLog('创建FAQ', '客服系统', 'faq'), (req, res) => {
  const { question, answer, category, sort_order } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ code: 400, message: '问题和答案不能为空' });
  }

  db.run('INSERT INTO faq_items (question, answer, category, sort_order) VALUES (?, ?, ?, ?)',
    [question, answer, category, sort_order || 0],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, data: { id: this.lastID }, message: '创建成功' });
    });
});

router.delete('/faq/:id', authenticateToken, requireRole(['super_admin']), auditLog('删除FAQ', '客服系统', 'faq'), (req, res) => {
  db.run('UPDATE faq_items SET status = 0 WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, message: '删除成功' });
  });
});

module.exports = router;
