import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { env } from '../config/env.js'
import { success, error } from '../utils/response.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR)

const BUSINESS_TYPES = ['permit', 'violation', 'accident', 'ebike', 'certificate', 'avatar', 'other']

const storage = multer.diskStorage({
  destination: function(req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    const businessType = (req.query.businessType as string) || 'other'
    const typeDir = BUSINESS_TYPES.includes(businessType) ? businessType : 'other'
    const fullDir = path.join(uploadDir, typeDir)

    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true })
    }

    cb(null, fullDir)
  },
  filename: function(req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: function(req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (extname && mimetype) {
      return cb(null, true)
    } else {
      cb(new Error('仅支持上传图片、PDF和Word文档'))
    }
  }
})

router.post('/', authMiddleware, function(req: Request, res: Response): void {
  const uploadSingle = upload.single('file')

  uploadSingle(req, res, function(err: any) {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return error(res, '文件大小不能超过10MB')
        }
        return error(res, err.message)
      } else if (err) {
        return error(res, err.message || '文件上传失败')
      }
    }

    if (!req.file) {
      return error(res, '请选择要上传的文件')
    }

    const businessType = (req.query.businessType as string) || 'other'
    const typeDir = BUSINESS_TYPES.includes(businessType) ? businessType : 'other'

    const fileUrl = '/uploads/' + typeDir + '/' + req.file.filename

    success(res, {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: fileUrl,
      path: req.file.path
    }, '文件上传成功')
  })
})

router.post('/multiple', authMiddleware, function(req: Request, res: Response): void {
  const uploadMultiple = upload.array('files', 10)

  uploadMultiple(req, res, function(err: any) {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return error(res, '单个文件大小不能超过10MB')
        }
        return error(res, err.message)
      } else if (err) {
        return error(res, err.message || '文件上传失败')
      }
    }

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return error(res, '请选择要上传的文件')
    }

    const businessType = (req.query.businessType as string) || 'other'
    const typeDir = BUSINESS_TYPES.includes(businessType) ? businessType : 'other'

    const files = (req.files as Express.Multer.File[]).map(function(file) {
      return {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: '/uploads/' + typeDir + '/' + file.filename,
        path: file.path
      }
    })

    success(res, files, '文件上传成功')
  })
})

export default router
