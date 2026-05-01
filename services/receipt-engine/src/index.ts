import express, { Application, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, logger, errorHandler, notFoundHandler, requestLogger, authMiddleware, asyncHandler, AuthenticatedRequest, query, execute, generateCode, ApiResponse, ReceiptParseResult } from '@sms-platform/shared';
import * as net from 'net';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

const receiptRouter = Router();

receiptRouter.post(
  '/callback/:providerCode',
  asyncHandler(async (req, res) => {
    const { providerCode } = req.params;
    const rawContent = JSON.stringify(req.body);
    const sourceIp = req.ip || req.connection.remoteAddress;

    const providers = await query(`
      SELECT id, provider_code, provider_name FROM providers WHERE provider_code = ?
    `, [providerCode]);

    if (providers.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_PROVIDER',
          message: '无效的通道商代码',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    const provider = providers[0];

    const requestId = extractRequestId(req.body, providerCode);

    const receiptCode = generateCode('RCP');
    await execute(`
      INSERT INTO receipt_raws (
        raw_content, provider_id, request_id, parsed, source_ip, received_at
      ) VALUES (?, ?, ?, 0, ?, NOW())
    `, [rawContent, provider.id, requestId, sourceIp]);

    if (requestId) {
      const parseResult = parseReceipt(req.body, providerCode);

      if (parseResult) {
        const smsRecords = await query(`
          SELECT sr.id, sr.sms_code, sr.task_id
          FROM sms_records sr
          WHERE sr.request_id = ? OR sr.sms_code = ?
        `, [requestId, requestId]);

        if (smsRecords.length > 0) {
          const smsRecord = smsRecords[0];
          const newStatus = parseResult.status === 'success' ? 2 : 3;
          const failReason = parseResult.status === 'failed' 
            ? `${parseResult.errorCode || ''}: ${parseResult.errorMessage || ''}`.trim() 
            : null;

          await execute(`
            UPDATE sms_records 
            SET status = ?, fail_reason = ?, receive_at = NOW()
            WHERE id = ?
          `, [newStatus, failReason, smsRecord.id]);

          if (parseResult.status === 'success') {
            await execute(`
              UPDATE send_tasks 
              SET success_count = success_count + 1, pending_count = pending_count - 1
              WHERE id = ?
            `, [smsRecord.task_id]);
          } else {
            await execute(`
              UPDATE send_tasks 
              SET fail_count = fail_count + 1, pending_count = pending_count - 1
              WHERE id = ?
            `, [smsRecord.task_id]);
          }

          await execute(`
            UPDATE receipt_raws SET parsed = 1 WHERE request_id = ?
          `, [requestId]);
        }
      }
    }

    const response: ApiResponse = {
      success: true,
      data: {
        message: '回执已接收',
        receiptCode,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

receiptRouter.get(
  '/status/:smsCode',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { smsCode } = req.params;

    const smsRecords = await query(`
      SELECT 
        sr.id, sr.sms_code, sr.phone_number, sr.status, 
        sr.intercept_reason, sr.fail_reason,
        sr.request_at, sr.receive_at,
        sr.request_id,
        p.provider_name
      FROM sms_records sr
      LEFT JOIN providers p ON sr.provider_id = p.id
      WHERE sr.sms_code = ?
    `, [smsCode]);

    if (smsRecords.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'SMS_NOT_FOUND',
          message: '短信记录不存在',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
      return;
    }

    const record = smsRecords[0];
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
        smsCode: record.sms_code,
        phoneNumber: record.phone_number,
        status: record.status,
        statusText: statusMap[record.status] || '未知',
        providerName: record.provider_name,
        interceptReason: record.intercept_reason,
        failReason: record.fail_reason,
        requestAt: record.request_at,
        receiveAt: record.receive_at,
        requestId: record.request_id,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

function extractRequestId(body: any, providerCode: string): string | null {
  if (body.requestId) return body.requestId;
  if (body.request_id) return body.request_id;
  if (body.bizId) return body.bizId;
  if (body.outId) return body.outId;
  if (body.id) return body.id;
  if (body.smsCode) return body.smsCode;
  
  if (Array.isArray(body) && body.length > 0) {
    return extractRequestId(body[0], providerCode);
  }
  
  return null;
}

function parseReceipt(body: any, providerCode: string): ReceiptParseResult | null {
  let result: Partial<ReceiptParseResult> = {};

  if (body.status === 'SUCCESS' || body.status === 0 || body.code === 'OK' || body.success === true) {
    result.status = 'success';
  } else if (body.status === 'FAIL' || body.status === 1 || body.code !== 'OK' || body.success === false) {
    result.status = 'failed';
    result.errorCode = body.errorCode || body.code || String(body.status);
    result.errorMessage = body.errorMessage || body.message || '发送失败';
  }

  result.requestId = extractRequestId(body, providerCode) || '';
  result.phoneNumber = body.phoneNumber || body.phone || body.mobile;

  return result.requestId ? result as ReceiptParseResult : null;
}

app.use('/api/receipt', receiptRouter);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'receipt-engine',
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
  for (let port = 9860; port <= 9870; port++) {
    if (port !== preferredPort && await isPortAvailable(port)) {
      return port;
    }
  }
  return 0;
}

async function startServer() {
  const preferredPort = config.services.receipt.port;
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
    logger.info(`  回执解析引擎启动成功`);
    logger.info(`  监听端口: ${actualPort}`);
    logger.info(`=================================================`);
  });
}

startServer().catch((err) => {
  logger.error('服务启动失败:', err);
  process.exit(1);
});
