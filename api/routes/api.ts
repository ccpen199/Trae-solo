import { Router, type Request, type Response } from 'express'
import type { ApiResponse } from '../../shared/types/index.js'
import { v4 as uuidv4 } from 'uuid'

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  createdAt: string
  lastUsed?: string
  isActive: boolean
}

const mockApiKeys: ApiKey[] = [
  {
    id: uuidv4(),
    name: '生产环境密钥',
    key: 'sk_live_' + uuidv4().replace(/-/g, '').slice(0, 32),
    permissions: ['orders:read', 'orders:write', 'riders:read', 'pricing:read'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isActive: true,
  },
  {
    id: uuidv4(),
    name: '测试环境密钥',
    key: 'sk_test_' + uuidv4().replace(/-/g, '').slice(0, 32),
    permissions: ['orders:read', 'riders:read'],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
  },
]

const router = Router()

router.get('/keys', async (req: Request, res: Response): Promise<void> => {
  try {
    const response: ApiResponse = {
      success: true,
      data: mockApiKeys,
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch API keys',
    })
  }
})

router.post('/webhook/test', async (req: Request, res: Response): Promise<void> => {
  try {
    const { url, eventType, payload } = req.body as {
      url?: string
      eventType?: string
      payload?: Record<string, unknown>
    }

    const testEvent = eventType ?? 'order:status'
    const testPayload = payload ?? {
      orderId: uuidv4(),
      status: 'delivered',
      timestamp: new Date().toISOString(),
    }

    const webhookResult = {
      id: uuidv4(),
      event: testEvent,
      payload: testPayload,
      targetUrl: url ?? 'https://example.com/webhook',
      status: 'success',
      statusCode: 200,
      responseTime: Math.round(Math.random() * 200 + 50),
      sentAt: new Date().toISOString(),
    }

    const response: ApiResponse = {
      success: true,
      data: webhookResult,
      message: 'Webhook test sent successfully',
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test webhook',
    })
  }
})

export default router
