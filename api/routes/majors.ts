import { Router } from 'express'
import { getMajors, getMajorById, compareMajors } from '../controllers/majorController.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/', getMajors)
router.get('/compare', compareMajors)
router.get('/:id', getMajorById)

export default router
