import { Router, type Request, type Response } from 'express'
import { AdminService } from '../services/AdminService.js'
import { QualityCheckService } from '../services/QualityCheckService.js'
import { CircuitBreakerService } from '../services/CircuitBreakerService.js'
import { IndexService } from '../services/IndexService.js'
import { AuditService } from '../services/AuditService.js'
import type {
  ApiResponse,
  DataSource,
  QualityRule,
  CircuitBreakLog,
  IndexParameter,
  ApiCallStats,
  ApiKey,
  AuditLog,
} from '../../shared/types.js'

const router = Router()

function getOperator(req: Request): string {
  return (req.headers['x-operator'] as string) || 'admin';
}

function successResponse<T>(data: T, message = 'success'): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
    timestamp: new Date().toISOString(),
  }
}

function errorResponse(code: number, message: string): ApiResponse<null> {
  return {
    code,
    message,
    data: null,
    timestamp: new Date().toISOString(),
  }
}

router.get('/data-sources', (_req: Request, res: Response): void => {
  try {
    const data = AdminService.getDataSources()
    res.json(successResponse<DataSource[]>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.put('/data-sources/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const data = AdminService.updateDataSource(id, req.body)
    if (!data) {
      res.status(404).json(errorResponse(404, 'Data source not found'))
      return
    }
    AuditService.logAction(getOperator(req), 'updateDataSource', 'data_source', id, JSON.stringify(req.body), req.ip)
    res.json(successResponse<DataSource>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.get('/quality-rules', (_req: Request, res: Response): void => {
  try {
    const data = QualityCheckService.getQualityRules()
    res.json(successResponse<QualityRule[]>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.put('/quality-rules/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const data = QualityCheckService.updateQualityRule({ id, ...req.body })
    AuditService.logAction(getOperator(req), 'updateQualityRule', 'quality_rule', id, JSON.stringify(req.body), req.ip)
    res.json(successResponse<QualityRule>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.get('/circuit-breaker', (_req: Request, res: Response): void => {
  try {
    const data = AdminService.getDataSources()
    res.json(successResponse<DataSource[]>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.post('/circuit-breaker/:id/break', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { reason } = req.body
    CircuitBreakerService.manualBreak(id, reason || '手动熔断')
    AuditService.logAction(getOperator(req), 'manualBreak', 'data_source', id, reason || '手动熔断', req.ip)
    const data = AdminService.getDataSourceById(id)
    res.json(successResponse(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.post('/circuit-breaker/:id/restore', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    CircuitBreakerService.manualRestore(id)
    AuditService.logAction(getOperator(req), 'manualRestore', 'data_source', id, undefined, req.ip)
    const data = AdminService.getDataSourceById(id)
    res.json(successResponse(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.get('/circuit-breaker/logs', (req: Request, res: Response): void => {
  try {
    const { sourceId } = req.query
    const data = CircuitBreakerService.getCircuitBreakLogs(sourceId as string | undefined)
    res.json(successResponse<CircuitBreakLog[]>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.get('/index-params', (_req: Request, res: Response): void => {
  try {
    const data = IndexService.getAllIndexParameters()
    res.json(successResponse<IndexParameter[]>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.get('/index-params/:type', (req: Request, res: Response): void => {
  try {
    const { type } = req.params
    const data = IndexService.getIndexParameters(type)
    if (!data) {
      res.status(404).json(errorResponse(404, 'Index parameter not found'))
      return
    }
    res.json(successResponse<IndexParameter>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.put('/index-params/:type', (req: Request, res: Response): void => {
  try {
    const { type } = req.params
    const data = IndexService.updateIndexParameter(type, req.body.parameters)
    if (!data) {
      res.status(404).json(errorResponse(404, 'Index parameter not found'))
      return
    }
    AuditService.logAction(getOperator(req), 'updateIndexParam', 'index_parameter', type, JSON.stringify(req.body.parameters), req.ip)
    res.json(successResponse<IndexParameter>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.get('/api-stats', (_req: Request, res: Response): void => {
  try {
    const data = AdminService.getApiStats()
    res.json(successResponse<ApiCallStats>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.get('/api-keys', (_req: Request, res: Response): void => {
  try {
    const data = AdminService.getApiKeys()
    res.json(successResponse<ApiKey[]>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.post('/api-keys', (req: Request, res: Response): void => {
  try {
    const { keyName, rateLimit, expiresDays } = req.body
    const data = AdminService.createApiKey(keyName || '新密钥', rateLimit || 1000, expiresDays || 365)
    AuditService.logAction(getOperator(req), 'createApiKey', 'api_key', data.id, `keyName=${keyName || '新密钥'}`, req.ip)
    res.json(successResponse<ApiKey>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.put('/api-keys/:id/status', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { status } = req.body
    const data = AdminService.updateApiKeyStatus(id, status)
    if (!data) {
      res.status(404).json(errorResponse(404, 'API key not found'))
      return
    }
    AuditService.logAction(getOperator(req), 'updateApiKeyStatus', 'api_key', id, `status=${status}`, req.ip)
    res.json(successResponse<ApiKey>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.get('/audit-logs', (req: Request, res: Response): void => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0
    const result = AuditService.getAuditLogs(limit, offset)
    res.json(successResponse<{ logs: AuditLog[]; total: number }>(result))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

export default router
