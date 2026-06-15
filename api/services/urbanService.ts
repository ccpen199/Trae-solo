import { v4 as uuidv4 } from 'uuid';
import { mockTickets, generateVitalSigns } from '../data/mockData';
import type { ComplaintTicket, TicketCategory, TicketPriority } from '../../shared/types';
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
    return mockTickets.find(t => t.id === ticketId) || null;
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
}

export const urbanService = new UrbanService();
