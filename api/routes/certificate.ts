import { Router, type Request, type Response } from 'express'
import CertificateService from '../services/CertificateService.js'
import db from '../db/index.js'
import { success, error, paged } from '../utils/response.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()
const certificateService = new CertificateService(db)

router.post('/issue', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      error(res, '用户未认证', 401)
      return
    }

    const { certType, holderName, holderIdCard, issueDate, expiryDate } = req.body

    const result = certificateService.issue({
      userId,
      certType,
      holderName,
      holderIdCard,
      issueDate,
      expiryDate,
    })

    success(res, result, '证照签发成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '证照签发失败'
    error(res, message)
  }
})

router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { certNumber, verifyCode } = req.body

    const result = certificateService.verify({
      certNumber,
      verifyCode,
    })

    success(res, result, '证照核验完成')
  } catch (err) {
    const message = err instanceof Error ? err.message : '证照核验失败'
    error(res, message)
  }
})

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      error(res, '用户未认证', 401)
      return
    }

    const { certType, status, page = 1, pageSize = 10 } = req.query

    const result = certificateService.getList({
      userId,
      certType: certType as string,
      status: status as string,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    })

    paged(res, result.list, result.total, result.page, result.pageSize, '获取证照列表成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取证照列表失败'
    error(res, message)
  }
})

router.get('/my', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      error(res, '用户未认证', 401)
      return
    }

    const { certType, status, page = 1, pageSize = 10 } = req.query

    const result = certificateService.getList({
      userId,
      certType: certType as string,
      status: status as string,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    })

    paged(res, result.list, result.total, result.page, result.pageSize, '获取我的证照成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取证照列表失败'
    error(res, message)
  }
})

router.get('/types', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = certificateService.getCertTypes()
    success(res, result, '获取证照类型成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取失败'
    error(res, message)
  }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const result = certificateService.getDetail(id)
    success(res, result, '获取证照详情成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取详情失败'
    error(res, message)
  }
})

router.get('/verify/:certNumber', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const certNumber = req.params.certNumber
    const result = certificateService.verify({ certNumber })
    success(res, result.certificate, '核验完成')
  } catch (err) {
    const message = err instanceof Error ? err.message : '核验失败'
    error(res, message)
  }
})

router.get('/:id/download', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const cert = certificateService.getDetail(id)
    success(res, cert.certNumber, '获取下载链接成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取失败'
    error(res, message)
  }
})

router.get('/:id/qrcode', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const cert = certificateService.getDetail(id)
    success(res, cert.verifyCode, '获取二维码成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取失败'
    error(res, message)
  }
})

router.post('/generate', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      error(res, '用户未认证', 401)
      return
    }
    const { certType, businessId } = req.body
    const user = req.user || {}
    const result = certificateService.issue({
      userId,
      certType,
      holderName: (user as any).name || '',
      holderIdCard: (user as any).idCard || '',
    })
    success(res, result, '证照生成成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '生成失败'
    error(res, message)
  }
})

router.post('/:id/revoke', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { reason } = req.body
    const result = certificateService.revoke(id, reason || '')
    success(res, result, '证照吊销成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '吊销失败'
    error(res, message)
  }
})

export default router
