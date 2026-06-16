import { v4 as uuidv4 } from 'uuid';
import { 
  mockTickets, 
  mockTicketLogs, 
  generateVitalSigns, 
  mockDispatchRules, 
  mockDepartmentStats, 
  mockDepartmentReceipts,
  generateTransportationData,
  generateMedicalData,
  generateUtilitiesData,
  generateGovernmentData,
} from '../data/mockData';
import type { 
  ComplaintTicket, 
  TicketCategory, 
  TicketPriority, 
  TicketLog, 
  DispatchRule, 
  DispatchRuleType, 
  TicketPriority as TPriority, 
  DepartmentStats, 
  DepartmentReceipt,
  TransportationDashboardData,
  MedicalDashboardData,
  UtilitiesDashboardData,
  GovernmentDashboardData,
} from '../../shared/types';
import { TICKET_CATEGORY_MAP } from '../../shared/types';

export interface ComplaintRequest {
  userId: string;
  title: string;
  content: string;
  category: TicketCategory;
  subCategory?: string;
  images?: string[];
  location?: string;
}

export interface NlpClassificationResult {
  category: TicketCategory;
  subCategory: string;
  department: string;
  priority: TicketPriority;
  confidence: number;
  keywords: string[];
}

export class UrbanService {
  async classifyTicket(content: string): Promise<NlpClassificationResult> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const lowerContent = content.toLowerCase();
    let category: TicketCategory = 'urban_management';
    let subCategory = '其他';
    let priority: TicketPriority = 'medium';

    if (lowerContent.includes('公交') || lowerContent.includes('brt') || lowerContent.includes('停车') || lowerContent.includes('交通')) {
      category = 'transportation';
      subCategory = '公共交通';
    } else if (lowerContent.includes('医院') || lowerContent.includes('医疗') || lowerContent.includes('看病')) {
      category = 'medical';
      subCategory = '医疗服务';
    } else if (lowerContent.includes('学校') || lowerContent.includes('入学') || lowerContent.includes('教育')) {
      category = 'education';
      subCategory = '教育服务';
    } else if (lowerContent.includes('证件') || lowerContent.includes('办理') || lowerContent.includes('审批')) {
      category = 'government';
      subCategory = '政务服务';
    } else if (lowerContent.includes('噪音') || lowerContent.includes('垃圾') || lowerContent.includes('井盖') || lowerContent.includes('路灯')) {
      category = 'urban_management';
      subCategory = '市政设施';
    }

    if (lowerContent.includes('紧急') || lowerContent.includes('危险') || lowerContent.includes('安全隐患')) {
      priority = 'urgent';
    } else if (lowerContent.includes('尽快') || lowerContent.includes('马上')) {
      priority = 'high';
    }

    const keywords = content.match(/[\u4e00-\u9fa5]{2,}/g)?.slice(0, 5) || [];

    return {
      category,
      subCategory,
      department: TICKET_CATEGORY_MAP[category].department,
      priority,
      confidence: 0.85 + Math.random() * 0.15,
      keywords,
    };
  }

  async submitComplaint(request: ComplaintRequest): Promise<{ ticketId: string; ticketNo: string; category: TicketCategory; department: string; deadline: string }> {
    const classification = await this.classifyTicket(request.content);
    const ticketNo = this.generateTicketNo();
    const deadline = new Date();
    const hours = classification.priority === 'urgent' ? 4 : classification.priority === 'high' ? 24 : 72;
    deadline.setHours(deadline.getHours() + hours);

    const newTicket: ComplaintTicket = {
      id: uuidv4(),
      ticketNo,
      title: request.title,
      content: request.content,
      category: classification.category,
      subCategory: classification.subCategory,
      department: classification.department,
      status: 'assigned',
      priority: classification.priority,
      deadline: deadline.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockTickets.unshift(newTicket);

    return {
      ticketId: newTicket.id,
      ticketNo: newTicket.ticketNo,
      category: classification.category,
      department: classification.department,
      deadline: deadline.toISOString(),
    };
  }

  async getTickets(userId: string, status?: string, category?: string): Promise<ComplaintTicket[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    let tickets = [...mockTickets];
    if (status) {
      tickets = tickets.filter(t => t.status === status);
    }
    if (category) {
      tickets = tickets.filter(t => t.category === category);
    }
    return tickets;
  }

  async getTicketDetail(ticketId: string): Promise<ComplaintTicket | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const ticket = mockTickets.find(t => t.id === ticketId);
    if (!ticket) return null;
    
    const logs = mockTicketLogs[ticket.ticketNo] || this.generateDefaultLogs(ticket);
    return {
      ...ticket,
      logs,
    };
  }

  private generateDefaultLogs(ticket: ComplaintTicket): TicketLog[] {
    const logs: TicketLog[] = [
      {
        id: uuidv4(),
        ticketId: ticket.ticketNo,
        action: 'submit',
        description: '市民提交诉求',
        operator: '市民',
        department: '市民',
        timestamp: ticket.createdAt,
      },
    ];

    if (ticket.status !== 'pending') {
      logs.push({
        id: uuidv4(),
        ticketId: ticket.ticketNo,
        action: 'classify',
        description: 'AI智能分类完成',
        operator: '系统',
        department: 'AI分类系统',
        timestamp: ticket.createdAt,
      });
    }

    if (ticket.status === 'assigned' || ticket.status === 'processing' || ticket.status === 'resolved' || ticket.status === 'closed') {
      logs.push({
        id: uuidv4(),
        ticketId: ticket.ticketNo,
        action: 'assign',
        description: `分派至${ticket.department}`,
        operator: '工单管理员',
        department: ticket.department,
        timestamp: ticket.updatedAt,
      });
    }

    if (ticket.status === 'processing' || ticket.status === 'resolved' || ticket.status === 'closed') {
      logs.push({
        id: uuidv4(),
        ticketId: ticket.ticketNo,
        action: 'process',
        description: '工作人员正在处理中',
        operator: '经办人员',
        department: ticket.department,
        timestamp: ticket.updatedAt,
      });
    }

    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      logs.push({
        id: uuidv4(),
        ticketId: ticket.ticketNo,
        action: 'resolve',
        description: ticket.resolution || '问题已处理完成',
        operator: '经办人员',
        department: ticket.department,
        timestamp: ticket.updatedAt,
      });
    }

    if (ticket.status === 'closed' && ticket.satisfactionScore !== undefined) {
      logs.push({
        id: uuidv4(),
        ticketId: ticket.ticketNo,
        action: 'rate',
        description: `市民评价：${ticket.satisfactionScore}星`,
        operator: '市民',
        department: '市民',
        timestamp: ticket.updatedAt,
      });
    }

    return logs;
  }

  async rateTicket(ticketId: string, score: number, comment?: string): Promise<{ success: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const ticket = mockTickets.find(t => t.id === ticketId);
    if (ticket) {
      ticket.satisfactionScore = score;
      ticket.status = 'closed';
      ticket.updatedAt = new Date().toISOString();
      return { success: true };
    }
    return { success: false };
  }

  async getVitalSigns() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return generateVitalSigns();
  }

  async getVitalSignsHistory(hours: number = 24) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const data = [];
    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);
      data.push({
        timestamp: timestamp.toISOString(),
        ...generateVitalSigns(),
      });
    }
    return data;
  }

  private generateTicketNo(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(mockTickets.length + 1).padStart(4, '0');
    return `${dateStr}${seq}`;
  }

  async getDispatchRules(): Promise<DispatchRule[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mockDispatchRules];
  }

  async createDispatchRule(rule: Omit<DispatchRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<DispatchRule> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newRule: DispatchRule = {
      id: uuidv4(),
      ...rule,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDispatchRules.unshift(newRule);
    return newRule;
  }

  async updateDispatchRule(id: string, updates: Partial<DispatchRule>): Promise<DispatchRule | null> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const index = mockDispatchRules.findIndex(r => r.id === id);
    if (index === -1) return null;
    mockDispatchRules[index] = {
      ...mockDispatchRules[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return mockDispatchRules[index];
  }

  async toggleDispatchRule(id: string, isEnabled: boolean): Promise<DispatchRule | null> {
    return this.updateDispatchRule(id, { isEnabled });
  }

  async deleteDispatchRule(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockDispatchRules.findIndex(r => r.id === id);
    if (index === -1) return false;
    mockDispatchRules.splice(index, 1);
    return true;
  }

  async getDepartmentStats(): Promise<DepartmentStats[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return [...mockDepartmentStats];
  }

  async getDepartmentReceipts(department?: string): Promise<DepartmentReceipt[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    let receipts = [...mockDepartmentReceipts];
    if (department) {
      receipts = receipts.filter(r => r.department === department);
    }
    return receipts;
  }

  async getTransportationDashboard(): Promise<TransportationDashboardData> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return generateTransportationData();
  }

  async getMedicalDashboard(): Promise<MedicalDashboardData> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return generateMedicalData();
  }

  async getUtilitiesDashboard(): Promise<UtilitiesDashboardData> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return generateUtilitiesData();
  }

  async getGovernmentDashboard(): Promise<GovernmentDashboardData> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return generateGovernmentData();
  }
}

export const urbanService = new UrbanService();
