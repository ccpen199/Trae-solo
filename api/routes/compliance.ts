import { Router, type Request, type Response } from 'express'
import { AdminService } from '../services/AdminService.js'
import { QualityCheckService } from '../services/QualityCheckService.js'
import { IndexService } from '../services/IndexService.js'
import type { ApiResponse, ComplianceReport } from '../../shared/types.js'

const router = Router()

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

function getComplianceLevel(qualityScore: number): string {
  if (qualityScore >= 90) return 'high'
  if (qualityScore >= 70) return 'medium'
  return 'low'
}

router.get('/status', (_req: Request, res: Response): void => {
  try {
    const dataSources = AdminService.getDataSources()
    const qualityRules = QualityCheckService.getQualityRules()
    const indexParams = IndexService.getAllIndexParameters()

    const dsCompliant = dataSources.filter(ds => ds.qualityScore >= 70).length
    const rulesCompliant = qualityRules.filter(r => r.enabled).length
    const allDsCompliant = dsCompliant === dataSources.length && dataSources.length > 0

    let complianceStatus: ComplianceReport['complianceStatus']
    if (allDsCompliant && rulesCompliant === qualityRules.length) {
      complianceStatus = 'compliant'
    } else if (dsCompliant > 0 || rulesCompliant > 0) {
      complianceStatus = 'partial'
    } else {
      complianceStatus = 'non_compliant'
    }

    const report: ComplianceReport = {
      serviceName: '气象数据平台',
      version: '1.0.0',
      dataSources: dataSources.map(ds => ({
        name: ds.name,
        status: ds.status,
        qualityScore: ds.qualityScore,
        complianceLevel: getComplianceLevel(ds.qualityScore),
      })),
      qualityRules: qualityRules.map(r => ({
        id: r.id,
        name: r.name,
        enabled: r.enabled,
        passRate: r.enabled ? 95 : 0,
      })),
      indices: indexParams.map(idx => ({
        type: idx.indexType,
        name: idx.indexName,
        version: idx.version,
        lastUpdate: idx.updateTime,
      })),
      lastCheckTime: new Date().toISOString(),
      complianceStatus,
    }

    res.json(successResponse<ComplianceReport>(report))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

export default router
