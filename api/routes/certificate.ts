import { Router, type Request, type Response } from 'express'
import { authMiddleware, adminMiddleware, type AuthRequest } from '../middleware/auth.js'
import * as certificateService from '../services/certificateService.js'
import fs from 'fs'

const router = Router()

router.post('/generate/:orderId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = certificateService.generateCertificate(req.params.orderId)
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error })
      return
    }
    res.json({ success: true, certificate: result.certificate })
  } catch (err) {
    res.status(500).json({ success: false, error: '生成证书失败' })
  }
})

router.get('/mine', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const result = certificateService.getUserCertificates(req.user!.id, page, pageSize)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取我的证书失败' })
  }
})

router.get('/all', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const result = certificateService.getAllCertificates(page, pageSize)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取证书列表失败' })
  }
})

router.get('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const certificateNo = req.query.certificateNo as string | undefined
    const id = req.query.id as string | undefined
    if (!certificateNo && !id) {
      res.status(400).json({ success: false, error: '证书编号或ID必填' })
      return
    }
    const result = certificateService.verifyCertificate(certificateNo || '', id)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, error: '证书验证失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const certificate = certificateService.getCertificateById(req.params.id)
    if (!certificate) {
      res.status(404).json({ success: false, error: '证书不存在' })
      return
    }
    res.json({ success: true, certificate })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取证书详情失败' })
  }
})

router.get('/download/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cert = certificateService.getCertificateById(req.params.id)
    if (!cert) {
      res.status(404).json({ success: false, error: '证书不存在' })
      return
    }
    if (cert.user_id !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, error: '无权限下载此证书' })
      return
    }
    const pdfPath = certificateService.getPdfPath(req.params.id)
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      res.status(404).json({ success: false, error: 'PDF文件不存在' })
      return
    }
    res.download(pdfPath, `certificate-${cert.certificate_no}.pdf`)
  } catch (err) {
    res.status(500).json({ success: false, error: '下载证书失败' })
  }
})

router.post('/:id/revoke', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const ok = certificateService.revokeCertificate(req.params.id)
    if (!ok) {
      res.status(400).json({ success: false, error: '吊销失败' })
      return
    }
    res.json({ success: true, message: '证书已吊销' })
  } catch (err) {
    res.status(500).json({ success: false, error: '吊销证书失败' })
  }
})

export default router
