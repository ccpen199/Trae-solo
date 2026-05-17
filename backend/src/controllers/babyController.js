const { getDB } = require('../models/db');

async function saveBabyInfo(req, res) {
  try {
    const { name, gender, birthday, monthAge, avatar } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '请输入宝宝姓名' });
    }

    const db = getDB();
    const existingBaby = db.prepare('SELECT id FROM babies WHERE user_id = ?').get(req.user.id);

    let babyId;

    if (existingBaby) {
      db.prepare(`
        UPDATE babies 
        SET name = ?, gender = ?, birthday = ?, month_age = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(name, gender || 'unknown', birthday || null, monthAge || null, avatar || null, req.user.id);
      babyId = existingBaby.id;
    } else {
      const result = db.prepare(`
        INSERT INTO babies (user_id, name, gender, birthday, month_age, avatar)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(req.user.id, name, gender || 'unknown', birthday || null, monthAge || null, avatar || null);
      babyId = result.lastInsertRowid;

      const existingBook = db.prepare('SELECT id FROM growth_books WHERE baby_id = ?').get(babyId);
      if (!existingBook) {
        const bookResult = db.prepare(`
          INSERT INTO growth_books (baby_id, creator_id, title)
          VALUES (?, ?, ?)
        `).run(babyId, req.user.id, `${name}的成长书`);

        db.prepare(`
          INSERT INTO book_family_members (book_id, user_id, role, relation)
          VALUES (?, ?, 'creator', '妈妈')
        `).run(bookResult.lastInsertRowid, req.user.id);
      }
    }

    const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(babyId);
    const book = db.prepare('SELECT * FROM growth_books WHERE baby_id = ?').get(babyId);

    res.json({
      success: true,
      message: '宝宝信息保存成功',
      baby,
      book
    });
  } catch (error) {
    console.error('保存宝宝信息失败:', error);
    res.status(500).json({ success: false, message: '保存宝宝信息失败' });
  }
}

async function getBabyInfo(req, res) {
  try {
    const db = getDB();
    const baby = db.prepare('SELECT * FROM babies WHERE user_id = ?').get(req.user.id);

    if (!baby) {
      return res.status(404).json({ success: false, message: '未找到宝宝信息' });
    }

    res.json({ success: true, baby });
  } catch (error) {
    console.error('获取宝宝信息失败:', error);
    res.status(500).json({ success: false, message: '获取宝宝信息失败' });
  }
}

module.exports = { saveBabyInfo, getBabyInfo };
