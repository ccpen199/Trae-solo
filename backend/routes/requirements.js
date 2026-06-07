const express = require('express');
const db = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, (req, res) => {
  const {
    title, description, category, skill_tags, budget_type,
    budget_min, budget_max, budget_fixed, location,
    latitude, longitude, service_date, service_duration,
    delivery_deadline, deliverables
  } = req.body;

  db.run(
    `INSERT INTO service_requirements 
     (client_id, title, description, category, skill_tags, budget_type,
      budget_min, budget_max, budget_fixed, location, latitude, longitude,
      service_date, service_duration, delivery_deadline, deliverables)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id, title, description, category, JSON.stringify(skill_tags || []),
      budget_type || 'fixed', budget_min || 0, budget_max || 0, budget_fixed || 0,
      location || '', latitude || null, longitude || null,
      service_date || null, service_duration || 0, delivery_deadline || null,
      JSON.stringify(deliverables || [])
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '发布需求失败' });
      }

      const requirementId = this.lastID;
      
      runMatchingAlgorithm(requirementId, (err) => {
        res.json({ message: '需求发布成功', id: requirementId });
      });
    }
  );
});

function runMatchingAlgorithm(requirementId, callback) {
  db.get('SELECT * FROM service_requirements WHERE id = ?', [requirementId], (err, req) => {
    if (!req) return callback(new Error('需求不存在'));

    const reqSkills = JSON.parse(req.skill_tags || '[]');
    const skillIds = reqSkills.map(s => s.id);

    let query = `
      SELECT DISTINCT u.id as provider_id, u.rating, u.response_time,
             u.latitude as p_lat, u.longitude as p_lng,
             COUNT(DISTINCT ps.skill_tag_id) as skill_match_count
      FROM users u
      JOIN provider_skills ps ON u.id = ps.user_id
      WHERE u.role = 'provider'
    `;
    const params = [];

    if (skillIds.length > 0) {
      query += ` AND ps.skill_tag_id IN (${skillIds.map(() => '?').join(',')})`;
      params.push(...skillIds);
    }

    query += ` GROUP BY u.id ORDER BY skill_match_count DESC, u.rating DESC LIMIT 10`;

    db.all(query, params, (err, providers) => {
      if (err || !providers.length) return callback(err);

      const matchStmt = db.prepare(
        `INSERT INTO matches (requirement_id, provider_id, match_score, skill_match, 
                              distance_match, rating_match, response_match)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );

      providers.forEach(provider => {
        const skillMatch = skillIds.length > 0 ? (provider.skill_match_count / skillIds.length) * 40 : 20;
        
        let distanceMatch = 15;
        if (req.latitude && req.longitude && provider.p_lat && provider.p_lng) {
          const distance = calculateDistance(req.latitude, req.longitude, provider.p_lat, provider.p_lng);
          if (distance <= 5) distanceMatch = 20;
          else if (distance <= 15) distanceMatch = 15;
          else if (distance <= 30) distanceMatch = 10;
          else distanceMatch = 5;
        }

        const ratingMatch = ((provider.rating || 5) / 5) * 25;
        const responseMatch = Math.max(0, 20 - (provider.response_time || 0) / 60);
        const totalScore = skillMatch + distanceMatch + ratingMatch + responseMatch;

        matchStmt.run(
          requirementId, provider.provider_id, totalScore,
          skillMatch, distanceMatch, ratingMatch, responseMatch
        );
      });

      matchStmt.finalize(callback);
    });
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

router.get('/', authenticateToken, (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT sr.*, 
           (SELECT username FROM users WHERE id = sr.client_id) as client_name,
           (SELECT COUNT(*) FROM matches WHERE requirement_id = sr.id) as match_count
    FROM service_requirements sr WHERE sr.client_id = ?
  `;
  const params = [req.user.id];

  if (status) {
    query += ' AND sr.status = ?';
    params.push(status);
  }

  query += ' ORDER BY sr.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, requirements) => {
    res.json(requirements || []);
  });
});

router.get('/all', (req, res) => {
  const { category, status = 'open', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT sr.*, 
           (SELECT username FROM users WHERE id = sr.client_id) as client_name
    FROM service_requirements sr WHERE sr.status = ?
  `;
  const params = [status];

  if (category) {
    query += ' AND sr.category = ?';
    params.push(category);
  }

  query += ' ORDER BY sr.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, requirements) => {
    res.json(requirements || []);
  });
});

router.get('/:id', (req, res) => {
  db.get(
    `SELECT sr.*, 
            (SELECT username FROM users WHERE id = sr.client_id) as client_name,
            (SELECT avatar FROM users WHERE id = sr.client_id) as client_avatar
     FROM service_requirements sr WHERE sr.id = ?`,
    [req.params.id],
    (err, requirement) => {
      if (!requirement) {
        return res.status(404).json({ error: '需求不存在' });
      }
      res.json(requirement);
    }
  );
});

router.get('/:id/matches', authenticateToken, (req, res) => {
  db.all(
    `SELECT m.*, u.username, u.avatar, u.rating, u.rating_count
     FROM matches m
     JOIN users u ON m.provider_id = u.id
     WHERE m.requirement_id = ?
     ORDER BY m.match_score DESC`,
    [req.params.id],
    (err, matches) => {
      res.json(matches || []);
    }
  );
});

router.post('/:id/accept-match/:matchId', authenticateToken, (req, res) => {
  db.get(
    'SELECT * FROM matches WHERE id = ? AND requirement_id = ?',
    [req.params.matchId, req.params.id],
    (err, match) => {
      if (!match) {
        return res.status(404).json({ error: '匹配不存在' });
      }

      db.run(
        `UPDATE service_requirements 
         SET status = 'matched', matched_provider_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND client_id = ?`,
        [match.provider_id, req.params.id, req.user.id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: '接受匹配失败' });
          }

          db.run(
            'UPDATE matches SET status = "accepted", client_accepted = 1 WHERE id = ?',
            [req.params.matchId],
            function(err) {
              res.json({ message: '已接受匹配' });
            }
          );
        }
      );
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const {
    title, description, budget_type, budget_min, budget_max, budget_fixed,
    location, service_date, delivery_deadline, status
  } = req.body;

  db.run(
    `UPDATE service_requirements SET
       title = COALESCE(?, title),
       description = COALESCE(?, description),
       budget_type = COALESCE(?, budget_type),
       budget_min = COALESCE(?, budget_min),
       budget_max = COALESCE(?, budget_max),
       budget_fixed = COALESCE(?, budget_fixed),
       location = COALESCE(?, location),
       service_date = COALESCE(?, service_date),
       delivery_deadline = COALESCE(?, delivery_deadline),
       status = COALESCE(?, status),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND client_id = ?`,
    [title, description, budget_type, budget_min, budget_max, budget_fixed,
     location, service_date, delivery_deadline, status, req.params.id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '更新需求失败' });
      }
      res.json({ message: '更新成功' });
    }
  );
});

module.exports = router;
