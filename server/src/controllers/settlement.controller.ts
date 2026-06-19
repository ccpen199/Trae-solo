import { Response } from 'express'
import type { AuthRequest } from '../middleware/auth.middleware'
import {
  getAllSettlements,
  getSettlementsByUserId,
  addSettlement,
  generateId,
} from '../data/database'
import type { Settlement } from '../types'

export async function getSettlements(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id
    const role = req.user?.role
    const { status, period } = req.query

    let settlements: Settlement[]

    if (role === 'publisher' || role === 'admin') {
      settlements = getAllSettlements()
    } else {
      settlements = getSettlementsByUserId(userId || '')
    }

    if (status) {
      settlements = settlements.filter(s => s.status === status)
    }

    const stats = {
      total: settlements.reduce((sum, s) => sum + s.amount, 0),
      count: settlements.length,
      pending: settlements.filter(s => s.status === 'pending' || s.status === 'processing').length,
      completed: settlements.filter(s => s.status === 'completed').length,
    }

    res.json({
      success: true,
      data: settlements,
      stats,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getSettlementById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const settlements = getAllSettlements()
    const settlement = settlements.find(s => s.id === id)

    if (!settlement) {
      return res.status(404).json({ error: 'Settlement not found' })
    }

    res.json({ success: true, data: settlement })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function createSettlement(req: AuthRequest, res: Response) {
  try {
    const { userId, userName, taskId, taskName, amount, units, paymentMethod } = req.body

    const settlement: Settlement = {
      id: generateId(),
      userId,
      userName,
      taskId,
      taskName,
      amount,
      units,
      status: 'pending',
      paymentMethod: paymentMethod || 'wechat',
      createdAt: new Date().toISOString().split('T')[0],
    }

    addSettlement(settlement)

    res.status(201).json({
      success: true,
      data: settlement,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function processSettlement(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const settlements = getAllSettlements()
    const settlement = settlements.find(s => s.id === id)

    if (!settlement) {
      return res.status(404).json({ error: 'Settlement not found' })
    }

    settlement.status = 'completed'
    settlement.completedAt = new Date().toISOString().split('T')[0]

    res.json({
      success: true,
      data: settlement,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getPaymentMethods(req: AuthRequest, res: Response) {
  try {
    const methods = [
      { id: 'wechat', name: '微信支付', type: 'wechat', isDefault: true, enabled: true },
      { id: 'bank', name: '银行卡', type: 'bank', bank: '工商银行', last4: '8821', isDefault: false, enabled: true },
    ]

    res.json({
      success: true,
      data: methods,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function addPaymentMethod(req: AuthRequest, res: Response) {
  try {
    const { type, details } = req.body

    res.status(201).json({
      success: true,
      message: 'Payment method added',
      data: { type, details },
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function withdraw(req: AuthRequest, res: Response) {
  try {
    const { amount, methodId } = req.body
    const userId = req.user?.id

    if (!userId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const settlement: Settlement = {
      id: generateId(),
      userId,
      userName: '用户',
      taskId: '',
      taskName: '提现',
      amount: -Math.abs(amount),
      units: 0,
      status: 'processing',
      paymentMethod: methodId || 'wechat',
      createdAt: new Date().toISOString().split('T')[0],
    }

    addSettlement(settlement)

    res.json({
      success: true,
      data: settlement,
      message: 'Withdrawal request submitted',
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}
