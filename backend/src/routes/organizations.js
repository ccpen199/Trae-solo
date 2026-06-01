const express = require('express');
const db = require('../models/database');

const router = express.Router();

router.get('/', (req, res) => {
  const orgs = db.prepare('SELECT * FROM organizations ORDER BY id').all();
  res.json(orgs);
});

router.get('/:id/issues', (req, res) => {
  const issues = db.prepare(`
    SELECT i.*, o.name as org_name
    FROM issues i
    LEFT JOIN organizations o ON i.responsible_org_id = o.id
    WHERE i.responsible_org_id = ?
    ORDER BY i.created_at DESC
  `).all(req.params.id);
  res.json(issues);
});

module.exports = router;
