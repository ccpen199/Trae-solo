import { Router, type Request, type Response } from 'express'
import type { ApiResponse } from '../../shared/types'
import { generateId } from '../db/index.js'

const router = Router()

router.post('/generate/:namingId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { namingId } = req.params
    const reportId = generateId('report')
    const result = {
      reportId,
      pdfUrl: `/api/report/download/${reportId}`
    }
    const response: ApiResponse<typeof result> = { code: 0, message: '报告生成成功', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

router.get('/download/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="naming-report-${id}.pdf"`)
    const mockPdfContent = Buffer.from(
      '%PDF-1.4\n%mock pdf content for naming report',
      'utf-8'
    )
    res.send(mockPdfContent)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

export default router
