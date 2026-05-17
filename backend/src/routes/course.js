const express = require('express')
const { getCourseList, getCourseDetail, getHomeData, updateCourseProgress } = require('../controllers/course')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.get('/', getCourseList)
router.get('/home', authMiddleware, getHomeData)
router.get('/:id', authMiddleware, getCourseDetail)
router.post('/progress', authMiddleware, updateCourseProgress)

module.exports = router
