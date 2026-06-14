import { Router, type Request, type Response } from 'express'
import type {
  MortgageParams,
  MortgageResult,
  TaxParams,
  TaxResult,
  Property,
  ApiResponse
} from '../../shared/types.js'
import { calculatorService } from '../services/CalculatorService.js'
import { propertyService } from '../services/PropertyService.js'

const router = Router()

router.post('/mortgage', async (req: Request, res: Response): Promise<void> => {
  try {
    const params: MortgageParams = req.body

    if (!params.totalPrice || !params.downPaymentRatio || !params.loanYears || !params.interestRate) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数：总价、首付比例、贷款年限、利率'
      })
      return
    }

    if (params.downPaymentRatio < 0 || params.downPaymentRatio > 1) {
      res.status(400).json({
        success: false,
        error: '首付比例必须在 0 到 1 之间'
      })
      return
    }

    const result = await calculatorService.calculateMortgage(params)

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(200).json(result as ApiResponse<MortgageResult>)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '房贷计算失败'
    })
  }
})

router.post('/tax', async (req: Request, res: Response): Promise<void> => {
  try {
    const params: TaxParams = req.body

    if (!params.propertyType || !params.totalPrice || !params.area) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数：房源类型、总价、面积'
      })
      return
    }

    const result = await calculatorService.calculateTax(params)

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(200).json(result as ApiResponse<TaxResult>)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '税费计算失败'
    })
  }
})

router.get('/compare', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.query

    if (!ids) {
      res.status(400).json({
        success: false,
        error: '请提供要对比的房源ID列表'
      })
      return
    }

    const idList = (ids as string).split(',')

    if (idList.length < 2) {
      res.status(400).json({
        success: false,
        error: '至少需要选择2个房源进行对比'
      })
      return
    }

    if (idList.length > 5) {
      res.status(400).json({
        success: false,
        error: '最多只能对比5个房源'
      })
      return
    }

    const properties: Property[] = []
    const notFoundIds: string[] = []

    for (const id of idList) {
      const result = await propertyService.getPropertyDetail(id)
      if (result.success && result.data) {
        properties.push(result.data)
      } else {
        notFoundIds.push(id)
      }
    }

    if (notFoundIds.length > 0) {
      res.status(404).json({
        success: false,
        error: `以下房源不存在: ${notFoundIds.join(', ')}`
      })
      return
    }

    const comparison = {
      properties,
      compareFields: [
        { key: 'price', label: '总价', unit: '万' },
        { key: 'unitPrice', label: '单价', unit: '元/㎡' },
        { key: 'area', label: '面积', unit: '㎡' },
        { key: 'rooms', label: '居室', unit: '室' },
        { key: 'halls', label: '厅', unit: '厅' },
        { key: 'bathrooms', label: '卫', unit: '卫' },
        { key: 'floor', label: '楼层', unit: '' },
        { key: 'orientation', label: '朝向', unit: '' },
        { key: 'decoration', label: '装修', unit: '' },
        { key: 'buildYear', label: '建成年代', unit: '年' },
        { key: 'district', label: '区域', unit: '' },
        { key: 'verification.ownerVerified', label: '业主核验', unit: '' },
        { key: 'verification.antiFraudPassed', label: '反诈通过', unit: '' }
      ]
    }

    res.status(200).json({
      success: true,
      data: comparison
    } as ApiResponse<typeof comparison>)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '楼盘对比失败'
    })
  }
})

export default router
