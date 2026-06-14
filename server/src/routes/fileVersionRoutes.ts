import { Router } from 'express'
import { 
  uploadFileVersion,
  getFileVersions,
  getFileVersionById,
  updateFileVersion,
  deleteFileVersion,
  setFinalVersion,
  downloadFileVersion,
} from '../controllers/fileVersionController'
import { authMiddleware } from '../middleware/auth'
import { upload } from '../middleware/upload'

const router = Router()

router.get('/task/:taskId', authMiddleware, getFileVersions)
router.get('/:id', authMiddleware, getFileVersionById)
router.get('/:id/download', authMiddleware, downloadFileVersion)
router.post('/task/:taskId', authMiddleware, upload.single('file'), uploadFileVersion)
router.put('/:id', authMiddleware, updateFileVersion)
router.delete('/:id', authMiddleware, deleteFileVersion)
router.post('/:id/final', authMiddleware, setFinalVersion)

export default router
