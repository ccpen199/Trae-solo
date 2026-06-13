import { Router } from 'express'
import { 
  createTask, 
  getTasks, 
  getTaskById, 
  publishTask, 
  getMyTasks,
  uploadTaskAttachment,
  selectBid,
} from '../controllers/taskController'
import { authMiddleware } from '../middleware/auth'
import { upload } from '../middleware/upload'

const router = Router()

router.get('/', getTasks)
router.get('/my', authMiddleware, getMyTasks)
router.post('/', authMiddleware, createTask)
router.get('/:id', getTaskById)
router.post('/:id/publish', authMiddleware, publishTask)
router.post('/:id/attachments', authMiddleware, upload.single('file'), uploadTaskAttachment)
router.post('/:taskId/select-bid/:bidId', authMiddleware, selectBid)

export default router
