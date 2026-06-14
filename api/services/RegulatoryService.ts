import { v4 as uuidv4 } from 'uuid'
import type { RegulatoryReport, Deal, ApiResponse } from '../../shared/types.js'

export class RegulatoryService {
  private reports: RegulatoryReport[] = []

  async submitDealToRegulatory(
    deal: Deal
  ): Promise<ApiResponse<RegulatoryReport>> {
    try {
      const existingReport = this.reports.find(r => r.dealId === deal.id)

      if (existingReport && existingReport.status === 'success') {
        return {
          success: false,
          error: '该成交记录已上报'
        }
      }

      const reportId = `REG-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      const mockSubmission = this.simulateGovernmentSubmission(deal, reportId)

      const report: RegulatoryReport = {
        id: uuidv4(),
        dealId: deal.id,
        reportId,
        reportTime: new Date().toISOString(),
        status: mockSubmission.success ? 'success' : 'failed',
        governmentResponse: mockSubmission.response,
        createdAt: new Date().toISOString()
      }

      this.reports.push(report)

      if (mockSubmission.success) {
        deal.status = 'reported'
      }

      return {
        success: mockSubmission.success,
        data: report,
        message: mockSubmission.response
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '上报住建局失败'
      }
    }
  }

  async batchSubmitDeals(
    deals: Deal[]
  ): Promise<ApiResponse<{ success: RegulatoryReport[]; failed: RegulatoryReport[] }>> {
    try {
      const successReports: RegulatoryReport[] = []
      const failedReports: RegulatoryReport[] = []

      for (const deal of deals) {
        const result = await this.submitDealToRegulatory(deal)

        if (result.success && result.data) {
          successReports.push(result.data)
        } else if (result.data) {
          failedReports.push(result.data)
        }
      }

      return {
        success: true,
        data: {
          success: successReports,
          failed: failedReports
        },
        message: `成功上报 ${successReports.length} 条，失败 ${failedReports.length} 条`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '批量上报失败'
      }
    }
  }

  async getReportStatus(
    reportId: string
  ): Promise<ApiResponse<RegulatoryReport>> {
    try {
      const report = this.reports.find(r => r.reportId === reportId)

      if (!report) {
        return {
          success: false,
          error: '上报记录不存在'
        }
      }

      return {
        success: true,
        data: report
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '查询上报状态失败'
      }
    }
  }

  async getDealReports(
    dealId: string
  ): Promise<ApiResponse<RegulatoryReport[]>> {
    try {
      const reports = this.reports.filter(r => r.dealId === dealId)

      return {
        success: true,
        data: reports
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取成交上报记录失败'
      }
    }
  }

  async getAgentReports(
    agentId: string,
    deals: Deal[]
  ): Promise<ApiResponse<RegulatoryReport[]>> {
    try {
      const agentDealIds = deals.filter(d => d.agentId === agentId).map(d => d.id)
      const reports = this.reports.filter(r => agentDealIds.includes(r.dealId))

      return {
        success: true,
        data: reports
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取经纪人上报记录失败'
      }
    }
  }

  async getRegulatoryStatistics(): Promise<ApiResponse<{
    totalReported: number
    successCount: number
    failedCount: number
    pendingCount: number
    successRate: number
  }>> {
    try {
      const totalReported = this.reports.length
      const successCount = this.reports.filter(r => r.status === 'success').length
      const failedCount = this.reports.filter(r => r.status === 'failed').length
      const pendingCount = this.reports.filter(r => r.status === 'pending').length
      const successRate = totalReported > 0 ? successCount / totalReported : 0

      return {
        success: true,
        data: {
          totalReported,
          successCount,
          failedCount,
          pendingCount,
          successRate: Math.round(successRate * 10000) / 100
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取监管统计失败'
      }
    }
  }

  private simulateGovernmentSubmission(
    deal: Deal,
    reportId: string
  ): { success: boolean; response: string } {
    if (!deal.propertyId || !deal.clientId || deal.dealPrice <= 0) {
      return {
        success: false,
        response: `上报失败：成交数据不完整，请检查房源、客户及成交价信息。上报单号：${reportId}`
      }
    }

    if (deal.dealPrice > 100000000) {
      return {
        success: false,
        response: `上报失败：成交价格异常，请核实后重新上报。上报单号：${reportId}`
      }
    }

    const success = Math.random() > 0.1

    if (success) {
      return {
        success: true,
        response: `住建局已受理，上报成功。上报单号：${reportId}，请妥善保存。受理时间：${new Date().toLocaleString()}`
      }
    } else {
      return {
        success: false,
        response: `上报失败：住建局系统繁忙，请稍后重试。上报单号：${reportId}`
      }
    }
  }

  async resubmitFailedReport(
    reportId: string,
    deal: Deal
  ): Promise<ApiResponse<RegulatoryReport>> {
    try {
      const existingReport = this.reports.find(r => r.reportId === reportId)

      if (!existingReport) {
        return {
          success: false,
          error: '上报记录不存在'
        }
      }

      if (existingReport.status === 'success') {
        return {
          success: false,
          error: '该记录已上报成功，无需重新上报'
        }
      }

      return this.submitDealToRegulatory(deal)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '重新上报失败'
      }
    }
  }

  getReports(): RegulatoryReport[] {
    return [...this.reports]
  }
}

export const regulatoryService = new RegulatoryService()
