const express = require('express');
const router = express.Router();

module.exports = (authService) => {
  router.post('/login', (req, res) => {
    try {
      const { username, password } = req.body;
      const result = authService.login(username, password);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/me', (req, res) => {
    authService.middleware(req, res, () => {
      res.json({
        user: req.user
      });
    });
  });

  return router;
};
