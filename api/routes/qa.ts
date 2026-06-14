import { Router } from 'express'
import { getQuestions, createQuestion, getQuestionById, createAnswer, likeAnswer } from '../controllers/qaController.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/questions', getQuestions)
router.post('/questions', auth, createQuestion)
router.get('/questions/:id', getQuestionById)
router.post('/questions/:id/answers', auth, createAnswer)
router.post('/answers/:id/like', auth, likeAnswer)

export default router
