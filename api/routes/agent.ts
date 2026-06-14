import { Router, type Request, type Response } from 'express'
import type {
  ViewingRecord,
  Client,
  Deal,
  ApiResponse
} from '../../shared/types.js'
import { agentService } from '../services/AgentService.js'

const router = Router()

router.get('/viewings', async (req: Request, res: Response): Promise<void> => {
  try {
    const { agentId } = req.query
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20

    if (!agentId) {
      res.status(400).json({
        success: false,
        error: '缺少 agentId 参数'
      })
      return
    }

    const result = await agentService.getAgentViewingRecords(agentId as string, page, pageSize)

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取带看记录失败'
    })
  }
})

router.post('/viewings', async (req: Request, res: Response): Promise<void> => {
  try {
    const recordData = req.body as Omit<ViewingRecord, 'id' | 'createdAt'>

    if (!recordData.propertyId || !recordData.clientId || !recordData.agentId || !recordData.date || !recordData.timeSlot) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数：propertyId, clientId, agentId, date, timeSlot'
      })
      return
    }

    const result = await agentService.createViewingRecord(recordData)

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(201).json(result as ApiResponse<ViewingRecord>)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '新增带看失败'
    })
  }
})

router.get('/clients', async (req: Request, res: Response): Promise<void> => {
  try {
    const { agentId, level } = req.query

    if (!agentId) {
      res.status(400).json({
        success: false,
        error: '缺少 agentId 参数'
      })
      return
    }

    const result = await agentService.getAgentClients(
      agentId as string,
      level as Client['level'] | undefined
    )

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(200).json(result as ApiResponse<Client[]>)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取客户列表失败'
    })
  }
})

router.post('/clients', async (req: Request, res: Response): Promise<void> => {
  try {
    const clientData = req.body as Omit<Client, 'id' | 'createdAt'>

    if (!clientData.name || !clientData.phone || !clientData.agentId) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数：name, phone, agentId'
      })
      return
    }

    const result = await agentService.addClient(clientData)

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(201).json(result as ApiResponse<Client>)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '新增客户失败'
    })
  }
})

router.get('/deals', async (req: Request, res: Response): Promise<void> => {
  try {
    const { agentId, status } = req.query

    if (!agentId) {
      res.status(400).json({
        success: false,
        error: '缺少 agentId 参数'
      })
      return
    }

    const result = await agentService.getAgentDeals(
      agentId as string,
      status as Deal['status'] | undefined
    )

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(200).json(result as ApiResponse<Deal[]>)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取成交记录失败'
    })
  }
})

router.post('/deals', async (req: Request, res: Response): Promise<void> => {
  try {
    const dealData = req.body as Omit<Deal, 'id' | 'status' | 'createdAt'>

    if (!dealData.propertyId || !dealData.clientId || !dealData.agentId || !dealData.dealPrice || !dealData.dealDate) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数：propertyId, clientId, agentId, dealPrice, dealDate'
      })
      return
    }

    const result = await agentService.createDeal(dealData)

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(201).json(result as ApiResponse<Deal>)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '成交登记失败'
    })
  }
})

router.get('/statistics', async (req: Request, res: Response): Promise<void> => {
  try {
    const { agentId } = req.query

    if (!agentId) {
      res.status(400).json({
        success: false,
        error: '缺少 agentId 参数'
      })
      return
    }

    const result = await agentService.getAgentStatistics(agentId as string)

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取经纪人统计失败'
    })
  }
})

export default router
