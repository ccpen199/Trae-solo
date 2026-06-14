import { Router } from 'express'
import { getUniversities, getUniversityById, getUniversityScores, compareUniversities, getUniversityMajors } from '../controllers/universityController.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/', getUniversities)
router.get('/compare', compareUniversities)
router.get('/:id', getUniversityById)
router.get('/:id/scores', getUniversityScores)
router.get('/:id/majors', getUniversityMajors)

export default router
