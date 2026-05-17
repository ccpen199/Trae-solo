const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/init');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);

    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { adminId: admin.id, username: admin.username, isAdmin: true, role: admin.role },
      process.env.JWT_SECRET || 'knowmorechinese_jwt_secret_key_2024',
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          role: admin.role
        }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

router.get('/users', authenticateAdmin, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const users = db.prepare(`
      SELECT id, nickname, email, phone, gender, birth_year, level, created_at
      FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(parseInt(limit), parseInt(offset));

    const countResult = db.prepare('SELECT COUNT(*) as total FROM users').get();

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

router.get('/contents', authenticateAdmin, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const contents = db.prepare(`
      SELECT * FROM content ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(parseInt(limit), parseInt(offset));

    const parsedContents = contents.map(row => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : []
    }));

    const countResult = db.prepare('SELECT COUNT(*) as total FROM content').get();

    res.json({
      success: true,
      data: {
        contents: parsedContents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total
        }
      }
    });
  } catch (error) {
    console.error('Get contents error:', error);
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

router.post('/contents', authenticateAdmin, (req, res) => {
  try {
    const { type, title, description, cover_url, content_url, duration, tags, category, difficulty, is_paid, price, author } = req.body;
    const contentId = uuidv4();

    db.prepare(`
      INSERT INTO content (id, type, title, description, cover_url, content_url, duration, tags, category, difficulty, is_paid, price, author)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      contentId, type, title, description, cover_url, content_url, duration,
      JSON.stringify(tags || []), category, difficulty || 'beginner', is_paid ? 1 : 0, price || 0, author
    );

    res.json({
      success: true,
      message: 'Content created successfully',
      data: { id: contentId }
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ success: false, message: 'Failed to create content', error: error.message });
  }
});

router.put('/contents/:id', authenticateAdmin, (req, res) => {
  try {
    const contentId = req.params.id;
    const { type, title, description, cover_url, content_url, duration, tags, category, difficulty, is_paid, price, author } = req.body;

    const updates = [];
    const values = [];

    if (type !== undefined) { updates.push('type = ?'); values.push(type); }
    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (cover_url !== undefined) { updates.push('cover_url = ?'); values.push(cover_url); }
    if (content_url !== undefined) { updates.push('content_url = ?'); values.push(content_url); }
    if (duration !== undefined) { updates.push('duration = ?'); values.push(duration); }
    if (tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(tags)); }
    if (category !== undefined) { updates.push('category = ?'); values.push(category); }
    if (difficulty !== undefined) { updates.push('difficulty = ?'); values.push(difficulty); }
    if (is_paid !== undefined) { updates.push('is_paid = ?'); values.push(is_paid ? 1 : 0); }
    if (price !== undefined) { updates.push('price = ?'); values.push(price); }
    if (author !== undefined) { updates.push('author = ?'); values.push(author); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(contentId);
    const query = `UPDATE content SET ${updates.join(', ')} WHERE id = ?`;

    db.prepare(query).run(...values);

    res.json({ success: true, message: 'Content updated successfully' });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ success: false, message: 'Failed to update content', error: error.message });
  }
});

router.delete('/contents/:id', authenticateAdmin, (req, res) => {
  try {
    const contentId = req.params.id;

    db.prepare('DELETE FROM content WHERE id = ?').run(contentId);

    res.json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete content', error: error.message });
  }
});

router.get('/stats', authenticateAdmin, (req, res) => {
  try {
    const userStats = db.prepare('SELECT COUNT(*) as total_users FROM users').get();
    const contentStats = db.prepare('SELECT COUNT(*) as total_content FROM content').get();
    const viewStats = db.prepare('SELECT SUM(view_count) as total_views, SUM(like_count) as total_likes FROM content').get();

    res.json({
      success: true,
      data: {
        total_users: userStats.total_users,
        total_content: contentStats.total_content,
        total_views: viewStats.total_views || 0,
        total_likes: viewStats.total_likes || 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

module.exports = router;
