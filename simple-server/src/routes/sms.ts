import { Router } from 'express';
import { getDatabase } from '../database';
import { logger } from '../logger';
import { generateCode, isValidPhone, templateReplace, buildPagination } from '../utils';
import { asyncHandler, AuthenticatedRequest, authMiddleware, permissionMiddleware } from '../middleware';
import { NotFoundError, BadRequestError, InsufficientBalanceError } from '../errors';
import { getFrequencyCount, incrementFrequencyCount } from '../memory-store';

export const smsRouter = Router();

smsRouter.use(authMiddleware);

smsRouter.post(
  '/send',
  permissionMiddleware(['sms:send']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { templateId, phoneNumbers, variables } = req.body;
    const userId = req.user?.userId;

    if (!templateId || !phoneNumbers || phoneNumbers.length === 0) {
      throw new BadRequestError('模板ID和手机号列表不能为空');
    }

    const db = getDatabase();

    const template = db.prepare('SELECT * FROM sms_templates WHERE id = ? AND status = 2').get(templateId);
    if (!template) {
      throw new NotFoundError('模板不存在或未激活');
    }

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
      throw new BadRequestError('没有有效的手机号');
    }

    const account = db.prepare('SELECT * FROM accounts WHERE user_id = ?').get(userId);
    if (!account) {
      throw new NotFoundError('账户不存在');
    }

    const providers = db.prepare(`
      SELECT * FROM providers WHERE status = 1 ORDER BY priority DESC
    `).all();

    if (providers.length === 0) {
      const response = {
        success: false,
        error: {
          code: 'NO_AVAILABLE_PROVIDER',
          message: '没有可用的短信通道',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(503).json(response);
      return;
    }

    const provider = providers[0];
    const estimatedCost = provider.price_per_sms * validPhones.length;

    if (account.balance < estimatedCost) {
      throw new InsufficientBalanceError(account.balance, estimatedCost);
    }

    const taskCode = generateCode('TSK');
    const taskResult = db.prepare(`
      INSERT INTO send_tasks (
        task_code, task_name, template_id, template_content_snapshot,
        sender_id, total_count, pending_count, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `).run(
      taskCode,
      `发送任务-${taskCode}`,
      templateId,
      template.template_content,
      userId,
      validPhones.length,
      validPhones.length
    );

    const taskId = taskResult.lastInsertRowid;

    const smsRecords: any[] = [];

    for (const phone of validPhones) {
      const smsCode = generateCode('SMS');
      const content = templateReplace(template.template_content, variables || {});

      const complianceResult = checkCompliance(content, phone, db);
      if (!complianceResult.passed) {
        const interceptCode = generateCode('INT');
        db.prepare(`
          INSERT INTO intercept_records (
            intercept_code, intercept_type, intercept_reason,
            phone_number, template_id, content_snapshot, intercept_at
          ) VALUES (?, 'compliance', ?, ?, ?, ?, datetime('now'))
        `).run(
          interceptCode,
          JSON.stringify(complianceResult.issues),
          phone,
          templateId,
          content
        );

        db.prepare(`
          INSERT INTO sms_records (
            sms_code, task_id, template_id, sender_id, phone_number,
            content, template_variables, status, intercept_reason, price, amount, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 4, ?, 0, 0, datetime('now'))
        `).run(
          smsCode,
          taskId,
          templateId,
          userId,
          phone,
          content,
          variables ? JSON.stringify(variables) : null,
          JSON.stringify(complianceResult.issues)
        );

        db.prepare(`
          UPDATE send_tasks SET intercept_count = intercept_count + 1, pending_count = pending_count - 1
          WHERE id = ?
        `).run(taskId);

        continue;
      }

      const freqRules = db.prepare(`
        SELECT * FROM frequency_rules WHERE status = 1 ORDER BY priority DESC
      `).all();

      let freqAllowed = true;
      let freqReason = '';

      for (const rule of freqRules) {
        let targetValue: string | undefined;
        if (rule.target_type === 'phone') {
          targetValue = phone;
        } else if (rule.target_type === 'user') {
          targetValue = String(userId);
        }

        if (!targetValue) continue;

        const currentCount = getFrequencyCount(rule.target_type, targetValue, rule.time_window);
        if (currentCount >= rule.max_count) {
          freqAllowed = false;
          freqReason = `频控限制: ${rule.rule_name}，时间窗口: ${rule.time_window}秒，限制: ${rule.max_count}次`;
          break;
        }
      }

      if (!freqAllowed) {
        const interceptCode = generateCode('INT');
        db.prepare(`
          INSERT INTO intercept_records (
            intercept_code, intercept_type, intercept_reason,
            phone_number, template_id, content_snapshot, intercept_at
          ) VALUES (?, 'frequency', ?, ?, ?, ?, datetime('now'))
        `).run(
          interceptCode,
          freqReason,
          phone,
          templateId,
          content
        );

        db.prepare(`
          INSERT INTO sms_records (
            sms_code, task_id, template_id, sender_id, phone_number,
            content, template_variables, status, intercept_reason, price, amount, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 4, ?, 0, 0, datetime('now'))
        `).run(
          smsCode,
          taskId,
          templateId,
          userId,
          phone,
          content,
          variables ? JSON.stringify(variables) : null,
          freqReason
        );

        db.prepare(`
          UPDATE send_tasks SET intercept_count = intercept_count + 1, pending_count = pending_count - 1
          WHERE id = ?
        `).run(taskId);

        continue;
      }

      for (const rule of freqRules) {
        let targetValue: string | undefined;
        if (rule.target_type === 'phone') {
          targetValue = phone;
        } else if (rule.target_type === 'user') {
          targetValue = String(userId);
        }
        if (targetValue) {
          incrementFrequencyCount(rule.target_type, targetValue, rule.time_window);
        }
      }

      const price = provider.price_per_sms;
      const amount = price;
      const balanceBefore = account.balance;
      const balanceAfter = balanceBefore - amount;

      db.prepare(`
        UPDATE accounts SET balance = ?, total_used = total_used + ? WHERE user_id = ?
      `).run(balanceAfter, amount, userId);

      const recordCode = generateCode('CON');
      db.prepare(`
        INSERT INTO consumption_records (
          record_code, user_id, template_id, task_id, provider_id,
          phone_number, price, amount, balance_before, balance_after, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
      `).run(
        recordCode,
        userId,
        templateId,
        taskId,
        provider.id,
        phone,
        price,
        amount,
        balanceBefore,
        balanceAfter
      );

      const requestId = generateCode('REQ');
      const smsRecordResult = db.prepare(`
        INSERT INTO sms_records (
          sms_code, task_id, template_id, sender_id, provider_id, phone_number,
          content, template_variables, status, price, amount, request_id, request_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 2, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        smsCode,
        taskId,
        templateId,
        userId,
        provider.id,
        phone,
        content,
        variables ? JSON.stringify(variables) : null,
        price,
        amount,
        requestId
      );

      db.prepare(`
        UPDATE send_tasks SET success_count = success_count + 1, pending_count = pending_count - 1
        WHERE id = ?
      `).run(taskId);

      db.prepare(`
        INSERT INTO audit_logs (
          audit_code, user_id, module, action, target_type, target_id,
          new_value, ip_address, created_at
        ) VALUES (?, ?, 'sms', 'send', 'sms_record', ?, ?, ?, datetime('now'))
      `).run(
        generateCode('AUD'),
        userId,
        smsRecordResult.lastInsertRowid,
        JSON.stringify({ phoneNumber: phone, templateId, price, amount }),
        req.ip
      );

      if (balanceAfter <= account.balance_warning_threshold) {
        const warningCode = generateCode('WAR');
        db.prepare(`
          INSERT INTO balance_warnings (
            warning_code, user_id, current_balance, warning_threshold,
            warning_level, notified, auto_recharge_triggered, created_at
          ) VALUES (?, ?, ?, ?, 1, 0, 0, datetime('now'))
        `).run(
          warningCode,
          userId,
          balanceAfter,
          account.balance_warning_threshold
        );
      }
    }

    const task = db.prepare('SELECT * FROM send_tasks WHERE id = ?').get(taskId);
    if (task.pending_count === 0) {
      db.prepare(`
        UPDATE send_tasks SET status = 2 WHERE id = ?
      `).run(taskId);
    }

    const response = {
      success: true,
      data: {
        taskCode,
        taskId,
        totalCount: validPhones.length,
        invalidCount: invalidPhones.length,
        invalidPhones,
        message: '短信已处理完成',
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

function checkCompliance(content: string, phone: string, db: any): {
  passed: boolean;
  issues: any[];
} {
  const issues: any[] = [];

  const sensitiveWords = db.prepare('SELECT word, level, category FROM sensitive_words').all();
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

  if (content.length > 70) {
    issues.push({
      ruleCode: 'max_length_70',
      ruleName: '短信长度限制',
      reason: `内容长度超过限制: ${content.length} > 70`,
      action: 'block',
    });
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

smsRouter.get(
  '/tasks',
  permissionMiddleware(['sms:task:view']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string;
    const userId = req.user?.userId;

    const db = getDatabase();

    let whereClause = 'sender_id = ?';
    const params: any[] = [userId];

    if (status !== undefined) {
      whereClause += ' AND status = ?';
      params.push(parseInt(status));
    }

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM send_tasks WHERE ${whereClause}
    `).get(...params);

    const total = countResult.total;
    const { offset, limit, totalPages } = buildPagination(page, pageSize, total);

    const tasks = db.prepare(`
      SELECT 
        st.*, t.template_name
      FROM send_tasks st
      LEFT JOIN sms_templates t ON st.template_id = t.id
      WHERE ${whereClause}
      ORDER BY st.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const response = {
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
          progress: t.total_count > 0 
            ? ((t.success_count + t.fail_count + t.intercept_count) / t.total_count * 100).toFixed(2) 
            : '0.00',
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
  permissionMiddleware(['sms:task:view']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const taskId = parseInt(req.params.id);
    const userId = req.user?.userId;

    const db = getDatabase();

    const task = db.prepare(`
      SELECT 
        st.*, t.template_name, t.template_content
      FROM send_tasks st
      LEFT JOIN sms_templates t ON st.template_id = t.id
      WHERE st.id = ? AND st.sender_id = ?
    `).get(taskId, userId);

    if (!task) {
      throw new NotFoundError('任务不存在');
    }

    const response = {
      success: true,
      data: {
        id: task.id,
        taskCode: task.task_code,
        taskName: task.task_name,
        templateId: task.template_id,
        templateName: task.template_name,
        templateContent: task.template_content,
        totalCount: task.total_count,
        successCount: task.success_count,
        failCount: task.fail_count,
        pendingCount: task.pending_count,
        interceptCount: task.intercept_count,
        status: task.status,
        progress: task.total_count > 0 
          ? ((task.success_count + task.fail_count + task.intercept_count) / task.total_count * 100).toFixed(2) 
          : '0.00',
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

smsRouter.get(
  '/records',
  permissionMiddleware(['sms:view']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const phoneNumber = req.query.phoneNumber as string;
    const status = req.query.status as string;
    const userId = req.user?.userId;

    const db = getDatabase();

    let whereClause = 'sender_id = ?';
    const params: any[] = [userId];

    if (phoneNumber) {
      whereClause += ' AND phone_number LIKE ?';
      params.push(`%${phoneNumber}%`);
    }

    if (status !== undefined) {
      whereClause += ' AND status = ?';
      params.push(parseInt(status));
    }

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM sms_records WHERE ${whereClause}
    `).get(...params);

    const total = countResult.total;
    const { offset, limit, totalPages } = buildPagination(page, pageSize, total);

    const records = db.prepare(`
      SELECT 
        sr.*, t.template_name, p.provider_name
      FROM sms_records sr
      LEFT JOIN sms_templates t ON sr.template_id = t.id
      LEFT JOIN providers p ON sr.provider_id = p.id
      WHERE ${whereClause}
      ORDER BY sr.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const statusMap: { [key: number]: string } = {
      0: '待发送',
      1: '发送中',
      2: '发送成功',
      3: '发送失败',
      4: '被拦截',
    };

    const response = {
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
