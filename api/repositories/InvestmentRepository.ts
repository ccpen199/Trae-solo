import { db, generateId, now } from '../data/database';
import type { InvestmentProject, PageResponse } from '../../shared/types';

export interface InvestmentQueryParams {
  page?: number;
  pageSize?: number;
  status?: InvestmentProject['status'];
  region?: string;
  type?: string;
  keyword?: string;
}

export class InvestmentRepository {
  async findById(id: string): Promise<InvestmentProject | undefined> {
    return db.investmentProjects.get(id);
  }

  async findAll(params: InvestmentQueryParams = {}): Promise<PageResponse<InvestmentProject>> {
    const { page = 1, pageSize = 10, status, region, type, keyword } = params;
    
    let projects = Array.from(db.investmentProjects.values());

    if (status) {
      projects = projects.filter(p => p.status === status);
    }
    if (region) {
      projects = projects.filter(p => p.region === region);
    }
    if (type) {
      projects = projects.filter(p => p.type === type);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      projects = projects.filter(p => 
        p.name.toLowerCase().includes(kw) || 
        p.description.toLowerCase().includes(kw)
      );
    }

    projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = projects.length;
    const start = (page - 1) * pageSize;
    const list = projects.slice(start, start + pageSize);

    return { list, total, page, pageSize };
  }

  async create(projectData: Omit<InvestmentProject, 'id' | 'createdAt'>): Promise<InvestmentProject> {
    const project: InvestmentProject = {
      ...projectData,
      id: generateId(),
      createdAt: now(),
    };
    db.investmentProjects.set(project.id, project);
    return project;
  }

  async update(id: string, updates: Partial<InvestmentProject>): Promise<InvestmentProject | undefined> {
    const project = db.investmentProjects.get(id);
    if (!project) return undefined;

    const updated: InvestmentProject = {
      ...project,
      ...updates,
    };
    db.investmentProjects.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: InvestmentProject['status']): Promise<InvestmentProject | undefined> {
    return this.update(id, { status });
  }

  async delete(id: string): Promise<boolean> {
    return db.investmentProjects.delete(id);
  }
}

export const investmentRepository = new InvestmentRepository();
