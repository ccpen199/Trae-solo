import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const { status, genre } = req.query;
    let sql = 'SELECT * FROM movies WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (genre) { sql += ' AND genre = ?'; params.push(genre); }
    sql += ' ORDER BY id';
    const rows = db.prepare(sql).all(...params);
    const parsedRows = rows.map(row => ({
      ...row,
      copyright_region: row.copyright_region ? JSON.parse(row.copyright_region) : null,
      pre_show_languages: row.pre_show_languages ? JSON.parse(row.pre_show_languages) : null,
      pre_show_subtitles: row.pre_show_subtitles ? JSON.parse(row.pre_show_subtitles) : null,
    }));
    res.json(parsedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Movie not found' });
    const parsedRow = {
      ...row,
      copyright_region: row.copyright_region ? JSON.parse(row.copyright_region) : null,
      pre_show_languages: row.pre_show_languages ? JSON.parse(row.pre_show_languages) : null,
      pre_show_subtitles: row.pre_show_subtitles ? JSON.parse(row.pre_show_subtitles) : null,
    };
    res.json(parsedRow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const {
      title, genre, duration, director, release_date, copyright_expiry, revenue_share_ratio, pre_show_package, poster_url, status,
      synopsis, cast,
      copyright_holder, copyright_reg_no, copyright_region, copyright_terms,
      pre_show_ad_duration, pre_show_trailer_count, pre_show_material_version, pre_show_material_path, pre_show_languages, pre_show_subtitles,
      share_effective_date, share_expiry_date, share_tiered, share_tier1_ratio, share_tier2_ratio, share_tier3_ratio,
      lifecycle_first_schedule, lifecycle_last_schedule, lifecycle_notes,
    } = req.body;
    const result = db.prepare(
      `INSERT INTO movies (
        title, genre, duration, director, release_date, copyright_expiry, revenue_share_ratio, pre_show_package, poster_url, status,
        synopsis, cast,
        copyright_holder, copyright_reg_no, copyright_region, copyright_terms,
        pre_show_ad_duration, pre_show_trailer_count, pre_show_material_version, pre_show_material_path, pre_show_languages, pre_show_subtitles,
        share_effective_date, share_expiry_date, share_tiered, share_tier1_ratio, share_tier2_ratio, share_tier3_ratio,
        lifecycle_first_schedule, lifecycle_last_schedule, lifecycle_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      title, genre, duration, director, release_date, copyright_expiry || null, revenue_share_ratio || 0.5, pre_show_package || null, poster_url || null, status || 'upcoming',
      synopsis || null, cast || null,
      copyright_holder || null, copyright_reg_no || null, copyright_region ? JSON.stringify(copyright_region) : null, copyright_terms || null,
      pre_show_ad_duration || null, pre_show_trailer_count || null, pre_show_material_version || null, pre_show_material_path || null,
      pre_show_languages ? JSON.stringify(pre_show_languages) : null, pre_show_subtitles ? JSON.stringify(pre_show_subtitles) : null,
      share_effective_date || null, share_expiry_date || null, share_tiered ? 1 : 0, share_tier1_ratio || null, share_tier2_ratio || null, share_tier3_ratio || null,
      lifecycle_first_schedule || null, lifecycle_last_schedule || null, lifecycle_notes || null
    );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Movie not found' });
    const {
      title, genre, duration, director, release_date, copyright_expiry, revenue_share_ratio, pre_show_package, poster_url, status,
      synopsis, cast,
      copyright_holder, copyright_reg_no, copyright_region, copyright_terms,
      pre_show_ad_duration, pre_show_trailer_count, pre_show_material_version, pre_show_material_path, pre_show_languages, pre_show_subtitles,
      share_effective_date, share_expiry_date, share_tiered, share_tier1_ratio, share_tier2_ratio, share_tier3_ratio,
      lifecycle_first_schedule, lifecycle_last_schedule, lifecycle_notes,
    } = req.body;
    db.prepare(
      `UPDATE movies SET
        title=?, genre=?, duration=?, director=?, release_date=?, copyright_expiry=?, revenue_share_ratio=?, pre_show_package=?, poster_url=?, status=?,
        synopsis=?, cast=?,
        copyright_holder=?, copyright_reg_no=?, copyright_region=?, copyright_terms=?,
        pre_show_ad_duration=?, pre_show_trailer_count=?, pre_show_material_version=?, pre_show_material_path=?, pre_show_languages=?, pre_show_subtitles=?,
        share_effective_date=?, share_expiry_date=?, share_tiered=?, share_tier1_ratio=?, share_tier2_ratio=?, share_tier3_ratio=?,
        lifecycle_first_schedule=?, lifecycle_last_schedule=?, lifecycle_notes=?,
        updated_at=datetime('now','localtime')
      WHERE id=?`
    ).run(
      title ?? existing.title,
      genre ?? existing.genre,
      duration ?? existing.duration,
      director ?? existing.director,
      release_date ?? existing.release_date,
      copyright_expiry ?? existing.copyright_expiry,
      revenue_share_ratio ?? existing.revenue_share_ratio,
      pre_show_package ?? existing.pre_show_package,
      poster_url ?? existing.poster_url,
      status ?? existing.status,
      synopsis ?? existing.synopsis,
      cast ?? existing.cast,
      copyright_holder ?? existing.copyright_holder,
      copyright_reg_no ?? existing.copyright_reg_no,
      copyright_region !== undefined ? JSON.stringify(copyright_region) : existing.copyright_region,
      copyright_terms ?? existing.copyright_terms,
      pre_show_ad_duration ?? existing.pre_show_ad_duration,
      pre_show_trailer_count ?? existing.pre_show_trailer_count,
      pre_show_material_version ?? existing.pre_show_material_version,
      pre_show_material_path ?? existing.pre_show_material_path,
      pre_show_languages !== undefined ? JSON.stringify(pre_show_languages) : existing.pre_show_languages,
      pre_show_subtitles !== undefined ? JSON.stringify(pre_show_subtitles) : existing.pre_show_subtitles,
      share_effective_date ?? existing.share_effective_date,
      share_expiry_date ?? existing.share_expiry_date,
      share_tiered !== undefined ? (share_tiered ? 1 : 0) : existing.share_tiered,
      share_tier1_ratio ?? existing.share_tier1_ratio,
      share_tier2_ratio ?? existing.share_tier2_ratio,
      share_tier3_ratio ?? existing.share_tier3_ratio,
      lifecycle_first_schedule ?? existing.lifecycle_first_schedule,
      lifecycle_last_schedule ?? existing.lifecycle_last_schedule,
      lifecycle_notes ?? existing.lifecycle_notes,
      req.params.id
    );
    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM movies WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Movie not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
