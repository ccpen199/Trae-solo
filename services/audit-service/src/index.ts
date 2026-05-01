import express, { Application, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, logger, errorHandler, notFoundHandler, requestLogger, authMiddleware, asyncHandler, AuthenticatedRequest, query, execute, generateCode, ApiResponse, buildPagination } from '@sms-platform/shared';
import * as net from 'net';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

const auditRouter = Router();

auditRouter.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const module = req.query.module as string;
    const action = req.query.action as string;
    const userId = req.query.userId as string;
    const targetType = req.query.targetType as string;
    const targetId = req.query.targetId as string;
    const startTime = req.query.startTime as string;
    const endTime = req.query.endTime as string;

    let whereConditions: string[] = ['1=1'];
    let params: any[] = [];

    if (module) {
      whereConditions.push('module = ?');
      params.push(module);
    }

    if (action) {
      whereConditions.push('action = ?');
      params.push(action);
    }

    if (userId) {
      whereConditions.push('user_id = ?');
      params.push(parseInt(userId));
    }

    if (targetType) {
      whereConditions.push('target_type = ?');
      params.push(targetType);
    }

    if (targetId) {
      whereConditions.push('target_id = ?');
      params.push(parseInt(targetId));
    }

    if (startTime) {
      whereConditions.push('created_at >= ?');
      params.push(new Date(startTime));
    }

    if (endTime) {
      whereConditions.push('created_at <= ?');
      params.push(new Date(endTime));
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = await query(`
      SELECT COUNT(*) as total FROM audit_logs WHERE ${whereClause}
    `, params);

    const total = countResult[0].total;
    const { offset, limit, totalPages } = buildPagination(page, pageSize, total);

    const logs = await query(`
      SELECT 
        al.id, al.audit_code, al.user_id, al.module, al.action,
        al.target_type, al.target_id, al.old_value, al.new_value,
        al.ip_address, al.user_agent, al.created_at,
        u.username, u.real_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const response: ApiResponse = {
      success: true,
      data: {
        list: logs.map((log: any) => ({
          id: log.id,
          auditCode: log.audit_code,
          userId: log.user_id,
          username: log.username,
          realName: log.real_name,
          module: log.module,
          action: log.action,
          targetType: log.target_type,
          targetId: log.target_id,
          oldValue: log.old_value ? JSON.parse(log.old_value) : null,
          newValue: log.new_value ? JSON.parse(log.new_value) : null,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          createdAt: log.created_at,
        })),
        total,
        page,
        pageSize,
        totalPages,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

auditRouter.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: '无效的审计日志ID',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    const logs = await query(`
      SELECT 
        al.*, u.username, u.real_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.id = ?
    `, [id]);

    if (logs.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '审计日志不存在',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
      return;
    }

    const log = logs[0];
    const response: ApiResponse = {
      success: true,
      data: {
        id: log.id,
        auditCode: log.audit_code,
        userId: log.user_id,
        username: log.username,
        realName: log.real_name,
        module: log.module,
        action: log.action,
        targetType: log.target_type,
        targetId: log.target_id,
        oldValue: log.old_value ? JSON.parse(log.old_value) : null,
        newValue: log.new_value ? JSON.parse(log.new_value) : null,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        createdAt: log.created_at,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

auditRouter.get(
  '/target/:targetType/:targetId',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { targetType, targetId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;

    const countResult = await query(`
      SELECT COUNT(*) as total FROM audit_logs 
      WHERE target_type = ? AND target_id = ?
    `, [targetType, parseInt(targetId)]);

    const total = countResult[0].total;
    const { offset, limit, totalPages } = buildPagination(page, pageSize, total);

    const logs = await query(`
      SELECT 
        al.*, u.username, u.real_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.target_type = ? AND al.target_id = ?
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [targetType, parseInt(targetId), limit, offset]);

    const response: ApiResponse = {
      success: true,
      data: {
        list: logs.map((log: any) => ({
          id: log.id,
          auditCode: log.audit_code,
          userId: log.user_id,
          username: log.username,
          realName: log.real_name,
          module: log.module,
          action: log.action,
          oldValue: log.old_value ? JSON.parse(log.old_value) : null,
          newValue: log.new_value ? JSON.parse(log.new_value) : null,
          ipAddress: log.ip_address,
          createdAt: log.created_at,
        })),
        total,
        page,
        pageSize,
        totalPages,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

auditRouter.get(
  '/phone/:phoneNumber',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { phoneNumber } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;

    const smsRecords = await query(`
      SELECT id FROM sms_records WHERE phone_number = ?
    `, [phoneNumber]);

    const smsIds = smsRecords.map((r: any) => r.id);

    if (smsIds.length === 0) {
      const response: ApiResponse = {
        success: true,
        data: {
          list: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        },
        timestamp: new Date().toISOString(),
      };
      res.json(response);
      return;
    }

    const placeholders = smsIds.map(() => '?').join(',');

    const countResult = await query(`
      SELECT COUNT(*) as total FROM audit_logs 
      WHERE (target_type = 'sms_record' AND target_id IN (${placeholders}))
         OR (target_type = 'sms_template')
    `, smsIds);

    const total = countResult[0].total;
    const { offset, limit, totalPages } = buildPagination(page, pageSize, total);

    const logs = await query(`
      SELECT 
        al.*, u.username, u.real_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE (al.target_type = 'sms_record' AND al.target_id IN (${placeholders}))
         OR (al.target_type = 'sms_template')
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [...smsIds, limit, offset]);

    const response: ApiResponse = {
      success: true,
      data: {
        list: logs.map((log: any) => ({
          id: log.id,
          auditCode: log.audit_code,
          userId: log.user_id,
          username: log.username,
          realName: log.real_name,
          module: log.module,
          action: log.action,
          targetType: log.target_type,
          targetId: log.target_id,
          oldValue: log.old_value ? JSON.parse(log.old_value) : null,
          newValue: log.new_value ? JSON.parse(log.new_value) : null,
          ipAddress: log.ip_address,
          createdAt: log.created_at,
        })),
        total,
        page,
        pageSize,
        totalPages,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

app.use('/api/audit', auditRouter);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'audit-service',
    },
    timestamp: new Date().toISOString(),
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function findAvailablePort(preferredPort: number): Promise<number> {
  if (await isPortAvailable(preferredPort)) {
    return preferredPort;
  }
  for (let port = 9880; port <= 9890; port++) {
    if (port !== preferredPort && await isPortAvailable(port)) {
      return port;
    }
  }
  return 0;
}

async function startServer() {
  const preferredPort = config.services.audit.port;
  const actualPort = await findAvailablePort(preferredPort);

  if (actualPort === 0) {
    logger.error('无法找到可用的端口');
    process.exit(1);
  }

  if (actualPort !== preferredPort) {
    logger.warn(`端口 ${preferredPort} 已被占用，自动切换到端口 ${actualPort}`);
  }

  app.listen(actualPort, () => {
    logger.info(`=================================================`);
    logger.info(`  审计服务启动成功`);
    logger.info(`  监听端口: ${actualPort}`);
    logger.info(`=================================================`);
  });
}

startServer().catch((err) => {
  logger.error('服务启动失败:', err);
  process.exit(1);
});
