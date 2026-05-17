const { run, get, all } = require('../models/database');

async function search(req, res) {
  try {
    const { keyword, type = 'all', page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    if (!keyword) {
      return res.status(400).json({ success: false, message: '请输入搜索关键词' });
    }

    if (req.user) {
      await run(
        'INSERT INTO search_history (user_id, keyword) VALUES (?, ?)',
        [req.user.id, keyword]
      );
    }

    let results = {};

    if (type === 'all' || type === 'notes') {
      const notes = await all(
        `SELECT n.*, u.nickname, u.avatar 
         FROM notes n 
         JOIN users u ON n.user_id = u.id 
         WHERE n.status = 1 AND (n.title LIKE ? OR n.content LIKE ?) 
         ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
        [`%${keyword}%`, `%${keyword}%`, parseInt(pageSize), offset]
      );

      notes.forEach(note => {
        note.images = note.images ? JSON.parse(note.images) : [];
        note.topic_ids = note.topic_ids ? JSON.parse(note.topic_ids) : [];
      });

      const notesTotal = await get(
        `SELECT COUNT(*) as count FROM notes n 
         WHERE n.status = 1 AND (n.title LIKE ? OR n.content LIKE ?)`,
        [`%${keyword}%`, `%${keyword}%`]
      );

      results.notes = {
        list: notes,
        total: notesTotal.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };
    }

    if (type === 'all' || type === 'products') {
      const products = await all(
        `SELECT p.* 
         FROM products p 
         WHERE p.status = 1 AND p.name LIKE ? 
         ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
        [`%${keyword}%`, parseInt(pageSize), offset]
      );

      products.forEach(product => {
        product.images = product.images ? JSON.parse(product.images) : [];
      });

      const productsTotal = await get(
        `SELECT COUNT(*) as count FROM products p 
         WHERE p.status = 1 AND p.name LIKE ?`,
        [`%${keyword}%`]
      );

      results.products = {
        list: products,
        total: productsTotal.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };
    }

    if (type === 'all' || type === 'users') {
      const users = await all(
        `SELECT * FROM users 
         WHERE nickname LIKE ? 
         ORDER BY id DESC LIMIT ? OFFSET ?`,
        [`%${keyword}%`, parseInt(pageSize), offset]
      );

      const usersTotal = await get(
        `SELECT COUNT(*) as count FROM users WHERE nickname LIKE ?`,
        [`%${keyword}%`]
      );

      results.users = {
        list: users,
        total: usersTotal.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };
    }

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getSearchHistory(req, res) {
  try {
    if (!req.user) {
      return res.json({ success: true, data: [] });
    }

    const history = await all(
      `SELECT DISTINCT keyword, MAX(created_at) as last_search 
       FROM search_history 
       WHERE user_id = ? 
       GROUP BY keyword 
       ORDER BY last_search DESC LIMIT 20`,
      [req.user.id]
    );

    res.json({ success: true, data: history.map(h => h.keyword) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function clearSearchHistory(req, res) {
  try {
    if (req.user) {
      await run('DELETE FROM search_history WHERE user_id = ?', [req.user.id]);
    }
    res.json({ success: true, message: '已清空搜索历史' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getHotSearch(req, res) {
  try {
    const hotKeywords = [
      '穿搭', '美食', '旅行', '护肤', '彩妆',
      '健身', '家居', '宠物', '摄影', '数码',
      '职场', '学习', '情感', '亲子', '手工'
    ];

    res.json({ success: true, data: hotKeywords });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  search,
  getSearchHistory,
  clearSearchHistory,
  getHotSearch
};
