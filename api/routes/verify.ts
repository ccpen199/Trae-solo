import { Router, type Request, type Response } from 'express'

const router = Router()
const CERTIFICATE_FIXTURES: Record<string, { cert_number: string; issue_date: string; issue_authority: string; confidence: number }> = {
  '建设用地规划许可证': {
    cert_number: '沪地规(2026)字第001268号',
    issue_date: '2026-03-18',
    issue_authority: '上海市规划和自然资源局',
    confidence: 98,
  },
  '建设工程规划许可证': {
    cert_number: '沪建规(2026)字第002417号',
    issue_date: '2026-02-08',
    issue_authority: '上海市规划和自然资源局',
    confidence: 97,
  },
  '建筑工程施工许可证': {
    cert_number: '沪施许(2026)第003551号',
    issue_date: '2026-01-20',
    issue_authority: '上海市住房和城乡建设管理委员会',
    confidence: 96,
  },
  '国有土地使用证': {
    cert_number: '沪国用(2026)第000918号',
    issue_date: '2025-12-12',
    issue_authority: '上海市自然资源确权登记局',
    confidence: 95,
  },
  '商品房预售许可证': {
    cert_number: '沪房预售证(2026)第004806号',
    issue_date: '2026-04-05',
    issue_authority: '上海市房屋管理局',
    confidence: 97,
  },
}

router.post('/ocr', (req: Request, res: Response): void => {
  const certType = typeof req.body.type === 'string' && req.body.type.trim()
    ? req.body.type
    : '建设用地规划许可证'
  const fixture = CERTIFICATE_FIXTURES[certType] || CERTIFICATE_FIXTURES['建设用地规划许可证']

  res.json({
    success: true,
    data: {
      ...fixture,
      type: certType,
      preview_ready: Boolean(req.body.imageBase64),
    }
  })
})

router.post('/bureau', (req: Request, res: Response): void => {
  const certNumber = req.body.cert_number || req.body.certNumber || req.body.idNumber
  const certType = req.body.type || req.body.verificationType || '建设用地规划许可证'

  if (!certNumber || typeof certNumber !== 'string') {
    res.status(400).json({ success: false, error: '缺少证号' })
    return
  }

  const fixture = CERTIFICATE_FIXTURES[String(certType)] || CERTIFICATE_FIXTURES['建设用地规划许可证']
  const normalizedInput = certNumber.trim()
  const status = normalizedInput === fixture.cert_number
    ? 'match'
    : normalizedInput.includes('000')
    ? 'not_found'
    : 'mismatch'

  res.json({
    success: true,
    data: {
      status,
      cert_number: normalizedInput,
      issue_date: fixture.issue_date,
      issue_authority: fixture.issue_authority,
      verify_time: new Date().toISOString(),
    }
  })
})

export default router
