import { Router } from 'express'
import { 
  createMilestones, 
  getMilestones, 
  getMilestoneById,
  submitMilestone, 
  approveMilestone, 
  rejectMilestone,
  uploadFileVersion,
  getFileVersions,
  addCollaboration,
  getCollaborations,
  resolveCollaboration,
} from '../controllers/milestoneController'
import { authMiddleware } from '../middleware/auth'
import { upload } from '../middleware/upload'

const router = Router()

router.get('/task/:taskId', getMilestones)
router.get('/:milestoneId', authMiddleware, getMilestoneById)
router.post('/task/:taskId', authMiddleware, createMilestones)
router.post('/:milestoneId/submit', authMiddleware, submitMilestone)
router.post('/:milestoneId/approve', authMiddleware, approveMilestone)
router.post('/:milestoneId/reject', authMiddleware, rejectMilestone)

router.get('/task/:taskId/files', getFileVersions)
router.post('/task/:taskId/files', authMiddleware, upload.single('file'), uploadFileVersion)

router.get('/task/:taskId/collaborations', getCollaborations)
router.post('/task/:taskId/collaborations', authMiddleware, addCollaboration)
router.patch('/task/:taskId/collaborations/:collaborationId', authMiddleware, resolveCollaboration)

export default router
