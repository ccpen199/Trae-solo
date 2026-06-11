import { investmentRepository } from '../repositories/InvestmentRepository';
import type { InvestmentProject, PageResponse } from '../../shared/types';

export interface CreateInvestmentData {
  name: string;
  type: string;
  region: string;
  totalInvestment: number;
  description: string;
  contactPerson: string;
  contactPhone: string;
  createdBy: string;
}

export interface UpdateInvestmentData {
  name?: string;
  type?: string;
  region?: string;
  totalInvestment?: number;
  description?: string;
  contactPerson?: string;
  contactPhone?: string;
  status?: InvestmentProject['status'];
}

export class InvestmentService {
  async getProjectById(id: string): Promise<InvestmentProject | undefined> {
    return investmentRepository.findById(id);
  }

  async getProjectList(params: {
    page?: number;
    pageSize?: number;
    status?: InvestmentProject['status'];
    region?: string;
    type?: string;
    keyword?: string;
  }): Promise<PageResponse<InvestmentProject>> {
    return investmentRepository.findAll(params);
  }

  async createProject(data: CreateInvestmentData): Promise<InvestmentProject> {
    return investmentRepository.create({
      ...data,
      status: 'pending',
    });
  }

  async updateProject(id: string, data: UpdateInvestmentData): Promise<InvestmentProject | undefined> {
    const project = await investmentRepository.findById(id);
    if (!project) return undefined;

    return investmentRepository.update(id, data);
  }

  async updateProjectStatus(id: string, status: InvestmentProject['status']): Promise<InvestmentProject | undefined> {
    const project = await investmentRepository.findById(id);
    if (!project) return undefined;

    const validTransitions: Record<InvestmentProject['status'], InvestmentProject['status'][]> = {
      pending: ['negotiating', 'signed'],
      negotiating: ['pending', 'signed', 'completed'],
      signed: ['negotiating', 'completed'],
      completed: [],
    };

    if (!validTransitions[project.status].includes(status)) {
      throw new Error(`无法从 ${project.status} 状态变更为 ${status}`);
    }

    return investmentRepository.updateStatus(id, status);
  }

  async deleteProject(id: string): Promise<boolean> {
    const project = await investmentRepository.findById(id);
    if (!project) return false;

    if (project.status === 'signed' || project.status === 'completed') {
      throw new Error('已签约或已完成的项目不能删除');
    }

    return investmentRepository.delete(id);
  }

  async getProjectStats(): Promise<{
    total: number;
    pending: number;
    negotiating: number;
    signed: number;
    completed: number;
    totalInvestment: number;
  }> {
    const projects = Array.from((await investmentRepository.findAll({ page: 1, pageSize: 9999 })).list);
    
    return {
      total: projects.length,
      pending: projects.filter(p => p.status === 'pending').length,
      negotiating: projects.filter(p => p.status === 'negotiating').length,
      signed: projects.filter(p => p.status === 'signed').length,
      completed: projects.filter(p => p.status === 'completed').length,
      totalInvestment: projects.reduce((sum, p) => sum + p.totalInvestment, 0),
    };
  }
}

export const investmentService = new InvestmentService();
