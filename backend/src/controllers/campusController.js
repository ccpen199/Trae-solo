const { db } = require('../models/database');

function getCampusEvents(req, res) {
  try {
    const events = db.prepare(`
      SELECT * FROM campus_recruitment 
      ORDER BY created_at DESC
      LIMIT 50
    `).all();
    
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: '获取校招活动失败' });
  }
}

function createCampusEvent(req, res) {
  const { title, university, eventType, eventDate, description } = req.body;

  if (!title || !university) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO campus_recruitment (company_id, university, event_type, event_date, title, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.user?.companyId || 1,
      university,
      eventType || 'career_fair',
      eventDate || null,
      title,
      description || ''
    );

    const event = db.prepare('SELECT * FROM campus_recruitment WHERE id = ?').get(result.lastInsertRowid);
    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: '创建校招活动失败' });
  }
}

function getCampusStats(req, res) {
  try {
    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM campus_recruitment').get().count;
    const totalCompanies = db.prepare('SELECT COUNT(*) as count FROM campus_recruitment GROUP BY company_id').all().length;
    const pendingEvents = db.prepare('SELECT COUNT(*) as count FROM campus_recruitment WHERE status = ?').get('pending').count;
    
    res.json({
      totalEvents,
      totalCompanies,
      pendingEvents
    });
  } catch (err) {
    res.status(500).json({ error: '获取统计失败' });
  }
}

module.exports = { getCampusEvents, createCampusEvent, getCampusStats };
