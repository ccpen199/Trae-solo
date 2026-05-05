const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

function getTagsForFavorite(favoriteId, callback) {
  db.all(
    `SELECT tag FROM tags WHERE favorite_id = ? ORDER BY created_at`,
    [favoriteId],
    (err, rows) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, rows.map(r => r.tag));
      }
    }
  );
}

function addTagsToFavorite(favoriteId, tags, callback) {
  try {
    db.run(`DELETE FROM tags WHERE favorite_id = ?`, [favoriteId]);

    if (!tags || tags.length === 0) {
      if (callback) callback(null);
      return;
    }

    const insertStmt = db.prepare(`INSERT INTO tags (favorite_id, tag) VALUES (?, ?)`);
    
    for (const tag of tags) {
      const trimmedTag = tag.trim();
      if (trimmedTag.length > 0) {
        insertStmt.run(favoriteId, trimmedTag);
      }
    }

    if (callback) callback(null);
  } catch (err) {
    console.error('addTagsToFavorite error:', err.message);
    if (callback) callback(err);
  }
}

router.get('/check', authenticateToken, (req, res) => {
  const { object_type, object_id } = req.query;
  const userId = req.user.id;

  if (!object_type || !object_id) {
    return res.status(400).json({ error: 'object_type and object_id are required' });
  }

  db.get(
    `SELECT id, is_deleted FROM favorites 
     WHERE user_id = ? AND object_type = ? AND object_id = ?`,
    [userId, object_type, object_id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (row && row.is_deleted === 0) {
        res.json({ isFavorite: true, favoriteId: row.id });
      } else {
        res.json({ isFavorite: false });
      }
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { object_type, object_id, object_data, tags, source_page } = req.body;
  const userId = req.user.id;

  if (!object_type || !object_id) {
    return res.status(400).json({ error: 'object_type and object_id are required' });
  }

  if (!['product', 'company'].includes(object_type)) {
    return res.status(400).json({ error: 'object_type must be "product" or "company"' });
  }

  if (tags && tags.length > 3) {
    return res.status(400).json({ error: 'Maximum 3 tags allowed' });
  }

  db.get(
    `SELECT id, is_deleted FROM favorites 
     WHERE user_id = ? AND object_type = ? AND object_id = ?`,
    [userId, object_type, object_id],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existing && existing.is_deleted === 0) {
        return res.status(200).json({
          message: 'Already in favorites',
          alreadyExists: true,
          favoriteId: existing.id
        });
      }

      if (existing && existing.is_deleted === 1) {
        db.run(
          `UPDATE favorites 
           SET is_deleted = 0, updated_at = CURRENT_TIMESTAMP, object_data = ?, source_page = ?
           WHERE id = ?`,
          [JSON.stringify(object_data), source_page || null, existing.id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            if (tags && tags.length > 0) {
              addTagsToFavorite(existing.id, tags, (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Database error' });
                }
                res.status(201).json({
                  message: 'Favorite restored',
                  favoriteId: existing.id,
                  alreadyExists: false
                });
              });
            } else {
              res.status(201).json({
                message: 'Favorite restored',
                favoriteId: existing.id,
                alreadyExists: false
              });
            }
          }
        );
        return;
      }

      db.run(
        `INSERT INTO favorites (user_id, object_type, object_id, object_data, source_page)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, object_type, object_id, JSON.stringify(object_data), source_page || null],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          const favoriteId = this.lastID;

          if (tags && tags.length > 0) {
            addTagsToFavorite(favoriteId, tags, (err) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }
              res.status(201).json({
                message: 'Favorite added successfully',
                favoriteId,
                alreadyExists: false
              });
            });
          } else {
            res.status(201).json({
              message: 'Favorite added successfully',
              favoriteId,
              alreadyExists: false
            });
          }
        }
      );
    }
  );
});

router.get('/', authenticateToken, (req, res) => {
  const { type = 'all', tag } = req.query;
  const userId = req.user.id;

  let query = `
    SELECT f.*, 
           GROUP_CONCAT(t.tag, ',') as tags_list
    FROM favorites f
    LEFT JOIN tags t ON f.id = t.favorite_id
    WHERE f.user_id = ? AND f.is_deleted = 0
  `;
  const params = [userId];

  if (type && type !== 'all') {
    query += ` AND f.object_type = ?`;
    params.push(type);
  }

  if (tag) {
    query += ` AND f.id IN (SELECT favorite_id FROM tags WHERE tag = ?)`;
    params.push(tag);
  }

  query += ` GROUP BY f.id ORDER BY f.created_at DESC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const favorites = rows.map(row => ({
      ...row,
      object_data: row.object_data ? JSON.parse(row.object_data) : null,
      tags: row.tags_list ? row.tags_list.split(',') : []
    }));

    let productCount = 0;
    let companyCount = 0;

    db.all(
      `SELECT object_type, COUNT(*) as count 
       FROM favorites 
       WHERE user_id = ? AND is_deleted = 0 
       GROUP BY object_type`,
      [userId],
      (err, countRows) => {
        if (err) {
          console.error('Count error:', err);
        } else {
          countRows.forEach(r => {
            if (r.object_type === 'product') productCount = r.count;
            if (r.object_type === 'company') companyCount = r.count;
          });
        }

        res.json({
          favorites,
          counts: {
            total: productCount + companyCount,
            product: productCount,
            company: companyCount
          }
        });
      }
    );
  });
});

router.get('/tags', authenticateToken, (req, res) => {
  const { limit } = req.query;
  const userId = req.user.id;

  let query = `
    SELECT t.tag, COUNT(DISTINCT f.id) as count
    FROM tags t
    INNER JOIN favorites f ON t.favorite_id = f.id
    WHERE f.user_id = ? AND f.is_deleted = 0
    GROUP BY t.tag
    ORDER BY count DESC, t.tag
  `;

  const params = [userId];

  if (limit && !isNaN(parseInt(limit))) {
    query += ` LIMIT ?`;
    params.push(parseInt(limit));
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ tags: rows });
  });
});

router.put('/:id/tags', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { tags } = req.body;
  const userId = req.user.id;

  if (tags && tags.length > 3) {
    return res.status(400).json({ error: 'Maximum 3 tags allowed' });
  }

  db.get(
    `SELECT id FROM favorites WHERE id = ? AND user_id = ?`,
    [id, userId],
    (err, favorite) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!favorite) {
        return res.status(404).json({ error: 'Favorite not found' });
      }

      addTagsToFavorite(parseInt(id), tags || [], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        db.run(
          `UPDATE favorites SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [id],
          () => {
            res.json({ message: 'Tags updated successfully' });
          }
        );
      });
    }
  );
});

router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.get(
    `SELECT id FROM favorites WHERE id = ? AND user_id = ?`,
    [id, userId],
    (err, favorite) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!favorite) {
        return res.status(404).json({ error: 'Favorite not found' });
      }

      db.run(
        `UPDATE favorites SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ message: 'Favorite removed successfully', removed: true });
        }
      );
    }
  );
});

router.post('/batch-delete', authenticateToken, (req, res) => {
  const { ids } = req.body;
  const userId = req.user.id;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No IDs provided' });
  }

  const placeholders = ids.map(() => '?').join(',');
  const params = [userId, ...ids];

  db.run(
    `UPDATE favorites SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP 
     WHERE user_id = ? AND id IN (${placeholders})`,
    params,
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ 
        message: 'Favorites removed successfully', 
        removed: this.changes 
      });
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { object_data } = req.body;
  const userId = req.user.id;

  db.get(
    `SELECT id FROM favorites WHERE id = ? AND user_id = ?`,
    [id, userId],
    (err, favorite) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!favorite) {
        return res.status(404).json({ error: 'Favorite not found' });
      }

      db.run(
        `UPDATE favorites SET object_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [JSON.stringify(object_data), id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ message: 'Favorite updated successfully' });
        }
      );
    }
  );
});

module.exports = router;
