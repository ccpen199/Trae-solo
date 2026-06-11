import express, { type Request, type Response } from 'express'
import db from '../db.js'

const router = express.Router()

router.post('/assess', (req: Request, res: Response) => {
  const { entrepreneur_id, project_id } = req.body

  if (!entrepreneur_id || !project_id) {
    return res.status(400).json({
      success: false,
      error: '创业者ID和项目ID不能为空',
    })
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id) as any
  if (!project) {
    return res.status(404).json({
      success: false,
      error: '项目不存在',
    })
  }

  const entrepreneur = db.prepare('SELECT * FROM entrepreneur_profiles WHERE user_id = ?').get(entrepreneur_id) as any

  let score = 60
  let risk_level = 'medium'
  const analysis: string[] = []

  if (project.mengxintong_certified) {
    score += 15
    analysis.push('项目已通过《盟信通》认证，品牌可信度高')
  } else {
    analysis.push('项目尚未通过《盟信通》认证，建议进一步核实品牌资质')
  }

  if (project.total_stores && project.total_stores > 100) {
    score += 10
    analysis.push('品牌门店数量超过100家，运营模式成熟')
  } else if (project.total_stores && project.total_stores < 10) {
    score -= 10
    analysis.push('品牌门店数量较少，运营模式有待验证')
  }

  if (project.free_joining) {
    score += 5
    analysis.push('免加盟费，降低创业门槛')
  }

  const investmentMin = project.investment_min
  const investmentMax = project.investment_max

  if (entrepreneur) {
    const budgetMatch = entrepreneur.budget_range
    if (budgetMatch) {
      const budgetMatchLower = budgetMatch.match(/(\d+)/)
      if (budgetMatchLower) {
        const budgetLow = parseInt(budgetMatchLower[1]) * 10000
        if (investmentMin >= budgetLow * 0.5 && investmentMax <= budgetLow * 2) {
          score += 10
          analysis.push('投资金额与创业者预算匹配度较好')
        } else {
          score -= 5
          analysis.push('投资金额与创业者预算存在一定差距，需谨慎评估资金压力')
        }
      }
    }

    if (entrepreneur.experience && entrepreneur.experience.includes('创业')) {
      score += 5
      analysis.push('创业者具备创业经验，抗风险能力较强')
    }
  }

  const profitModel = project.profit_model || ''
  if (profitModel.includes('回收期') && profitModel.includes('月')) {
    const match = profitModel.match(/回收期(\d+)-(\d+)个月/)
    if (match) {
      const maxPayback = parseInt(match[2])
      if (maxPayback <= 12) {
        score += 10
        analysis.push('投资回收期较短（12个月内），资金回笼快')
      } else if (maxPayback <= 24) {
        score += 5
        analysis.push('投资回收期适中（12-24个月）')
      } else {
        score -= 5
        analysis.push('投资回收期较长，需做好长期资金规划')
      }
    }
  }

  if (score >= 75) {
    risk_level = 'low'
  } else if (score >= 60) {
    risk_level = 'medium'
  } else {
    risk_level = 'high'
  }

  const recommendations: string[] = [
    '建议实地考察品牌总部及现有门店，了解真实运营情况',
    '仔细审阅加盟合同条款，特别关注费用、权利义务、退出机制等内容',
    '咨询专业律师和会计师，降低法律和财务风险',
    '准备3-6个月的流动资金储备，应对开店初期可能的亏损',
  ]

  const marketAnalysis = `
    市场分析：
    - ${project.industry}行业目前处于${project.total_stores > 1000 ? '成熟期' : '成长期'}，市场竞争${project.total_stores > 500 ? '激烈' : '适中'}
    - 该品牌在行业内处于${project.total_stores > 1000 ? '头部' : project.total_stores > 100 ? '中上游' : '新兴'}地位
    - 投资门槛：${(investmentMin / 10000).toFixed(0)}-${(investmentMax / 10000).toFixed(0)}万元，${project.free_joining ? '含免加盟费优惠' : '需支付加盟费'}
  `

  const financialAnalysis = `
    财务分析：
    - 总投资：${(investmentMin / 10000).toFixed(0)}-${(investmentMax / 10000).toFixed(0)}万元
    - ${profitModel}
    - 建议保持足够的现金流储备，确保前6个月正常运营
  `

  const competitorAnalysis = `
    竞品分析：
    - 同品类主要竞争对手包括其他头部连锁品牌
    - 该项目的差异化优势：${project.category || '特色产品'}定位，${project.free_joining ? '免加盟费' : '性价比高'}
    - 进入策略建议：选择合适的商圈位置，做好本地化运营
  `

  const result = db
    .prepare(
      `INSERT INTO risk_assessments (entrepreneur_id, project_id, score, risk_level, market_analysis, financial_analysis, competitor_analysis, recommendations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      entrepreneur_id,
      project_id,
      score,
      risk_level,
      marketAnalysis,
      financialAnalysis,
      competitorAnalysis,
      recommendations.join('\n')
    )

  res.json({
    success: true,
    data: {
      id: result.lastInsertRowid,
      score,
      risk_level,
      risk_text: risk_level === 'low' ? '低风险' : risk_level === 'medium' ? '中等风险' : '高风险',
      analysis,
      recommendations,
      market_analysis: marketAnalysis,
      financial_analysis: financialAnalysis,
      competitor_analysis: competitorAnalysis,
    },
  })
})

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params

  const assessment = db.prepare('SELECT * FROM risk_assessments WHERE id = ?').get(id)

  if (!assessment) {
    return res.status(404).json({
      success: false,
      error: '评估报告不存在',
    })
  }

  res.json({
    success: true,
    data: assessment,
  })
})

router.get('/', (req: Request, res: Response) => {
  const { entrepreneurId, projectId, page = 1, pageSize = 10 } = req.query

  let whereClause: string[] = []
  let params: any[] = []

  if (entrepreneurId) {
    whereClause.push('entrepreneur_id = ?')
    params.push(parseInt(entrepreneurId as string))
  }

  if (projectId) {
    whereClause.push('project_id = ?')
    params.push(parseInt(projectId as string))
  }

  const whereSql = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : ''

  const countSql = `SELECT COUNT(*) as total FROM risk_assessments ${whereSql}`
  const totalResult = db.prepare(countSql).get(...params) as { total: number }

  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string)
  const limit = parseInt(pageSize as string)

  const sql = `
    SELECT ra.*, p.name as project_name, u.name as entrepreneur_name
    FROM risk_assessments ra
    LEFT JOIN projects p ON ra.project_id = p.id
    LEFT JOIN users u ON ra.entrepreneur_id = u.id
    ${whereSql}
    ORDER BY ra.created_at DESC
    LIMIT ? OFFSET ?
  `

  const assessments = db.prepare(sql).all(...params, limit, offset)

  res.json({
    success: true,
    data: {
      list: assessments,
      total: totalResult.total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    },
  })
})

export default router
