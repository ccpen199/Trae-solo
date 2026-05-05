const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../database');

router.get('/stats', (req, res) => {
  try {
    const articleCount = getQuery('SELECT COUNT(*) as count FROM articles WHERE status = 1', []);
    const albumCount = getQuery('SELECT COUNT(*) as count FROM albums', []);
    const messageCount = getQuery('SELECT COUNT(*) as count FROM messages WHERE status = 0', []);
    const totalViews = getQuery(`
      SELECT (SELECT SUM(view_count) FROM articles) + 
             (SELECT SUM(view_count) FROM albums) + 
             (SELECT SUM(view_count) FROM media) as total
    `, []);
    
    res.json({
      success: true,
      data: {
        articles: articleCount.count,
        albums: albumCount.count,
        pendingMessages: messageCount.count,
        totalViews: totalViews.total || 0
      }
    });
  } catch (error) {
    console.error('统计数据获取失败:', error);
    res.status(500).json({ success: false, message: '获取统计数据失败' });
  }
});

router.get('/articles', (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (status !== undefined) {
      whereClause += ' AND status = ?';
      params.push(parseInt(status));
    }
    
    const totalResult = getQuery(`
      SELECT COUNT(*) as total FROM articles ${whereClause}
    `, params);
    
    const articles = allQuery(`
      SELECT a.*, c.name as category_name 
      FROM articles a 
      LEFT JOIN categories c ON a.category_id = c.id 
      ${whereClause}
      ORDER BY a.created_at DESC 
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    res.json({
      success: true,
      data: {
        list: articles,
        total: totalResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('文章列表获取失败:', error);
    res.status(500).json({ success: false, message: '获取文章列表失败' });
  }
});

router.post('/articles', (req, res) => {
  try {
    const { category_id, title, content, summary, cover_image, author, status, is_recommended } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, message: '标题不能为空' });
    }
    
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    
    const result = runQuery(`
      INSERT INTO articles (category_id, title, slug, content, summary, cover_image, author, status, is_recommended, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      category_id || 1,
      title,
      slug + '-' + Date.now(),
      content || '',
      summary || '',
      cover_image || '',
      author || '站长',
      status !== undefined ? status : 0,
      is_recommended || 0
    ]);
    
    res.json({
      success: true,
      message: '文章创建成功',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('创建文章失败:', error);
    res.status(500).json({ success: false, message: '创建文章失败' });
  }
});

router.put('/articles/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, title, content, summary, cover_image, author, status, is_recommended } = req.body;
    
    const article = getQuery('SELECT * FROM articles WHERE id = ?', [id]);
    if (!article) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    
    const updates = [];
    const params = [];
    
    if (category_id !== undefined) { updates.push('category_id = ?'); params.push(category_id); }
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (content !== undefined) { updates.push('content = ?'); params.push(content); }
    if (summary !== undefined) { updates.push('summary = ?'); params.push(summary); }
    if (cover_image !== undefined) { updates.push('cover_image = ?'); params.push(cover_image); }
    if (author !== undefined) { updates.push('author = ?'); params.push(author); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (is_recommended !== undefined) { updates.push('is_recommended = ?'); params.push(is_recommended); }
    
    updates.push('updated_at = datetime("now")');
    params.push(id);
    
    runQuery(`UPDATE articles SET ${updates.join(', ')} WHERE id = ?`, params);
    
    res.json({
      success: true,
      message: '文章更新成功'
    });
  } catch (error) {
    console.error('更新文章失败:', error);
    res.status(500).json({ success: false, message: '更新文章失败' });
  }
});

router.delete('/articles/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const article = getQuery('SELECT * FROM articles WHERE id = ?', [id]);
    if (!article) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    
    runQuery('DELETE FROM articles WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: '文章已删除'
    });
  } catch (error) {
    console.error('删除文章失败:', error);
    res.status(500).json({ success: false, message: '删除文章失败' });
  }
});

router.get('/messages', (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (status !== undefined) {
      whereClause += ' AND status = ?';
      params.push(parseInt(status));
    }
    
    const totalResult = getQuery(`
      SELECT COUNT(*) as total FROM messages ${whereClause}
    `, params);
    
    const messages = allQuery(`
      SELECT * FROM messages 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    res.json({
      success: true,
      data: {
        list: messages,
        total: totalResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('留言列表获取失败:', error);
    res.status(500).json({ success: false, message: '获取留言列表失败' });
  }
});

router.put('/messages/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    
    const message = getQuery('SELECT * FROM messages WHERE id = ?', [id]);
    if (!message) {
      return res.status(404).json({ success: false, message: '留言不存在' });
    }
    
    runQuery('UPDATE messages SET status = 1 WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: '留言已审核通过'
    });
  } catch (error) {
    console.error('审核留言失败:', error);
    res.status(500).json({ success: false, message: '审核留言失败' });
  }
});

router.put('/messages/:id/reply', (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    
    const message = getQuery('SELECT * FROM messages WHERE id = ?', [id]);
    if (!message) {
      return res.status(404).json({ success: false, message: '留言不存在' });
    }
    
    runQuery('UPDATE messages SET reply = ? WHERE id = ?', [reply, id]);
    
    res.json({
      success: true,
      message: '回复已保存'
    });
  } catch (error) {
    console.error('回复留言失败:', error);
    res.status(500).json({ success: false, message: '回复留言失败' });
  }
});

router.put('/profile', (req, res) => {
  try {
    const { name, title, avatar, bio, email, phone, location, github, website, interests, experience } = req.body;
    
    const profile = getQuery('SELECT * FROM profile LIMIT 1', []);
    
    if (profile) {
      const updates = [];
      const params = [];
      
      if (name !== undefined) { updates.push('name = ?'); params.push(name); }
      if (title !== undefined) { updates.push('title = ?'); params.push(title); }
      if (avatar !== undefined) { updates.push('avatar = ?'); params.push(avatar); }
      if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }
      if (email !== undefined) { updates.push('email = ?'); params.push(email); }
      if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
      if (location !== undefined) { updates.push('location = ?'); params.push(location); }
      if (github !== undefined) { updates.push('github = ?'); params.push(github); }
      if (website !== undefined) { updates.push('website = ?'); params.push(website); }
      if (interests !== undefined) { updates.push('interests = ?'); params.push(interests); }
      if (experience !== undefined) { updates.push('experience = ?'); params.push(experience); }
      
      updates.push('updated_at = datetime("now")');
      
      runQuery(`UPDATE profile SET ${updates.join(', ')}`, params);
    } else {
      runQuery(`
        INSERT INTO profile (name, title, avatar, bio, email, phone, location, github, website, interests, experience)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name || '',
        title || '',
        avatar || '',
        bio || '',
        email || '',
        phone || '',
        location || '',
        github || '',
        website || '',
        interests || '',
        experience || ''
      ]);
    }
    
    res.json({
      success: true,
      message: '个人信息已更新'
    });
  } catch (error) {
    console.error('更新个人信息失败:', error);
    res.status(500).json({ success: false, message: '更新个人信息失败' });
  }
});

router.get('/categories', (req, res) => {
  try {
    const categories = allQuery(`
      SELECT * FROM categories 
      ORDER BY sort_order
    `);
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('分类列表获取失败:', error);
    res.status(500).json({ success: false, message: '获取分类列表失败' });
  }
});

module.exports = router;
