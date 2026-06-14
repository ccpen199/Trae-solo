import { Router, type Request, type Response } from 'express'
import {
  listPaymentAccounts,
  insertPaymentRecord,
  listPaymentRecords,
} from '../db/index.js'
import { mockPaymentAccounts } from '../data/mock.js'
import type { PaymentAccount, PaymentRecord } from '../../shared/types.js'

const router = Router()

router.get('/accounts', (req: Request, res: Response): void => {
  try {
    const { keyword, category } = req.query
    const keywordStr = keyword ? String(keyword).trim() : ''
    const categoryStr = category ? String(category).trim() : ''

    let dbAccounts = listPaymentAccounts()

    if (keywordStr) {
      dbAccounts = dbAccounts.filter(
        (acc) =>
          acc.accountNumber.includes(keywordStr) ||
          acc.accountName.includes(keywordStr),
      )
    }

    if (categoryStr) {
      dbAccounts = dbAccounts.filter((acc) => acc.category === categoryStr)
    }

    let allAccounts: PaymentAccount[] = [...dbAccounts]

    if (allAccounts.length === 0) {
      allAccounts = mockPaymentAccounts.filter((acc) => {
        if (keywordStr && !(acc.accountNumber.includes(keywordStr) || acc.accountName.includes(keywordStr))) {
          return false
        }
        if (categoryStr && acc.category !== categoryStr) {
          return false
        }
        return true
      })
    }

    res.json({
      success: true,
      data: allAccounts,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '搜索缴费账户失败',
    })
  }
})

router.get('/records', (req: Request, res: Response): void => {
  try {
    const { accountId } = req.query
    const accountIdStr = accountId ? String(accountId) : undefined
    const records = listPaymentRecords(accountIdStr)

    res.json({
      success: true,
      data: records,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取缴费记录失败',
    })
  }
})

router.get('/accounts/:accountId', (req: Request, res: Response): void => {
  try {
    const { accountId } = req.params

    const dbAccounts = listPaymentAccounts()
    let account = dbAccounts.find((a) => a.id === accountId)

    if (!account) {
      account = mockPaymentAccounts.find((a) => a.id === accountId)
    }

    if (!account) {
      res.status(404).json({
        success: false,
        error: '未找到缴费账户',
      })
      return
    }

    res.json({
      success: true,
      data: account as PaymentAccount,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取账单详情失败',
    })
  }
})

router.post('/pay', (req: Request, res: Response): void => {
  try {
    const { accountId, amount } = req.body as { accountId?: string; amount?: number }

    if (!accountId || !amount || amount <= 0) {
      res.status(400).json({
        success: false,
        error: '参数错误：accountId 和 amount 为必填，且 amount 必须大于0',
      })
      return
    }

    const id = `pr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const orderNo = `PAY${Date.now()}`
    const createdAt = new Date().toISOString()
    const paidAt = new Date().toISOString()
    const status: 'success' = 'success'

    const record: PaymentRecord = {
      id,
      accountId,
      amount,
      status,
      orderNo,
      paidAt,
      createdAt,
    }

    insertPaymentRecord(record)

    res.json({
      success: true,
      data: record,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建缴费记录失败',
    })
  }
})

export default router
