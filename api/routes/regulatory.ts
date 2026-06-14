import { Router, type Request, type Response } from 'express'
import type { Deal, RegulatoryReport, ApiResponse } from '../../shared/types.js'
import { regulatoryService } from '../services/RegulatoryService.js'
import { agentService } from '../services/AgentService.js'

const router = Router()

router.post('/report', async (req: Request, res: Response): Promise<void> => {
  try {
    const { dealId } = req.body

    if (!dealId) {
      res.status(400).json({
        success: false,
        error: '缺少 dealId 参数'
      })
      return
    }

    const allDeals = agentService.getDeals()
    const deal = allDeals.find(d => d.id === dealId)

    if (!deal) {
      res.status(404).json({
        success: false,
        error: '成交记录不存在'
      })
      return
    }

    const result = await regulatoryService.submitDealToRegulatory(deal)

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(200).json(result as ApiResponse<RegulatoryReport>)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '上报成交数据失败'
    })
  }
})

router.get('/status/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const result = await regulatoryService.getReportStatus(id)

    if (!result.success) {
      res.status(404).json(result)
      return
    }

    res.status(200).json(result as ApiResponse<RegulatoryReport>)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '查询上报状态失败'
    })
  }
})

router.post('/batch', async (req: Request, res: Response): Promise<void> => {
  try {
    const { dealIds } = req.body

    if (!dealIds || !Array.isArray(dealIds) || dealIds.length === 0) {
      res.status(400).json({
        success: false,
        error: '缺少 dealIds 参数（非空数组）'
      })
      return
    }

    const allDeals = agentService.getDeals()
    const deals: Deal[] = []
    const notFoundIds: string[] = []

    for (const dealId of dealIds) {
      const deal = allDeals.find(d => d.id === dealId)
      if (deal) {
        deals.push(deal)
      } else {
        notFoundIds.push(dealId)
      }
    }

    if (notFoundIds.length > 0) {
      res.status(404).json({
        success: false,
        error: `以下成交记录不存在: ${notFoundIds.join(', ')}`
      })
      return
    }

    const result = await regulatoryService.batchSubmitDeals(deals)

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '批量上报失败'
    })
  }
})

export default router
