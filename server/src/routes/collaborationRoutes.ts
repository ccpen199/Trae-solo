import { Router } from 'express'
import { 
  createCollaboration,
  getCollaborations,
  getCollaborationById,
  updateCollaboration,
  deleteCollaboration,
  resolveCollaboration,
  batchResolveCollaborations,
} from '../controllers/collaborationController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.get('/task/:taskId', authMiddleware, getCollaborations)
router.get('/:id', authMiddleware, getCollaborationById)
router.post('/', authMiddleware, createCollaboration)
router.put('/:id', authMiddleware, updateCollaboration)
router.delete('/:id', authMiddleware, deleteCollaboration)
router.post('/:id/resolve', authMiddleware, resolveCollaboration)
router.post('/task/:taskId/batch-resolve', authMiddleware, batchResolveCollaborations)

export default router
