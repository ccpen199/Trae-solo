import { Router } from 'express'
import { 
  createTask, 
  getTasks, 
  getTaskById, 
  publishTask, 
  getMyTasks,
  uploadTaskAttachment,
  selectBid,
  getPlatformStats,
  updateTask,
  deleteTaskAttachment,
  deleteTask,
} from '../controllers/taskController'
import { authMiddleware } from '../middleware/auth'
import { upload } from '../middleware/upload'

const router = Router()

router.get('/stats', getPlatformStats)
router.get('/', getTasks)
router.get('/my', authMiddleware, getMyTasks)
router.post('/', authMiddleware, createTask)
router.put('/:id', authMiddleware, updateTask)
router.get('/:id', getTaskById)
router.post('/:id/publish', authMiddleware, publishTask)
router.post('/:id/attachments', authMiddleware, upload.single('file'), uploadTaskAttachment)
router.delete('/:id/attachments/:attachmentId', authMiddleware, deleteTaskAttachment)
router.delete('/:id', authMiddleware, deleteTask)
router.post('/:taskId/select-bid/:bidId', authMiddleware, selectBid)

export default router
