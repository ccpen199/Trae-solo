const express = require('express');
const router = express.Router();
const { getMyBook, addEntry, updateEntry, deleteEntry } = require('../controllers/bookController');
const { authenticateToken, requireBabyInfo } = require('../middleware/auth');

router.get('/', authenticateToken, getMyBook);
router.post('/entries', authenticateToken, requireBabyInfo, addEntry);
router.put('/entries/:id', authenticateToken, updateEntry);
router.delete('/entries/:id', authenticateToken, deleteEntry);

module.exports = router;
