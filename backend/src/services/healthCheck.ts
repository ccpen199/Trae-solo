import { Request, Response } from 'express';
import { DepartmentAdapterManager } from '../adapters/DepartmentAdapterManager';
import ProfileEngineService from '../engines/ProfileEngineService';
import KnowledgeGraphEngine from '../engines/KnowledgeGraphEngine';
import FeedbackAnalyticsEngine from '../engines/FeedbackAnalyticsEngine';
import logger from '../utils/logger';
import os from 'os';

export class HealthCheckService {
  static check(_req: Request, res: Response) {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'ZZ-Government-Hub-Backend',
      version: '2.1.0',
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json(health);
  }

  static async detailed(_req: Request, res: Response) {
    const startTime = Date.now();

    const departmentHealth = DepartmentAdapterManager.getAllHealthStatus();
    const departmentsStatus = Object.values(departmentHealth);

    const onlineCount = departmentsStatus.filter(h => h.status === 'online').length;
    const degradedCount = departmentsStatus.filter(h => h.status === 'degraded').length;
    const offlineCount = departmentsStatus.filter(h => h.status === 'offline').length;

    const avgAdapterResponse = departmentsStatus.length > 0
      ? Math.round(departmentsStatus.reduce((s, h) => s + h.avgResponseTime, 0) / departmentsStatus.length)
      : 0;

    const profileStats = ProfileEngineService.getEngineStats();
    const kgStats = KnowledgeGraphEngine.getGraphStats();
    const fbStats = FeedbackAnalyticsEngine.getStats();

    const cpuLoad = os.loadavg();
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    const checks = [
      { name: '委办局适配器健康', status: offlineCount === 0 ? 'pass' : degradedCount > 0 ? 'warn' : 'pass' },
      { name: '用户画像引擎', status: profileStats.cachedProfiles > 0 ? 'pass' : 'warn' },
      { name: '知识图谱引擎', status: kgStats.totalGraphNodes > 0 ? 'pass' : 'fail' },
      { name: '反馈分析引擎', status: fbStats.totalFeedbacks > 0 ? 'pass' : 'warn' },
      { name: '内存使用', status: memUsage.heapUsed / memUsage.heapTotal < 0.8 ? 'pass' : 'warn' },
      { name: 'CPU负载', status: cpuLoad[0] < os.cpus().length * 0.8 ? 'pass' : 'warn' }
    ];

    const allPass = checks.every(c => c.status === 'pass');
    const hasFail = checks.some(c => c.status === 'fail');

    const responseTime = Date.now() - startTime;

    const status = hasFail ? 'unhealthy' : allPass ? 'healthy' : 'degraded';
    const httpCode = hasFail ? 503 : 200;

    res.status(httpCode).json({
      status,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      uptime: {
        seconds: Math.round(process.uptime()),
        formatted: formatUptime(process.uptime())
      },
      service: {
        name: '郑州市掌上办事中枢后端',
        version: '2.1.0',
        build: '2025.05.25',
        environment: process.env.NODE_ENV || 'development'
      },
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        nodeVersion: process.version,
        pid: process.pid,
        cpus: os.cpus().length,
        cpuLoad: {
          '1min': Math.round(cpuLoad[0] * 100) / 100,
          '5min': Math.round(cpuLoad[1] * 100) / 100,
          '15min': Math.round(cpuLoad[2] * 100) / 100
        },
        memory: {
          process: {
            rss: formatBytes(memUsage.rss),
            heapUsed: formatBytes(memUsage.heapUsed),
            heapTotal: formatBytes(memUsage.heapTotal),
            heapUsagePct: Math.round(memUsage.heapUsed / memUsage.heapTotal * 100)
          },
          system: {
            total: formatBytes(totalMem),
            free: formatBytes(freeMem),
            usedPct: Math.round((totalMem - freeMem) / totalMem * 100)
          }
        }
      },
      integrations: {
        departments: {
          total: departmentsStatus.length,
          online: onlineCount,
          degraded: degradedCount,
          offline: offlineCount,
          avgResponseTimeMs: avgAdapterResponse
        },
        engines: {
          profile: { cachedProfiles: profileStats.cachedProfiles, behaviorRecords: profileStats.totalBehaviorRecords },
          knowledgeGraph: { nodes: kgStats.totalGraphNodes, policies: kgStats.totalPolicies, qas: kgStats.totalQAPairs },
          feedback: { feedbacks: fbStats.totalFeedbacks, workOrders: fbStats.totalWorkOrders, clusters: fbStats.totalClusters }
        }
      },
      checks,
      _links: {
        self: '/health/detailed',
        simple: '/health',
        docs: '/api/v1'
      }
    });
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0) parts.push(`${minutes}分钟`);
  parts.push(`${secs}秒`);

  return parts.join('');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}
