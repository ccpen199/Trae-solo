const { db } = require('./database');

function getServiceUserId(req) {
  const userId = req.user?.id;
  if (!userId) return null;

  const ownProfile = db.prepare('SELECT user_id FROM user_profiles WHERE user_id = ?').get(userId);
  if (ownProfile) return userId;

  const fallback = db.prepare(`
    SELECT u.id
    FROM users u
    JOIN user_profiles up ON up.user_id = u.id
    WHERE u.role = 'user' AND u.status = 'active'
    ORDER BY u.id
    LIMIT 1
  `).get();

  return fallback?.id || userId;
}

module.exports = { getServiceUserId };
