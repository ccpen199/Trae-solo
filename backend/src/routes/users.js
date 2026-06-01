const express = require('express');

function createUsersRouter(db, auth) {
  const router = express.Router();

  router.get('/', auth, (req, res) => {
    try {
      const users = db.prepare(`
        SELECT u.id, u.username, u.real_name, u.email, u.phone, u.status,
               r.name as role_name, r.description as role_description,
               u.created_at
        FROM users u
        JOIN roles r ON u.role_id = r.id
        ORDER BY u.id
      `).all();

      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/roles', auth, (req, res) => {
    try {
      const roles = db.prepare('SELECT * FROM roles').all();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createUsersRouter;
