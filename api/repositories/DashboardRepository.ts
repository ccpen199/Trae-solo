import { db, generateId, now } from '../data/database.js';
import type {
  Dashboard,
  DashboardWidget,
  PageResponse,
} from '../../shared/types/index.js';

export interface DashboardQueryParams {
  ownerId?: string;
  isPublic?: boolean;
  role?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateDashboardData {
  name: string;
  description: string;
  layout: DashboardWidget[];
  ownerId: string;
  isPublic?: boolean;
  sharedRoles?: string[];
}

export interface UpdateDashboardData {
  name?: string;
  description?: string;
  layout?: DashboardWidget[];
  isPublic?: boolean;
  sharedRoles?: string[];
}

export class DashboardRepository {
  async findAll(params: DashboardQueryParams): Promise<PageResponse<Dashboard>> {
    const { ownerId, isPublic, role, page = 1, pageSize = 20 } = params;
    
    let allDashboards = Array.from(db.dashboards.values());

    let filtered = allDashboards.filter((dashboard) => {
      let match = true;
      
      if (ownerId && dashboard.ownerId !== ownerId) {
        match = false;
      }
      
      if (isPublic !== undefined && dashboard.isPublic !== isPublic) {
        if (!role || !dashboard.sharedRoles.includes(role)) {
          match = false;
        }
      }
      
      if (role && !dashboard.isPublic && dashboard.ownerId !== ownerId) {
        if (!dashboard.sharedRoles.includes(role)) {
          match = false;
        }
      }
      
      return match;
    });

    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);

    return { list, total, page, pageSize };
  }

  async findById(id: string): Promise<Dashboard | null> {
    return db.dashboards.get(id) || null;
  }

  async create(data: CreateDashboardData): Promise<Dashboard> {
    const dashboard: Dashboard = {
      id: generateId(),
      name: data.name,
      description: data.description,
      layout: data.layout,
      ownerId: data.ownerId,
      isPublic: data.isPublic ?? false,
      sharedRoles: data.sharedRoles ?? [],
      createdAt: now(),
      updatedAt: now(),
    };

    db.dashboards.set(dashboard.id, dashboard);
    return dashboard;
  }

  async update(id: string, data: UpdateDashboardData): Promise<Dashboard | null> {
    const existing = db.dashboards.get(id);
    if (!existing) return null;

    const updated: Dashboard = {
      ...existing,
      ...data,
      updatedAt: now(),
    };

    db.dashboards.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return db.dashboards.delete(id);
  }

  async addWidget(dashboardId: string, widget: DashboardWidget): Promise<Dashboard | null> {
    const dashboard = db.dashboards.get(dashboardId);
    if (!dashboard) return null;

    const updated: Dashboard = {
      ...dashboard,
      layout: [...dashboard.layout, widget],
      updatedAt: now(),
    };

    db.dashboards.set(dashboardId, updated);
    return updated;
  }

  async updateWidget(dashboardId: string, widgetId: string, widget: Partial<DashboardWidget>): Promise<Dashboard | null> {
    const dashboard = db.dashboards.get(dashboardId);
    if (!dashboard) return null;

    const updatedLayout = dashboard.layout.map((w) =>
      w.id === widgetId ? { ...w, ...widget } : w
    );

    const updated: Dashboard = {
      ...dashboard,
      layout: updatedLayout,
      updatedAt: now(),
    };

    db.dashboards.set(dashboardId, updated);
    return updated;
  }

  async removeWidget(dashboardId: string, widgetId: string): Promise<Dashboard | null> {
    const dashboard = db.dashboards.get(dashboardId);
    if (!dashboard) return null;

    const updatedLayout = dashboard.layout.filter((w) => w.id !== widgetId);

    const updated: Dashboard = {
      ...dashboard,
      layout: updatedLayout,
      updatedAt: now(),
    };

    db.dashboards.set(dashboardId, updated);
    return updated;
  }
}

export const dashboardRepository = new DashboardRepository();
