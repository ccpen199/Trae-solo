const express = require('express')
const { search, getSearchHistory, clearSearchHistory } = require('../controllers/search')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.get('/', authMiddleware, search)
router.get('/history', authMiddleware, getSearchHistory)
router.delete('/history', authMiddleware, clearSearchHistory)

module.exports = router
