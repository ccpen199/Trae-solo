import { Router, type Request, type Response } from 'express'
import crypto from 'crypto'
import { getDatabase } from '../lib/database.js'
import * as sm4 from '../lib/sm4.js'

const router = Router()

function generateCaseNo(): string {
  const ts = Date.now().toString().slice(-8)
  return `LDZ${ts}${crypto.randomInt(1000, 9999)}`
}

function generateApplicationNo(prefix: string): string {
  const ts = Date.now().toString().slice(-8)
  const rand = crypto.randomInt(1000, 9999).toString()
  return `${prefix}${ts}${rand}`
}

interface ArbitrationCaseRow {
  id: number
  user_id: number
  case_no: string
  applicant_name: string
  applicant_phone: string
  respondent?: string
  case_type: string
  case_summary: string
  claim_amount?: number
  status: string
  accepted_at?: string
  hearing_at?: string
  closed_at?: string
  result?: string
  created_at: string
  updated_at: string
}

interface ClaimItem {
  type: string
  description: string
  amount?: number
  startDate?: string
  endDate?: string
}

function safeDecryptPhone(encrypted: string): string {
  try {
    return sm4.decrypt(encrypted)
  } catch {
    return encrypted
  }
}

function safeMaskPhone(phone: string): string {
  if (!phone) return ''
  return sm4.maskPhone(safeDecryptPhone(phone))
}

router.post('/arbitration', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      userId,
      applicantName,
      applicantPhone,
      respondent,
      caseType,
      caseSummary,
      claimAmount,
      claimItems,
    } = req.body

    if (!userId || !applicantName || !applicantPhone || !caseType || !caseSummary) {
      res.status(400).sendJson({
        code: 400,
        message: '必填字段缺失',
        data: null,
        traceId: req.traceId,
      })
      return
    }

    let parsedClaimItems: ClaimItem[] = []
    if (claimItems) {
      if (Array.isArray(claimItems)) {
        parsedClaimItems = claimItems
      } else if (typeof claimItems === 'string') {
        try {
          parsedClaimItems = JSON.parse(claimItems)
        } catch {
          parsedClaimItems = []
        }
      }
    }

    const claimItemsJson = JSON.stringify(parsedClaimItems)

    const db = getDatabase()
    const encryptedPhone = sm4.encrypt(applicantPhone)
    const caseNo = generateCaseNo()
    const applicationNo = generateApplicationNo('AR')

    const tx = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO arbitration_cases (
          user_id, case_no, applicant_name, applicant_phone, respondent,
          case_type, case_summary, claim_amount, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        caseNo,
        applicantName,
        encryptedPhone,
        respondent || null,
        caseType,
        caseSummary,
        claimAmount ? Number(claimAmount) : null,
        'pending'
      )

      db.prepare(`
        INSERT INTO user_applications (
          user_id, application_no, application_type, title, form_data, status, submitted_at, remark
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      `).run(
        userId,
        applicationNo,
        'arbitration',
        `劳动仲裁申请 - ${caseType}`,
        JSON.stringify({
          caseType,
          respondent,
          caseSummary,
          claimAmount,
          claimItems: parsedClaimItems,
          claimItemsJson,
        }),
        'pending',
        `案件ID: ${result.lastInsertRowid}，案号: ${caseNo}`
      )

      return {
        id: Number(result.lastInsertRowid),
        caseNo,
        applicationNo,
      }
    })

    const txResult = tx()

    res.status(201).sendJson({
      code: 0,
      message: '仲裁申请提交成功',
      data: {
        id: txResult.id,
        caseNo: txResult.caseNo,
        applicationNo: txResult.applicationNo,
        status: 'pending',
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({
      code: 500,
      message: '提交失败：' + err.message,
      data: null,
      traceId: req.traceId,
    })
  }
})

router.get('/arbitration', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Number(req.query.userId)
    if (Number.isNaN(userId)) {
      res.status(400).sendJson({ code: 400, message: 'userId 必填', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()
    const rows = db.prepare(
      'SELECT * FROM arbitration_cases WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as ArbitrationCaseRow[]

    const data = rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      caseNo: row.case_no,
      applicantName: row.applicant_name,
      applicantPhone: safeMaskPhone(row.applicant_phone),
      respondent: row.respondent,
      caseType: row.case_type,
      caseSummary: row.case_summary,
      claimAmount: row.claim_amount,
      status: row.status,
      acceptedAt: row.accepted_at,
      hearingAt: row.hearing_at,
      closedAt: row.closed_at,
      result: row.result,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    res.status(200).sendJson({
      code: 0,
      message: '查询成功',
      data,
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.get('/arbitration/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
      res.status(400).sendJson({ code: 400, message: '无效的ID', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()
    const row = db.prepare('SELECT * FROM arbitration_cases WHERE id = ?').get(id) as ArbitrationCaseRow | undefined
    if (!row) {
      res.status(404).sendJson({ code: 404, message: '案件不存在', data: null, traceId: req.traceId })
      return
    }

    const application = db.prepare(
      "SELECT form_data FROM user_applications WHERE remark LIKE ? AND application_type = 'arbitration' LIMIT 1"
    ).get(`%案件ID: ${id}%`) as { form_data?: string } | undefined

    let parsedClaimItems: ClaimItem[] = []
    if (application?.form_data) {
      try {
        const parsed = JSON.parse(application.form_data)
        parsedClaimItems = parsed.claimItems || []
      } catch {
        parsedClaimItems = []
      }
    }

    res.status(200).sendJson({
      code: 0,
      message: '查询成功',
      data: {
        id: row.id,
        userId: row.user_id,
        caseNo: row.case_no,
        applicantName: row.applicant_name,
        applicantPhone: safeMaskPhone(row.applicant_phone),
        respondent: row.respondent,
        caseType: row.case_type,
        caseSummary: row.case_summary,
        claimAmount: row.claim_amount,
        claimItems: parsedClaimItems,
        status: row.status,
        statusText: (() => {
          const map: Record<string, string> = {
            pending: '待受理',
            accepted: '已受理',
            hearing_scheduled: '已排期',
            hearing_done: '已开庭',
            closed: '已结案',
            withdrawn: '已撤回',
            rejected: '不予受理',
          }
          return map[row.status] || row.status
        })(),
        acceptedAt: row.accepted_at,
        hearingAt: row.hearing_at,
        closedAt: row.closed_at,
        result: row.result,
        timeline: [
          { status: '已提交', time: row.created_at },
          ...(row.accepted_at ? [{ status: '已受理', time: row.accepted_at }] : []),
          ...(row.hearing_at ? [{ status: '开庭时间', time: row.hearing_at }] : []),
          ...(row.closed_at ? [{ status: '已结案', time: row.closed_at }] : []),
        ],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

export default router
