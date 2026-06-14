const express = require('express');
const { db } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

function parseJsonField(field) {
  try {
    return field ? JSON.parse(field) : [];
  } catch {
    return [];
  }
}

function formatPerson(person) {
  if (!person) return null;
  return {
    ...person,
    known_for: parseJsonField(person.known_for)
  };
}

router.get('/', (req, res) => {
  const { page = 1, limit = 20, sort = 'popularity', keyword } = req.query;
  const offset = (page - 1) * limit;

  let where = [];
  let params = [];

  if (keyword) {
    where.push('(name LIKE ? OR original_name LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
  const orderBy = sort === 'popularity' ? 'popularity DESC' :
                  sort === 'name' ? 'name ASC' : 'id DESC';

  const people = db.prepare(`
    SELECT * FROM people ${whereClause}
    ORDER BY ${orderBy} LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM people ${whereClause}`).get(...params);

  res.json({
    data: people.map(formatPerson),
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.get('/:id', (req, res) => {
  const person = db.prepare('SELECT * FROM people WHERE id = ?').get(req.params.id);
  if (!person) {
    return res.status(404).json({ error: '影人不存在' });
  }

  const movieCredits = db.prepare(`
    SELECT mc.*, m.title, m.poster_url, m.year, m.rating
    FROM movie_credits mc
    JOIN movies m ON mc.movie_id = m.id
    WHERE mc.person_id = ?
    ORDER BY mc.order_index ASC
  `).all(req.params.id);

  const tvCredits = db.prepare(`
    SELECT tc.*, t.title, t.poster_url, t.start_year, t.rating
    FROM tv_credits tc
    JOIN tv_shows t ON tc.tv_show_id = t.id
    WHERE tc.person_id = ?
    ORDER BY tc.order_index ASC
  `).all(req.params.id);

  const relations = db.prepare(`
    SELECT pr.*, 
      CASE WHEN pr.person1_id = ? THEN pr.person2_id ELSE pr.person1_id END as related_person_id,
      CASE WHEN pr.person1_id = ? THEN p2.name ELSE p1.name END as related_name,
      CASE WHEN pr.person1_id = ? THEN p2.avatar_url ELSE p1.avatar_url END as related_avatar
    FROM person_relations pr
    LEFT JOIN people p1 ON pr.person1_id = p1.id
    LEFT JOIN people p2 ON pr.person2_id = p2.id
    WHERE pr.person1_id = ? OR pr.person2_id = ?
    ORDER BY pr.collaboration_count DESC
  `).all(req.params.id, req.params.id, req.params.id, req.params.id, req.params.id);

  const editSuggestions = db.prepare(`
    SELECT pes.*, u.username
    FROM person_edit_suggestions pes
    JOIN users u ON pes.user_id = u.id
    WHERE pes.person_id = ? AND pes.status = 'pending'
    ORDER BY pes.created_at DESC
  `).all(req.params.id);

  res.json({
    person: formatPerson(person),
    movieCredits,
    tvCredits,
    relations,
    editSuggestions
  });
});

router.post('/:id/suggest-edit', authenticateToken, (req, res) => {
  const { field_name, old_value, new_value } = req.body;

  if (!field_name || !new_value) {
    return res.status(400).json({ error: '请填写完整的编辑信息' });
  }

  const result = db.prepare(`
    INSERT INTO person_edit_suggestions 
    (person_id, user_id, field_name, old_value, new_value)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, req.user.id, field_name, old_value || null, new_value);

  const suggestion = db.prepare('SELECT * FROM person_edit_suggestions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ suggestion });
});

router.post('/', authenticateToken, requireRole(['admin', 'moderator']), (req, res) => {
  const {
    imdb_id, tmdb_id, name, original_name, birth_date, death_date,
    place_of_birth, gender, biography, avatar_url, known_for, popularity
  } = req.body;

  const result = db.prepare(`
    INSERT INTO people 
    (imdb_id, tmdb_id, name, original_name, birth_date, death_date,
     place_of_birth, gender, biography, avatar_url, known_for, popularity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    imdb_id || null, tmdb_id || null, name, original_name || null, birth_date || null,
    death_date || null, place_of_birth || null, gender || 0, biography || null,
    avatar_url || null, JSON.stringify(known_for || []), popularity || 0
  );

  const person = db.prepare('SELECT * FROM people WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ person: formatPerson(person) });
});

module.exports = router;
