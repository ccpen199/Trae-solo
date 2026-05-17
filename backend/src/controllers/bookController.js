const { getDB } = require('../models/db');

async function getMyBook(req, res) {
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

    const familyMembers = db.prepare(`
      SELECT bfm.*, u.nickname, u.avatar
      FROM book_family_members bfm
      JOIN users u ON bfm.user_id = u.id
      WHERE bfm.book_id = ?
    `).all(book.id);

    const entries = db.prepare(`
      SELECT be.*, u.nickname as author_name, u.avatar as author_avatar
      FROM book_entries be
      JOIN users u ON be.author_id = u.id
      WHERE be.book_id = ?
      ORDER BY be.entry_date DESC, be.created_at DESC
    `).all(book.id);

    const userRole = familyMembers.find(m => m.user_id === req.user.id)?.role || 'family';

    res.json({
      success: true,
      book: {
        ...book,
        baby,
        familyMembers,
        entries: entries.map(e => ({
          ...e,
          images: e.images ? JSON.parse(e.images) : [],
          tags: e.tags ? JSON.parse(e.tags) : []
        })),
        userRole
      }
    });
  } catch (error) {
    console.error('获取成长书失败:', error);
    res.status(500).json({ success: false, message: '获取成长书失败' });
  }
}

async function addEntry(req, res) {
  try {
    const { title, content, images, entryDate, mood, tags } = req.body;

    if (!entryDate) {
      return res.status(400).json({ success: false, message: '请选择记录日期' });
    }

    const db = getDB();
    const baby = db.prepare('SELECT * FROM babies WHERE user_id = ?').get(req.user.id);

    if (!baby) {
      return res.status(400).json({ success: false, message: '请先填写宝宝信息' });
    }

    const book = db.prepare('SELECT * FROM growth_books WHERE baby_id = ?').get(baby.id);

    if (!book) {
      return res.status(404).json({ success: false, message: '未找到成长书' });
    }

    const member = db.prepare('SELECT * FROM book_family_members WHERE book_id = ? AND user_id = ?').get(book.id, req.user.id);

    if (!member) {
      return res.status(403).json({ success: false, message: '无权限添加记录' });
    }

    const result = db.prepare(`
      INSERT INTO book_entries (book_id, author_id, title, content, images, entry_date, mood, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      book.id,
      req.user.id,
      title || '',
      content || '',
      images ? JSON.stringify(images) : null,
      entryDate,
      mood || '',
      tags ? JSON.stringify(tags) : null
    );

    const entry = db.prepare(`
      SELECT be.*, u.nickname as author_name, u.avatar as author_avatar
      FROM book_entries be
      JOIN users u ON be.author_id = u.id
      WHERE be.id = ?
    `).get(result.lastInsertRowid);

    res.json({
      success: true,
      message: '记录添加成功',
      entry: {
        ...entry,
        images: entry.images ? JSON.parse(entry.images) : [],
        tags: entry.tags ? JSON.parse(entry.tags) : []
      }
    });
  } catch (error) {
    console.error('添加记录失败:', error);
    res.status(500).json({ success: false, message: '添加记录失败' });
  }
}

async function updateEntry(req, res) {
  try {
    const { id } = req.params;
    const { title, content, images, entryDate, mood, tags } = req.body;

    const db = getDB();
    const entry = db.prepare('SELECT * FROM book_entries WHERE id = ?').get(id);

    if (!entry) {
      return res.status(404).json({ success: false, message: '记录不存在' });
    }

    const member = db.prepare('SELECT * FROM book_family_members WHERE book_id = ? AND user_id = ?').get(entry.book_id, req.user.id);

    if (!member) {
      return res.status(403).json({ success: false, message: '无权限编辑' });
    }

    if (member.role !== 'creator' && entry.author_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '只能编辑自己的记录' });
    }

    db.prepare(`
      UPDATE book_entries 
      SET title = ?, content = ?, images = ?, entry_date = ?, mood = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title || '',
      content || '',
      images ? JSON.stringify(images) : null,
      entryDate || entry.entry_date,
      mood || '',
      tags ? JSON.stringify(tags) : null,
      id
    );

    const updatedEntry = db.prepare(`
      SELECT be.*, u.nickname as author_name, u.avatar as author_avatar
      FROM book_entries be
      JOIN users u ON be.author_id = u.id
      WHERE be.id = ?
    `).get(id);

    res.json({
      success: true,
      message: '记录更新成功',
      entry: {
        ...updatedEntry,
        images: updatedEntry.images ? JSON.parse(updatedEntry.images) : [],
        tags: updatedEntry.tags ? JSON.parse(updatedEntry.tags) : []
      }
    });
  } catch (error) {
    console.error('更新记录失败:', error);
    res.status(500).json({ success: false, message: '更新记录失败' });
  }
}

async function deleteEntry(req, res) {
  try {
    const { id } = req.params;

    const db = getDB();
    const entry = db.prepare('SELECT * FROM book_entries WHERE id = ?').get(id);

    if (!entry) {
      return res.status(404).json({ success: false, message: '记录不存在' });
    }

    const member = db.prepare('SELECT * FROM book_family_members WHERE book_id = ? AND user_id = ?').get(entry.book_id, req.user.id);

    if (!member) {
      return res.status(403).json({ success: false, message: '无权限删除' });
    }

    if (member.role !== 'creator' && entry.author_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '只能删除自己的记录' });
    }

    db.prepare('DELETE FROM book_entries WHERE id = ?').run(id);

    res.json({ success: true, message: '记录删除成功' });
  } catch (error) {
    console.error('删除记录失败:', error);
    res.status(500).json({ success: false, message: '删除记录失败' });
  }
}

module.exports = { getMyBook, addEntry, updateEntry, deleteEntry };
