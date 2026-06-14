import { Router, type Request, type Response } from 'express'
import PDFDocument from 'pdfkit'
import { mockSocialSecurity } from '../data/mock.js'
import type { SocialSecurityAccount } from '../../shared/types.js'

const router = Router()

router.get('/:idCard', (req: Request, res: Response): void => {
  try {
    const { idCard } = req.params

    if (mockSocialSecurity.idCard !== idCard) {
      res.status(404).json({
        success: false,
        error: '未找到社保公积金账户信息',
      })
      return
    }

    res.json({
      success: true,
      data: mockSocialSecurity as SocialSecurityAccount,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取社保公积金信息失败',
    })
  }
})

router.get('/:idCard/history', (req: Request, res: Response): void => {
  try {
    const { idCard } = req.params

    if (mockSocialSecurity.idCard !== idCard) {
      res.status(404).json({
        success: false,
        error: '未找到社保公积金账户信息',
      })
      return
    }

    res.json({
      success: true,
      data: mockSocialSecurity.contributionHistory,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取历史明细失败',
    })
  }
})

router.post('/:idCard/certificate', (req: Request, res: Response): void => {
  try {
    const { idCard } = req.params

    if (mockSocialSecurity.idCard !== idCard) {
      res.status(404).json({
        success: false,
        error: '未找到社保公积金账户信息',
      })
      return
    }

    const chunks: Buffer[] = []
    const doc = new PDFDocument()

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks)
      const base64 = pdfBuffer.toString('base64')
      res.json({
        success: true,
        data: {
          base64,
          filename: `社保公积金凭证_${mockSocialSecurity.name}_${Date.now()}.pdf`,
        },
      })
    })

    doc.fontSize(20).text('青岛市社保公积金电子凭证', { align: 'center' })
    doc.moveDown(2)
    doc.fontSize(14).text(`姓名：${mockSocialSecurity.name}`)
    doc.text(`身份证号：${mockSocialSecurity.idCard}`)
    doc.text(`缴存单位：${mockSocialSecurity.housingFund.unit}`)
    doc.moveDown(1)
    doc.fontSize(16).text('一、公积金信息')
    doc.fontSize(12).text(`账户余额：¥${mockSocialSecurity.housingFund.balance.toFixed(2)}`)
    doc.text(`月缴存额：¥${mockSocialSecurity.housingFund.monthlyContribution}`)
    doc.text(`上次缴存日期：${mockSocialSecurity.housingFund.lastDepositDate}`)
    doc.text(`账户状态：${mockSocialSecurity.housingFund.status === 'normal' ? '正常' : '停缴'}`)
    doc.moveDown(1)
    doc.fontSize(16).text('二、社会保险信息')
    doc.fontSize(12).text(`养老保险：累计${mockSocialSecurity.socialInsurance.pension.months}个月，状态：${mockSocialSecurity.socialInsurance.pension.status}`)
    doc.text(`医疗保险：累计${mockSocialSecurity.socialInsurance.medical.months}个月，状态：${mockSocialSecurity.socialInsurance.medical.status}`)
    doc.text(`失业保险：累计${mockSocialSecurity.socialInsurance.unemployment.months}个月，状态：${mockSocialSecurity.socialInsurance.unemployment.status}`)
    doc.text(`工伤保险：累计${mockSocialSecurity.socialInsurance.workInjury.months}个月，状态：${mockSocialSecurity.socialInsurance.workInjury.status}`)
    doc.text(`生育保险：累计${mockSocialSecurity.socialInsurance.maternity.months}个月，状态：${mockSocialSecurity.socialInsurance.maternity.status}`)
    doc.moveDown(2)
    doc.fontSize(10).text(`生成时间：${new Date().toLocaleString('zh-CN')}`, { align: 'right' })
    doc.text('本凭证由青岛市民服务平台自动生成，具有同等法律效力。', { align: 'right' })

    doc.end()
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '生成电子凭证失败',
    })
  }
})

export default router
