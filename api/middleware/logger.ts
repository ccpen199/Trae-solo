import type { Request, Response, NextFunction } from 'express';

interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  ip: string;
  userAgent: string;
  userId?: number;
}

const logs: LogEntry[] = [];
const MAX_LOGS = 1000;

function formatLog(entry: LogEntry): string {
  const date = new Date(entry.timestamp);
  const timeStr = date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  
  const color = entry.statusCode >= 500 ? '\x1b[31m' : 
                entry.statusCode >= 400 ? '\x1b[33m' : 
                entry.statusCode >= 300 ? '\x1b[36m' : '\x1b[32m';
  
  return `${timeStr} [${entry.method}] ${entry.url} - ${color}${entry.statusCode}\x1b[0m - ${entry.responseTime}ms - IP: ${entry.ip}`;
}

export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime,
      ip,
      userAgent,
      userId: req.user?.id,
    };

    console.log(formatLog(entry));

    logs.unshift(entry);
    if (logs.length > MAX_LOGS) {
      logs.pop();
    }
  });

  next();
}

export function getLogs(limit: number = 100): LogEntry[] {
  return logs.slice(0, limit);
}

export function clearLogs(): void {
  logs.length = 0;
}

export function getLogStats() {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  let totalRequests = 0;
  let requestsLastHour = 0;
  let requestsLastDay = 0;
  let totalResponseTime = 0;
  let errors = 0;

  logs.forEach(log => {
    totalRequests++;
    totalResponseTime += log.responseTime;
    
    const logTime = new Date(log.timestamp).getTime();
    if (logTime >= oneHourAgo) requestsLastHour++;
    if (logTime >= oneDayAgo) requestsLastDay++;
    if (log.statusCode >= 400) errors++;
  });

  return {
    total_requests: totalRequests,
    requests_last_hour: requestsLastHour,
    requests_last_day: requestsLastDay,
    avg_response_time: totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0,
    error_count: errors,
    error_rate: totalRequests > 0 ? Math.round((errors / totalRequests) * 10000) / 100 : 0,
  };
}

export default loggerMiddleware;
