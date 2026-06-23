import { Router, type Request, type Response } from 'express'
import {
  listPaymentAccounts,
  insertPaymentRecord,
  listPaymentRecords,
} from '../db/index.js'
import { mockPaymentAccounts } from '../data/mock.js'
import type { PaymentAccount, PaymentRecord, PaymentAccountWithMatch } from '../../shared/types.js'

const router = Router()

function generateSystemSource(district: string, category: string): string {
  const sourceMap: Record<string, Record<string, string>> = {
    市南区: {
      water: '青岛市水务集团市南区营业厅',
      electric: '青岛供电公司市南供电中心',
      gas: '青岛能源集团市南区燃气公司',
      heating: '青岛热电集团市南区供热公司',
      broadband: '中国联通青岛市南区分公司',
    },
    市北区: {
      water: '青岛市水务集团市北区营业厅',
      electric: '青岛供电公司市北供电中心',
      gas: '青岛能源集团市北区燃气公司',
      heating: '青岛热电集团市北区供热公司',
      broadband: '中国联通青岛市北区分公司',
    },
    李沧区: {
      water: '青岛市水务集团李沧区营业厅',
      electric: '青岛供电公司李沧供电中心',
      gas: '青岛能源集团李沧区燃气公司',
      heating: '青岛热电集团李沧区供热公司',
      broadband: '中国联通青岛李沧区分公司',
    },
    崂山区: {
      water: '青岛市水务集团崂山区营业厅',
      electric: '青岛供电公司崂山供电中心',
      gas: '青岛能源集团崂山区燃气公司',
      heating: '青岛热电集团崂山区供热公司',
      broadband: '中国联通青岛崂山区分公司',
    },
    黄岛区: {
      water: '青岛市水务集团黄岛区营业厅',
      electric: '青岛供电公司黄岛供电中心',
      gas: '青岛能源集团黄岛区燃气公司',
      heating: '青岛热电集团黄岛区供热公司',
      broadband: '中国联通青岛黄岛区分公司',
    },
    城阳区: {
      water: '青岛市水务集团城阳区营业厅',
      electric: '青岛供电公司城阳供电中心',
      gas: '青岛能源集团城阳区燃气公司',
      heating: '青岛热电集团城阳区供热公司',
      broadband: '中国联通青岛城阳区分公司',
    },
  }
  return sourceMap[district]?.[category] || '青岛市缴费系统'
}

function generateSystemStatus(): 'online' | 'offline' | 'maintenance' {
  const rand = Math.random()
  if (rand < 0.75) return 'online'
  if (rand < 0.9) return 'maintenance'
  return 'offline'
}

function enrichAccount(acc: PaymentAccount): PaymentAccount {
  return {
    ...acc,
    systemStatus: acc.systemStatus || generateSystemStatus(),
    systemSource: acc.systemSource || generateSystemSource(acc.district, acc.category),
    householdNo: acc.householdNo || `${acc.district.slice(0, 2)}-${acc.category.toUpperCase()}-${acc.accountNumber.slice(-6)}`,
    address: acc.address || `${acc.district}XX路XX号`,
    ownerPhone: acc.ownerPhone || '138' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
  }
}

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

function computeMatchScores(acc: PaymentAccount, keyword: string): { matchScore: number; matchDegree: number } {
  if (!keyword.trim()) {
    return { matchScore: 100, matchDegree: 100 }
  }
  const householdScore = calculateMatchScore(acc.householdNo, keyword)
  const accountNumScore = calculateMatchScore(acc.accountNumber, keyword)
  const nameScore = calculateMatchScore(acc.accountName, keyword)
  const addressScore = calculateMatchScore(acc.address, keyword)
  const districtScore = calculateMatchScore(acc.district, keyword)

  const matchScore = Math.max(householdScore, accountNumScore, nameScore, addressScore, districtScore)
  const matchDegree = Math.min(98, Math.max(75, matchScore + Math.floor(Math.random() * 5)))

  return { matchScore, matchDegree }
}

router.get('/accounts', (req: Request, res: Response): void => {
  try {
    const { keyword, category, district } = req.query
    const keywordStr = keyword ? String(keyword).trim() : ''
    const categoryStr = category ? String(category).trim() : ''
    const districtStr = district ? String(district).trim() : ''

    let dbAccounts = listPaymentAccounts()

    let allAccounts: PaymentAccount[] = dbAccounts.map(enrichAccount)

    if (allAccounts.length === 0) {
      allAccounts = mockPaymentAccounts.map(enrichAccount)
    }

    if (keywordStr) {
      const kw = keywordStr.toLowerCase()
      allAccounts = allAccounts.filter(
        (acc) =>
          acc.householdNo.toLowerCase().includes(kw) ||
          acc.accountNumber.toLowerCase().includes(kw) ||
          acc.accountName.toLowerCase().includes(kw) ||
          acc.address.toLowerCase().includes(kw) ||
          acc.district.toLowerCase().includes(kw),
      )
    }

    if (categoryStr) {
      allAccounts = allAccounts.filter((acc) => acc.category === categoryStr)
    }

    if (districtStr) {
      allAccounts = allAccounts.filter((acc) => acc.district === districtStr)
    }

    const accountsWithMatch: PaymentAccountWithMatch[] = allAccounts.map((acc) => {
      const { matchScore, matchDegree } = computeMatchScores(acc, keywordStr)
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

router.get('/systems-status', (_req: Request, res: Response): void => {
  try {
    const districts = ['市南区', '市北区', '李沧区', '崂山区', '黄岛区', '城阳区']
    const categories = [
      { key: 'water', label: '水务' },
      { key: 'electric', label: '电力' },
      { key: 'gas', label: '燃气' },
      { key: 'heating', label: '供暖' },
      { key: 'broadband', label: '宽带' },
    ]

    const statusList = districts.flatMap((district) =>
      categories.map((cat) => ({
        district,
        category: cat.key,
        categoryLabel: cat.label,
        systemSource: generateSystemSource(district, cat.key),
        systemStatus: generateSystemStatus(),
      })),
    )

    res.json({
      success: true,
      data: statusList,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取缴费系统状态失败',
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

    const dbAccounts = listPaymentAccounts().map(enrichAccount)
    let account = dbAccounts.find((a) => a.id === accountId)

    if (!account) {
      account = mockPaymentAccounts.map(enrichAccount).find((a) => a.id === accountId)
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

function generateMockReceiptPdfBase64(): string {
  const pdfHeader = '%PDF-1.4\n'
  const pdfBody = `1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 100>>stream\nBT /F1 24 Tf 100 700 Td (Qingdao Payment Receipt) Tj ET\nendstream\nendobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000109 00000 n \n0000000211 00000 n \n0000000361 00000 n \ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n425\n%%EOF`
  return Buffer.from(pdfHeader + pdfBody).toString('base64')
}

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

    const isFailed = Math.random() < 0.3

    if (isFailed) {
      const failReasons = [
        { reason: '账户余额不足，请充值后重试', retryable: true },
        { reason: '网络连接超时，请稍后重试', retryable: true },
        { reason: '缴费系统维护中，暂不可用', retryable: false },
      ]
      const failInfo = failReasons[Math.floor(Math.random() * failReasons.length)]

      const record: PaymentRecord = {
        id,
        accountId,
        amount,
        status: 'failed',
        orderNo,
        createdAt,
        failReason: failInfo.reason,
      }

      insertPaymentRecord(record)

      res.json({
        success: true,
        data: {
          ...record,
          retryable: failInfo.retryable,
        },
      })
      return
    }

    const paidAt = new Date().toISOString()
    const receiptNo = `RCPT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const electronicReceipt = generateMockReceiptPdfBase64()

    const record: PaymentRecord = {
      id,
      accountId,
      amount,
      status: 'success',
      orderNo,
      paidAt,
      createdAt,
      receiptNo,
      electronicReceipt,
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
