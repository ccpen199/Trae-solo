import { v4 as uuidv4 } from 'uuid'
import type { ViewingRecord, Client, Deal, ApiResponse } from '../../shared/types.js'

export class AgentService {
  private viewingRecords: ViewingRecord[] = []
  private clients: Client[] = []
  private deals: Deal[] = []

  async createViewingRecord(
    record: Omit<ViewingRecord, 'id' | 'createdAt'>
  ): Promise<ApiResponse<ViewingRecord>> {
    try {
      const newRecord: ViewingRecord = {
        ...record,
        id: uuidv4(),
        createdAt: new Date().toISOString()
      }

      this.viewingRecords.push(newRecord)

      return {
        success: true,
        data: newRecord
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建带看记录失败'
      }
    }
  }

  async getAgentViewingRecords(
    agentId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<{ list: ViewingRecord[]; total: number }>> {
    try {
      const filtered = this.viewingRecords
        .filter(r => r.agentId === agentId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const start = (page - 1) * pageSize
      const end = start + pageSize
      const list = filtered.slice(start, end)

      return {
        success: true,
        data: {
          list,
          total: filtered.length
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取带看记录失败'
      }
    }
  }

  async updateViewingFeedback(
    recordId: string,
    feedback: string,
    interestLevel: ViewingRecord['interestLevel']
  ): Promise<ApiResponse<ViewingRecord>> {
    try {
      const record = this.viewingRecords.find(r => r.id === recordId)

      if (!record) {
        return {
          success: false,
          error: '带看记录不存在'
        }
      }

      record.feedback = feedback
      record.interestLevel = interestLevel

      return {
        success: true,
        data: record
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新带看反馈失败'
      }
    }
  }

  async addClient(
    client: Omit<Client, 'id' | 'createdAt'>
  ): Promise<ApiResponse<Client>> {
    try {
      const existingClient = this.clients.find(
        c => c.phone === client.phone && c.agentId === client.agentId
      )

      if (existingClient) {
        return {
          success: false,
          error: '该客户已存在'
        }
      }

      const newClient: Client = {
        ...client,
        id: uuidv4(),
        createdAt: new Date().toISOString()
      }

      this.clients.push(newClient)

      return {
        success: true,
        data: newClient
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '添加客户失败'
      }
    }
  }

  async getAgentClients(
    agentId: string,
    level?: Client['level']
  ): Promise<ApiResponse<Client[]>> {
    try {
      let filtered = this.clients.filter(c => c.agentId === agentId)

      if (level) {
        filtered = filtered.filter(c => c.level === level)
      }

      filtered.sort((a, b) => {
        const levelOrder: Record<Client['level'], number> = { A: 0, B: 1, C: 2 }
        return levelOrder[a.level] - levelOrder[b.level]
      })

      return {
        success: true,
        data: filtered
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取客户列表失败'
      }
    }
  }

  async updateClient(
    clientId: string,
    updates: Partial<Omit<Client, 'id' | 'agentId' | 'createdAt'>>
  ): Promise<ApiResponse<Client>> {
    try {
      const clientIndex = this.clients.findIndex(c => c.id === clientId)

      if (clientIndex === -1) {
        return {
          success: false,
          error: '客户不存在'
        }
      }

      this.clients[clientIndex] = {
        ...this.clients[clientIndex],
        ...updates
      }

      return {
        success: true,
        data: this.clients[clientIndex]
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新客户信息失败'
      }
    }
  }

  async createDeal(
    deal: Omit<Deal, 'id' | 'status' | 'createdAt'>
  ): Promise<ApiResponse<Deal>> {
    try {
      const newDeal: Deal = {
        ...deal,
        id: uuidv4(),
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      this.deals.push(newDeal)

      return {
        success: true,
        data: newDeal
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建成交登记失败'
      }
    }
  }

  async getAgentDeals(
    agentId: string,
    status?: Deal['status']
  ): Promise<ApiResponse<Deal[]>> {
    try {
      let filtered = this.deals.filter(d => d.agentId === agentId)

      if (status) {
        filtered = filtered.filter(d => d.status === status)
      }

      filtered.sort((a, b) => new Date(b.dealDate).getTime() - new Date(a.dealDate).getTime())

      return {
        success: true,
        data: filtered
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取成交记录失败'
      }
    }
  }

  async updateDealStatus(
    dealId: string,
    status: Deal['status']
  ): Promise<ApiResponse<Deal>> {
    try {
      const deal = this.deals.find(d => d.id === dealId)

      if (!deal) {
        return {
          success: false,
          error: '成交记录不存在'
        }
      }

      deal.status = status

      return {
        success: true,
        data: deal
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新成交状态失败'
      }
    }
  }

  async getAgentStatistics(
    agentId: string
  ): Promise<ApiResponse<{
    totalViewings: number
    totalClients: number
    totalDeals: number
    totalCommission: number
    pendingDeals: number
    levelAClients: number
  }>> {
    try {
      const viewings = this.viewingRecords.filter(r => r.agentId === agentId)
      const clients = this.clients.filter(c => c.agentId === agentId)
      const deals = this.deals.filter(d => d.agentId === agentId)

      const totalCommission = deals
        .filter(d => d.status === 'completed' || d.status === 'reported')
        .reduce((sum, d) => sum + d.commission, 0)

      const pendingDeals = deals.filter(d => d.status === 'pending').length
      const levelAClients = clients.filter(c => c.level === 'A').length

      return {
        success: true,
        data: {
          totalViewings: viewings.length,
          totalClients: clients.length,
          totalDeals: deals.length,
          totalCommission: Math.round(totalCommission * 100) / 100,
          pendingDeals,
          levelAClients
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取经纪人统计失败'
      }
    }
  }

  getViewingRecords(): ViewingRecord[] {
    return [...this.viewingRecords]
  }

  getClients(): Client[] {
    return [...this.clients]
  }

  getDeals(): Deal[] {
    return [...this.deals]
  }
}

export const agentService = new AgentService()
