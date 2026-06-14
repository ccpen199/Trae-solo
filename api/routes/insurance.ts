import { Router, type Request, type Response } from 'express'
import { insuranceProducts, insurancePolicies, orders } from '../../src/mock/data.js'
import type { InsurancePolicy } from '../../src/types/index.js'

const router = Router()

let nextPolicyId = 100

router.get('/products', async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: insuranceProducts,
  })
})

router.get('/products/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const product = insuranceProducts.find(p => p.id === id)

  if (!product) {
    res.status(404).json({
      success: false,
      error: '保险产品不存在',
    })
    return
  }

  res.status(200).json({
    success: true,
    data: product,
  })
})

router.post('/products', async (req: Request, res: Response): Promise<void> => {
  const { name, coverage, coverage_amount, premium, provider, description } = req.body

  if (!name || !coverage || !coverage_amount || !premium || !provider) {
    res.status(400).json({
      success: false,
      error: '缺少必要参数',
    })
    return
  }

  const newProduct = {
    id: insuranceProducts.length > 0 ? Math.max(...insuranceProducts.map(p => p.id)) + 1 : 1,
    name,
    coverage,
    coverage_amount,
    premium,
    provider,
    description: description || '',
  }

  insuranceProducts.push(newProduct)

  res.status(201).json({
    success: true,
    data: newProduct,
  })
})

router.get('/policies', async (req: Request, res: Response): Promise<void> => {
  const { order_id, status } = req.query

  let filtered = [...insurancePolicies]

  if (order_id) {
    filtered = filtered.filter(p => p.order_id === parseInt(order_id as string, 10))
  }
  if (status) {
    filtered = filtered.filter(p => p.status === status)
  }

  res.status(200).json({
    success: true,
    data: filtered,
  })
})

router.get('/policies/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const policy = insurancePolicies.find(p => p.id === id)

  if (!policy) {
    res.status(404).json({
      success: false,
      error: '保单不存在',
    })
    return
  }

  res.status(200).json({
    success: true,
    data: policy,
  })
})

router.post('/policies', async (req: Request, res: Response): Promise<void> => {
  const { order_id, product_id } = req.body

  if (!order_id || !product_id) {
    res.status(400).json({
      success: false,
      error: '订单ID和产品ID不能为空',
    })
    return
  }

  const order = orders.find(o => o.id === order_id)
  const product = insuranceProducts.find(p => p.id === product_id)

  if (!order) {
    res.status(404).json({
      success: false,
      error: '订单不存在',
    })
    return
  }

  if (!product) {
    res.status(404).json({
      success: false,
      error: '保险产品不存在',
    })
    return
  }

  const policyNo = `${product.name.includes('意外') ? 'PA' : 'PP'}${Date.now().toString().slice(-10)}`

  const effectiveDate = new Date(order.start_time)
  const expireDate = new Date(effectiveDate)
  expireDate.setHours(23, 59, 59, 999)

  const newPolicy: InsurancePolicy = {
    id: nextPolicyId++,
    order_id,
    product_id,
    product_name: product.name,
    policy_no: policyNo,
    status: 'active',
    effective_date: effectiveDate.toISOString(),
    expire_date: expireDate.toISOString(),
  }

  insurancePolicies.push(newPolicy)

  res.status(201).json({
    success: true,
    data: newPolicy,
  })
})

router.patch('/policies/:id/claim', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const policy = insurancePolicies.find(p => p.id === id)

  if (!policy) {
    res.status(404).json({
      success: false,
      error: '保单不存在',
    })
    return
  }

  if (policy.status === 'expired') {
    res.status(400).json({
      success: false,
      error: '保单已过期，无法理赔',
    })
    return
  }

  policy.status = 'claimed'

  res.status(200).json({
    success: true,
    data: policy,
    message: '理赔申请已提交',
  })
})

export default router
