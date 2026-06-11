import { db, generateId, now } from '../data/database.js';
import type {
  OpenApi,
  ApiApplication,
  PageResponse,
} from '../../shared/types/index.js';

export interface OpenApiQueryParams {
  category?: string;
  isPublic?: boolean;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  page?: number;
  pageSize?: number;
}

export interface CreateOpenApiData {
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  category: string;
  requestParams: OpenApi['requestParams'];
  responseParams: OpenApi['responseParams'];
  rateLimit?: number;
  isPublic?: boolean;
}

export interface UpdateOpenApiData {
  name?: string;
  path?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description?: string;
  category?: string;
  requestParams?: OpenApi['requestParams'];
  responseParams?: OpenApi['responseParams'];
  rateLimit?: number;
  isPublic?: boolean;
}

export interface CreateApplicationData {
  name: string;
  description: string;
  ownerId: string;
}

export interface UpdateApplicationData {
  name?: string;
  description?: string;
  status?: 'active' | 'suspended';
  subscribedApis?: string[];
}

export class OpenApiRepository {
  async findAllApis(params: OpenApiQueryParams): Promise<PageResponse<OpenApi>> {
    const { category, isPublic, method, page = 1, pageSize = 20 } = params;
    
    let allApis = Array.from(db.openApis.values());

    let filtered = allApis.filter((api) => {
      let match = true;
      if (category && api.category !== category) match = false;
      if (isPublic !== undefined && api.isPublic !== isPublic) match = false;
      if (method && api.method !== method) match = false;
      return match;
    });

    filtered.sort((a, b) => a.name.localeCompare(b.name));

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);

    return { list, total, page, pageSize };
  }

  async findApiById(id: string): Promise<OpenApi | null> {
    return db.openApis.get(id) || null;
  }

  async findApiByPath(path: string, method: string): Promise<OpenApi | null> {
    const apis = Array.from(db.openApis.values());
    return apis.find((api) => api.path === path && api.method === method) || null;
  }

  async createApi(data: CreateOpenApiData): Promise<OpenApi> {
    const api: OpenApi = {
      id: generateId(),
      name: data.name,
      path: data.path,
      method: data.method,
      description: data.description,
      category: data.category,
      requestParams: data.requestParams,
      responseParams: data.responseParams,
      rateLimit: data.rateLimit ?? 100,
      isPublic: data.isPublic ?? true,
    };

    db.openApis.set(api.id, api);
    return api;
  }

  async updateApi(id: string, data: UpdateOpenApiData): Promise<OpenApi | null> {
    const existing = db.openApis.get(id);
    if (!existing) return null;

    const updated: OpenApi = {
      ...existing,
      ...data,
    };

    db.openApis.set(id, updated);
    return updated;
  }

  async deleteApi(id: string): Promise<boolean> {
    return db.openApis.delete(id);
  }

  async findAllApplications(ownerId?: string, page = 1, pageSize = 20): Promise<PageResponse<ApiApplication>> {
    let allApps = Array.from(db.apiApplications.values());

    if (ownerId) {
      allApps = allApps.filter((app) => app.ownerId === ownerId);
    }

    allApps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = allApps.length;
    const start = (page - 1) * pageSize;
    const list = allApps.slice(start, start + pageSize);

    return { list, total, page, pageSize };
  }

  async findApplicationById(id: string): Promise<ApiApplication | null> {
    return db.apiApplications.get(id) || null;
  }

  async findApplicationByKey(appKey: string): Promise<ApiApplication | null> {
    const apps = Array.from(db.apiApplications.values());
    return apps.find((app) => app.appKey === appKey) || null;
  }

  async createApplication(data: CreateApplicationData): Promise<ApiApplication> {
    const app: ApiApplication = {
      id: generateId(),
      name: data.name,
      description: data.description,
      appKey: this.generateAppKey(),
      appSecret: this.generateAppSecret(),
      ownerId: data.ownerId,
      subscribedApis: [],
      status: 'active',
      createdAt: now(),
    };

    db.apiApplications.set(app.id, app);
    return app;
  }

  async updateApplication(id: string, data: UpdateApplicationData): Promise<ApiApplication | null> {
    const existing = db.apiApplications.get(id);
    if (!existing) return null;

    const updated: ApiApplication = {
      ...existing,
      ...data,
    };

    db.apiApplications.set(id, updated);
    return updated;
  }

  async deleteApplication(id: string): Promise<boolean> {
    return db.apiApplications.delete(id);
  }

  async subscribeApi(applicationId: string, apiId: string): Promise<ApiApplication | null> {
    const app = db.apiApplications.get(applicationId);
    if (!app) return null;

    if (!app.subscribedApis.includes(apiId)) {
      app.subscribedApis.push(apiId);
      db.apiApplications.set(applicationId, app);
    }

    return app;
  }

  async unsubscribeApi(applicationId: string, apiId: string): Promise<ApiApplication | null> {
    const app = db.apiApplications.get(applicationId);
    if (!app) return null;

    app.subscribedApis = app.subscribedApis.filter((id) => id !== apiId);
    db.apiApplications.set(applicationId, app);

    return app;
  }

  async regenerateSecret(applicationId: string): Promise<ApiApplication | null> {
    const app = db.apiApplications.get(applicationId);
    if (!app) return null;

    app.appSecret = this.generateAppSecret();
    db.apiApplications.set(applicationId, app);

    return app;
  }

  private generateAppKey(): string {
    return 'ak_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateAppSecret(): string {
    return 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export const openApiRepository = new OpenApiRepository();
