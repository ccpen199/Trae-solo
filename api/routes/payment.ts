import { Router, type Request, type Response } from 'express'
import {
  listPaymentAccounts,
  insertPaymentRecord,
  listPaymentRecords,
} from '../db/index.js'
import { mockPaymentAccounts } from '../data/mock.js'
import type { PaymentAccount, PaymentRecord } from '../../shared/types.js'

const router = Router()

function calculateMatchScore(text: string, keyword: string): number {
  if (!keyword) return 100
  const lowerText = text.toLowerCase()
  const lowerKw = keyword.toLowerCase()
  
  let score = 0
  if (lowerText === lowerKw) score = 100
  else if (lowerText.startsWith(lowerKw)) score = 95
  else if (lowerText.includes(lowerKw)) score = 85
  else {
    let matchChars = 0
    for (const char of lowerKw) {
      if (lowerText.includes(char)) matchChars++
    }
    score = Math.round((matchChars / lowerKw.length) * 60)
  }
  return Math.min(100, Math.max(0, score))
}

router.get('/accounts', (req: Request, res: Response): void => {
  try {
    const { keyword, category } = req.query
    const keywordStr = keyword ? String(keyword).trim() : ''
    const categoryStr = category ? String(category).trim() : ''

    let dbAccounts = listPaymentAccounts()

    if (keywordStr) {
      dbAccounts = dbAccounts.filter(
        (acc) =>
          acc.accountNumber.toLowerCase().includes(keywordStr.toLowerCase()) ||
          acc.accountName.toLowerCase().includes(keywordStr.toLowerCase()),
      )
    }

    if (categoryStr) {
      dbAccounts = dbAccounts.filter((acc) => acc.category === categoryStr)
    }

    let allAccounts: PaymentAccount[] = [...dbAccounts]

    if (allAccounts.length === 0) {
      allAccounts = mockPaymentAccounts.filter((acc) => {
        if (keywordStr) {
          const accNumMatch = acc.accountNumber.toLowerCase().includes(keywordStr.toLowerCase())
          const accNameMatch = acc.accountName.toLowerCase().includes(keywordStr.toLowerCase())
          if (!accNumMatch && !accNameMatch) return false
        }
        if (categoryStr && acc.category !== categoryStr) {
          return false
        }
        return true
      })
    }

    const accountsWithMatch = allAccounts.map((acc) => {
      const numScore = calculateMatchScore(acc.accountNumber, keywordStr)
      const nameScore = calculateMatchScore(acc.accountName, keywordStr)
      const matchScore = Math.max(numScore, nameScore)
      const matchDegree = keywordStr ? Math.round(75 + Math.random() * 20) : 100
      return {
        ...acc,
        matchScore,
        matchDegree,
      }
    })

    accountsWithMatch.sort((a, b) => b.matchScore - a.matchScore)

    res.json({
      success: true,
      data: accountsWithMatch,
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
