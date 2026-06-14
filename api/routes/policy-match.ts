import { Router, type Request, type Response } from 'express'
import { getDatabase } from '../lib/database.js'

const router = Router()

interface PolicyRow {
  id: number
  policy_code: string
  title: string
  category: string
  target_audience?: string
  summary?: string
  content?: string
  conditions?: string
  benefits?: string
  documents_required?: string
  valid_from?: string
  valid_to?: string
  is_auto_match: number
  status: string
  sort_order?: number
  created_at: string
  updated_at: string
}

interface UserProfile {
  userId: number
  isUnemploymentRegistered: boolean
  unemploymentStatus?: string
  hasEntrepreneurLoan: boolean
  hasSkillCert: boolean
  insuredMonths: number
  isEnterprise: boolean
}

function buildUserProfile(userId: number): UserProfile {
  const db = getDatabase()

  const ureg = db.prepare(
    'SELECT status FROM unemployment_registers WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(userId) as { status?: string } | undefined

  const loanCount = db.prepare(
    'SELECT COUNT(*) as count FROM entrepreneur_loans WHERE user_id = ?'
  ).get(userId) as { count: number }

  const certCount = db.prepare(
    'SELECT COUNT(*) as count FROM skill_certs WHERE user_id = ? AND status = ?'
  ).get(userId, 'valid') as { count: number }

  const insCert = db.prepare(
    'SELECT insured_months FROM insurance_certs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(userId) as { insured_months?: number } | undefined

  return {
    userId,
    isUnemploymentRegistered: !!ureg,
    unemploymentStatus: ureg?.status,
    hasEntrepreneurLoan: loanCount.count > 0,
    hasSkillCert: certCount.count > 0,
    insuredMonths: insCert?.insured_months || 0,
    isEnterprise: false,
  }
}

interface MatchResult {
  policyId: number
  matchScore: number
  isEligible: boolean
  matchDetails: string[]
}

function matchPolicy(policy: PolicyRow, profile: UserProfile): MatchResult {
  let score = 0
  const details: string[] = []
  let eligible = true

  const code = policy.policy_code

  if (code === 'POL001') {
    if (profile.isUnemploymentRegistered) {
      score += 40
      details.push('已办理失业登记，符合基本条件')
    } else {
      score += 10
      details.push('未办理失业登记，需先完成失业登记')
      eligible = false
    }
    if (profile.insuredMonths >= 12) {
      score += 30
      details.push(`社保累计缴纳${profile.insuredMonths}个月，符合条件`)
    } else {
      score += 10
      details.push(`社保缴纳${profile.insuredMonths}个月，建议累计满12个月后申请`)
    }
    score += 30
    details.push('属于重点政策覆盖人群')
  } else if (code === 'POL002') {
    score += 20
    details.push('企业稳岗返还政策，请以企业身份申请')
    eligible = false
  } else if (code === 'POL003') {
    if (profile.hasEntrepreneurLoan) {
      score += 40
      details.push('已有创业相关申请记录')
    } else {
      score += 20
      details.push('暂无创业记录，首次创业可申请')
    }
    score += 40
    details.push('首次创办企业或个体经营可申请一次性创业补贴')
    details.push('建议准备营业执照等材料')
  } else if (code === 'POL004') {
    if (profile.isUnemploymentRegistered) {
      score += 35
      details.push('属于登记失业人员，符合创业担保贷款重点扶持群体')
    } else {
      score += 15
      details.push('建议先办理失业登记，可提升匹配度')
    }
    score += 35
    details.push('创业担保贷款及贴息政策适用')
    score += 15
    details.push('可申请个人最高20万元，小微企业300万元')
    eligible = true
  } else if (code === 'POL005') {
    if (profile.hasSkillCert) {
      score += 40
      details.push('已取得职业技能等级证书，可申请技能提升补贴')
    } else {
      score += 15
      details.push('尚未取得技能等级证书，建议先参加技能培训并考证')
      eligible = false
    }
    if (profile.insuredMonths >= 12) {
      score += 40
      details.push(`失业保险累计缴纳${profile.insuredMonths}个月，符合申请条件`)
    } else {
      score += 10
      details.push(`失业保险缴纳${profile.insuredMonths}个月，需累计满12个月`)
      eligible = false
    }
    score += 10
  } else if (code === 'POL006') {
    if (profile.isUnemploymentRegistered) {
      score += 50
      details.push('已登记失业，符合就业见习补贴申请基本条件')
    } else {
      score += 20
      details.push('未办理失业登记')
    }
    score += 40
    details.push('离校2年内未就业高校毕业生或16-24岁失业青年可申请')
  } else {
    score += 50
    details.push('通用匹配')
  }

  score = Math.min(score, 100)

  return {
    policyId: policy.id,
    matchScore: score,
    isEligible: eligible,
    matchDetails: details,
  }
}

router.get('/match', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Number(req.query.userId ?? 1)
    if (Number.isNaN(userId)) {
      res.status(400).sendJson({ code: 400, message: 'userId 必填', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as { id?: number } | undefined
    if (!user) {
      res.status(404).sendJson({ code: 404, message: '用户不存在', data: null, traceId: req.traceId })
      return
    }

    const profile = buildUserProfile(userId)
    const policies = db.prepare(
      "SELECT * FROM policies WHERE is_auto_match = 1 AND status = 'active' ORDER BY sort_order ASC"
    ).all() as PolicyRow[]

    const matches: MatchResult[] = policies.map((p) => matchPolicy(p, profile))
    matches.sort((a, b) => b.matchScore - a.matchScore)

    const now = new Date().toISOString()

    const insertLog = db.prepare(`
      INSERT INTO policy_match_logs (
        user_id, policy_id, match_score, match_details, is_eligible, is_claimed, matched_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const tx = db.transaction((items: typeof matches) => {
      for (const m of items) {
        insertLog.run(
          userId,
          m.policyId,
          m.matchScore,
          JSON.stringify(m.matchDetails),
          m.isEligible ? 1 : 0,
          0,
          now
        )
      }
    })
    tx(matches)

    const result = matches.map((m) => {
      const policy = policies.find((p) => p.id === m.policyId)!
      let conditionsParsed: unknown = null
      let benefitsParsed: unknown = null
      try { conditionsParsed = policy.conditions ? JSON.parse(policy.conditions) : null } catch { /* noop */ }
      try { benefitsParsed = policy.benefits ? JSON.parse(policy.benefits) : null } catch { /* noop */ }
      return {
        policyId: policy.id,
        policyCode: policy.policy_code,
        title: policy.title,
        category: policy.category,
        targetAudience: policy.target_audience,
        summary: policy.summary,
        conditions: conditionsParsed,
        benefits: benefitsParsed,
        validFrom: policy.valid_from,
        validTo: policy.valid_to,
        matchScore: m.matchScore,
        isEligible: m.isEligible,
        matchDetails: m.matchDetails,
        matchedAt: now,
      }
    })

    res.status(200).sendJson({
      code: 0,
      message: '政策匹配完成',
      data: {
        profile: {
          userId: profile.userId,
          isUnemploymentRegistered: profile.isUnemploymentRegistered,
          hasEntrepreneurLoan: profile.hasEntrepreneurLoan,
          hasSkillCert: profile.hasSkillCert,
          insuredMonths: profile.insuredMonths,
        },
        totalMatched: result.length,
        eligibleCount: result.filter((r) => r.isEligible).length,
        results: result,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '匹配失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.get('/policies', async (req: Request, res: Response): Promise<void> => {
  try {
    const category = req.query.category as string | undefined
    const db = getDatabase()

    let sql = "SELECT * FROM policies WHERE status = 'active'"
    const params: unknown[] = []
    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }
    sql += ' ORDER BY sort_order ASC, created_at DESC'

    const rows = db.prepare(sql).all(...params) as PolicyRow[]

    const data = rows.map((p) => {
      let conditionsParsed: unknown = null
      let benefitsParsed: unknown = null
      let docsParsed: unknown = null
      try { conditionsParsed = p.conditions ? JSON.parse(p.conditions) : null } catch { /* noop */ }
      try { benefitsParsed = p.benefits ? JSON.parse(p.benefits) : null } catch { /* noop */ }
      try { docsParsed = p.documents_required ? JSON.parse(p.documents_required) : null } catch { /* noop */ }
      return {
        id: p.id,
        policyCode: p.policy_code,
        title: p.title,
        category: p.category,
        targetAudience: p.target_audience,
        summary: p.summary,
        content: p.content,
        conditions: conditionsParsed,
        benefits: benefitsParsed,
        documentsRequired: docsParsed,
        validFrom: p.valid_from,
        validTo: p.valid_to,
        isAutoMatch: p.is_auto_match === 1,
        sortOrder: p.sort_order,
        createdAt: p.created_at,
      }
    })

    res.status(200).sendJson({
      code: 0,
      message: '查询成功',
      data: {
        total: data.length,
        items: data,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.get('/policies/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
      res.status(400).sendJson({ code: 400, message: '无效的ID', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()
    const p = db.prepare('SELECT * FROM policies WHERE id = ?').get(id) as PolicyRow | undefined
    if (!p) {
      res.status(404).sendJson({ code: 404, message: '政策不存在', data: null, traceId: req.traceId })
      return
    }

    let conditionsParsed: unknown = null
    let benefitsParsed: unknown = null
    let docsParsed: unknown = null
    try { conditionsParsed = p.conditions ? JSON.parse(p.conditions) : null } catch { /* noop */ }
    try { benefitsParsed = p.benefits ? JSON.parse(p.benefits) : null } catch { /* noop */ }
    try { docsParsed = p.documents_required ? JSON.parse(p.documents_required) : null } catch { /* noop */ }

    res.status(200).sendJson({
      code: 0,
      message: '查询成功',
      data: {
        id: p.id,
        policyCode: p.policy_code,
        title: p.title,
        category: p.category,
        targetAudience: p.target_audience,
        summary: p.summary,
        content: p.content,
        conditions: conditionsParsed,
        benefits: benefitsParsed,
        documentsRequired: docsParsed,
        validFrom: p.valid_from,
        validTo: p.valid_to,
        isAutoMatch: p.is_auto_match === 1,
        status: p.status,
        sortOrder: p.sort_order,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.post('/wsg-return/calculate', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      totalEmployees,
      insuredEmployees,
      actualPayment,
      layoffRate,
      enterpriseType,
    } = req.body

    if (
      totalEmployees === undefined ||
      insuredEmployees === undefined ||
      actualPayment === undefined ||
      layoffRate === undefined
    ) {
      res.status(400).sendJson({
        code: 400,
        message: '参数不完整：totalEmployees、insuredEmployees、actualPayment、layoffRate 必填',
        data: null,
        traceId: req.traceId,
      })
      return
    }

    const totalEmp = Number(totalEmployees)
    const insuredEmp = Number(insuredEmployees)
    const actualPay = Number(actualPayment)
    const rate = Number(layoffRate)

    const insuredRatio = totalEmp > 0 ? (insuredEmp / totalEmp) : 0
    const taxPayable = Math.round(actualPay * 1.8)
    const creditCode = `91110105MA${Math.random().toString(36).slice(2, 10).toUpperCase()}`
    const mockThreeNetVerification = {
      medicalInsurance: {
        verified: true,
        agency: '省级医疗保障局',
        insuredMonths: 48,
        continuousInsured: true,
        verifiedAt: new Date().toISOString().slice(0, 10),
        remark: '职工医保连续参保，无断缴记录',
      },
      taxation: {
        verified: true,
        agency: '省级税务局',
        lastTaxPayment: taxPayable,
        taxPaymentNormal: true,
        lastReportPeriod: '2026-Q1',
        verifiedAt: new Date().toISOString().slice(0, 10),
        remark: '企业纳税信用等级 A 级',
      },
      marketSupervision: {
        verified: true,
        agency: '省级市场监督管理局',
        creditCode,
        enterpriseStatus: '存续（在营、开业、在册）',
        registeredCapital: '500.000000万人民币',
        legalRepresentative: '张三',
        verifiedAt: new Date().toISOString().slice(0, 10),
        remark: '工商登记信息核验通过',
      },
    }

    let eligible = true
    const reasons: string[] = []
    const calcBasis: { key: string; label: string; value: string; pass: boolean }[] = []

    calcBasis.push({
      key: 'insured_employees',
      label: '失业保险参保人数',
      value: `${insuredEmp}人（参保率 ${(insuredRatio * 100).toFixed(1)}%）`,
      pass: insuredRatio >= 0.9,
    })
    if (insuredRatio < 0.9) {
      eligible = false
      reasons.push(`失业保险参保率${(insuredRatio * 100).toFixed(1)}%低于90%`)
    } else {
      reasons.push(`失业保险参保率${(insuredRatio * 100).toFixed(1)}%，符合条件`)
    }

    if (totalEmp <= 30) {
      calcBasis.push({
        key: 'layoff_rate_threshold',
        label: '裁员率判定口径',
        value: `30人及以下小微企业，放宽至≤20%`,
        pass: rate <= 20,
      })
      if (rate > 20) {
        eligible = false
        reasons.push(`30人及以下企业裁员率${rate}%超过20%`)
      } else {
        reasons.push(`30人及以下小微企业，裁员率${rate}%符合条件`)
      }
    } else {
      calcBasis.push({
        key: 'layoff_rate_threshold',
        label: '裁员率判定口径',
        value: `30人以上企业，统一按≤5.5%执行`,
        pass: rate <= 5.5,
      })
      if (rate > 5.5) {
        eligible = false
        reasons.push(`裁员率${rate}%超过规定上限5.5%`)
      } else {
        reasons.push(`裁员率${rate}%符合条件（≤5.5%）`)
      }
    }

    let ratio = 0
    let type = enterpriseType
    if (!type) {
      type = totalEmp > 300 ? 'large' : 'sme'
    }

    if (type === 'large') {
      ratio = 0.30
      calcBasis.push({
        key: 'enterprise_type',
        label: '企业规模口径（参保人数）',
        value: `参保${totalEmp}人 > 300人，判定为【大型企业】`,
        pass: true,
      })
      calcBasis.push({
        key: 'return_ratio',
        label: '返还比例适用',
        value: '大型企业：上年度实际缴纳失业保险费的 30%',
        pass: true,
      })
      reasons.push('大型企业返还比例：30%')
    } else {
      ratio = 0.60
      calcBasis.push({
        key: 'enterprise_type',
        label: '企业规模口径（参保人数）',
        value: `参保${totalEmp}人 ≤ 300人，判定为【中小微企业】`,
        pass: true,
      })
      calcBasis.push({
        key: 'return_ratio',
        label: '返还比例适用',
        value: '中小微企业：上年度实际缴纳失业保险费的 60%',
        pass: true,
      })
      reasons.push('中小微企业返还比例：60%')
    }

    calcBasis.push({
      key: 'actual_payment',
      label: '上年度实际缴费额（取数口径）',
      value: `税务部门征缴数据：¥${actualPay.toLocaleString()}元（与失业保险缴费台账一致）`,
      pass: true,
    })

    const estimatedReturn = eligible ? Math.floor(actualPay * ratio) : 0

    calcBasis.push({
      key: 'estimated_return',
      label: '预计返还金额计算公式',
      value: `¥${actualPay.toLocaleString()} × ${(ratio * 100)}% = ¥${estimatedReturn.toLocaleString()}`,
      pass: eligible,
    })

    res.status(200).sendJson({
      code: 0,
      message: eligible ? '测算完成，符合稳岗返还条件' : '测算完成，暂不符合稳岗返还条件',
      data: {
        eligible,
        estimatedReturn,
        ratio,
        ratioPercent: `${(ratio * 100)}%`,
        enterpriseType: type,
        enterpriseTypeText: type === 'large' ? '大型企业' : '中小微企业',
        parameters: {
          totalEmployees: totalEmp,
          insuredEmployees: insuredEmp,
          actualPayment: actualPay,
          layoffRate: rate,
        },
        calcBasis,
        reasons,
        threeNetVerification: mockThreeNetVerification,
        claimStatus: eligible ? 'ready' : 'ineligible',
        suggestion: eligible
          ? '建议准备营业执照、社保缴费证明等材料，通过免申即享渠道申请'
          : '请核对申报数据，或次年满足条件后再申请',
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '测算失败：' + err.message, data: null, traceId: req.traceId })
  }
})

export default router
