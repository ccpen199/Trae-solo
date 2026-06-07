import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authenticate } from '../middleware/auth.js'
import { auditLog } from '../middleware/audit.js'

const router = Router()

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status, keyword, page = '1', pageSize = '10',
    } = req.query as any

    const conditions: string[] = []
    const params: any[] = []

    if (status) { conditions.push('t.status = ?'); params.push(status) }
    if (keyword) {
      conditions.push('(t.title LIKE ? OR h.title LIKE ? OR c.name LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }

    if (req.user!.role === 'agent') {
      conditions.push('t.agent_id = ?')
      params.push(req.user!.id)
    } else if (req.user!.role === 'manager') {
      conditions.push('t.agent_id IN (SELECT id FROM users WHERE org_id = ?)')
      params.push(req.user!.org_id)
    }

    const pageNum = Math.max(1, Number(page))
    const pageSizeNum = Math.max(1, Math.min(100, Number(pageSize)))
    const offset = (pageNum - 1) * pageSizeNum
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

    const totalRow = db.prepare(
      `SELECT COUNT(*) as count FROM transactions t ${where}`
    ).get(...params) as { count: number }

    const rows = db.prepare(
      `SELECT t.*, h.title as house_title, c.name as client_name, u.name as agent_name
       FROM transactions t
       LEFT JOIN houses h ON t.house_id = h.id
       LEFT JOIN clients c ON t.client_id = c.id
       LEFT JOIN users u ON t.agent_id = u.id
       ${where}
       ORDER BY t.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSizeNum, offset) as any[]

    res.json({ success: true, data: rows, total: totalRow.count, page: pageNum, pageSize: pageSizeNum })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', authenticate, auditLog('create', 'transaction'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, houseId, clientId, totalAmount, commissionRate } = req.body

    if (!title || !houseId || !clientId || !totalAmount) {
      res.status(400).json({ success: false, error: '标题、房源、客户和总价为必填项' })
      return
    }

    const rate = commissionRate || 0.025
    const commissionAmount = Number(totalAmount) * rate

    const createTransaction = db.transaction(() => {
      const result = db.prepare(
        `INSERT INTO transactions (title, house_id, client_id, agent_id, total_amount, commission_rate, commission_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(title, houseId, clientId, req.user!.id, totalAmount, rate, commissionAmount)

      const txId = result.lastInsertRowid

      const nodeTypes: Array<'contract' | 'loan' | 'transfer'> = ['contract', 'loan', 'transfer']
      for (const nodeType of nodeTypes) {
        db.prepare(
          `INSERT INTO transaction_nodes (transaction_id, node_type, status) VALUES (?, ?, 'pending')`
        ).run(txId, nodeType)
      }

      return txId
    })

    const txId = createTransaction()
    const transaction = db.prepare(
      `SELECT t.*, h.title as house_title, c.name as client_name, u.name as agent_name
       FROM transactions t
       LEFT JOIN houses h ON t.house_id = h.id
       LEFT JOIN clients c ON t.client_id = c.id
       LEFT JOIN users u ON t.agent_id = u.id
       WHERE t.id = ?`
    ).get(txId) as any

    res.status(201).json({ success: true, data: transaction })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const transaction = db.prepare(
      `SELECT t.*, h.title as house_title, c.name as client_name, u.name as agent_name
       FROM transactions t
       LEFT JOIN houses h ON t.house_id = h.id
       LEFT JOIN clients c ON t.client_id = c.id
       LEFT JOIN users u ON t.agent_id = u.id
       WHERE t.id = ?`
    ).get(Number(req.params.id)) as any

    if (!transaction) {
      res.status(404).json({ success: false, error: '交易不存在' })
      return
    }

    const nodes = db.prepare(
      'SELECT * FROM transaction_nodes WHERE transaction_id = ? ORDER BY node_type'
    ).all(Number(req.params.id)) as any[]

    res.json({ success: true, data: { ...transaction, nodes } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id/status', authenticate, auditLog('update_status', 'transaction'), async (req: Request, res: Response): Promise<void> => {
  try {
    const txId = Number(req.params.id)
    const { status } = req.body

    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId) as any
    if (!transaction) {
      res.status(404).json({ success: false, error: '交易不存在' })
      return
    }

    const isOwner = transaction.agent_id === req.user!.id
    const isPrivileged = ['director', 'manager'].includes(req.user!.role)
    if (!isOwner && !isPrivileged) {
      res.status(403).json({ success: false, error: '无权修改此交易状态' })
      return
    }

    const validStatuses = ['contract', 'loan', 'transfer', 'completed']
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: '无效的交易状态' })
      return
    }

    db.transaction(() => {
      db.prepare(
        'UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(status, txId)

      const nodeTypeMap: Record<string, string> = {
        contract: 'contract',
        loan: 'loan',
        transfer: 'transfer',
      }
      const nodeType = nodeTypeMap[status]
      if (nodeType) {
        db.prepare(
          "UPDATE transaction_nodes SET status = 'processing' WHERE transaction_id = ? AND node_type = ? AND status = 'pending'"
        ).run(txId, nodeType)
      }
    })()

    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id/nodes/:nodeId', authenticate, auditLog('update_node', 'transaction_node'), async (req: Request, res: Response): Promise<void> => {
  try {
    const txId = Number(req.params.id)
    const nodeId = Number(req.params.nodeId)
    const { status } = req.body

    if (!status || !['pending', 'processing', 'completed'].includes(status)) {
      res.status(400).json({ success: false, error: '无效的节点状态' })
      return
    }

    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId) as any
    if (!transaction) {
      res.status(404).json({ success: false, error: '交易不存在' })
      return
    }

    const node = db.prepare('SELECT * FROM transaction_nodes WHERE id = ? AND transaction_id = ?').get(nodeId, txId) as any
    if (!node) {
      res.status(404).json({ success: false, error: '节点不存在' })
      return
    }

    db.transaction(() => {
      if (status === 'completed') {
        db.prepare(
          "UPDATE transaction_nodes SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).run(nodeId)
      } else {
        db.prepare(
          'UPDATE transaction_nodes SET status = ? WHERE id = ?'
        ).run(status, nodeId)
      }

      if (status === 'completed') {
        const allNodes = db.prepare(
          'SELECT status FROM transaction_nodes WHERE transaction_id = ?'
        ).all(txId) as any[]

        const allCompleted = allNodes.every(n => n.status === 'completed')
        if (allCompleted) {
          db.prepare(
            "UPDATE transactions SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
          ).run(txId)

          const agent = db.prepare('SELECT role, org_id FROM users WHERE id = ?').get(transaction.agent_id) as any
          if (agent) {
            const rules = db.prepare(
              'SELECT role, rate FROM commission_rules WHERE org_id = ?'
            ).all(agent.org_id) as any[]

            for (const rule of rules) {
              const amount = transaction.commission_amount * rule.rate / transaction.commission_rate
              db.prepare(
                `INSERT INTO commissions (transaction_id, agent_id, amount, rate, status)
                 VALUES (?, ?, ?, ?, 'pending')`
              ).run(txId, transaction.agent_id, amount, rule.rate)
            }
          }
        }
      }
    })()

    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
