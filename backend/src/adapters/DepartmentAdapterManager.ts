import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Service } from 'typedi';
import logger, { auditLogger } from '../utils/logger';
import config from '../config';
import { GOVERNMENT_DEPARTMENTS } from '../../../shared/constants';

export interface AdapterHealth {
  status: 'online' | 'degraded' | 'offline';
  lastCheck: string;
  avgResponseTime: number;
  errorRate: number;
  totalRequests: number;
  concurrentConnections: number;
}

export interface AdapterRequestOptions {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, unknown>;
  data?: unknown;
  timeout?: number;
  retries?: number;
  idempotent?: boolean;
  citizenId?: string;
}

export interface AdapterResponse<T = unknown> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
  raw?: unknown;
  meta?: {
    requestId: string;
    responseTime: number;
    traceId?: string;
    fromCache?: boolean;
  };
}

interface CircuitBreaker {
  failureCount: number;
  lastFailureTime: number;
  openUntil: number;
  state: 'closed' | 'open' | 'half-open';
}

@Service()
class DepartmentAdapter {
  private httpClient: AxiosInstance;
  private health: AdapterHealth;
  private circuitBreaker: CircuitBreaker;
  private requestQueue: Map<string, Promise<AdapterResponse>>;

  constructor(
    public readonly code: string,
    public readonly name: string,
    public readonly category: string,
    private readonly baseUrl: string,
    private readonly authConfig: { type: string; config: Record<string, unknown> }
  ) {
    this.httpClient = this.createHttpClient();
    this.health = {
      status: 'online',
      lastCheck: new Date().toISOString(),
      avgResponseTime: 0,
      errorRate: 0,
      totalRequests: 0,
      concurrentConnections: 0
    };
    this.circuitBreaker = {
      failureCount: 0,
      lastFailureTime: 0,
      openUntil: 0,
      state: 'closed'
    };
    this.requestQueue = new Map();
  }

  private createHttpClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.departmentApi.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Source': 'ZZ-GOV-HUB',
        'X-Client-Version': '2.1.0'
      }
    });

    client.interceptors.request.use((reqConfig) => {
      this.authConfig.type === 'apikey' &&
        (reqConfig.headers['X-API-Key'] = this.authConfig.config.key as string);
      this.authConfig.type === 'oauth2' &&
        (reqConfig.headers['Authorization'] = `Bearer ${this.authConfig.config.token}`);
      return reqConfig;
    });

    return client;
  }

  async request<T = unknown>(options: AdapterRequestOptions): Promise<AdapterResponse<T>> {
    const requestId = `${this.code}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    this.health.concurrentConnections++;
    this.health.totalRequests++;

    if (this.circuitBreaker.state === 'open' && Date.now() < this.circuitBreaker.openUntil) {
      this.health.concurrentConnections--;
      return {
        success: false,
        code: 503,
        message: `委办局[${this.name}]服务暂不可用（熔断器开启）`,
        meta: { requestId, responseTime: 0 }
      };
    }

    const dedupKey = `${options.method || 'GET'}:${options.endpoint}:${JSON.stringify(options.params)}`;
    if (options.idempotent && this.requestQueue.has(dedupKey)) {
      logger.info(`[Adapter:${this.code}] 请求去重命中: ${options.endpoint}`);
      return this.requestQueue.get(dedupKey) as Promise<AdapterResponse<T>>;
    }

    const requestPromise = this.executeRequest<T>(options, requestId, startTime);
    if (options.idempotent) {
      this.requestQueue.set(dedupKey, requestPromise);
      setTimeout(() => this.requestQueue.delete(dedupKey), 5000);
    }

    return requestPromise;
  }

  private async executeRequest<T>(
    options: AdapterRequestOptions,
    requestId: string,
    startTime: number
  ): Promise<AdapterResponse<T>> {
    let attempt = 0;
    const maxRetries = options.retries ?? config.orchestration.maxRetry;
    let lastError: Error | null = null;

    while (attempt <= maxRetries) {
      try {
        if (this.circuitBreaker.state === 'half-open') {
          logger.info(`[Adapter:${this.code}] 熔断器半开状态，探测请求`);
        }

        const axiosConfig: AxiosRequestConfig = {
          method: (options.method || 'GET') as any,
          url: options.endpoint,
          params: options.params,
          data: options.data,
          timeout: options.timeout || config.departmentApi.timeout,
          headers: {
            'X-Request-ID': requestId,
            ...(options.citizenId && { 'X-Citizen-ID': options.citizenId })
          }
        };

        const response = await this.httpClient.request(axiosConfig);
        const responseTime = Date.now() - startTime;

        this.updateHealth(responseTime, true);

        if (this.circuitBreaker.state === 'half-open') {
          this.circuitBreaker.state = 'closed';
          this.circuitBreaker.failureCount = 0;
          logger.info(`[Adapter:${this.code}] 熔断器恢复关闭状态`);
        }

        auditLogger.apiAccess(this.code, options.endpoint, response.status, responseTime);

        const responseData = response.data as any;
        return {
          success: responseData?.code === 0 || responseData?.success || response.status === 200,
          code: responseData?.code || response.status,
          message: responseData?.message || 'OK',
          data: responseData?.data ?? responseData as T,
          raw: responseData,
          meta: {
            requestId,
            responseTime,
            traceId: response.headers['x-trace-id']
          }
        };

      } catch (error: any) {
        lastError = error;
        attempt++;
        const responseTime = Date.now() - startTime;

        this.updateHealth(responseTime, false);
        this.recordFailure();

        logger.warn(`[Adapter:${this.code}] 请求失败 (尝试 ${attempt}/${maxRetries + 1}):`, {
          endpoint: options.endpoint,
          message: error.message,
          code: error.code,
          status: error.response?.status
        });

        if (attempt <= maxRetries && this.isRetryableError(error)) {
          const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, backoff));
          continue;
        }
      }
    }

    this.health.concurrentConnections--;
    const totalTime = Date.now() - startTime;

    return {
      success: false,
      code: 502,
      message: `委办局接口调用失败：${lastError?.message || '未知错误'}`,
      meta: { requestId, responseTime: totalTime }
    };
  }

  private isRetryableError(error: any): boolean {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    if (error.response && retryableStatuses.includes(error.response.status)) return true;
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') return true;
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') return false;
    return false;
  }

  private updateHealth(responseTime: number, success: boolean): void {
    const total = this.health.totalRequests || 1;
    this.health.avgResponseTime = Math.round(
      (this.health.avgResponseTime * (total - 1) + responseTime) / total
    );
    const errors = this.health.errorRate * (total - 1) + (success ? 0 : 1);
    this.health.errorRate = errors / total;
    this.health.lastCheck = new Date().toISOString();
    this.health.concurrentConnections = Math.max(0, this.health.concurrentConnections - 1);
  }

  private recordFailure(): void {
    const now = Date.now();
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = now;

    if (this.circuitBreaker.failureCount >= config.departmentApi.circuitBreakerThreshold) {
      this.circuitBreaker.state = 'open';
      this.circuitBreaker.openUntil = now + config.departmentApi.circuitBreakerTimeout;
      this.health.status = 'offline';
      logger.error(`[Adapter:${this.code}] 熔断器触发！状态切换为OPEN，持续${config.departmentApi.circuitBreakerTimeout}ms`);
    }

    if (this.circuitBreaker.state === 'open' && now >= this.circuitBreaker.openUntil) {
      this.circuitBreaker.state = 'half-open';
      this.health.status = 'degraded';
      this.circuitBreaker.failureCount = 0;
    }
  }

  getHealth(): AdapterHealth {
    const { failureCount, ...rest } = this.circuitBreaker;
    return { ...this.health };
  }

  async healthCheck(): Promise<AdapterHealth> {
    try {
      const start = Date.now();
      await this.httpClient.get('/health', { timeout: 3000 });
      this.health.status = 'online';
      this.health.lastCheck = new Date().toISOString();
      logger.debug(`[Adapter:${this.code}] 健康检查成功，耗时${Date.now() - start}ms`);
    } catch (error) {
      this.health.status = 'degraded';
      logger.warn(`[Adapter:${this.code}] 健康检查失败:`, (error as Error).message);
    }
    return this.health;
  }
}

@Service()
export class DepartmentAdapterManager {
  private static adapters: Map<string, DepartmentAdapter> = new Map();
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) return;

    logger.info('[AdapterManager] 初始化委办局适配器...');

    const adapterConfigs = this.buildAdapterConfigs();

    for (const cfg of adapterConfigs) {
      const adapter = new DepartmentAdapter(
        cfg.code, cfg.name, cfg.category, cfg.baseUrl, cfg.auth
      );
      this.adapters.set(cfg.code, adapter);
      logger.debug(`[AdapterManager] 加载适配器: ${cfg.name} (${cfg.code})`);
    }

    this.initialized = true;

    this.startHealthCheckLoop();

    logger.info(`[AdapterManager] 适配器初始化完成，共加载 ${this.adapters.size} 个委办局接口`);
  }

  private static buildAdapterConfigs() {
    return GOVERNMENT_DEPARTMENTS.map(dept => ({
      code: dept.code,
      name: dept.name,
      category: dept.category,
      baseUrl: `http://api.zhengzhou.gov.cn/${dept.code}/v1`,
      auth: {
        type: 'apikey',
        config: { key: `${dept.code.toUpperCase()}_API_KEY_${Date.now()}` }
      }
    }));
  }

  private static startHealthCheckLoop(): void {
    setInterval(async () => {
      for (const adapter of this.adapters.values()) {
        try {
          await adapter.healthCheck();
        } catch (e) {
          logger.error(`[AdapterManager] 健康检查循环出错:`, (e as Error).message);
        }
      }
    }, 60000);
  }

  static getAdapter(code: string): DepartmentAdapter | undefined {
    return this.adapters.get(code);
  }

  static getAdapterCount(): number {
    return this.adapters.size;
  }

  static getAllAdapters(): DepartmentAdapter[] {
    return Array.from(this.adapters.values());
  }

  static getAdaptersByCategory(category: string): DepartmentAdapter[] {
    return this.getAllAdapters().filter(a => a.category === category);
  }

  static getAllHealthStatus(): Record<string, AdapterHealth> {
    const result: Record<string, AdapterHealth> = {};
    for (const [code, adapter] of this.adapters) {
      result[code] = adapter.getHealth();
    }
    return result;
  }

  static async shutdown(): Promise<void> {
    logger.info('[AdapterManager] 关闭所有委办局适配器连接池...');
    this.adapters.clear();
    this.initialized = false;
  }
}

export const getAdapter = (code: string) => DepartmentAdapterManager.getAdapter(code);
export const getAllAdapters = () => DepartmentAdapterManager.getAllAdapters();
