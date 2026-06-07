const express = require('express');
const db = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/tags', (req, res) => {
  const { category } = req.query;
  let query = 'SELECT * FROM skill_tags WHERE is_active = 1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  query += ' ORDER BY sort_order ASC';

  db.all(query, params, (err, tags) => {
    res.json(tags || []);
  });
});

router.get('/categories', (req, res) => {
  db.all('SELECT DISTINCT category FROM skill_tags WHERE is_active = 1 ORDER BY category', (err, rows) => {
    res.json(rows.map(r => r.category));
  });
});

router.post('/provider/skills', authenticateToken, (req, res) => {
  const { skill_tag_id, proficiency_level, years_experience, hourly_rate } = req.body;
  
  db.run(
    `INSERT OR REPLACE INTO provider_skills 
     (user_id, skill_tag_id, proficiency_level, years_experience, hourly_rate)
     VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, skill_tag_id, proficiency_level || 1, years_experience || 0, hourly_rate || 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '添加技能失败' });
      }
      res.json({ message: '技能添加成功', id: this.lastID });
    }
  );
});

router.delete('/provider/skills/:skillId', authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM provider_skills WHERE user_id = ? AND id = ?',
    [req.user.id, req.params.skillId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '删除技能失败' });
      }
      res.json({ message: '技能删除成功' });
    }
  );
});

router.get('/provider/skills', authenticateToken, (req, res) => {
  db.all(
    `SELECT ps.id, st.name, st.category, ps.proficiency_level,
            ps.years_experience, ps.hourly_rate, ps.is_certified
     FROM provider_skills ps
     JOIN skill_tags st ON ps.skill_tag_id = st.id
     WHERE ps.user_id = ?`,
    [req.user.id],
    (err, skills) => {
      res.json(skills || []);
    }
  );
});

router.post('/portfolios', authenticateToken, (req, res) => {
  const { title, description, images, skill_tag_id, client_name, completion_date } = req.body;
  
  db.run(
    `INSERT INTO portfolios 
     (user_id, title, description, images, skill_tag_id, client_name, completion_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, title, description, images || '', skill_tag_id || null, client_name || '', completion_date || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '添加作品集失败' });
      }
      res.json({ message: '作品集添加成功', id: this.lastID });
    }
  );
});

router.get('/portfolios/me', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM portfolios WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, portfolios) => {
      res.json(portfolios || []);
    }
  );
});

router.delete('/portfolios/:id', authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM portfolios WHERE user_id = ? AND id = ?',
    [req.user.id, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '删除作品集失败' });
      }
      res.json({ message: '作品集删除成功' });
    }
  );
});

module.exports = router;
