import { getDatabase } from '../database/index.js';
import { CircuitBreakerState, RateLimitRule, CircuitBreakerRule, RateLimitResult, CircuitBreakerResult } from '../domains/core/types.js';
import { generateId, now } from '../utils/index.js';

interface RateLimitState {
  tokens: number;
  lastRefill: number;
}

interface CircuitBreakerStateEntity {
  id: string;
  service_id: string;
  api_id: string | null;
  state: CircuitBreakerState;
  failure_count: number;
  success_count: number;
  last_failure_time: number | null;
  open_time: number | null;
  created_at: number;
  updated_at: number;
}

export class TrafficShieldEngine {
  private db: ReturnType<typeof getDatabase>;
  private rateLimitStates: Map<string, RateLimitState>;
  private circuitBreakerRules: Map<string, CircuitBreakerRule>;
  private rateLimitRules: Map<string, RateLimitRule>;

  constructor() {
    this.db = getDatabase();
    this.rateLimitStates = new Map();
    this.circuitBreakerRules = new Map();
    this.rateLimitRules = new Map();
    this.loadRules();
  }

  private loadRules(): void {
    const rateLimitStmt = this.db.prepare('SELECT * FROM rate_limit_rules WHERE is_enabled = 1');
    const rateLimits = rateLimitStmt.all() as RateLimitRule[];
    rateLimits.forEach(rule => {
      this.rateLimitRules.set(this.getRateLimitKey(rule.service_id, rule.api_id), rule);
    });

    const circuitStmt = this.db.prepare('SELECT * FROM circuit_breaker_rules WHERE is_enabled = 1');
    const circuits = circuitStmt.all() as CircuitBreakerRule[];
    circuits.forEach(rule => {
      this.circuitBreakerRules.set(this.getCircuitKey(rule.service_id, rule.api_id), rule);
    });
  }

  private getRateLimitKey(serviceId: string, apiId: string | null): string {
    return apiId ? `${serviceId}:${apiId}` : serviceId;
  }

  private getCircuitKey(serviceId: string, apiId: string | null): string {
    return apiId ? `${serviceId}:${apiId}` : serviceId;
  }

  checkRateLimit(serviceId: string, apiId: string | null, apiKeyId: string | null): RateLimitResult {
    const key = this.getRateLimitKey(serviceId, apiId);
    const rule = this.rateLimitRules.get(key);
    
    if (!rule) {
      return { allowed: true, remaining: 9999, reset: now() + 60, limit: 9999 };
    }

    const stateKey = `${key}:${apiKeyId || 'global'}`;
    const currentTime = now();
    
    let state = this.rateLimitStates.get(stateKey);
    if (!state) {
      state = { tokens: rule.burst_size, lastRefill: currentTime };
      this.rateLimitStates.set(stateKey, state);
    }

    const timePassed = currentTime - state.lastRefill;
    const tokensToAdd = timePassed * rule.requests_per_second;
    
    if (tokensToAdd > 0) {
      state.tokens = Math.min(state.tokens + tokensToAdd, rule.burst_size);
      state.lastRefill = currentTime;
    }

    if (state.tokens >= 1) {
      state.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(state.tokens),
        reset: currentTime + rule.window_size,
        limit: rule.burst_size,
      };
    }

    return {
      allowed: false,
      remaining: 0,
      reset: currentTime + Math.ceil((1 - state.tokens) / rule.requests_per_second),
      limit: rule.burst_size,
    };
  }

  checkCircuitBreaker(serviceId: string, apiId: string | null): CircuitBreakerResult {
    const key = this.getCircuitKey(serviceId, apiId);
    const rule = this.circuitBreakerRules.get(key);
    
    if (!rule) {
      return { allowed: true, state: 'CLOSED' };
    }

    const state = this.getOrCreateCircuitState(serviceId, apiId);
    const currentTime = now();

    if (state.state === 'OPEN') {
      if (state.open_time && (currentTime - state.open_time) >= rule.reset_timeout / 1000) {
        this.updateCircuitState(state.id, 'HALF_OPEN');
        return { allowed: true, state: 'HALF_OPEN' };
      }
      return { 
        allowed: false, 
        state: 'OPEN', 
        error: 'Service unavailable - circuit breaker open' 
      };
    }

    return { allowed: true, state: state.state };
  }

  recordSuccess(serviceId: string, apiId: string | null): void {
    const key = this.getCircuitKey(serviceId, apiId);
    const rule = this.circuitBreakerRules.get(key);
    if (!rule) return;

    const state = this.getOrCreateCircuitState(serviceId, apiId);
    const currentTime = now();

    if (state.state === 'HALF_OPEN') {
      state.success_count += 1;
      if (state.success_count >= rule.min_requests) {
        this.updateCircuitState(state.id, 'CLOSED', 0, state.success_count);
      } else {
        this.updateCircuitState(state.id, 'HALF_OPEN', state.failure_count, state.success_count);
      }
    } else if (state.state === 'CLOSED') {
      this.updateCircuitState(state.id, 'CLOSED', 0, state.success_count + 1);
    }
  }

  recordFailure(serviceId: string, apiId: string | null): void {
    const key = this.getCircuitKey(serviceId, apiId);
    const rule = this.circuitBreakerRules.get(key);
    if (!rule) return;

    const state = this.getOrCreateCircuitState(serviceId, apiId);
    const currentTime = now();
    const newFailureCount = state.failure_count + 1;
    const totalRequests = newFailureCount + state.success_count;

    if (totalRequests >= rule.min_requests) {
      const failureRate = newFailureCount / totalRequests;
      
      if (failureRate >= rule.failure_threshold) {
        this.updateCircuitState(state.id, 'OPEN', newFailureCount, 0, currentTime);
        return;
      }
    }

    this.updateCircuitState(state.id, state.state, newFailureCount, state.success_count, null, currentTime);
  }

  private getOrCreateCircuitState(serviceId: string, apiId: string | null): CircuitBreakerStateEntity {
    const key = this.getCircuitKey(serviceId, apiId);
    
    const existingStmt = this.db.prepare(
      `SELECT * FROM circuit_breaker_states WHERE service_id = ? ${apiId ? 'AND api_id = ?' : 'AND api_id IS NULL'}`
    );
    
    const existing = apiId 
      ? existingStmt.get(serviceId, apiId) as CircuitBreakerStateEntity | undefined
      : existingStmt.get(serviceId) as CircuitBreakerStateEntity | undefined;

    if (existing) return existing;

    const id = generateId();
    const timestamp = now();
    
    const insertStmt = this.db.prepare(`
      INSERT INTO circuit_breaker_states 
      (id, service_id, api_id, state, failure_count, success_count, created_at, updated_at)
      VALUES (?, ?, ?, 'CLOSED', 0, 0, ?, ?)
    `);
    
    insertStmt.run(id, serviceId, apiId, timestamp, timestamp);

    return {
      id,
      service_id: serviceId,
      api_id: apiId,
      state: 'CLOSED',
      failure_count: 0,
      success_count: 0,
      last_failure_time: null,
      open_time: null,
      created_at: timestamp,
      updated_at: timestamp,
    };
  }

  private updateCircuitState(
    id: string,
    state: CircuitBreakerState,
    failureCount?: number,
    successCount?: number,
    openTime?: number | null,
    lastFailureTime?: number | null
  ): void {
    const timestamp = now();
    const fields: string[] = ['state = ?', 'updated_at = ?'];
    const values: (string | number | null)[] = [state, timestamp];

    if (failureCount !== undefined) {
      fields.push('failure_count = ?');
      values.push(failureCount);
    }
    if (successCount !== undefined) {
      fields.push('success_count = ?');
      values.push(successCount);
    }
    if (openTime !== undefined) {
      fields.push('open_time = ?');
      values.push(openTime);
    }
    if (lastFailureTime !== undefined) {
      fields.push('last_failure_time = ?');
      values.push(lastFailureTime);
    }

    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE circuit_breaker_states SET ${fields.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);
  }

  addRateLimitRule(rule: RateLimitRule): void {
    this.rateLimitRules.set(this.getRateLimitKey(rule.service_id, rule.api_id), rule);
  }

  addCircuitBreakerRule(rule: CircuitBreakerRule): void {
    this.circuitBreakerRules.set(this.getCircuitKey(rule.service_id, rule.api_id), rule);
  }

  removeRateLimitRule(serviceId: string, apiId: string | null): void {
    this.rateLimitRules.delete(this.getRateLimitKey(serviceId, apiId));
  }

  removeCircuitBreakerRule(serviceId: string, apiId: string | null): void {
    this.circuitBreakerRules.delete(this.getCircuitKey(serviceId, apiId));
  }

  getCircuitBreakerState(serviceId: string, apiId: string | null): CircuitBreakerState | null {
    const key = this.getCircuitKey(serviceId, apiId);
    const stateStmt = this.db.prepare(
      `SELECT state FROM circuit_breaker_states WHERE service_id = ? ${apiId ? 'AND api_id = ?' : 'AND api_id IS NULL'}`
    );
    const result = apiId 
      ? stateStmt.get(serviceId, apiId) as { state: CircuitBreakerState } | undefined
      : stateStmt.get(serviceId) as { state: CircuitBreakerState } | undefined;
    return result?.state || null;
  }
}
