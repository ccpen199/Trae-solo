import express, { Application, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import Bull from 'bull';
import { config, logger, errorHandler, notFoundHandler, requestLogger, authMiddleware, asyncHandler, AuthenticatedRequest, query, execute, generateCode, ApiResponse, buildPagination, templateReplace, isValidPhone } from '@sms-platform/shared';
import * as net from 'net';
import axios from 'axios';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

const smsQueue = new Bull('sms-send-queue', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    db: config.redis.db,
  },
});

const smsRouter = Router();

smsRouter.post(
  '/send',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { templateId, phoneNumbers, variables } = req.body;
    const userId = req.user?.userId;

    if (!templateId || !phoneNumbers || phoneNumbers.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '模板ID和手机号列表不能为空',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    const templates = await query(`
      SELECT * FROM sms_templates WHERE id = ? AND status = 2
    `, [templateId]);

    if (templates.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: '模板不存在或未激活',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
      return;
    }

    const template = templates[0];
    const validPhones: string[] = [];
    const invalidPhones: string[] = [];

    for (const phone of phoneNumbers) {
      if (isValidPhone(phone)) {
        validPhones.push(phone);
      } else {
        invalidPhones.push(phone);
      }
    }

    if (validPhones.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '没有有效的手机号',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    const accounts = await query(`SELECT * FROM accounts WHERE user_id = ?`, [userId]);
    if (accounts.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ACCOUNT_NOT_FOUND',
          message: '账户不存在',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
      return;
    }

    const account = accounts[0];

    let estimatedCost = 0;
    try {
      const routingResponse = await axios.post(
        `http://localhost:${config.services.routing.port}/api/routing/select`,
        {
          templateType: template.template_type,
          phoneNumber: validPhones[0],
        },
        {
          headers: {
            Authorization: req.headers.authorization || '',
          },
        }
      );

      if (routingResponse.data.success && routingResponse.data.data) {
        estimatedCost = routingResponse.data.data.pricePerSms * validPhones.length;
      }
    } catch (e) {
      logger.error('获取路由信息失败，使用默认价格估算', e);
      estimatedCost = 0.05 * validPhones.length;
    }

    if (account.balance < estimatedCost) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: `余额不足，当前余额: ${account.balance}, 预计需要: ${estimatedCost}`,
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    const taskCode = generateCode('TSK');
    const taskResult = await execute(`
      INSERT INTO send_tasks (
        task_code, task_name, template_id, template_content_snapshot,
        sender_id, total_count, pending_count, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `, [
      taskCode,
      `发送任务-${taskCode}`,
      templateId,
      template.template_content,
      userId,
      validPhones.length,
      validPhones.length,
    ]);

    const taskId = taskResult.insertId;

    const smsRecords = [];
    const jobDataList = [];

    for (const phone of validPhones) {
      const smsCode = generateCode('SMS');
      const content = templateReplace(template.template_content, variables || {});

      smsRecords.push({
        smsCode,
        taskId,
        templateId,
        senderId: userId,
        phoneNumber: phone,
        content,
        templateVariables: variables ? JSON.stringify(variables) : null,
        status: 0,
        price: 0,
        amount: 0,
      });

      jobDataList.push({
        smsCode,
        phoneNumber: phone,
        templateId,
        templateType: template.template_type,
        content,
        variables,
        userId,
        taskId,
      });
    }

    for (const record of smsRecords) {
      await execute(`
        INSERT INTO sms_records (
          sms_code, task_id, template_id, sender_id, phone_number,
          content, template_variables, status, price, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        record.smsCode,
        record.taskId,
        record.templateId,
        record.senderId,
        record.phoneNumber,
        record.content,
        record.templateVariables,
        record.status,
        record.price,
        record.amount,
      ]);
    }

    for (const jobData of jobDataList) {
      await smsQueue.add(jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      });
    }

    await execute(`UPDATE send_tasks SET status = 1 WHERE id = ?`, [taskId]);

    const response: ApiResponse = {
      success: true,
      data: {
        taskCode,
        taskId,
        totalCount: validPhones.length,
        invalidCount: invalidPhones.length,
        invalidPhones,
        message: '短信已加入发送队列，正在处理中',
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

smsRouter.get(
  '/tasks',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string;

    let whereConditions: string[] = ['sender_id = ?'];
    let params: any[] = [userId];

    if (status !== undefined) {
      whereConditions.push('status = ?');
      params.push(parseInt(status));
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = await query(`
      SELECT COUNT(*) as total FROM send_tasks WHERE ${whereClause}
    `, params);

    const total = countResult[0].total;
    const { offset, limit, totalPages } = buildPagination(page, pageSize, total);

    const tasks = await query(`
      SELECT 
        st.*, t.template_name
      FROM send_tasks st
      LEFT JOIN sms_templates t ON st.template_id = t.id
      WHERE ${whereClause}
      ORDER BY st.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const response: ApiResponse = {
      success: true,
      data: {
        list: tasks.map((t: any) => ({
          id: t.id,
          taskCode: t.task_code,
          taskName: t.task_name,
          templateId: t.template_id,
          templateName: t.template_name,
          totalCount: t.total_count,
          successCount: t.success_count,
          failCount: t.fail_count,
          pendingCount: t.pending_count,
          interceptCount: t.intercept_count,
          status: t.status,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
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

smsRouter.get(
  '/tasks/:id',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const taskId = parseInt(req.params.id);
    const userId = req.user?.userId;

    const tasks = await query(`
      SELECT 
        st.*, t.template_name, t.template_content
      FROM send_tasks st
      LEFT JOIN sms_templates t ON st.template_id = t.id
      WHERE st.id = ? AND st.sender_id = ?
    `, [taskId, userId]);

    if (tasks.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: '任务不存在',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
      return;
    }

    const t = tasks[0];
    const response: ApiResponse = {
      success: true,
      data: {
        id: t.id,
        taskCode: t.task_code,
        taskName: t.task_name,
        templateId: t.template_id,
        templateName: t.template_name,
        templateContent: t.template_content,
        totalCount: t.total_count,
        successCount: t.success_count,
        failCount: t.fail_count,
        pendingCount: t.pending_count,
        interceptCount: t.intercept_count,
        status: t.status,
        progress: t.total_count > 0 
          ? ((t.success_count + t.fail_count + t.intercept_count) / t.total_count * 100).toFixed(2) 
          : '0.00',
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

smsRouter.get(
  '/records',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const phoneNumber = req.query.phoneNumber as string;
    const status = req.query.status as string;
    const startTime = req.query.startTime as string;
    const endTime = req.query.endTime as string;

    let whereConditions: string[] = ['sender_id = ?'];
    let params: any[] = [userId];

    if (phoneNumber) {
      whereConditions.push('phone_number LIKE ?');
      params.push(`%${phoneNumber}%`);
    }

    if (status !== undefined) {
      whereConditions.push('status = ?');
      params.push(parseInt(status));
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
      SELECT COUNT(*) as total FROM sms_records WHERE ${whereClause}
    `, params);

    const total = countResult[0].total;
    const { offset, limit, totalPages } = buildPagination(page, pageSize, total);

    const records = await query(`
      SELECT 
        sr.*, t.template_name, p.provider_name
      FROM sms_records sr
      LEFT JOIN sms_templates t ON sr.template_id = t.id
      LEFT JOIN providers p ON sr.provider_id = p.id
      WHERE ${whereClause}
      ORDER BY sr.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const statusMap: { [key: number]: string } = {
      0: '待发送',
      1: '发送中',
      2: '发送成功',
      3: '发送失败',
      4: '被拦截',
    };

    const response: ApiResponse = {
      success: true,
      data: {
        list: records.map((r: any) => ({
          id: r.id,
          smsCode: r.sms_code,
          taskId: r.task_id,
          templateId: r.template_id,
          templateName: r.template_name,
          providerName: r.provider_name,
          phoneNumber: r.phone_number,
          content: r.content,
          status: r.status,
          statusText: statusMap[r.status] || '未知',
          interceptReason: r.intercept_reason,
          failReason: r.fail_reason,
          price: r.price,
          amount: r.amount,
          requestId: r.request_id,
          requestAt: r.request_at,
          receiveAt: r.receive_at,
          createdAt: r.created_at,
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

smsQueue.process(async (job) => {
  const { smsCode, phoneNumber, templateId, templateType, content, variables, userId, taskId } = job.data;

  try {
    const complianceResult = await axios.post(
      `http://localhost:${config.services.compliance.port}/api/compliance/check`,
      {
        content,
        templateType,
        phoneNumber,
      }
    );

    if (complianceResult.data.success && !complianceResult.data.data.passed) {
      await execute(`
        UPDATE sms_records 
        SET status = 4, intercept_reason = ?
        WHERE sms_code = ?
      `, [
        JSON.stringify(complianceResult.data.data.issues),
        smsCode,
      ]);

      await execute(`
        UPDATE send_tasks 
        SET intercept_count = intercept_count + 1, pending_count = pending_count - 1
        WHERE id = ?
      `, [taskId]);

      const interceptCode = generateCode('INT');
      await execute(`
        INSERT INTO intercept_records (
          intercept_code, sms_record_id, intercept_type, intercept_reason,
          phone_number, template_id, content_snapshot, intercept_at
        ) VALUES (?, (SELECT id FROM sms_records WHERE sms_code = ?), 'compliance', ?, ?, ?, ?, NOW())
      `, [
        interceptCode,
        smsCode,
        JSON.stringify(complianceResult.data.data.issues),
        phoneNumber,
        templateId,
        content,
      ]);

      logger.info(`短信 ${smsCode} 被合规过滤拦截`);
      return;
    }

    const frequencyResult = await axios.post(
      `http://localhost:${config.services.frequency.port}/api/frequency/check`,
      {
        phoneNumber,
        userId,
        templateType,
      }
    );

    if (frequencyResult.data.success && !frequencyResult.data.data.allowed) {
      await execute(`
        UPDATE sms_records 
        SET status = 4, intercept_reason = ?
        WHERE sms_code = ?
      `, [
        frequencyResult.data.data.interceptReason || '频控限制',
        smsCode,
      ]);

      await execute(`
        UPDATE send_tasks 
        SET intercept_count = intercept_count + 1, pending_count = pending_count - 1
        WHERE id = ?
      `, [taskId]);

      const interceptCode = generateCode('INT');
      await execute(`
        INSERT INTO intercept_records (
          intercept_code, sms_record_id, intercept_type, intercept_reason,
          phone_number, template_id, content_snapshot, intercept_at
        ) VALUES (?, (SELECT id FROM sms_records WHERE sms_code = ?), 'frequency', ?, ?, ?, ?, NOW())
      `, [
        interceptCode,
        smsCode,
        frequencyResult.data.data.interceptReason || '频控限制',
        phoneNumber,
        templateId,
        content,
      ]);

      logger.info(`短信 ${smsCode} 被频控拦截`);
      return;
    }

    const routingResult = await axios.post(
      `http://localhost:${config.services.routing.port}/api/routing/select`,
      {
        templateType,
        phoneNumber,
        variables,
      }
    );

    if (!routingResult.data.success) {
      throw new Error('路由选择失败');
    }

    const { providerId, providerCode, providerName, pricePerSms } = routingResult.data.data;

    await axios.post(
      `http://localhost:${config.services.frequency.port}/api/frequency/increment`,
      {
        phoneNumber,
        userId,
        templateType,
      }
    );

    await execute(`
      UPDATE sms_records 
      SET status = 1, provider_id = ?, price = ?, amount = ?, request_at = NOW()
      WHERE sms_code = ?
    `, [providerId, pricePerSms, pricePerSms, smsCode]);

    const smsRecords = await query(`SELECT id FROM sms_records WHERE sms_code = ?`, [smsCode]);
    const smsRecordId = smsRecords[0].id;

    const accounts = await query(`SELECT * FROM accounts WHERE user_id = ?`, [userId]);
    const account = accounts[0];
    const balanceBefore = account.balance;
    const balanceAfter = balanceBefore - pricePerSms;

    await execute(`UPDATE accounts SET balance = ?, total_used = total_used + ? WHERE user_id = ?`, [
      balanceAfter,
      pricePerSms,
      userId,
    ]);

    const recordCode = generateCode('CON');
    await execute(`
      INSERT INTO consumption_records (
        record_code, user_id, sms_record_id, template_id, task_id,
        provider_id, phone_number, price, amount, balance_before, balance_after, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      recordCode,
      userId,
      smsRecordId,
      templateId,
      taskId,
      providerId,
      phoneNumber,
      pricePerSms,
      pricePerSms,
      balanceBefore,
      balanceAfter,
    ]);

    if (balanceAfter <= account.balance_warning_threshold) {
      const warningCode = generateCode('WAR');
      await execute(`
        INSERT INTO balance_warnings (
          warning_code, user_id, current_balance, warning_threshold,
          warning_level, notified, auto_recharge_triggered, created_at
        ) VALUES (?, ?, ?, ?, 1, 0, 0, NOW())
      `, [warningCode, userId, balanceAfter, account.balance_warning_threshold]);
    }

    const requestId = generateCode('REQ');
    await execute(`
      UPDATE sms_records 
      SET status = 2, request_id = ?
      WHERE sms_code = ?
    `, [requestId, smsCode]);

    await execute(`
      UPDATE send_tasks 
      SET success_count = success_count + 1, pending_count = pending_count - 1
      WHERE id = ?
    `, [taskId]);

    logger.info(`短信 ${smsCode} 发送成功，使用通道: ${providerName}`);
  } catch (error) {
    logger.error(`短信发送处理失败: ${smsCode}`, error);

    await execute(`
      UPDATE sms_records 
      SET status = 3, fail_reason = ?
      WHERE sms_code = ?
    `, [
      error instanceof Error ? error.message : '未知错误',
      smsCode,
    ]);

    await execute(`
      UPDATE send_tasks 
      SET fail_count = fail_count + 1, pending_count = pending_count - 1
      WHERE id = ?
    `, [taskId]);
  }
});

smsQueue.on('completed', (job) => {
  logger.info(`短信任务完成: ${job.data.smsCode}`);
});

smsQueue.on('failed', (job, error) => {
  logger.error(`短信任务失败: ${job.data.smsCode}`, error);
});

app.use('/api/sms', smsRouter);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'sms-sender-service',
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
  for (let port = 9900; port <= 9910; port++) {
    if (port !== preferredPort && await isPortAvailable(port)) {
      return port;
    }
  }
  return 0;
}

async function startServer() {
  const preferredPort = config.services.smsSender.port;
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
    logger.info(`  短信发送服务启动成功`);
    logger.info(`  监听端口: ${actualPort}`);
    logger.info(`=================================================`);
  });
}

startServer().catch((err) => {
  logger.error('服务启动失败:', err);
  process.exit(1);
});
