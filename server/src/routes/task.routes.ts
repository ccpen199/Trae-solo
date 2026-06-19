import { Router } from 'express'
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskUnits,
  submitAnnotation,
  getRecommendedTasks,
} from '../controllers/task.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authenticate, getTasks)
router.get('/recommended', authenticate, getRecommendedTasks)
router.get('/:id', authenticate, getTaskById)
router.post('/', authenticate, createTask)
router.put('/:id', authenticate, updateTask)
router.delete('/:id', authenticate, deleteTask)
router.get('/:id/units', authenticate, getTaskUnits)
router.post('/units/:unitId/annotate', authenticate, submitAnnotation)

export { router as taskRouter }
