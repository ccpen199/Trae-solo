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

function formatMovie(movie) {
  if (!movie) return null;
  return {
    ...movie,
    genres: parseJsonField(movie.genres),
    countries: parseJsonField(movie.countries),
    languages: parseJsonField(movie.languages),
    writers: parseJsonField(movie.writers)
  };
}

router.get('/', (req, res) => {
  const { page = 1, limit = 20, genre, year, rating, sort = 'rating', keyword } = req.query;
  const offset = (page - 1) * limit;

  let where = [];
  let params = [];

  if (genre) {
    where.push('genres LIKE ?');
    params.push(`%${genre}%`);
  }
  if (year) {
    where.push('year = ?');
    params.push(year);
  }
  if (rating) {
    where.push('rating >= ?');
    params.push(rating);
  }
  if (keyword) {
    where.push('(title LIKE ? OR original_title LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
  const orderBy = sort === 'rating' ? 'rating DESC, vote_count DESC' :
                  sort === 'year' ? 'year DESC' :
                  sort === 'popular' ? 'vote_count DESC' : 'id DESC';

  const movies = db.prepare(`
    SELECT * FROM movies ${whereClause}
    ORDER BY ${orderBy} LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM movies ${whereClause}`).get(...params);

  res.json({
    data: movies.map(formatMovie),
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.get('/:id', (req, res) => {
  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
  if (!movie) {
    return res.status(404).json({ error: '电影不存在' });
  }

  const credits = db.prepare(`
    SELECT mc.*, p.name, p.avatar_url, p.imdb_id, p.tmdb_id
    FROM movie_credits mc
    JOIN people p ON mc.person_id = p.id
    WHERE mc.movie_id = ?
    ORDER BY mc.order_index ASC
  `).all(req.params.id);

  const related = db.prepare(`
    SELECT * FROM movies 
    WHERE id != ? AND (
      genres LIKE ? OR director LIKE ?
    )
    ORDER BY rating DESC LIMIT 6
  `).all(req.params.id, `%${movie.genres?.split(',')[0] || ''}%`, movie.director || '');

  const videos = db.prepare(`
    SELECT * FROM video_sources 
    WHERE content_type = 'movie' AND content_id = ?
  `).all(req.params.id);

  res.json({
    movie: formatMovie(movie),
    credits,
    related: related.map(formatMovie),
    videos
  });
});

router.post('/', authenticateToken, requireRole(['admin', 'moderator']), (req, res) => {
  const {
    imdb_id, tmdb_id, title, original_title, year, release_date, runtime,
    genres, countries, languages, director, writers, plot, poster_url,
    backdrop_url, trailer_url, content_rating, source, source_id
  } = req.body;

  const result = db.prepare(`
    INSERT INTO movies 
    (imdb_id, tmdb_id, title, original_title, year, release_date, runtime, rating, vote_count,
     genres, countries, languages, director, writers, plot, poster_url, backdrop_url, trailer_url,
     content_rating, source, source_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    imdb_id || null, tmdb_id || null, title, original_title || null, year || null,
    release_date || null, runtime || null,
    JSON.stringify(genres || []), JSON.stringify(countries || []), JSON.stringify(languages || []),
    director || null, JSON.stringify(writers || []), plot || null, poster_url || null,
    backdrop_url || null, trailer_url || null, content_rating || null, source || null, source_id || null
  );

  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ movie: formatMovie(movie) });
});

router.put('/:id', authenticateToken, requireRole(['admin', 'moderator']), (req, res) => {
  const {
    imdb_id, tmdb_id, title, original_title, year, release_date, runtime, rating,
    genres, countries, languages, director, writers, plot, poster_url,
    backdrop_url, trailer_url, content_rating, status
  } = req.body;

  db.prepare(`
    UPDATE movies SET
      imdb_id = COALESCE(?, imdb_id),
      tmdb_id = COALESCE(?, tmdb_id),
      title = COALESCE(?, title),
      original_title = COALESCE(?, original_title),
      year = COALESCE(?, year),
      release_date = COALESCE(?, release_date),
      runtime = COALESCE(?, runtime),
      rating = COALESCE(?, rating),
      genres = COALESCE(?, genres),
      countries = COALESCE(?, countries),
      languages = COALESCE(?, languages),
      director = COALESCE(?, director),
      writers = COALESCE(?, writers),
      plot = COALESCE(?, plot),
      poster_url = COALESCE(?, poster_url),
      backdrop_url = COALESCE(?, backdrop_url),
      trailer_url = COALESCE(?, trailer_url),
      content_rating = COALESCE(?, content_rating),
      status = COALESCE(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    imdb_id, tmdb_id, title, original_title, year, release_date, runtime, rating,
    genres ? JSON.stringify(genres) : undefined,
    countries ? JSON.stringify(countries) : undefined,
    languages ? JSON.stringify(languages) : undefined,
    director, writers ? JSON.stringify(writers) : undefined, plot, poster_url,
    backdrop_url, trailer_url, content_rating, status, req.params.id
  );

  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
  res.json({ movie: formatMovie(movie) });
});

module.exports = router;
