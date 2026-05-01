import express, { Application, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, logger, errorHandler, notFoundHandler, requestLogger, authMiddleware, asyncHandler, AuthenticatedRequest, query, execute, generateCode, ApiResponse, ComplianceCheckResult } from '@sms-platform/shared';
import * as net from 'net';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

const complianceRouter = Router();

complianceRouter.post(
  '/check',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { content, templateType, phoneNumber } = req.body;

    const issues: { ruleCode: string; ruleName: string; reason: string; action: string }[] = [];
    let modifiedContent = content;

    const complianceRules = await query(`
      SELECT * FROM compliance_rules WHERE status = 1 ORDER BY priority DESC
    `);

    for (const rule of complianceRules) {
      switch (rule.rule_type) {
        case 'sensitive_word':
          const sensitiveResult = await checkSensitiveWords(content);
          if (!sensitiveResult.passed) {
            issues.push(...sensitiveResult.issues);
            if (rule.action === 'replace') {
              for (const issue of sensitiveResult.issues) {
                const match = issue.reason.match(/敏感词: ([^\s]+)/);
                if (match) {
                  const word = match[1];
                  const replaceText = rule.replace_text || '***';
                  modifiedContent = modifiedContent.replace(new RegExp(word, 'gi'), replaceText);
                }
              }
            }
          }
          break;

        case 'length':
          const maxLength = parseInt(rule.rule_content) || 70;
          if (content.length > maxLength) {
            issues.push({
              ruleCode: rule.rule_code,
              ruleName: rule.rule_name,
              reason: `内容长度超过限制: ${content.length} > ${maxLength}`,
              action: rule.action,
            });
          }
          break;

        case 'blacklist':
          if (phoneNumber) {
            const blacklistResult = await checkBlacklist(phoneNumber);
            if (!blacklistResult.passed) {
              issues.push(...blacklistResult.issues);
            }
          }
          break;

        case 'regex':
          try {
            const regex = new RegExp(rule.rule_content);
            if (regex.test(content)) {
              issues.push({
                ruleCode: rule.rule_code,
                ruleName: rule.rule_name,
                reason: `内容匹配到禁止的正则表达式`,
                action: rule.action,
              });
            }
          } catch (e) {
            logger.error(`正则表达式规则错误: ${rule.rule_code}`, e);
          }
          break;
      }
    }

    const blockingIssues = issues.filter(i => i.action === 'block');
    const passed = blockingIssues.length === 0;

    const result: ComplianceCheckResult = {
      passed,
      issues,
      modifiedContent: passed ? undefined : modifiedContent,
    };

    const response: ApiResponse = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

complianceRouter.get(
  '/rules',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const rules = await query(`
      SELECT * FROM compliance_rules ORDER BY priority DESC
    `);

    const response: ApiResponse = {
      success: true,
      data: {
        list: rules,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

complianceRouter.get(
  '/sensitive-words',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const countResult = await query(`SELECT COUNT(*) as total FROM sensitive_words`);
    const total = countResult[0].total;

    const offset = (page - 1) * pageSize;

    const words = await query(`
      SELECT * FROM sensitive_words ORDER BY level DESC LIMIT ? OFFSET ?
    `, [pageSize, offset]);

    const response: ApiResponse = {
      success: true,
      data: {
        list: words,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

async function checkSensitiveWords(content: string): Promise<ComplianceCheckResult> {
  const sensitiveWords = await query(`
    SELECT word, level, category FROM sensitive_words
  `);

  const issues: { ruleCode: string; ruleName: string; reason: string; action: string }[] = [];

  for (const sw of sensitiveWords) {
    if (content.toLowerCase().includes(sw.word.toLowerCase())) {
      issues.push({
        ruleCode: 'sensitive_word_check',
        ruleName: '敏感词检查',
        reason: `敏感词: ${sw.word} (级别: ${sw.level}, 分类: ${sw.category})`,
        action: 'block',
      });
    }
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

async function checkBlacklist(phoneNumber: string): Promise<ComplianceCheckResult> {
  const issues: { ruleCode: string; ruleName: string; reason: string; action: string }[] = [];

  const blacklist = await query(`
    SELECT * FROM compliance_rules WHERE rule_type = 'blacklist' AND status = 1
  `);

  for (const rule of blacklist) {
    const blacklistPhones = rule.rule_content ? JSON.parse(rule.rule_content) : [];
    if (blacklistPhones.includes(phoneNumber)) {
      issues.push({
        ruleCode: rule.rule_code,
        ruleName: rule.rule_name,
        reason: `号码 ${phoneNumber} 在黑名单中`,
        action: rule.action,
      });
    }
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

app.use('/api/compliance', complianceRouter);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'compliance-engine',
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
  for (let port = 9870; port <= 9880; port++) {
    if (port !== preferredPort && await isPortAvailable(port)) {
      return port;
    }
  }
  return 0;
}

async function startServer() {
  const preferredPort = config.services.compliance.port;
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
    logger.info(`  合规过滤引擎启动成功`);
    logger.info(`  监听端口: ${actualPort}`);
    logger.info(`=================================================`);
  });
}

startServer().catch((err) => {
  logger.error('服务启动失败:', err);
  process.exit(1);
});
