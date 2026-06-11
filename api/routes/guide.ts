import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { randomUUID } from 'crypto'

const router = Router()

const keywordMap: Record<string, string[]> = {
  '社保': ['svc-001'],
  '保险': ['svc-001'],
  '养老': ['svc-001'],
  '医疗': ['svc-001'],
  '税务': ['svc-002'],
  '纳税': ['svc-002'],
  '报税': ['svc-002'],
  '投诉': ['svc-003'],
  '建议': ['svc-003'],
  '反馈': ['svc-003'],
  '城管': ['svc-003'],
  '公积金': ['svc-004'],
  '住房': ['svc-004'],
  '提取': ['svc-004'],
  '营业执照': ['svc-005'],
  '企业': ['svc-005'],
  '注册': ['svc-005'],
  '户籍': ['svc-006'],
  '户口': ['svc-006'],
  '迁移': ['svc-006'],
  '水费': ['svc-007'],
  '缴费': ['svc-007', 'svc-008', 'svc-009'],
  '电费': ['svc-008'],
  '燃气': ['svc-009'],
  '不动产': ['svc-010'],
  '房产': ['svc-010'],
  '交通': ['svc-011', 'svc-012'],
  '违章': ['svc-011'],
  '公交': ['svc-012'],
  '充值': ['svc-012'],
}

const tipsMap: Record<string, string[]> = {
  '社保': ['建议提前准备好身份证和社保卡', '可通过线上渠道自助办理'],
  '税务': ['请提前确认税务登记信息', '预约成功后请按时到场'],
  '投诉': ['请提供详细的投诉地址和问题描述', '可上传照片作为佐证材料'],
  '公积金': ['提取原因不同所需材料不同', '建议提前咨询公积金管理中心'],
  '营业执照': ['请确保经营场所证明材料齐全', '可先在线预审再现场提交'],
  '户籍': ['迁移需原户籍地和迁入地双重审核', '建议提前办理房产证明'],
  '水费': ['可通过水表编号自动查询欠费', '支持批量缴纳'],
  '电费': ['可通过电表编号自动查询欠费', '支持设置自动扣费'],
  '燃气': ['可通过燃气表编号自动查询欠费', '建议定期检查燃气设备安全'],
  '不动产': ['查询需实名认证', '可下载电子版查询证明'],
  '交通': ['违章处理需在规定时间内完成', '部分违章可在线处理'],
  '公交': ['支持多种充值金额选择', '充值后即时到账'],
}

router.post('/recommend', (req: Request, res: Response): void => {
  try {
    const question = String(
      req.body?.question ?? req.body?.query ?? req.body?.text ?? req.body?.message ?? '',
    ).trim()
    if (!question) {
      res.status(400).json({ success: false, error: 'Question is required' })
      return
    }

    const matchedServiceIds = new Set<string>()
    const matchedKeywords: string[] = []

    for (const [keyword, serviceIds] of Object.entries(keywordMap)) {
      if (question.includes(keyword)) {
        matchedKeywords.push(keyword)
        for (const sid of serviceIds) {
          matchedServiceIds.add(sid)
        }
      }
    }

    if (matchedServiceIds.size === 0) {
      for (const [keyword, serviceIds] of Object.entries(keywordMap)) {
        for (const sid of serviceIds) {
          matchedServiceIds.add(sid)
        }
        if (matchedServiceIds.size >= 3) break
      }
    }

    const serviceIds = Array.from(matchedServiceIds)
    const services = db.prepare(`SELECT s.*, d.name as department_name FROM services s JOIN departments d ON s.department_id = d.id WHERE s.id IN (${serviceIds.map(() => '?').join(',')})`).all(...serviceIds) as Record<string, unknown>[]

    const parsedServices = services.map((s) => {
      const parsed = { ...s }
      if (typeof parsed.access_config === 'string') {
        try { parsed.access_config = JSON.parse(parsed.access_config) } catch { /* keep as-is */ }
      }
      if (typeof parsed.process_steps === 'string') {
        try { parsed.process_steps = JSON.parse(parsed.process_steps) } catch { /* keep as-is */ }
      }
      return parsed
    })

    const allTips: string[] = []
    for (const kw of matchedKeywords) {
      if (tipsMap[kw]) {
        allTips.push(...tipsMap[kw])
      }
    }

    const primaryService = parsedServices[0]
    let processPath: string[] = []
    let materialList: Record<string, unknown>[] = []

    if (primaryService) {
      processPath = (primaryService.process_steps as string[]) || []
      const materials = db.prepare(`SELECT * FROM materials WHERE service_id = ?`).all(primaryService.id) as Record<string, unknown>[]
      materialList = materials.map((m) => {
        const parsed = { ...m }
        if (typeof parsed.ocr_fields === 'string') {
          try { parsed.ocr_fields = JSON.parse(parsed.ocr_fields) } catch { /* keep as-is */ }
        }
        return parsed
      })
    }

    res.json({
      success: true,
      data: {
        question,
        matchedKeywords,
        serviceIds,
        process: processPath,
        materials: materialList,
        recommendedServices: parsedServices,
        processPath,
        materialList,
        tips: allTips.length > 0 ? allTips : ['请根据提示准备相关材料', '如有疑问可拨打12345热线咨询'],
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/ocr', (req: Request, res: Response): void => {
  try {
    const { materialId } = req.body
    if (!materialId) {
      res.status(400).json({ success: false, error: 'materialId is required' })
      return
    }

    const material = db.prepare(`SELECT * FROM materials WHERE id = ?`).get(materialId) as Record<string, unknown> | undefined
    if (!material) {
      res.status(404).json({ success: false, error: 'Material not found' })
      return
    }

    let ocrFields: unknown[] = []
    if (typeof material.ocr_fields === 'string') {
      try { ocrFields = JSON.parse(material.ocr_fields) } catch { ocrFields = [] }
    }

    const recognizedFields = (ocrFields as Array<Record<string, unknown>>).map((field) => {
      const confidence = (field.confidence as number) || 0.9
      const jitter = (Math.random() - 0.5) * 0.04
      return {
        ...field,
        confidence: Math.min(1, Math.max(0.8, confidence + jitter)),
        recognized_value: simulateOcrValue(field.field as string),
      }
    })

    res.json({
      success: true,
      data: {
        materialId,
        materialName: material.name,
        recognizedFields,
        overallConfidence: recognizedFields.length > 0 ? recognizedFields.reduce((sum: number, f) => sum + (f.confidence as number), 0) / recognizedFields.length : 0,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

function simulateOcrValue(field: string): string {
  const valueMap: Record<string, string> = {
    name: '张三',
    id_number: '330102199001011234',
    address: '浙江省杭州市xx区xx路100号',
    card_number: '6222021234567890123',
    bank_name: '中国工商银行',
    payment_month: '2026-05',
    amount: '1,256.80',
    tax_id: '91330100MA2XXXXXX',
    company_name: '某某科技有限公司',
    contract_no: 'HT-2026-001234',
    household_no: '330102123456',
    owner: '张三',
    meter_no: 'WH20230001',
    plate_no: '浙A12345',
    vehicle_type: '小型汽车',
    license_no: '330102199001011234',
    card_no: 'BUS202300123',
  }
  return valueMap[field] || `模拟_${field}_值`
}

router.get('/cases', (req: Request, res: Response): void => {
  try {
    const userId = req.query.userId as string
    if (!userId) {
      res.status(400).json({ success: false, error: 'userId query parameter is required' })
      return
    }

    const cases = db.prepare(`SELECT c.*, s.name as service_name FROM cases c JOIN services s ON c.service_id = s.id WHERE c.user_id = ? ORDER BY c.created_at DESC`).all(userId) as Record<string, unknown>[]

    const parsedCases = cases.map((c) => {
      const parsed = { ...c }
      if (typeof parsed.form_data === 'string') {
        try { parsed.form_data = JSON.parse(parsed.form_data) } catch { /* keep as-is */ }
      }
      return parsed
    })

    res.json({ success: true, data: parsedCases })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/cases/:id', (req: Request, res: Response): void => {
  try {
    const caseRow = db.prepare(`SELECT c.*, s.name as service_name, s.process_steps, s.category, s.sub_category FROM cases c JOIN services s ON c.service_id = s.id WHERE c.id = ?`).get(req.params.id) as Record<string, unknown> | undefined

    if (!caseRow) {
      res.status(404).json({ success: false, error: 'Case not found' })
      return
    }

    const parsed = { ...caseRow }
    if (typeof parsed.form_data === 'string') {
      try { parsed.form_data = JSON.parse(parsed.form_data) } catch { /* keep as-is */ }
    }
    if (typeof parsed.process_steps === 'string') {
      try { parsed.process_steps = JSON.parse(parsed.process_steps) } catch { /* keep as-is */ }
    }

    const materials = db.prepare(`SELECT m.* FROM materials m JOIN services s ON m.service_id = s.id WHERE s.id = ?`).get(parsed.service_id) as Record<string, unknown>[] | undefined
    if (materials) {
      parsed.materials = materials.map((m) => {
        const mp = { ...m }
        if (typeof mp.ocr_fields === 'string') {
          try { mp.ocr_fields = JSON.parse(mp.ocr_fields) } catch { /* keep as-is */ }
        }
        return mp
      })
    } else {
      parsed.materials = []
    }

    res.json({ success: true, data: parsed })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/submit', (req: Request, res: Response): void => {
  try {
    const { serviceId, userId, formData } = req.body

    if (!serviceId || !userId) {
      res.status(400).json({ success: false, error: 'serviceId and userId are required' })
      return
    }

    const service = db.prepare(`SELECT * FROM services WHERE id = ?`).get(serviceId)
    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' })
      return
    }

    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId)
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }

    const caseId = `case-${randomUUID().slice(0, 8)}`
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

    db.prepare(`INSERT INTO cases (id, user_id, service_id, status, form_data, created_at, updated_at) VALUES (?, ?, ?, 'submitted', ?, ?, ?)`).run(
      caseId, userId, serviceId, JSON.stringify(formData || {}), now, now,
    )

    db.prepare(`UPDATE services SET applicant_count = applicant_count + 1 WHERE id = ?`).run(serviceId)

    res.json({
      success: true,
      data: {
        caseId,
        serviceId,
        userId,
        status: 'submitted',
        createdAt: now,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
