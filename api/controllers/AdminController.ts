import type { Response } from 'express'
import warningService from '../services/WarningService.js'
import auditService from '../services/AuditService.js'
import dataShareService from '../services/DataShareService.js'
import type { RequestWithUser } from '../types/index.js'

class AdminController {
  stats(req: RequestWithUser, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const warningResult = warningService.getWarningList({ page: 1, pageSize: 5 })
      const auditResult = auditService.getAuditRules({ page: 1, pageSize: 5 })

      res.status(200).json({
        success: true,
        data: {
          warningTotal: warningResult.total,
          pendingWarnings: warningResult.stats.pending,
          processingWarnings: warningResult.stats.processing,
          resolvedWarnings: warningResult.stats.resolved,
          auditRuleTotal: auditResult.total,
          enabledAuditRules: auditResult.items.filter((item) => item.enabled).length,
          dataShareDepartments: 3,
          lastUpdated: new Date().toISOString(),
        },
        message: '获取后台统计成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取后台统计失败',
      })
    }
  }

  dashboard(req: RequestWithUser, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const warningResult = warningService.getWarningList({ page: 1, pageSize: 5 })
      const auditResult = auditService.getAuditRules({ page: 1, pageSize: 5 })

      res.status(200).json({
        success: true,
        data: {
          stats: {
            warningTotal: warningResult.total,
            pendingWarnings: warningResult.stats.pending,
            auditRuleTotal: auditResult.total,
            enabledAuditRules: auditResult.items.filter((item) => item.enabled).length,
          },
          warnings: warningResult.items,
          auditRules: auditResult.items,
          shortcuts: [
            { title: '异常预警', path: '/admin/warning' },
            { title: '稽核规则', path: '/admin/audit' },
            { title: '数据共享', path: '/admin/datashare' },
          ],
        },
        message: '获取后台看板成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取后台看板失败',
      })
    }
  }

  listWarnings(req: RequestWithUser, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 10

      const result = warningService.getWarningList({ page, pageSize })

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: {
          list: result.items,
          items: result.items,
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
        message: '获取预警列表成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取预警列表失败',
      })
    }
  }

  handleWarning(req: RequestWithUser, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const warningId = parseInt(req.params.id)
      const { handleNote, status } = req.body

      if (isNaN(warningId)) {
        res.status(400).json({
          success: false,
          error: '预警ID无效',
        })
        return
      }

      if (!handleNote) {
        res.status(400).json({
          success: false,
          error: '处理备注不能为空',
        })
        return
      }

      const result = warningService.handleWarning(warningId, req.user.id, {
        handleNote,
        status,
      })

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: {
          id: result.id,
          status: result.status,
          handledAt: result.handledAt,
        },
        message: '预警处理成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '预警处理失败',
      })
    }
  }

  listAuditRules(req: RequestWithUser, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 10

      const result = auditService.getAuditRules({ page, pageSize })

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: {
          list: result.items,
          items: result.items,
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
        message: '获取稽核规则列表成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取稽核规则列表失败',
      })
    }
  }

  createAuditRule(req: RequestWithUser, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const { ruleName, ruleCode, ruleCondition, riskLevel, threshold, enabled } = req.body

      if (!ruleName || !ruleCode || !ruleCondition || !riskLevel) {
        res.status(400).json({
          success: false,
          error: '缺少必要参数',
        })
        return
      }

      const result = auditService.createAuditRule({
        ruleName,
        ruleCode,
        ruleCondition,
        riskLevel,
        threshold,
        enabled,
      })

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: {
          rule: result.rule,
        },
        message: result.message,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '创建稽核规则失败',
      })
    }
  }

  updateAuditRule(req: RequestWithUser, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const ruleId = parseInt(req.params.id)
      const { ruleName, ruleCondition, riskLevel, threshold, enabled } = req.body

      if (isNaN(ruleId)) {
        res.status(400).json({
          success: false,
          error: '规则ID无效',
        })
        return
      }

      const result = auditService.updateAuditRule(ruleId, {
        ruleName,
        ruleCondition,
        riskLevel,
        threshold,
        enabled,
      })

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: {
          rule: result.rule,
        },
        message: result.message,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '更新稽核规则失败',
      })
    }
  }

  async datashareCompare(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const result = await dataShareService.compareWithExternalData()

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        })
        return
      }

      const [publicSecurity, civilAffairs, health] = result.comparisons
      const abnormalRecords = result.comparisons.flatMap((comparison, comparisonIndex) =>
        comparison.mismatches.map((item, index) => ({
          id: comparisonIndex * 100 + index + 1,
          userName: item.name,
          idCard: item.idCard,
          department: comparison.target.replace('部门', ''),
          issue: `${item.field} 信息比对不一致`,
          status: '待处理',
        })),
      )

      res.status(200).json({
        success: true,
        data: {
          publicSecurity: {
            totalRecords: publicSecurity?.totalCount || result.overall.totalRecords,
            matchedRecords: publicSecurity?.matchCount || result.overall.matchedRecords,
            unmatchedRecords: publicSecurity?.mismatchCount || result.overall.mismatchRecords,
            matchRate: publicSecurity?.matchRate || result.overall.overallMatchRate,
          },
          health: {
            totalRecords: health?.totalCount || result.overall.totalRecords,
            matchedRecords: health?.matchCount || result.overall.matchedRecords,
            unmatchedRecords: health?.mismatchCount || result.overall.mismatchRecords,
            matchRate: health?.matchRate || result.overall.overallMatchRate,
          },
          civilAffairs: {
            totalRecords: civilAffairs?.totalCount || result.overall.totalRecords,
            matchedRecords: civilAffairs?.matchCount || result.overall.matchedRecords,
            unmatchedRecords: civilAffairs?.mismatchCount || result.overall.mismatchRecords,
            matchRate: civilAffairs?.matchRate || result.overall.overallMatchRate,
          },
          abnormalRecords,
          compareProgress: 100,
          lastCompareTime: result.lastUpdated,
        },
        message: '跨部门数据比对完成',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '跨部门数据比对失败',
      })
    }
  }
}

const adminController = new AdminController()

export default adminController
export { AdminController }
