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

function formatTvShow(show) {
  if (!show) return null;
  return {
    ...show,
    genres: parseJsonField(show.genres),
    countries: parseJsonField(show.countries),
    languages: parseJsonField(show.languages)
  };
}

router.get('/', (req, res) => {
  const { page = 1, limit = 20, genre, sort = 'rating', keyword } = req.query;
  const offset = (page - 1) * limit;

  let where = [];
  let params = [];

  if (genre) {
    where.push('genres LIKE ?');
    params.push(`%${genre}%`);
  }
  if (keyword) {
    where.push('(title LIKE ? OR original_title LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
  const orderBy = sort === 'rating' ? 'rating DESC, vote_count DESC' :
                  sort === 'popular' ? 'vote_count DESC' : 'id DESC';

  const shows = db.prepare(`
    SELECT * FROM tv_shows ${whereClause}
    ORDER BY ${orderBy} LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM tv_shows ${whereClause}`).get(...params);

  res.json({
    data: shows.map(formatTvShow),
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.get('/:id', (req, res) => {
  const show = db.prepare('SELECT * FROM tv_shows WHERE id = ?').get(req.params.id);
  if (!show) {
    return res.status(404).json({ error: '剧集不存在' });
  }

  const seasons = db.prepare(`
    SELECT * FROM seasons WHERE tv_show_id = ? ORDER BY season_number ASC
  `).all(req.params.id);

  const credits = db.prepare(`
    SELECT tc.*, p.name, p.avatar_url
    FROM tv_credits tc
    JOIN people p ON tc.person_id = p.id
    WHERE tc.tv_show_id = ?
    ORDER BY tc.order_index ASC
  `).all(req.params.id);

  const videos = db.prepare(`
    SELECT * FROM video_sources 
    WHERE content_type = 'tv' AND content_id = ?
  `).all(req.params.id);

  res.json({
    show: formatTvShow(show),
    seasons,
    credits,
    videos
  });
});

router.get('/:id/seasons/:seasonNumber', (req, res) => {
  const season = db.prepare(`
    SELECT * FROM seasons WHERE tv_show_id = ? AND season_number = ?
  `).get(req.params.id, req.params.seasonNumber);

  if (!season) {
    return res.status(404).json({ error: '季不存在' });
  }

  const episodes = db.prepare(`
    SELECT * FROM episodes 
    WHERE tv_show_id = ? AND season_id = ? 
    ORDER BY episode_number ASC
  `).all(req.params.id, season.id);

  res.json({ season, episodes });
});

module.exports = router;
