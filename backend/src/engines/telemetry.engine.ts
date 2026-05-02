import { getDatabase } from '../database/index.js';
import { CallLog, Metric, Alert, AuditLog, ConfigurationChange, RealTimeMetrics, ServiceMetrics } from '../domains/core/types.js';
import { generateId, now, calculatePercentile, calculateSuccessRate } from '../utils/index.js';
import { WebSocketServer, WebSocket } from 'ws';

export class TelemetryEngine {
  private db: ReturnType<typeof getDatabase>;
  private wss: WebSocketServer | null = null;
  private connectedClients: Set<WebSocket> = new Set();
  private recentCallLogs: CallLog[] = [];
  private maxRecentLogs = 1000;
  private metricsWindow = 60;

  constructor() {
    this.db = getDatabase();
  }

  setWebSocketServer(wss: WebSocketServer): void {
    this.wss = wss;
    wss.on('connection', (ws) => {
      this.connectedClients.add(ws);
      ws.on('close', () => {
        this.connectedClients.delete(ws);
      });
    });
  }

  recordCallLog(data: Omit<CallLog, 'id' | 'created_at'>): CallLog {
    const id = generateId();
    const timestamp = now();

    const stmt = this.db.prepare(`
      INSERT INTO call_logs (
        id, trace_id, service_id, api_id, api_key_id, request_fingerprint,
        method, path, status_code, duration, request_headers, request_body,
        response_headers, response_body, error_message, client_ip, user_agent,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, data.trace_id, data.service_id, data.api_id, data.api_key_id,
      data.request_fingerprint, data.method, data.path, data.status_code,
      data.duration, data.request_headers, data.request_body, data.response_headers,
      data.response_body, data.error_message, data.client_ip, data.user_agent, timestamp
    );

    const callLog: CallLog = {
      ...data,
      id,
      created_at: timestamp,
    };

    this.recentCallLogs.push(callLog);
    if (this.recentCallLogs.length > this.maxRecentLogs) {
      this.recentCallLogs.shift();
    }

    this.updateMetrics(data.service_id, data.api_id, data.status_code, data.duration);

    return callLog;
  }

  private updateMetrics(
    serviceId: string,
    apiId: string | null,
    statusCode: number,
    duration: number
  ): void {
    const currentTime = now();
    const windowStart = currentTime - this.metricsWindow;

    const isSuccess = statusCode >= 200 && statusCode < 400;

    const metricType = isSuccess ? 'SUCCESS_RATE' : 'ERROR_COUNT';
    
    const existingMetricStmt = this.db.prepare(`
      SELECT * FROM metrics 
      WHERE service_id = ? AND metric_type = ? AND window_start >= ?
    `);
    
    const existingMetric = existingMetricStmt.get(serviceId, metricType, windowStart) as Metric | undefined;

    if (existingMetric) {
      const newValue = metricType === 'SUCCESS_RATE'
        ? (existingMetric.value * existingMetric.sample_count + (isSuccess ? 100 : 0)) / (existingMetric.sample_count + 1)
        : existingMetric.value + 1;

      const updateStmt = this.db.prepare(`
        UPDATE metrics SET value = ?, sample_count = ?, window_end = ? WHERE id = ?
      `);
      updateStmt.run(newValue, existingMetric.sample_count + 1, currentTime, existingMetric.id);
    } else {
      const id = generateId();
      const insertStmt = this.db.prepare(`
        INSERT INTO metrics (
          id, service_id, api_id, metric_type, value, sample_count,
          window_start, window_end, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertStmt.run(
        id, serviceId, apiId, metricType,
        metricType === 'SUCCESS_RATE' ? (isSuccess ? 100 : 0) : 1,
        1, windowStart, currentTime, currentTime
      );
    }
  }

  getRealTimeMetrics(): RealTimeMetrics {
    const currentTime = now();
    const windowStart = currentTime - this.metricsWindow;

    const recentLogs = this.recentCallLogs.filter(log => log.created_at >= windowStart);
    
    if (recentLogs.length === 0) {
      return {
        timestamp: currentTime,
        totalRequests: 0,
        successRate: 100,
        avgDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        errorCount: 0,
        activeServices: 0,
        openCircuits: 0,
      };
    }

    const successCount = recentLogs.filter(log => log.status_code >= 200 && log.status_code < 400).length;
    const errorCount = recentLogs.filter(log => log.status_code >= 400).length;
    const durations = recentLogs.map(log => log.duration);

    const activeServicesStmt = this.db.prepare("SELECT COUNT(*) as count FROM services WHERE status = 'RUNNING'");
    const activeServicesResult = activeServicesStmt.get() as { count: number };

    const openCircuitsStmt = this.db.prepare("SELECT COUNT(*) as count FROM circuit_breaker_states WHERE state = 'OPEN'");
    const openCircuitsResult = openCircuitsStmt.get() as { count: number };

    return {
      timestamp: currentTime,
      totalRequests: recentLogs.length,
      successRate: calculateSuccessRate(successCount, recentLogs.length),
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      p95Duration: calculatePercentile(durations, 95),
      p99Duration: calculatePercentile(durations, 99),
      errorCount,
      activeServices: activeServicesResult.count,
      openCircuits: openCircuitsResult.count,
    };
  }

  getServiceMetrics(serviceId: string): ServiceMetrics | null {
    const currentTime = now();
    const windowStart = currentTime - this.metricsWindow;

    const serviceStmt = this.db.prepare('SELECT name, status FROM services WHERE id = ?');
    const service = serviceStmt.get(serviceId) as { name: string; status: string } | undefined;
    
    if (!service) return null;

    const recentLogs = this.recentCallLogs.filter(
      log => log.service_id === serviceId && log.created_at >= windowStart
    );

    if (recentLogs.length === 0) {
      return {
        serviceId,
        serviceName: service.name,
        requestCount: 0,
        successRate: 100,
        avgDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        errorCount: 0,
        status: service.status,
      };
    }

    const successCount = recentLogs.filter(log => log.status_code >= 200 && log.status_code < 400).length;
    const errorCount = recentLogs.filter(log => log.status_code >= 400).length;
    const durations = recentLogs.map(log => log.duration);

    return {
      serviceId,
      serviceName: service.name,
      requestCount: recentLogs.length,
      successRate: calculateSuccessRate(successCount, recentLogs.length),
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      p95Duration: calculatePercentile(durations, 95),
      p99Duration: calculatePercentile(durations, 99),
      errorCount,
      status: service.status,
    };
  }

  queryByFingerprint(fingerprint: string, limit: number = 100): CallLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM call_logs 
      WHERE request_fingerprint = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(fingerprint, limit) as CallLog[];
  }

  queryByTraceId(traceId: string): CallLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM call_logs WHERE trace_id = ? ORDER BY created_at ASC
    `);
    return stmt.all(traceId) as CallLog[];
  }

  recordAuditLog(data: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const id = generateId();
    const timestamp = now();

    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (
        id, operation_type, resource_type, resource_id, actor_id,
        actor_type, old_value, new_value, request_ip, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, data.operation_type, data.resource_type, data.resource_id,
      data.actor_id, data.actor_type, data.old_value, data.new_value,
      data.request_ip, data.user_agent, timestamp
    );

    return {
      ...data,
      id,
      created_at: timestamp,
    };
  }

  recordConfigurationChange(data: Omit<ConfigurationChange, 'id' | 'created_at'>): ConfigurationChange {
    const id = generateId();
    const timestamp = now();

    const stmt = this.db.prepare(`
      INSERT INTO configuration_changes (
        id, service_id, change_type, entity_type, entity_id,
        old_config, new_config, changed_by, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `);

    stmt.run(
      id, data.service_id, data.change_type, data.entity_type, data.entity_id,
      data.old_config, data.new_config, data.changed_by, timestamp
    );

    return {
      ...data,
      id,
      status: 'PENDING',
      created_at: timestamp,
      deployed_at: null,
    };
  }

  recordAlert(data: Omit<Alert, 'id' | 'created_at' | 'is_acknowledged' | 'acknowledged_by' | 'acknowledged_at'>): Alert {
    const id = generateId();
    const timestamp = now();

    const stmt = this.db.prepare(`
      INSERT INTO alerts (
        id, alert_type, severity, service_id, api_id,
        message, is_acknowledged, created_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
    `);

    stmt.run(
      id, data.alert_type, data.severity, data.service_id, data.api_id,
      data.message, timestamp, data.metadata
    );

    const alert: Alert = {
      ...data,
      id,
      created_at: timestamp,
      is_acknowledged: false,
      acknowledged_by: null,
      acknowledged_at: null,
    };

    this.broadcastToClients({ type: 'ALERT', data: alert });

    return alert;
  }

  broadcastToClients(message: object): void {
    const messageStr = JSON.stringify(message);
    for (const client of this.connectedClients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
        } catch {
          this.connectedClients.delete(client);
        }
      }
    }
  }

  getRecentAlerts(limit: number = 50): Alert[] {
    const stmt = this.db.prepare(`
      SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?
    `);
    return stmt.all(limit) as Alert[];
  }

  getAuditLogs(limit: number = 100): AuditLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?
    `);
    return stmt.all(limit) as AuditLog[];
  }
}
