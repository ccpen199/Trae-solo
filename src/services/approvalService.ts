import { ApprovalTemplate, ApprovalInstance, ApprovalTodo, ApprovalOperation } from '@/types/approval';
import { mockApprovalTemplates, mockApprovalTodos, mockMyApprovals, mockApprovalDetail, mockApprovalStats } from '@/data/mockApproval';

export const approvalService = {
  async getTemplates(category?: string): Promise<ApprovalTemplate[]> {
    console.log('[ApprovalService] Get templates:', category);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let list = mockApprovalTemplates.filter(t => t.isEnabled);
    if (category) {
      list = list.filter(t => t.category === category);
    }
    return list.sort((a, b) => a.sort - b.sort);
  },

  async getTemplateDetail(templateId: string): Promise<ApprovalTemplate> {
    console.log('[ApprovalService] Get template detail:', templateId);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const template = mockApprovalTemplates.find(t => t.id === templateId);
    if (!template) throw new Error('模板不存在');
    return template;
  },

  async getTodoList(page: number = 1, pageSize: number = 10): Promise<{ list: ApprovalTodo[]; total: number }> {
    console.log('[ApprovalService] Get todo list');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      list: mockApprovalTodos.slice((page - 1) * pageSize, page * pageSize),
      total: mockApprovalTodos.length
    };
  },

  async getApprovalTodos(page?: number, pageSize?: number): Promise<{ list: ApprovalTodo[]; total: number }> {
    console.log('[ApprovalService] Get approval todos');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const p = page ?? 1;
    const ps = pageSize ?? 10;
    
    return {
      list: mockApprovalTodos.slice((p - 1) * ps, p * ps),
      total: mockApprovalTodos.length
    };
  },

  async getMyInitiated(page: number = 1, pageSize: number = 10): Promise<{ list: ApprovalInstance[]; total: number }> {
    console.log('[ApprovalService] Get my initiated');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      list: mockMyApprovals.slice((page - 1) * pageSize, page * pageSize),
      total: mockMyApprovals.length
    };
  },

  async getMyCompleted(page: number = 1, pageSize: number = 10): Promise<{ list: ApprovalInstance[]; total: number }> {
    console.log('[ApprovalService] Get my completed');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const completed = mockMyApprovals.filter(a => a.status === 'approved' || a.status === 'rejected');
    return {
      list: completed.slice((page - 1) * pageSize, page * pageSize),
      total: completed.length
    };
  },

  async getApprovalDetail(instanceId: string): Promise<ApprovalInstance> {
    console.log('[ApprovalService] Get approval detail:', instanceId);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const instance = mockMyApprovals.find(a => a.id === instanceId) || mockApprovalDetail;
    return instance;
  },

  async createApproval(templateId: string, formData: Record<string, any>, _attachments?: any[]): Promise<string> {
    console.log('[ApprovalService] Create approval:', templateId, formData);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return 'inst_' + Date.now();
  },

  async operateApproval(instanceId: string, operation: ApprovalOperation, opinion: string, _addSignUsers?: string[]): Promise<void> {
    console.log('[ApprovalService] Operate approval:', instanceId, operation, opinion);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (operation === 'reject' && !opinion.trim()) {
      throw new Error('驳回时请填写审批意见');
    }
  },

  async getApprovalStats(): Promise<{ todo: number; approved: number; rejected: number; myInitiated: number; myCompleted: number }> {
    console.log('[ApprovalService] Get approval stats');
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockApprovalStats;
  },

  async getCategories(): Promise<{ code: string; name: string }[]> {
    console.log('[ApprovalService] Get categories');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const categories = new Map<string, string>();
    mockApprovalTemplates.forEach(t => {
      if (!categories.has(t.category)) {
        categories.set(t.category, t.category);
      }
    });
    
    return Array.from(categories.entries()).map(([code, name]) => ({ code, name }));
  },

  async getCCList(instanceId: string): Promise<any[]> {
    console.log('[ApprovalService] Get CC list:', instanceId);
    await new Promise(resolve => setTimeout(resolve, 200));
    return [];
  },

  async addCC(instanceId: string, userIds: string[]): Promise<void> {
    console.log('[ApprovalService] Add CC:', instanceId, userIds);
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  async approveApproval(instanceId: string, opinion: string): Promise<{ success: boolean; content?: string }> {
    console.log('[ApprovalService] Approve approval:', instanceId, opinion);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, content: '审批通过' };
  },

  async rejectApproval(instanceId: string, opinion: string): Promise<{ success: boolean; content?: string }> {
    console.log('[ApprovalService] Reject approval:', instanceId, opinion);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, content: '已驳回' };
  }
};

export default approvalService;
