import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.post('/recommend', (req: Request, res: Response): void => {
  try {
    const { enterprise_type, industry, business_behavior, registered_capital } = req.body

    if (!enterprise_type || !business_behavior) {
      res.status(400).json({ success: false, error: 'enterprise_type and business_behavior are required' })
      return
    }

    const behaviorServiceMap: any = {
      '设立登记': ['开办', '登记'],
      '变更登记': ['变更'],
      '注销登记': ['注销'],
      '申请许可证': ['许可'],
      '项目备案': ['备案'],
      '税务办理': ['开办', '登记'],
      '社保办理': ['开办', '登记'],
      '进出口业务': ['备案', '许可'],
      '融资贷款': ['财政补贴', '税收优惠'],
      '技术研发': ['财政补贴', '人才计划'],
      '扩大生产': ['财政补贴', '税收优惠'],
      '环保合规': ['许可'],
      '安全生产': ['许可'],
      '人才招聘': ['人才计划'],
      '出口退税': ['税收优惠']
    }

    const targetCategories = behaviorServiceMap[business_behavior] || []

    let serviceWhereClauses = ['status = ?']
    let serviceParams: any[] = ['active']

    if (targetCategories.length > 0) {
      const placeholders = targetCategories.map(() => '?').join(', ')
      serviceWhereClauses.push(`category IN (${placeholders})`)
      serviceParams.push(...targetCategories)
    }

    const whereSql = serviceWhereClauses.join(' AND ')

    const recommendedServices = db.prepare(`
      SELECT si.*, d.name as department_name
      FROM service_items si
      LEFT JOIN departments d ON si.department_id = d.id
      WHERE ${whereSql}
      ORDER BY si.processing_days ASC
    `).all(...serviceParams)

    let policyWhereClauses = ['status = ?']
    let policyParams: any[] = ['active']

    if (industry) {
      policyWhereClauses.push('(target_industry = ? OR target_industry = ?)')
      policyParams.push(industry, '全行业')
    }

    if (enterprise_type) {
      policyWhereClauses.push('target_enterprise_type = ?')
      policyParams.push(enterprise_type)
    }

    const policyWhereSql = policyWhereClauses.join(' AND ')

    const recommendedPolicies = db.prepare(`
      SELECT p.*, d.name as department_name
      FROM policies p
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE ${policyWhereSql}
      ORDER BY p.id DESC
    `).all(...policyParams)

    const scoredServices = recommendedServices.map((service: any) => {
      let score = 0
      let reasons: string[] = []

      if (targetCategories.includes(service.category)) {
        score += 50
        reasons.push(`Category matches business behavior: ${business_behavior}`)
      }

      if (service.processing_days && service.processing_days <= 5) {
        score += 20
        reasons.push('Fast processing time')
      } else if (service.processing_days && service.processing_days <= 15) {
        score += 10
        reasons.push('Standard processing time')
      }

      if (service.required_materials) {
        const materialCount = service.required_materials.split(',').length
        if (materialCount <= 3) {
          score += 15
          reasons.push('Minimal materials required')
        } else if (materialCount <= 5) {
          score += 10
          reasons.push('Moderate materials required')
        }
      }

      return {
        ...service,
        recommendation_score: score,
        recommendation_reasons: reasons
      }
    })

    const scoredPolicies = recommendedPolicies.map((policy: any) => {
      let score = 0
      let reasons: string[] = []

      if (industry && (policy.target_industry === industry || policy.target_industry === '全行业')) {
        score += 40
        reasons.push(`Industry match: ${industry}`)
      }

      if (enterprise_type && policy.target_enterprise_type === enterprise_type) {
        score += 30
        reasons.push(`Enterprise type match: ${enterprise_type}`)
      }

      if (registered_capital && registered_capital >= 1000000) {
        score += 15
        reasons.push('Eligible for high-capital enterprise benefits')
      }

      if (policy.amount) {
        score += 15
        reasons.push(`Financial benefit available: ${policy.amount}`)
      }

      return {
        ...policy,
        recommendation_score: score,
        recommendation_reasons: reasons
      }
    })

    scoredServices.sort((a, b) => b.recommendation_score - a.recommendation_score)
    scoredPolicies.sort((a, b) => b.recommendation_score - a.recommendation_score)

    const guidanceSteps = generateGuidanceSteps(business_behavior, scoredServices, scoredPolicies)

    res.json({
      success: true,
      data: {
        enterprise_type,
        industry,
        business_behavior,
        recommended_services: scoredServices,
        recommended_policies: scoredPolicies,
        guidance_steps: guidanceSteps,
        estimated_processing_days: scoredServices.reduce((sum, s) => sum + (s.processing_days || 0), 0)
      }
    })
  } catch (error) {
    console.error('Smart guidance error:', error)
    res.status(500).json({ success: false, error: 'Failed to generate recommendations' })
  }
})

function generateGuidanceSteps(behavior: string, services: any[], policies: any[]): any[] {
  const steps: any[] = []

  steps.push({
    step: 1,
    title: '材料准备',
    description: '根据推荐的服务事项，准备相关申请材料',
    materials: services.flatMap((s: any) => s.required_materials ? s.required_materials.split(',') : []).filter(Boolean),
    estimated_time: '1-3个工作日'
  })

  const serviceSteps = services.slice(0, 3).map((service: any, index: number) => ({
    step: index + 2,
    title: `办理${service.name}`,
    description: service.description || `前往${service.department_name || '相关部门'}办理${service.name}`,
    department: service.department_name,
    service_item_id: service.id,
    required_materials: service.required_materials,
    estimated_days: service.processing_days
  }))

  steps.push(...serviceSteps)

  if (policies.length > 0) {
    steps.push({
      step: steps.length + 1,
      title: '政策申报',
      description: `可同步申请${policies.length}项相关政策，获取政策红利`,
      policies: policies.slice(0, 3).map((p: any) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        amount: p.amount
      })),
      estimated_time: '7-15个工作日'
    })
  }

  steps.push({
    step: steps.length + 1,
    title: '进度跟踪',
    description: '所有事项办理完成后，可在平台查看办理进度和结果',
    tips: ['设置提醒，及时查看审批结果', '保存好所有申请材料的电子存档', '如有疑问可通过诉求通道提交咨询']
  })

  return steps
}

router.post('/enterprise/:enterprise_id', (req: Request, res: Response): void => {
  try {
    const { enterprise_id } = req.params
    const { business_behavior } = req.body

    if (!business_behavior) {
      res.status(400).json({ success: false, error: 'business_behavior is required' })
      return
    }

    const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(enterprise_id) as any
    if (!enterprise) {
      res.status(404).json({ success: false, error: 'Enterprise not found' })
      return
    }

    const existingMaterials = db.prepare(`
      SELECT * FROM materials 
      WHERE enterprise_id = ? AND verified = 1
    `).all(enterprise_id)

    const creditScore = db.prepare(`
      SELECT AVG(score) as avg_score FROM credit_records WHERE enterprise_id = ?
    `).get(enterprise_id) as any

    const body = {
      enterprise_type: enterprise.type,
      industry: enterprise.industry,
      business_behavior,
      registered_capital: enterprise.registered_capital
    }

    const behaviorServiceMap: any = {
      '设立登记': ['开办', '登记'],
      '变更登记': ['变更'],
      '注销登记': ['注销'],
      '申请许可证': ['许可'],
      '项目备案': ['备案'],
      '税务办理': ['开办', '登记'],
      '社保办理': ['开办', '登记'],
      '进出口业务': ['备案', '许可'],
      '融资贷款': ['财政补贴', '税收优惠'],
      '技术研发': ['财政补贴', '人才计划'],
      '扩大生产': ['财政补贴', '税收优惠'],
      '环保合规': ['许可'],
      '安全生产': ['许可'],
      '人才招聘': ['人才计划'],
      '出口退税': ['税收优惠']
    }

    const targetCategories = behaviorServiceMap[business_behavior] || []

    let serviceWhereClauses = ['status = ?']
    let serviceParams: any[] = ['active']

    if (targetCategories.length > 0) {
      const placeholders = targetCategories.map(() => '?').join(', ')
      serviceWhereClauses.push(`category IN (${placeholders})`)
      serviceParams.push(...targetCategories)
    }

    const whereSql = serviceWhereClauses.join(' AND ')

    const recommendedServices = db.prepare(`
      SELECT si.*, d.name as department_name
      FROM service_items si
      LEFT JOIN departments d ON si.department_id = d.id
      WHERE ${whereSql}
      ORDER BY si.processing_days ASC
    `).all(...serviceParams)

    let policyWhereClauses = ['status = ?']
    let policyParams: any[] = ['active']

    if (enterprise.industry) {
      policyWhereClauses.push('(target_industry = ? OR target_industry = ?)')
      policyParams.push(enterprise.industry, '全行业')
    }

    policyWhereClauses.push('target_enterprise_type = ?')
    policyParams.push(enterprise.type)

    const policyWhereSql = policyWhereClauses.join(' AND ')

    const recommendedPolicies = db.prepare(`
      SELECT p.*, d.name as department_name
      FROM policies p
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE ${policyWhereSql}
      ORDER BY p.id DESC
    `).all(...policyParams)

    const scoredServices = recommendedServices.map((service: any) => {
      let score = 0
      let reasons: string[] = []

      if (targetCategories.includes(service.category)) {
        score += 50
        reasons.push(`Category matches business behavior: ${business_behavior}`)
      }

      if (service.processing_days && service.processing_days <= 5) {
        score += 20
        reasons.push('Fast processing time')
      } else if (service.processing_days && service.processing_days <= 15) {
        score += 10
        reasons.push('Standard processing time')
      }

      if (service.required_materials) {
        const materialCount = service.required_materials.split(',').length
        if (materialCount <= 3) {
          score += 15
          reasons.push('Minimal materials required')
        } else if (materialCount <= 5) {
          score += 10
          reasons.push('Moderate materials required')
        }
      }

      return {
        ...service,
        recommendation_score: score,
        recommendation_reasons: reasons
      }
    })

    const scoredPolicies = recommendedPolicies.map((policy: any) => {
      let score = 0
      let reasons: string[] = []

      if (enterprise.industry && (policy.target_industry === enterprise.industry || policy.target_industry === '全行业')) {
        score += 40
        reasons.push(`Industry match: ${enterprise.industry}`)
      }

      if (enterprise.type && policy.target_enterprise_type === enterprise.type) {
        score += 30
        reasons.push(`Enterprise type match: ${enterprise.type}`)
      }

      if (enterprise.registered_capital && enterprise.registered_capital >= 1000000) {
        score += 15
        reasons.push('Eligible for high-capital enterprise benefits')
      }

      if (policy.amount) {
        score += 15
        reasons.push(`Financial benefit available: ${policy.amount}`)
      }

      return {
        ...policy,
        recommendation_score: score,
        recommendation_reasons: reasons
      }
    })

    scoredServices.sort((a, b) => b.recommendation_score - a.recommendation_score)
    scoredPolicies.sort((a, b) => b.recommendation_score - a.recommendation_score)

    const guidanceSteps = generateGuidanceSteps(business_behavior, scoredServices, scoredPolicies)

    res.json({
      success: true,
      data: {
        enterprise: {
          id: enterprise.id,
          name: enterprise.name,
          type: enterprise.type,
          industry: enterprise.industry,
          registered_capital: enterprise.registered_capital
        },
        business_behavior,
        recommended_services: scoredServices,
        recommended_policies: scoredPolicies,
        existing_materials: existingMaterials,
        credit_score: creditScore?.avg_score || null,
        guidance_steps: guidanceSteps,
        estimated_processing_days: scoredServices.reduce((sum, s) => sum + (s.processing_days || 0), 0)
      }
    })
  } catch (error) {
    console.error('Enterprise guidance error:', error)
    res.status(500).json({ success: false, error: 'Failed to generate enterprise guidance' })
  }
})

router.get('/recommend', (req: Request, res: Response): void => {
  try {
    const { enterpriseType, industry, behavior, registeredCapital } = req.query

    const enterprise_type = enterpriseType as string
    const business_behavior = behavior as string
    const registered_capital = registeredCapital ? Number(registeredCapital) : undefined

    if (!enterprise_type || !business_behavior) {
      res.status(400).json({ success: false, error: 'enterpriseType and behavior are required' })
      return
    }

    const behaviorServiceMap: any = {
      '设立登记': ['开办', '登记'],
      '变更登记': ['变更'],
      '注销登记': ['注销'],
      '申请许可证': ['许可'],
      '项目备案': ['备案'],
      '税务办理': ['开办', '登记'],
      '社保办理': ['开办', '登记'],
      '进出口业务': ['备案', '许可'],
      '融资贷款': ['财政补贴', '税收优惠'],
      '技术研发': ['财政补贴', '人才计划'],
      '扩大生产': ['财政补贴', '税收优惠'],
      '环保合规': ['许可'],
      '安全生产': ['许可'],
      '人才招聘': ['人才计划'],
      '出口退税': ['税收优惠']
    }

    const targetCategories = behaviorServiceMap[business_behavior] || []

    let serviceWhereClauses = ['status = ?']
    let serviceParams: any[] = ['active']

    if (targetCategories.length > 0) {
      const placeholders = targetCategories.map(() => '?').join(', ')
      serviceWhereClauses.push(`category IN (${placeholders})`)
      serviceParams.push(...targetCategories)
    }

    const whereSql = serviceWhereClauses.join(' AND ')

    const recommendedServices = db.prepare(`
      SELECT si.*, d.name as department_name
      FROM service_items si
      LEFT JOIN departments d ON si.department_id = d.id
      WHERE ${whereSql}
      ORDER BY si.processing_days ASC
    `).all(...serviceParams)

    let policyWhereClauses = ['status = ?']
    let policyParams: any[] = ['active']

    if (industry) {
      policyWhereClauses.push('(target_industry = ? OR target_industry = ?)')
      policyParams.push(industry, '全行业')
    }

    if (enterprise_type) {
      policyWhereClauses.push('target_enterprise_type = ?')
      policyParams.push(enterprise_type)
    }

    const policyWhereSql = policyWhereClauses.join(' AND ')

    const recommendedPolicies = db.prepare(`
      SELECT p.*, d.name as department_name
      FROM policies p
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE ${policyWhereSql}
      ORDER BY p.id DESC
    `).all(...policyParams)

    const scoredServices = recommendedServices.map((service: any) => {
      let score = 0
      let reasons: string[] = []

      if (targetCategories.includes(service.category)) {
        score += 50
        reasons.push(`Category matches business behavior: ${business_behavior}`)
      }

      if (service.processing_days && service.processing_days <= 5) {
        score += 20
        reasons.push('Fast processing time')
      } else if (service.processing_days && service.processing_days <= 15) {
        score += 10
        reasons.push('Standard processing time')
      }

      if (service.required_materials) {
        const materialCount = service.required_materials.split(',').length
        if (materialCount <= 3) {
          score += 15
          reasons.push('Minimal materials required')
        } else if (materialCount <= 5) {
          score += 10
          reasons.push('Moderate materials required')
        }
      }

      return {
        ...service,
        recommendation_score: score,
        recommendation_reasons: reasons
      }
    })

    const scoredPolicies = recommendedPolicies.map((policy: any) => {
      let score = 0
      let reasons: string[] = []

      if (industry && (policy.target_industry === industry || policy.target_industry === '全行业')) {
        score += 40
        reasons.push(`Industry match: ${industry}`)
      }

      if (enterprise_type && policy.target_enterprise_type === enterprise_type) {
        score += 30
        reasons.push(`Enterprise type match: ${enterprise_type}`)
      }

      if (registered_capital && registered_capital >= 1000000) {
        score += 15
        reasons.push('Eligible for high-capital enterprise benefits')
      }

      if (policy.amount) {
        score += 15
        reasons.push(`Financial benefit available: ${policy.amount}`)
      }

      return {
        ...policy,
        recommendation_score: score,
        recommendation_reasons: reasons
      }
    })

    scoredServices.sort((a, b) => b.recommendation_score - a.recommendation_score)
    scoredPolicies.sort((a, b) => b.recommendation_score - a.recommendation_score)

    const guidanceSteps = generateGuidanceSteps(business_behavior, scoredServices, scoredPolicies)

    res.json({
      success: true,
      data: {
        enterprise_type,
        industry,
        business_behavior,
        recommended_services: scoredServices,
        recommended_policies: scoredPolicies,
        guidance_steps: guidanceSteps,
        estimated_processing_days: scoredServices.reduce((sum, s) => sum + (s.processing_days || 0), 0)
      }
    })
  } catch (error) {
    console.error('Smart guidance error:', error)
    res.status(500).json({ success: false, error: 'Failed to generate recommendations' })
  }
})

router.get('/behaviors', (req: Request, res: Response): void => {
  try {
    const behaviors = [
      { id: '设立登记', name: '企业设立登记', category: '开办企业', description: '完成工商注册、税务登记、社保登记等企业开办全流程' },
      { id: '变更登记', name: '企业变更登记', category: '变更信息', description: '变更企业名称、地址、法定代表人、经营范围等信息' },
      { id: '注销登记', name: '企业注销登记', category: '退出市场', description: '办理企业注销清算、税务清缴、工商注销等手续' },
      { id: '申请许可证', name: '经营许可证办理', category: '资质许可', description: '申请各类行业经营许可证、资质证书' },
      { id: '项目备案', name: '投资项目备案', category: '投资建设', description: '办理企业投资项目备案、核准手续' },
      { id: '税务办理', name: '税务相关业务', category: '税务服务', description: '办理税务登记、发票申领、纳税申报等业务' },
      { id: '社保办理', name: '社保公积金业务', category: '人力资源', description: '办理社会保险、住房公积金登记缴费等业务' },
      { id: '进出口业务', name: '进出口贸易', category: '对外贸易', description: '办理对外贸易经营者备案、海关登记、出口退税等' },
      { id: '融资贷款', name: '融资贷款服务', category: '金融服务', description: '申请银行贷款、政策性融资、担保服务等' },
      { id: '技术研发', name: '技术创新研发', category: '科技创新', description: '申请科技项目、研发补贴、高新技术认定等' },
      { id: '扩大生产', name: '扩大生产经营', category: '发展壮大', description: '产能扩张、技术改造、新建项目等' },
      { id: '环保合规', name: '环保合规办理', category: '环境保护', description: '办理环境影响评价、排污许可、环保验收等' },
      { id: '安全生产', name: '安全生产许可', category: '安全生产', description: '办理安全生产许可证、安全评价、职业健康等' },
      { id: '人才招聘', name: '人才招聘引进', category: '人力资源', description: '发布招聘信息、申请人才政策、办理人才引进等' },
      { id: '出口退税', name: '出口退税办理', category: '税务服务', description: '办理出口货物退（免）税申报等业务' }
    ]

    res.json({ success: true, data: behaviors })
  } catch (error) {
    console.error('Get behaviors error:', error)
    res.status(500).json({ success: false, error: 'Failed to get business behaviors' })
  }
})

export default router
