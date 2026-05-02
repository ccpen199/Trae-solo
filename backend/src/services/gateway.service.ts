import { Request, Response } from 'express';
import { getDatabase } from '../database/index.js';
import {
  AuthGuardEngine,
  TrafficShieldEngine,
  ReverseProxyEngine,
  TelemetryEngine,
} from '../engines/index.js';
import { Service, API, AuthResult, RateLimitResult, CircuitBreakerResult, ProxyResponse } from '../domains/core/types.js';
import { generateRequestFingerprint, now } from '../utils/index.js';

export class GatewayService {
  private db: ReturnType<typeof getDatabase>;
  private authEngine: AuthGuardEngine;
  private shieldEngine: TrafficShieldEngine;
  private proxyEngine: ReverseProxyEngine;
  private telemetryEngine: TelemetryEngine;

  constructor() {
    this.db = getDatabase();
    this.authEngine = new AuthGuardEngine();
    this.shieldEngine = new TrafficShieldEngine();
    this.proxyEngine = new ReverseProxyEngine();
    this.telemetryEngine = new TelemetryEngine();
  }

  async handleGatewayRequest(
    serviceCode: string,
    apiPath: string,
    req: Request
  ): Promise<{ response: ProxyResponse; error?: { code: string; message: string; status: number } }> {
    const startTime = Date.now();

    const serviceStmt = this.db.prepare('SELECT * FROM services WHERE id = ? OR name = ?');
    const service = serviceStmt.get(serviceCode, serviceCode) as Service | undefined;

    if (!service) {
      return {
        response: {
          success: false,
          statusCode: 404,
          headers: {},
          body: JSON.stringify({ error: 'Service not found', code: 'SERVICE_NOT_FOUND' }),
          duration: Date.now() - startTime,
          traceId: '',
          error: 'Service not found',
        },
        error: { code: 'SERVICE_NOT_FOUND', message: 'Service not found', status: 404 },
      };
    }

    if (service.status !== 'RUNNING') {
      return {
        response: {
          success: false,
          statusCode: 503,
          headers: {},
          body: JSON.stringify({ error: 'Service unavailable', code: 'SERVICE_NOT_RUNNING' }),
          duration: Date.now() - startTime,
          traceId: '',
          error: 'Service not running',
        },
        error: { code: 'SERVICE_NOT_RUNNING', message: 'Service not running', status: 503 },
      };
    }

    const authResult = this.authEngine.validateToken(req.headers.authorization);
    if (!authResult.success) {
      this.recordFailedCall(service.id, null, null, 401, Date.now() - startTime, req);
      
      this.telemetryEngine.recordAlert({
        alert_type: 'AUTH_FAILURE',
        severity: 'WARNING',
        service_id: service.id,
        message: `Authentication failed for service: ${service.name}`,
        metadata: JSON.stringify({ errorCode: authResult.errorCode }),
      });

      return {
        response: {
          success: false,
          statusCode: 401,
          headers: {},
          body: JSON.stringify({ error: authResult.error, code: authResult.errorCode }),
          duration: Date.now() - startTime,
          traceId: '',
          error: authResult.error,
        },
        error: { code: authResult.errorCode || 'AUTH_FAILED', message: authResult.error || 'Authentication failed', status: 401 },
      };
    }

    const rateLimitResult = this.shieldEngine.checkRateLimit(
      service.id,
      null,
      authResult.apiKeyId
    );

    if (!rateLimitResult.allowed) {
      this.recordFailedCall(service.id, null, authResult.apiKeyId, 429, Date.now() - startTime, req);

      this.telemetryEngine.recordAlert({
        alert_type: 'RATE_LIMIT_EXCEEDED',
        severity: 'WARNING',
        service_id: service.id,
        message: `Rate limit exceeded for service: ${service.name}`,
        metadata: JSON.stringify({ limit: rateLimitResult.limit }),
      });

      return {
        response: {
          success: false,
          statusCode: 429,
          headers: {
            'Retry-After': String(Math.max(1, Math.ceil((rateLimitResult.reset - now()) / 1000))),
          },
          body: JSON.stringify({ error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' }),
          duration: Date.now() - startTime,
          traceId: '',
          error: 'Rate limit exceeded',
        },
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded', status: 429 },
      };
    }

    const circuitResult = this.shieldEngine.checkCircuitBreaker(service.id, null);
    if (!circuitResult.allowed) {
      this.recordFailedCall(service.id, null, authResult.apiKeyId, 503, Date.now() - startTime, req);

      this.telemetryEngine.recordAlert({
        alert_type: 'CIRCUIT_BREAKER_TRIGGERED',
        severity: 'CRITICAL',
        service_id: service.id,
        message: `Circuit breaker open for service: ${service.name}`,
        metadata: JSON.stringify({ state: circuitResult.state }),
      });

      return {
        response: {
          success: false,
          statusCode: 503,
          headers: {},
          body: JSON.stringify({ error: 'Service unavailable - circuit breaker open', code: 'CIRCUIT_OPEN' }),
          duration: Date.now() - startTime,
          traceId: '',
          error: circuitResult.error,
        },
        error: { code: 'CIRCUIT_OPEN', message: circuitResult.error || 'Circuit breaker open', status: 503 },
      };
    }

    let requestBody = '';
    if (req.body) {
      requestBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const proxyResult = await this.proxyEngine.execute({
      service,
      method: req.method,
      path: apiPath,
      headers: req.headers,
      body: requestBody,
    });

    if (proxyResult.success) {
      this.shieldEngine.recordSuccess(service.id, null);
    } else {
      this.shieldEngine.recordFailure(service.id, null);
    }

    this.telemetryEngine.recordCallLog({
      trace_id: proxyResult.traceId,
      service_id: service.id,
      api_id: null,
      api_key_id: authResult.apiKeyId || null,
      request_fingerprint: generateRequestFingerprint(req.method, apiPath, req.headers, requestBody),
      method: req.method,
      path: apiPath,
      status_code: proxyResult.statusCode,
      duration: proxyResult.duration,
      request_headers: JSON.stringify(req.headers),
      request_body: requestBody || null,
      response_headers: JSON.stringify(proxyResult.headers),
      response_body: proxyResult.body,
      error_message: proxyResult.error || null,
      client_ip: req.ip || null,
      user_agent: req.get('User-Agent') || null,
    });

    return { response: proxyResult };
  }

  private recordFailedCall(
    serviceId: string,
    apiId: string | null,
    apiKeyId: string | null,
    statusCode: number,
    duration: number,
    req: Request
  ): void {
    let requestBody = '';
    if (req.body) {
      requestBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    this.telemetryEngine.recordCallLog({
      trace_id: '',
      service_id: serviceId,
      api_id: apiId,
      api_key_id: apiKeyId,
      request_fingerprint: generateRequestFingerprint(req.method, req.path, req.headers, requestBody),
      method: req.method,
      path: req.path,
      status_code: statusCode,
      duration: duration,
      request_headers: JSON.stringify(req.headers),
      request_body: requestBody || null,
      response_headers: null,
      response_body: null,
      error_message: `Request failed with status ${statusCode}`,
      client_ip: req.ip || null,
      user_agent: req.get('User-Agent') || null,
    });
  }

  getTelemetryEngine(): TelemetryEngine {
    return this.telemetryEngine;
  }

  getShieldEngine(): TrafficShieldEngine {
    return this.shieldEngine;
  }

  getAuthEngine(): AuthGuardEngine {
    return this.authEngine;
  }

  getProxyEngine(): ReverseProxyEngine {
    return this.proxyEngine;
  }
}
