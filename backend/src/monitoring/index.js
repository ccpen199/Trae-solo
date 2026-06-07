const db = require('../database');

class Monitor {
  constructor() {
    this.requests = [];
    this.maxRecords = 1000;
  }

  recordRequest(method, path, statusCode, duration, userId = null, ip = null, errorMessage = null) {
    const record = {
      method,
      path,
      statusCode,
      duration,
      userId,
      ip,
      errorMessage,
      timestamp: new Date()
    };
    
    this.requests.push(record);
    if (this.requests.length > this.maxRecords) {
      this.requests.shift();
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO api_monitor_logs (method, path, status_code, duration, user_id, ip, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(method, path, statusCode, duration, userId, ip, errorMessage);
    } catch (e) {
      console.error('Failed to save monitor log:', e);
    }
  }

  getMetrics() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;

    const recentRequests = this.requests.filter(r => r.timestamp.getTime() > oneMinuteAgo);
    const hourRequests = this.requests.filter(r => r.timestamp.getTime() > oneHourAgo);
    const dayRequests = this.requests.filter(r => r.timestamp.getTime() > oneDayAgo);

    const totalRequests = dayRequests.length;
    const failedRequests = dayRequests.filter(r => r.statusCode >= 400).length;
    const successRate = totalRequests > 0 ? ((totalRequests - failedRequests) / totalRequests * 100).toFixed(2) : 100;

    const avgDuration = dayRequests.length > 0 
      ? (dayRequests.reduce((sum, r) => sum + r.duration, 0) / dayRequests.length).toFixed(2)
      : 0;

    const errorReasons = this._clusterErrors(dayRequests.filter(r => r.errorMessage));

    return {
      requests_per_minute: recentRequests.length,
      requests_per_hour: hourRequests.length,
      requests_per_day: totalRequests,
      success_rate: parseFloat(successRate),
      failed_requests: failedRequests,
      average_duration_ms: parseFloat(avgDuration),
      error_clusters: errorReasons,
      active_services: 8,
      database_status: 'healthy'
    };
  }

  _clusterErrors(errors) {
    const clusters = {};
    errors.forEach(err => {
      const key = err.errorMessage ? err.errorMessage.substring(0, 50) : 'unknown';
      clusters[key] = (clusters[key] || 0) + 1;
    });
    return Object.entries(clusters)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  getDetailedStats(hours = 24) {
    const since = new Date(Date.now() - hours * 3600000).toISOString();
    const logs = db.prepare(`
      SELECT * FROM api_monitor_logs 
      WHERE created_at >= ? 
      ORDER BY created_at DESC
    `).all(since);

    const byEndpoint = {};
    logs.forEach(log => {
      const key = `${log.method} ${log.path}`;
      if (!byEndpoint[key]) {
        byEndpoint[key] = { count: 0, failed: 0, totalDuration: 0 };
      }
      byEndpoint[key].count++;
      if (log.status_code >= 400) byEndpoint[key].failed++;
      byEndpoint[key].totalDuration += log.duration || 0;
    });

    return Object.entries(byEndpoint).map(([endpoint, data]) => ({
      endpoint,
      total: data.count,
      failed: data.failed,
      success_rate: data.count > 0 ? ((data.count - data.failed) / data.count * 100).toFixed(2) : 100,
      avg_duration: data.count > 0 ? (data.totalDuration / data.count).toFixed(2) : 0
    }));
  }
}

module.exports = new Monitor();
