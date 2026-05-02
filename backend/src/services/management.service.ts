import { getDatabase } from '../database/index.js';
import {
  Service,
  API,
  APIKey,
  RateLimitRule,
  CircuitBreakerRule,
  ServiceStatus,
  AvailabilityProbeResult,
} from '../domains/core/types.js';
import {
  ServiceRepository,
  APIRepository,
  APIKeyRepository,
} from '../repositories/index.js';
import {
  TelemetryEngine,
  TrafficShieldEngine,
  ReverseProxyEngine,
} from '../engines/index.js';
import { generateId, generateAPIKey, now, isValidURL } from '../utils/index.js';

export interface CreateServiceRequest {
  name: string;
  description: string | null;
  base_url: string;
  created_by: string;
}

export interface CreateAPIRequest {
  service_id: string;
  name: string;
  path: string;
  method: string;
  description: string | null;
  timeout?: number;
  is_public?: boolean;
}

export interface CreateRateLimitRuleRequest {
  service_id: string;
  api_id: string | null;
  name: string;
  limit_type: 'GLOBAL' | 'PER_API' | 'PER_KEY';
  requests_per_second: number;
  burst_size: number;
  window_size: number;
}

export interface CreateCircuitBreakerRuleRequest {
  service_id: string;
  api_id: string | null;
  name: string;
  failure_threshold: number;
  timeout: number;
  reset_timeout: number;
  min_requests: number;
}

export class ManagementService {
  private db: ReturnType<typeof getDatabase>;
  private serviceRepository: ServiceRepository;
  private apiRepository: APIRepository;
  private apiKeyRepository: APIKeyRepository;
  private telemetryEngine: TelemetryEngine;
  private shieldEngine: TrafficShieldEngine;
  private proxyEngine: ReverseProxyEngine;

  constructor() {
    this.db = getDatabase();
    this.serviceRepository = new ServiceRepository();
    this.apiRepository = new APIRepository();
    this.apiKeyRepository = new APIKeyRepository();
    this.telemetryEngine = new TelemetryEngine();
    this.shieldEngine = new TrafficShieldEngine();
    this.proxyEngine = new ReverseProxyEngine();
  }

  async createService(request: CreateServiceRequest): Promise<{ service: Service; apiKey: string }> {
    if (!isValidURL(request.base_url)) {
      throw new Error('Invalid base URL');
    }

    const service = this.serviceRepository.create({
      name: request.name,
      description: request.description,
      base_url: request.base_url,
      created_by: request.created_by,
      status: 'OFFLINE',
    });

    this.telemetryEngine.recordAuditLog({
      operation_type: 'CREATE',
      resource_type: 'SERVICE',
      resource_id: service.id,
      actor_id: request.created_by,
      actor_type: 'USER',
      new_value: JSON.stringify(service),
      request_ip: null,
      user_agent: null,
    });

    const { key, prefix, hash } = generateAPIKey();
    
    this.apiKeyRepository.create({
      service_id: service.id,
      key_hash: hash,
      key_prefix: prefix,
      created_by: request.created_by,
    });

    return { service, apiKey: key };
  }

  async probeServiceAvailability(serviceId: string): Promise<AvailabilityProbeResult> {
    const service = this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    const result = await this.proxyEngine.probeAvailability(service.base_url);

    this.telemetryEngine.recordAuditLog({
      operation_type: 'ACCESS',
      resource_type: 'SERVICE',
      resource_id: serviceId,
      actor_id: 'SYSTEM',
      actor_type: 'SYSTEM',
      new_value: JSON.stringify({ action: 'PROBE', result }),
      request_ip: null,
      user_agent: null,
    });

    return {
      ...result,
      timestamp: now(),
    };
  }

  updateServiceStatus(serviceId: string, status: ServiceStatus, actorId: string): Service | null {
    const service = this.serviceRepository.findById(serviceId);
    if (!service) return null;

    const oldValue = JSON.stringify(service);
    const updated = this.serviceRepository.update(serviceId, { status });
    if (!updated) return null;

    this.telemetryEngine.recordAuditLog({
      operation_type: 'UPDATE',
      resource_type: 'SERVICE',
      resource_id: serviceId,
      actor_id: actorId,
      actor_type: 'USER',
      old_value: oldValue,
      new_value: JSON.stringify(updated),
      request_ip: null,
      user_agent: null,
    });

    this.telemetryEngine.recordConfigurationChange({
      service_id: serviceId,
      change_type: 'UPDATE',
      entity_type: 'SERVICE',
      entity_id: serviceId,
      old_config: oldValue,
      new_config: JSON.stringify(updated),
      changed_by: actorId,
    });

    if (status === 'RUNNING') {
      this.telemetryEngine.recordAlert({
        alert_type: 'CONFIG_CHANGE',
        severity: 'INFO',
        service_id: serviceId,
        message: `Service "${service.name}" has been deployed and is now running`,
        metadata: JSON.stringify({ status: 'RUNNING' }),
      });
    }

    return updated;
  }

  createAPI(request: CreateAPIRequest, actorId: string): API {
    const api = this.apiRepository.create({
      service_id: request.service_id,
      name: request.name,
      path: request.path,
      method: request.method,
      description: request.description,
      timeout: request.timeout,
      is_public: request.is_public,
    });

    this.telemetryEngine.recordAuditLog({
      operation_type: 'CREATE',
      resource_type: 'API',
      resource_id: api.id,
      actor_id: actorId,
      actor_type: 'USER',
      new_value: JSON.stringify(api),
      request_ip: null,
      user_agent: null,
    });

    return api;
  }

  createRateLimitRule(request: CreateRateLimitRuleRequest, actorId: string): RateLimitRule {
    const id = generateId();
    const timestamp = now();

    const rule: RateLimitRule = {
      id,
      service_id: request.service_id,
      api_id: request.api_id,
      name: request.name,
      limit_type: request.limit_type,
      requests_per_second: request.requests_per_second,
      burst_size: request.burst_size,
      window_size: request.window_size,
      is_enabled: true,
      created_at: timestamp,
      updated_at: timestamp,
    };

    const stmt = this.db.prepare(`
      INSERT INTO rate_limit_rules (
        id, service_id, api_id, name, limit_type,
        requests_per_second, burst_size, window_size,
        is_enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    stmt.run(
      id, rule.service_id, rule.api_id, rule.name, rule.limit_type,
      rule.requests_per_second, rule.burst_size, rule.window_size,
      timestamp, timestamp
    );

    this.shieldEngine.addRateLimitRule(rule);

    this.telemetryEngine.recordAuditLog({
      operation_type: 'CREATE',
      resource_type: 'RATE_LIMIT_RULE',
      resource_id: id,
      actor_id: actorId,
      actor_type: 'USER',
      new_value: JSON.stringify(rule),
      request_ip: null,
      user_agent: null,
    });

    this.telemetryEngine.recordConfigurationChange({
      service_id: request.service_id,
      change_type: 'CREATE',
      entity_type: 'RATE_LIMIT',
      entity_id: id,
      old_config: null,
      new_config: JSON.stringify(rule),
      changed_by: actorId,
    });

    return rule;
  }

  createCircuitBreakerRule(request: CreateCircuitBreakerRuleRequest, actorId: string): CircuitBreakerRule {
    const id = generateId();
    const timestamp = now();

    const rule: CircuitBreakerRule = {
      id,
      service_id: request.service_id,
      api_id: request.api_id,
      name: request.name,
      failure_threshold: request.failure_threshold,
      timeout: request.timeout,
      reset_timeout: request.reset_timeout,
      min_requests: request.min_requests,
      is_enabled: true,
      created_at: timestamp,
      updated_at: timestamp,
    };

    const stmt = this.db.prepare(`
      INSERT INTO circuit_breaker_rules (
        id, service_id, api_id, name, failure_threshold,
        timeout, reset_timeout, min_requests,
        is_enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    stmt.run(
      id, rule.service_id, rule.api_id, rule.name, rule.failure_threshold,
      rule.timeout, rule.reset_timeout, rule.min_requests,
      timestamp, timestamp
    );

    this.shieldEngine.addCircuitBreakerRule(rule);

    this.telemetryEngine.recordAuditLog({
      operation_type: 'CREATE',
      resource_type: 'CIRCUIT_BREAKER_RULE',
      resource_id: id,
      actor_id: actorId,
      actor_type: 'USER',
      new_value: JSON.stringify(rule),
      request_ip: null,
      user_agent: null,
    });

    this.telemetryEngine.recordConfigurationChange({
      service_id: request.service_id,
      change_type: 'CREATE',
      entity_type: 'CIRCUIT_BREAKER',
      entity_id: id,
      old_config: null,
      new_config: JSON.stringify(rule),
      changed_by: actorId,
    });

    return rule;
  }

  getServiceById(serviceId: string): Service | null {
    return this.serviceRepository.findById(serviceId);
  }

  getAllServices(): Service[] {
    return this.serviceRepository.findAll();
  }

  getAPIsByServiceId(serviceId: string): API[] {
    return this.apiRepository.findByServiceId(serviceId);
  }

  getRateLimitRules(serviceId: string): RateLimitRule[] {
    const stmt = this.db.prepare('SELECT * FROM rate_limit_rules WHERE service_id = ?');
    return stmt.all(serviceId) as RateLimitRule[];
  }

  getCircuitBreakerRules(serviceId: string): CircuitBreakerRule[] {
    const stmt = this.db.prepare('SELECT * FROM circuit_breaker_rules WHERE service_id = ?');
    return stmt.all(serviceId) as CircuitBreakerRule[];
  }

  getAPIKeys(serviceId: string): Omit<APIKey, 'key_hash'>[] {
    const keys = this.apiKeyRepository.findByServiceId(serviceId);
    return keys.map(({ key_hash: _, ...rest }) => rest);
  }

  createAPIKey(serviceId: string, createdBy: string, options?: {
    rate_limit?: number;
    rate_window?: number;
    expires_at?: number | null;
  }): { apiKey: Omit<APIKey, 'key_hash'>; key: string } {
    const service = this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    const { key, prefix, hash } = generateAPIKey();
    
    const apiKey = this.apiKeyRepository.create({
      service_id: serviceId,
      key_hash: hash,
      key_prefix: prefix,
      created_by: createdBy,
      rate_limit: options?.rate_limit,
      rate_window: options?.rate_window,
      expires_at: options?.expires_at,
    });

    this.telemetryEngine.recordAuditLog({
      operation_type: 'CREATE',
      resource_type: 'API_KEY',
      resource_id: apiKey.id,
      actor_id: createdBy,
      actor_type: 'USER',
      new_value: JSON.stringify({ ...apiKey, key_hash: '***' }),
      request_ip: null,
      user_agent: null,
    });

    const { key_hash: _, ...result } = apiKey;
    return { apiKey: result, key };
  }

  deployConfigToCluster(serviceId: string, actorId: string): { success: boolean; message: string } {
    const service = this.serviceRepository.findById(serviceId);
    if (!service) {
      return { success: false, message: 'Service not found' };
    }

    const rateLimitRules = this.getRateLimitRules(serviceId);
    const circuitBreakerRules = this.getCircuitBreakerRules(serviceId);

    rateLimitRules.forEach(rule => {
      this.shieldEngine.addRateLimitRule(rule);
    });

    circuitBreakerRules.forEach(rule => {
      this.shieldEngine.addCircuitBreakerRule(rule);
    });

    this.serviceRepository.update(serviceId, { status: 'RUNNING' });

    const configChangeStmt = this.db.prepare(`
      UPDATE configuration_changes SET status = 'DEPLOYED', deployed_at = ? WHERE service_id = ?
    `);
    configChangeStmt.run(now(), serviceId);

    this.telemetryEngine.recordAuditLog({
      operation_type: 'DEPLOY',
      resource_type: 'CONFIGURATION',
      resource_id: serviceId,
      actor_id: actorId,
      actor_type: 'USER',
      new_value: JSON.stringify({
        rateLimitRules: rateLimitRules.length,
        circuitBreakerRules: circuitBreakerRules.length,
      }),
      request_ip: null,
      user_agent: null,
    });

    this.telemetryEngine.recordAlert({
      alert_type: 'CONFIG_CHANGE',
      severity: 'INFO',
      service_id: serviceId,
      message: `Configuration deployed successfully for service: ${service.name}`,
      metadata: JSON.stringify({
        rateLimitRules: rateLimitRules.length,
        circuitBreakerRules: circuitBreakerRules.length,
      }),
    });

    return { success: true, message: 'Configuration deployed successfully' };
  }

  acknowledgeAlert(alertId: string, actorId: string): boolean {
    const timestamp = now();
    const stmt = this.db.prepare(`
      UPDATE alerts SET is_acknowledged = 1, acknowledged_by = ?, acknowledged_at = ? WHERE id = ?
    `);
    const result = stmt.run(actorId, timestamp, alertId);
    return result.changes > 0;
  }
}
