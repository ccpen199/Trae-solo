import { Router } from 'express';
import { query, execute, generateCode, ApiResponse, buildPagination, extractTemplateVariables, ComplianceCheckResult, AuthenticatedRequest, asyncHandler, validateRequestBody, permissionMiddleware, NotFoundError, BadRequestError, execute as dbExecute, query as dbQuery } from '@sms-platform/shared';

export const templateRouter = Router();

templateRouter.get(
  '/',
  permissionMiddleware(['template:view']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string;
    const templateType = req.query.templateType as string;
    const keyword = req.query.keyword as string;

    let whereConditions: string[] = ['1=1'];
    let params: any[] = [];

    if (status !== undefined) {
      whereConditions.push('status = ?');
      params.push(parseInt(status));
    }

    if (templateType) {
      whereConditions.push('template_type = ?');
      params.push(templateType);
    }

    if (keyword) {
      whereConditions.push('(template_name LIKE ? OR template_code LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = await query(`
      SELECT COUNT(*) as total FROM sms_templates WHERE ${whereClause}
    `, params);

    const total = countResult[0].total;
    const { offset, limit, totalPages } = buildPagination(page, pageSize, total);

    const templates = await query(`
      SELECT 
        id, template_code, template_name, template_content, template_type,
        sign_name, variables, status, operator_id, reviewed_by, reviewed_at,
        review_reason, created_at, updated_at
      FROM sms_templates
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const response: ApiResponse = {
      success: true,
      data: {
        list: templates.map((t: any) => ({
          id: t.id,
          templateCode: t.template_code,
          templateName: t.template_name,
          templateContent: t.template_content,
          templateType: t.template_type,
          signName: t.sign_name,
          variables: t.variables ? JSON.parse(t.variables) : null,
          status: t.status,
          operatorId: t.operator_id,
          reviewedBy: t.reviewed_by,
          reviewedAt: t.reviewed_at,
          reviewReason: t.review_reason,
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

templateRouter.get(
  '/:id',
  permissionMiddleware(['template:view']),
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new BadRequestError('无效的模板ID');
    }

    const templates = await query(`
      SELECT 
        id, template_code, template_name, template_content, template_type,
        sign_name, variables, status, operator_id, reviewed_by, reviewed_at,
        review_reason, created_at, updated_at
      FROM sms_templates
      WHERE id = ?
    `, [id]);

    if (templates.length === 0) {
      throw new NotFoundError('模板不存在');
    }

    const t = templates[0];
    const response: ApiResponse = {
      success: true,
      data: {
        id: t.id,
        templateCode: t.template_code,
        templateName: t.template_name,
        templateContent: t.template_content,
        templateType: t.template_type,
        signName: t.sign_name,
        variables: t.variables ? JSON.parse(t.variables) : null,
        status: t.status,
        operatorId: t.operator_id,
        reviewedBy: t.reviewed_by,
        reviewedAt: t.reviewed_at,
        reviewReason: t.review_reason,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

templateRouter.post(
  '/',
  permissionMiddleware(['template:create']),
  validateRequestBody({
    templateName: { required: true, type: 'string', minLength: 1, maxLength: 200 },
    templateContent: { required: true, type: 'string', minLength: 1, maxLength: 1000 },
    templateType: { required: true, type: 'string', minLength: 1, maxLength: 50 },
    signName: { type: 'string', maxLength: 100 },
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { templateName, templateContent, templateType, signName } = req.body;
    const userId = req.user?.userId;

    const variables = extractTemplateVariables(templateContent);

    const sensitiveWordResult = await checkSensitiveWords(templateContent);
    if (!sensitiveWordResult.passed) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'SENSITIVE_WORD_FOUND',
          message: '模板内容包含敏感词，无法创建',
          details: sensitiveWordResult.issues,
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    const templateCode = generateCode('TPL');

    const result = await execute(`
      INSERT INTO sms_templates (
        template_code, template_name, template_content, template_type,
        sign_name, variables, status, operator_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      templateCode,
      templateName,
      templateContent,
      templateType,
      signName || null,
      JSON.stringify(variables),
      0,
      userId,
    ]);

    await createAuditLog({
      userId: userId!,
      module: 'template',
      action: 'create',
      targetType: 'sms_template',
      targetId: result.insertId,
      newValue: JSON.stringify({
        templateCode,
        templateName,
        templateContent,
        templateType,
        signName,
        variables,
      }),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const response: ApiResponse = {
      success: true,
      data: {
        id: result.insertId,
        templateCode,
        templateName,
        templateContent,
        templateType,
        signName,
        variables,
        status: 0,
      },
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  })
);

templateRouter.put(
  '/:id',
  permissionMiddleware(['template:edit']),
  validateRequestBody({
    templateName: { type: 'string', minLength: 1, maxLength: 200 },
    templateContent: { type: 'string', minLength: 1, maxLength: 1000 },
    templateType: { type: 'string', minLength: 1, maxLength: 50 },
    signName: { type: 'string', maxLength: 100 },
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const id = parseInt(req.params.id);
    const { templateName, templateContent, templateType, signName } = req.body;
    const userId = req.user?.userId;

    if (isNaN(id)) {
      throw new BadRequestError('无效的模板ID');
    }

    const existingTemplates = await query(`
      SELECT * FROM sms_templates WHERE id = ?
    `, [id]);

    if (existingTemplates.length === 0) {
      throw new NotFoundError('模板不存在');
    }

    const oldTemplate = existingTemplates[0];

    if (oldTemplate.status === 2) {
      throw new BadRequestError('已激活的模板无法修改，请先禁用');
    }

    const newTemplateContent = templateContent || oldTemplate.template_content;
    const variables = extractTemplateVariables(newTemplateContent);

    const sensitiveWordResult = await checkSensitiveWords(newTemplateContent);
    if (!sensitiveWordResult.passed) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'SENSITIVE_WORD_FOUND',
          message: '模板内容包含敏感词，无法修改',
          details: sensitiveWordResult.issues,
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (templateName !== undefined) {
      updateFields.push('template_name = ?');
      updateValues.push(templateName);
    }
    if (templateContent !== undefined) {
      updateFields.push('template_content = ?');
      updateValues.push(templateContent);
      updateFields.push('variables = ?');
      updateValues.push(JSON.stringify(variables));
    }
    if (templateType !== undefined) {
      updateFields.push('template_type = ?');
      updateValues.push(templateType);
    }
    if (signName !== undefined) {
      updateFields.push('sign_name = ?');
      updateValues.push(signName);
    }

    if (updateFields.length > 0) {
      updateFields.push('status = ?');
      updateValues.push(0);

      updateValues.push(id);

      await execute(`
        UPDATE sms_templates SET ${updateFields.join(', ')} WHERE id = ?
      `, updateValues);
    }

    await createAuditLog({
      userId: userId!,
      module: 'template',
      action: 'update',
      targetType: 'sms_template',
      targetId: id,
      oldValue: JSON.stringify({
        templateName: oldTemplate.template_name,
        templateContent: oldTemplate.template_content,
        templateType: oldTemplate.template_type,
        signName: oldTemplate.sign_name,
      }),
      newValue: JSON.stringify({
        templateName: templateName || oldTemplate.template_name,
        templateContent: templateContent || oldTemplate.template_content,
        templateType: templateType || oldTemplate.template_type,
        signName: signName || oldTemplate.sign_name,
      }),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const response: ApiResponse = {
      success: true,
      data: {
        id,
        message: '模板已更新',
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

templateRouter.post(
  '/:id/activate',
  permissionMiddleware(['template:review']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const id = parseInt(req.params.id);
    const userId = req.user?.userId;

    if (isNaN(id)) {
      throw new BadRequestError('无效的模板ID');
    }

    const existingTemplates = await query(`
      SELECT * FROM sms_templates WHERE id = ?
    `, [id]);

    if (existingTemplates.length === 0) {
      throw new NotFoundError('模板不存在');
    }

    const template = existingTemplates[0];

    const sensitiveWordResult = await checkSensitiveWords(template.template_content);
    if (!sensitiveWordResult.passed) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'SENSITIVE_WORD_FOUND',
          message: '模板内容包含敏感词，无法激活',
          details: sensitiveWordResult.issues,
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    await execute(`
      UPDATE sms_templates SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?
    `, [2, userId, id]);

    await createAuditLog({
      userId: userId!,
      module: 'template',
      action: 'activate',
      targetType: 'sms_template',
      targetId: id,
      oldValue: JSON.stringify({ status: template.status }),
      newValue: JSON.stringify({ status: 2 }),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const response: ApiResponse = {
      success: true,
      data: {
        id,
        message: '模板已激活',
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

templateRouter.post(
  '/:id/deactivate',
  permissionMiddleware(['template:edit']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const id = parseInt(req.params.id);
    const userId = req.user?.userId;

    if (isNaN(id)) {
      throw new BadRequestError('无效的模板ID');
    }

    const existingTemplates = await query(`
      SELECT * FROM sms_templates WHERE id = ?
    `, [id]);

    if (existingTemplates.length === 0) {
      throw new NotFoundError('模板不存在');
    }

    const template = existingTemplates[0];

    await execute(`
      UPDATE sms_templates SET status = ? WHERE id = ?
    `, [3, id]);

    await createAuditLog({
      userId: userId!,
      module: 'template',
      action: 'deactivate',
      targetType: 'sms_template',
      targetId: id,
      oldValue: JSON.stringify({ status: template.status }),
      newValue: JSON.stringify({ status: 3 }),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const response: ApiResponse = {
      success: true,
      data: {
        id,
        message: '模板已禁用',
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

async function checkSensitiveWords(content: string): Promise<ComplianceCheckResult> {
  const sensitiveWords = await query(`
    SELECT word, level, category FROM sensitive_words WHERE status = 1
  `);

  const issues: { ruleCode: string; ruleName: string; reason: string; action: string }[] = [];

  for (const sw of sensitiveWords) {
    if (content.toLowerCase().includes(sw.word.toLowerCase())) {
      issues.push({
        ruleCode: 'sensitive_word_check',
        ruleName: '敏感词检查',
        reason: `内容包含敏感词: ${sw.word} (级别: ${sw.level}, 分类: ${sw.category})`,
        action: 'block',
      });
    }
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

async function createAuditLog(params: {
  userId: number;
  module: string;
  action: string;
  targetType?: string;
  targetId?: number;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const auditCode = generateCode('AUD');

  await execute(`
    INSERT INTO audit_logs (
      audit_code, user_id, module, action, target_type, target_id,
      old_value, new_value, ip_address, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    auditCode,
    params.userId,
    params.module,
    params.action,
    params.targetType,
    params.targetId,
    params.oldValue,
    params.newValue,
    params.ipAddress,
    params.userAgent,
  ]);
}
