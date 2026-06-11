import { openApiRepository } from '../repositories/OpenApiRepository.js';
import { db } from '../data/database.js';
import type {
  OpenApi,
  ApiApplication,
  PageResponse,
} from '../../shared/types/index.js';
import type {
  OpenApiQueryParams,
  CreateOpenApiData,
  UpdateOpenApiData,
  CreateApplicationData,
  UpdateApplicationData,
} from '../repositories/OpenApiRepository.js';

export class OpenApiService {
  async getApiList(params: OpenApiQueryParams): Promise<PageResponse<OpenApi>> {
    return openApiRepository.findAllApis(params);
  }

  async getApiById(id: string): Promise<OpenApi | null> {
    return openApiRepository.findApiById(id);
  }

  async createApi(data: CreateOpenApiData): Promise<OpenApi> {
    const existing = await openApiRepository.findApiByPath(data.path, data.method);
    if (existing) {
      throw new Error(`API ${data.method} ${data.path} already exists`);
    }
    return openApiRepository.createApi(data);
  }

  async updateApi(id: string, data: UpdateOpenApiData): Promise<OpenApi | null> {
    const existing = await openApiRepository.findApiById(id);
    if (!existing) return null;

    if (data.path && data.method) {
      const duplicate = await openApiRepository.findApiByPath(data.path, data.method);
      if (duplicate && duplicate.id !== id) {
        throw new Error(`API ${data.method} ${data.path} already exists`);
      }
    }

    return openApiRepository.updateApi(id, data);
  }

  async deleteApi(id: string): Promise<boolean> {
    return openApiRepository.deleteApi(id);
  }

  async getApiCategories(): Promise<string[]> {
    const apis = Array.from(db.openApis.values());
    const categories = new Set(apis.map((api) => api.category));
    return Array.from(categories).sort();
  }

  async getApplicationList(ownerId?: string, page = 1, pageSize = 20): Promise<PageResponse<ApiApplication>> {
    return openApiRepository.findAllApplications(ownerId, page, pageSize);
  }

  async getApplicationById(id: string, ownerId?: string): Promise<ApiApplication | null> {
    const app = await openApiRepository.findApplicationById(id);
    if (!app) return null;

    if (ownerId && app.ownerId !== ownerId) {
      return null;
    }

    return app;
  }

  async createApplication(data: CreateApplicationData): Promise<ApiApplication> {
    return openApiRepository.createApplication(data);
  }

  async updateApplication(id: string, data: UpdateApplicationData, ownerId?: string): Promise<ApiApplication | null> {
    const app = await openApiRepository.findApplicationById(id);
    if (!app) return null;

    if (ownerId && app.ownerId !== ownerId) {
      return null;
    }

    return openApiRepository.updateApplication(id, data);
  }

  async deleteApplication(id: string, ownerId?: string): Promise<boolean> {
    const app = await openApiRepository.findApplicationById(id);
    if (!app) return false;

    if (ownerId && app.ownerId !== ownerId) {
      return false;
    }

    return openApiRepository.deleteApplication(id);
  }

  async subscribeApi(applicationId: string, apiId: string, ownerId?: string): Promise<ApiApplication | null> {
    const app = await openApiRepository.findApplicationById(applicationId);
    if (!app) return null;

    if (ownerId && app.ownerId !== ownerId) {
      return null;
    }

    const api = await openApiRepository.findApiById(apiId);
    if (!api) {
      throw new Error('API not found');
    }

    return openApiRepository.subscribeApi(applicationId, apiId);
  }

  async unsubscribeApi(applicationId: string, apiId: string, ownerId?: string): Promise<ApiApplication | null> {
    const app = await openApiRepository.findApplicationById(applicationId);
    if (!app) return null;

    if (ownerId && app.ownerId !== ownerId) {
      return null;
    }

    return openApiRepository.unsubscribeApi(applicationId, apiId);
  }

  async regenerateAppSecret(applicationId: string, ownerId?: string): Promise<ApiApplication | null> {
    const app = await openApiRepository.findApplicationById(applicationId);
    if (!app) return null;

    if (ownerId && app.ownerId !== ownerId) {
      return null;
    }

    return openApiRepository.regenerateSecret(applicationId);
  }

  async validateApiAccess(appKey: string, appSecret: string, apiPath: string, apiMethod: string): Promise<{ valid: boolean; app?: ApiApplication; api?: OpenApi }> {
    const app = await openApiRepository.findApplicationByKey(appKey);
    if (!app || app.appSecret !== appSecret || app.status !== 'active') {
      return { valid: false };
    }

    const api = await openApiRepository.findApiByPath(apiPath, apiMethod);
    if (!api) {
      return { valid: false };
    }

    if (api.isPublic || app.subscribedApis.includes(api.id)) {
      return { valid: true, app, api };
    }

    return { valid: false };
  }

  async getSubscribedApis(applicationId: string, ownerId?: string): Promise<OpenApi[]> {
    const app = await openApiRepository.findApplicationById(applicationId);
    if (!app) return [];

    if (ownerId && app.ownerId !== ownerId) {
      return [];
    }

    const apis: OpenApi[] = [];
    for (const apiId of app.subscribedApis) {
      const api = await openApiRepository.findApiById(apiId);
      if (api) {
        apis.push(api);
      }
    }

    return apis;
  }
}

export const openApiService = new OpenApiService();
