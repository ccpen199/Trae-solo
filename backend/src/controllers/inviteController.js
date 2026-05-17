const { getDB } = require('../models/db');

function generateInviteCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createInvite(req, res) {
  try {
    const { relation } = req.body;

    const db = getDB();
    const baby = db.prepare('SELECT * FROM babies WHERE user_id = ?').get(req.user.id);

    if (!baby) {
      return res.status(400).json({ success: false, message: '请先填写宝宝信息' });
    }

    const book = db.prepare('SELECT * FROM growth_books WHERE baby_id = ?').get(baby.id);

    if (!book) {
      return res.status(404).json({ success: false, message: '未找到成长书' });
    }

    const member = db.prepare('SELECT * FROM book_family_members WHERE book_id = ? AND user_id = ? AND role = ?').get(book.id, req.user.id, 'creator');

    if (!member) {
      return res.status(403).json({ success: false, message: '只有创建者可以生成邀请码' });
    }

    let code;
    let attempts = 0;
    do {
      code = generateInviteCode();
      const existing = db.prepare('SELECT id FROM invite_codes WHERE code = ?').get(code);
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const result = db.prepare(`
      INSERT INTO invite_codes (code, creator_id, baby_id, book_id, relation, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(code, req.user.id, baby.id, book.id, relation || '家人', expiresAt.toISOString());

    const inviteCode = db.prepare('SELECT * FROM invite_codes WHERE id = ?').get(result.lastInsertRowid);

    console.log(`📨 邀请码: ${code} -> 邀请成为${relation || '家人'}`);

    res.json({
      success: true,
      message: '邀请码生成成功',
      inviteCode: {
        ...inviteCode,
        babyName: baby.name
      }
    });
  } catch (error) {
    console.error('生成邀请码失败:', error);
    res.status(500).json({ success: false, message: '生成邀请码失败' });
  }
}

async function acceptInvite(req, res) {
  try {
    const { code } = req.body;

    if (!code || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, message: '请输入6位邀请码' });
    }

    const db = getDB();
    const inviteCode = db.prepare('SELECT * FROM invite_codes WHERE code = ? AND status = ?').get(code, 'active');

    if (!inviteCode) {
      return res.status(400).json({ success: false, message: '邀请码无效或已过期' });
    }

    if (new Date(inviteCode.expires_at) < new Date()) {
      db.prepare('UPDATE invite_codes SET status = ? WHERE id = ?').run('expired', inviteCode.id);
      return res.status(400).json({ success: false, message: '邀请码已过期' });
    }

    const existingMember = db.prepare('SELECT * FROM book_family_members WHERE book_id = ? AND user_id = ?').get(inviteCode.book_id, req.user.id);

    if (existingMember) {
      return res.status(400).json({ success: false, message: '您已是该成长书的成员' });
    }

    db.prepare(`
      INSERT INTO book_family_members (book_id, user_id, role, relation)
      VALUES (?, ?, 'family', ?)
    `).run(inviteCode.book_id, req.user.id, inviteCode.relation || '家人');

    db.prepare('UPDATE invite_codes SET used_count = used_count + 1 WHERE id = ?').run(inviteCode.id);

    const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(inviteCode.baby_id);

    res.json({
      success: true,
      message: '成功加入成长书',
      baby
    });
  } catch (error) {
    console.error('接受邀请失败:', error);
    res.status(500).json({ success: false, message: '接受邀请失败' });
  }
}

async function getMyInvites(req, res) {
  try {
    const db = getDB();
    const baby = db.prepare('SELECT * FROM babies WHERE user_id = ?').get(req.user.id);

    if (!baby) {
      return res.status(404).json({ success: false, message: '请先填写宝宝信息' });
    }

    const book = db.prepare('SELECT * FROM growth_books WHERE baby_id = ?').get(baby.id);

    if (!book) {
      return res.status(404).json({ success: false, message: '未找到成长书' });
    }

    const invites = db.prepare(`
      SELECT * FROM invite_codes 
      WHERE creator_id = ? AND book_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id, book.id);

    res.json({
      success: true,
      invites: invites.map(i => ({
        ...i,
        isExpired: new Date(i.expires_at) < new Date()
      }))
    });
  } catch (error) {
    console.error('获取邀请列表失败:', error);
    res.status(500).json({ success: false, message: '获取邀请列表失败' });
  }
}

module.exports = { createInvite, acceptInvite, getMyInvites };
