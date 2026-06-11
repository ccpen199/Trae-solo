import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { randomUUID } from 'crypto'

const router = Router()

router.get('/vouchers/templates', (req: Request, res: Response): void => {
  try {
    const { status, orgId } = req.query
    let sql = 'SELECT * FROM voucher_template WHERE 1=1'
    const params: any[] = []

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }
    if (orgId) {
      sql += ' AND org_id = ?'
      params.push(orgId)
    }
    sql += ' ORDER BY created_at DESC'

    const templates = db.prepare(sql).all(...params) as any[]
    res.json({
      success: true,
      data: templates.map(t => ({
        id: t.id,
        name: t.name,
        amount: t.amount,
        totalQuantity: t.total_quantity,
        remainingQuantity: t.remaining_quantity,
        expiryDate: t.expiry_date,
        status: t.status,
        orgId: t.org_id,
        budgetId: t.budget_id,
        createdAt: t.created_at,
      })),
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.post('/vouchers/templates', (req: Request, res: Response): void => {
  try {
    const { name, amount, totalQuantity, expiryDate, orgId, budgetId } = req.body
    if (!name || !amount || !totalQuantity || !expiryDate || !orgId) {
      res.status(400).json({ success: false, message: '请填写完整的模板信息' })
      return
    }

    const id = `vt-${randomUUID().slice(0, 8)}`
    db.prepare('INSERT INTO voucher_template (id, name, amount, total_quantity, remaining_quantity, expiry_date, status, org_id, budget_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, name, amount, totalQuantity, totalQuantity, expiryDate, 'draft', orgId, budgetId || null)

    res.json({ success: true, data: { id }, message: '模板创建成功' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.post('/vouchers/issue', (req: Request, res: Response): void => {
  try {
    const { templateId, memberIds } = req.body
    if (!templateId || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      res.status(400).json({ success: false, message: '请提供模板ID和会员列表' })
      return
    }

    const template = db.prepare('SELECT * FROM voucher_template WHERE id = ?').get(templateId) as any
    if (!template) {
      res.status(404).json({ success: false, message: '模板不存在' })
      return
    }
    if (template.remaining_quantity < memberIds.length) {
      res.status(400).json({ success: false, message: '剩余数量不足' })
      return
    }

    const insertVoucher = db.prepare('INSERT INTO voucher (id, template_id, member_id, code, status, issued_at) VALUES (?, ?, ?, ?, ?, ?)')
    const issued: any[] = []

    const issueAll = db.transaction(() => {
      for (const memberId of memberIds) {
        const vId = `v-${randomUUID().slice(0, 8)}`
        const code = `VC${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`
        const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
        insertVoucher.run(vId, templateId, memberId, code, 'unused', now)
        issued.push({ id: vId, code, memberId })
      }
      db.prepare('UPDATE voucher_template SET remaining_quantity = remaining_quantity - ? WHERE id = ?').run(memberIds.length, templateId)
    })

    issueAll()
    res.json({ success: true, data: { issued }, message: `成功发放${memberIds.length}张电子券` })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

function handleMyVouchers(req: Request, res: Response): void {
  try {
    const memberId = req.query.memberId as string
    if (!memberId) {
      res.status(400).json({ success: false, message: '请提供会员ID' })
      return
    }

    const vouchers = db.prepare(`SELECT v.*, vt.name as template_name, vt.amount, vt.expiry_date FROM voucher v JOIN voucher_template vt ON v.template_id = vt.id WHERE v.member_id = ? ORDER BY v.issued_at DESC`).all(memberId) as any[]

    res.json({
      success: true,
      data: vouchers.map(v => ({
        id: v.id,
        templateId: v.template_id,
        templateName: v.template_name,
        amount: v.amount,
        code: v.code,
        status: v.status,
        issuedAt: v.issued_at,
        usedAt: v.used_at,
        expiryDate: v.expiry_date,
      })),
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

router.get('/my-vouchers', handleMyVouchers)
router.get('/vouchers/my', handleMyVouchers)

router.post('/vouchers/:id/redeem', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { memberId, operatorName } = req.body

    const voucher = db.prepare('SELECT * FROM voucher WHERE id = ?').get(id) as any
    if (!voucher) {
      res.status(404).json({ success: false, message: '电子券不存在' })
      return
    }
    if (memberId && voucher.member_id !== memberId) {
      res.status(400).json({ success: false, message: '会员ID不匹配' })
      return
    }
    if (voucher.status !== 'unused') {
      res.status(400).json({ success: false, message: '该电子券已被使用或已过期' })
      return
    }

    const template = db.prepare('SELECT * FROM voucher_template WHERE id = ?').get(voucher.template_id) as any
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    const serialNo = `HX${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    const redeemTx = db.transaction(() => {
      db.prepare("UPDATE voucher SET status = 'used', used_at = ? WHERE id = ?").run(now, id)
      if (template && template.budget_id) {
        db.prepare('UPDATE budget_plan SET used_amount = used_amount + ? WHERE id = ?').run(template.amount, template.budget_id)
      }
    })
    redeemTx()

    res.json({ success: true, data: { serialNo, usedAt: now, operatorName: operatorName || '系统管理员' }, message: '核销成功' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.post('/vouchers/batch-redeem', (req: Request, res: Response): void => {
  try {
    const { voucherIds, memberId, operatorName } = req.body
    if (!voucherIds || !Array.isArray(voucherIds) || voucherIds.length === 0) {
      res.status(400).json({ success: false, message: '请选择要核销的电子券' })
      return
    }

    const placeholders = voucherIds.map(() => '?').join(',')
    const vouchers = db.prepare(`SELECT * FROM voucher WHERE id IN (${placeholders}) AND member_id = ?`).all(...voucherIds, memberId) as any[]

    const unusedVouchers = vouchers.filter(v => v.status === 'unused')
    if (unusedVouchers.length === 0) {
      res.status(400).json({ success: false, message: '没有可核销的电子券' })
      return
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    const results: any[] = []

    const batchRedeemTx = db.transaction(() => {
      for (const v of unusedVouchers) {
        const template = db.prepare('SELECT * FROM voucher_template WHERE id = ?').get(v.template_id) as any
        const serialNo = `HX${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`
        db.prepare("UPDATE voucher SET status = 'used', used_at = ? WHERE id = ?").run(now, v.id)
        if (template && template.budget_id) {
          db.prepare('UPDATE budget_plan SET used_amount = used_amount + ? WHERE id = ?').run(template.amount, template.budget_id)
        }
        results.push({ id: v.id, serialNo, usedAt: now })
      }
    })
    batchRedeemTx()

    res.json({ success: true, data: { count: results.length, results, operatorName: operatorName || '系统管理员' }, message: `成功核销${results.length}张电子券` })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.get('/points/products', (req: Request, res: Response): void => {
  try {
    const { category } = req.query
    let sql = 'SELECT * FROM points_product WHERE stock > 0'
    const params: any[] = []

    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }
    sql += ' ORDER BY points ASC'

    const products = db.prepare(sql).all(...params) as any[]
    res.json({
      success: true,
      data: products.map(p => ({
        id: p.id,
        name: p.name,
        points: p.points,
        stock: p.stock,
        category: p.category,
        image: p.image,
        description: p.description,
      })),
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.post('/points/exchange', (req: Request, res: Response): void => {
  try {
    const { memberId, productId } = req.body
    if (!memberId || !productId) {
      res.status(400).json({ success: false, message: '请提供会员ID和商品ID' })
      return
    }

    const member = db.prepare('SELECT * FROM member WHERE id = ?').get(memberId) as any
    if (!member) {
      res.status(404).json({ success: false, message: '会员不存在' })
      return
    }

    const product = db.prepare('SELECT * FROM points_product WHERE id = ?').get(productId) as any
    if (!product) {
      res.status(404).json({ success: false, message: '商品不存在' })
      return
    }

    if (product.stock <= 0) {
      res.status(400).json({ success: false, message: '商品库存不足' })
      return
    }

    if (member.points < product.points) {
      res.status(400).json({ success: false, message: '积分不足' })
      return
    }

    const orderId = `po-${randomUUID().slice(0, 8)}`
    const exchangeAll = db.transaction(() => {
      db.prepare('INSERT INTO points_order (id, member_id, product_id, status) VALUES (?, ?, ?, ?)').run(orderId, memberId, productId, 'pending')
      db.prepare('UPDATE member SET points = points - ? WHERE id = ?').run(product.points, memberId)
      db.prepare('UPDATE points_product SET stock = stock - 1 WHERE id = ?').run(productId)
    })

    exchangeAll()
    res.json({ success: true, data: { orderId }, message: '兑换成功' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.get('/budgets', (req: Request, res: Response): void => {
  try {
    const { orgId, status } = req.query
    let sql = 'SELECT bp.*, o.name as org_name FROM budget_plan bp JOIN organization o ON bp.org_id = o.id WHERE 1=1'
    const params: any[] = []

    if (orgId) {
      sql += ' AND bp.org_id = ?'
      params.push(orgId)
    }
    if (status) {
      sql += ' AND bp.status = ?'
      params.push(status)
    }
    sql += ' ORDER BY bp.created_at DESC'

    const plans = db.prepare(sql).all(...params) as any[]
    const stepStmt = db.prepare('SELECT * FROM approval_step WHERE plan_id = ? ORDER BY step')

    const result = plans.map(p => {
      const steps = stepStmt.all(p.id) as any[]
      return {
        id: p.id,
        orgId: p.org_id,
        orgName: p.org_name,
        title: p.title,
        totalAmount: p.total_amount,
        usedAmount: p.used_amount,
        status: p.status,
        createdAt: p.created_at,
        approvalFlow: steps.map(s => ({
          step: s.step,
          approver: s.approver,
          approverName: s.approver_name,
          status: s.status,
          comment: s.comment,
          timestamp: s.timestamp,
        })),
      }
    })

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.get('/budgets/:id/details', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const budget = db.prepare('SELECT bp.*, o.name as org_name FROM budget_plan bp JOIN organization o ON bp.org_id = o.id WHERE bp.id = ?').get(id) as any
    if (!budget) {
      res.status(404).json({ success: false, message: '预算计划不存在' })
      return
    }

    const linkedTemplates = db.prepare('SELECT * FROM voucher_template WHERE budget_id = ?').all(id) as any[]
    const templateIds = linkedTemplates.map(t => t.id)
    const templateMap: Record<string, any> = {}
    for (const t of linkedTemplates) {
      templateMap[t.id] = t
    }

    let vouchers: any[] = []
    if (templateIds.length > 0) {
      const placeholders = templateIds.map(() => '?').join(',')
      vouchers = db.prepare(`
        SELECT v.*, m.name as member_name, o.name as member_org_name
        FROM voucher v
        JOIN member m ON v.member_id = m.id
        JOIN organization o ON m.org_id = o.id
        WHERE v.template_id IN (${placeholders})
      `).all(...templateIds) as any[]
    }

    const voucherBreakdown: any[] = []
    let issuedCount = 0
    let usedCount = 0
    let issuedAmount = 0
    let redeemedAmount = 0

    for (const t of linkedTemplates) {
      const tplVouchers = vouchers.filter(v => v.template_id === t.id)
      const tplIssued = tplVouchers.length
      const tplUsed = tplVouchers.filter(v => v.status === 'used').length
      const tplIssuedAmount = tplIssued * t.amount
      const tplUsedAmount = tplUsed * t.amount

      issuedCount += tplIssued
      usedCount += tplUsed
      issuedAmount += tplIssuedAmount
      redeemedAmount += tplUsedAmount

      voucherBreakdown.push({
        templateId: t.id,
        name: t.name,
        issued: tplIssued,
        used: tplUsed,
        amountPerUnit: t.amount,
        totalUsedAmount: tplUsedAmount,
      })
    }

    const steps = db.prepare('SELECT * FROM approval_step WHERE plan_id = ? ORDER BY step').all(id) as any[]
    const redeemedVouchers = vouchers
      .filter(v => v.status === 'used')
      .sort((a, b) => (b.used_at || '').localeCompare(a.used_at || ''))
      .map(v => ({
        id: v.id,
        code: v.code,
        memberId: v.member_id,
        memberName: v.member_name,
        memberOrgName: v.member_org_name,
        usedAt: v.used_at,
        amount: templateMap[v.template_id]?.amount || 0,
        templateName: templateMap[v.template_id]?.name || '',
        serialNo: `HX${v.used_at ? new Date(v.used_at).getTime() : Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        operatorName: '系统管理员',
      }))

    res.json({
      success: true,
      data: {
        id: budget.id,
        orgId: budget.org_id,
        orgName: budget.org_name,
        title: budget.title,
        totalAmount: budget.total_amount,
        usedAmount: budget.used_amount,
        status: budget.status,
        createdAt: budget.created_at,
        approvalFlow: steps.map(s => ({
          step: s.step,
          approver: s.approver,
          approverName: s.approver_name,
          status: s.status,
          comment: s.comment,
          timestamp: s.timestamp,
        })),
        linkedTemplates: linkedTemplates.map(t => ({
          id: t.id,
          name: t.name,
          amount: t.amount,
          totalQuantity: t.total_quantity,
          remainingQuantity: t.remaining_quantity,
          expiryDate: t.expiry_date,
          status: t.status,
        })),
        issuedCount,
        usedCount,
        issuedAmount,
        redeemedAmount,
        remainingBudget: budget.total_amount - redeemedAmount,
        voucherBreakdown,
        redeemedVouchers,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.post('/budgets', (req: Request, res: Response): void => {
  try {
    const { orgId, title, totalAmount } = req.body
    if (!orgId || !title || !totalAmount) {
      res.status(400).json({ success: false, message: '请填写完整的预算信息' })
      return
    }

    const id = `bp-${randomUUID().slice(0, 8)}`
    db.prepare('INSERT INTO budget_plan (id, org_id, title, total_amount, used_amount, status) VALUES (?, ?, ?, ?, 0, ?)')
      .run(id, orgId, title, totalAmount, 'pending')

    res.json({ success: true, data: { id }, message: '预算计划创建成功' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.put('/budgets/:id/approve', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { approver, comment } = req.body

    const plan = db.prepare('SELECT * FROM budget_plan WHERE id = ?').get(id) as any
    if (!plan) {
      res.status(404).json({ success: false, message: '预算计划不存在' })
      return
    }

    const pendingStep = db.prepare("SELECT * FROM approval_step WHERE plan_id = ? AND status = 'pending' ORDER BY step LIMIT 1").get(id) as any
    if (!pendingStep) {
      res.status(400).json({ success: false, message: '没有待审批步骤' })
      return
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    const approveAll = db.transaction(() => {
      db.prepare("UPDATE approval_step SET status = 'approved', comment = ?, timestamp = ? WHERE id = ?").run(comment || '同意', now, pendingStep.id)

      const nextStep = db.prepare("SELECT * FROM approval_step WHERE plan_id = ? AND status = 'pending' ORDER BY step LIMIT 1").get(id) as any
      if (!nextStep) {
        db.prepare("UPDATE budget_plan SET status = 'approved' WHERE id = ?").run(id)
      }
    })

    approveAll()
    res.json({ success: true, message: '审批通过' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.put('/budgets/:id/reject', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { comment } = req.body

    const plan = db.prepare('SELECT * FROM budget_plan WHERE id = ?').get(id) as any
    if (!plan) {
      res.status(404).json({ success: false, message: '预算计划不存在' })
      return
    }

    const pendingStep = db.prepare("SELECT * FROM approval_step WHERE plan_id = ? AND status = 'pending' ORDER BY step LIMIT 1").get(id) as any
    if (!pendingStep) {
      res.status(400).json({ success: false, message: '没有待审批步骤' })
      return
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    db.transaction(() => {
      db.prepare("UPDATE approval_step SET status = 'rejected', comment = ?, timestamp = ? WHERE id = ?").run(comment || '驳回', now, pendingStep.id)
      db.prepare("UPDATE budget_plan SET status = 'rejected' WHERE id = ?").run(id)
    })()

    res.json({ success: true, message: '已驳回' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

export default router
