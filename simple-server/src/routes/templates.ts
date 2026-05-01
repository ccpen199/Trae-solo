import { Router } from 'express';
import { getDatabase } from '../database';
import { logger } from '../logger';
import { generateCode, extractTemplateVariables, buildPagination } from '../utils';
import { asyncHandler, AuthenticatedRequest, authMiddleware, permissionMiddleware } from '../middleware';
import { NotFoundError, BadRequestError } from '../errors';

export const templateRouter = Router();

templateRouter.use(authMiddleware);

templateRouter.get(
  '/',
  permissionMiddleware(['template:view']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string;
    const templateType = req.query.templateType as string;
    const keyword = req.query.keyword as string;

    const db = getDatabase();

    let whereClause = '1=1';
    const params: any[] = [];

    if (status !== undefined) {
      whereClause += ' AND status = ?';
      params.push(parseInt(status));
    }

    if (templateType) {
      whereClause += ' AND template_type = ?';
      params.push(templateType);
    }

    if (keyword) {
      whereClause += ' AND (template_name LIKE ? OR template_code LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM sms_templates WHERE ${whereClause}
    `).get(...params);

    const total = countResult.total;
    const { offset, limit, totalPages } = buildPagination(page, pageSize, total);

    const templates = db.prepare(`
      SELECT 
        id, template_code, template_name, template_content, template_type,
        sign_name, variables, status, operator_id, reviewed_by, reviewed_at,
        review_reason, created_at, updated_at
      FROM sms_templates
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const response = {
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

templateRouter.post(
  '/',
  permissionMiddleware(['template:create']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { templateName, templateContent, templateType, signName } = req.body;
    const userId = req.user?.userId;

    if (!templateName || !templateContent || !templateType) {
      throw new BadRequestError('模板名称、内容和类型不能为空');
    }

    const db = getDatabase();

    const sensitiveWords = db.prepare('SELECT word FROM sensitive_words').all();
    for (const sw of sensitiveWords) {
      if (templateContent.toLowerCase().includes(sw.word.toLowerCase())) {
        const response = {
          success: false,
          error: {
            code: 'SENSITIVE_WORD_FOUND',
            message: `模板内容包含敏感词: ${sw.word}`,
          },
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }
    }

    const variables = extractTemplateVariables(templateContent);
    const templateCode = generateCode('TPL');

    const result = db.prepare(`
      INSERT INTO sms_templates (
        template_code, template_name, template_content, template_type,
        sign_name, variables, status, operator_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      templateCode,
      templateName,
      templateContent,
      templateType,
      signName || null,
      JSON.stringify(variables),
      0,
      userId
    );

    db.prepare(`
      INSERT INTO audit_logs (
        audit_code, user_id, module, action, target_type, target_id,
        new_value, ip_address, created_at
      ) VALUES (?, ?, 'template', 'create', 'sms_template', ?, ?, ?, datetime('now'))
    `).run(
      generateCode('AUD'),
      userId,
      result.lastInsertRowid,
      JSON.stringify({ templateCode, templateName, templateContent, templateType }),
      req.ip
    );

    const response = {
      success: true,
      data: {
        id: result.lastInsertRowid,
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

templateRouter.post(
  '/:id/activate',
  permissionMiddleware(['template:edit']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const id = parseInt(req.params.id);
    const userId = req.user?.userId;

    if (isNaN(id)) {
      throw new BadRequestError('无效的模板ID');
    }

    const db = getDatabase();

    const template = db.prepare('SELECT * FROM sms_templates WHERE id = ?').get(id);
    if (!template) {
      throw new NotFoundError('模板不存在');
    }

    const sensitiveWords = db.prepare('SELECT word FROM sensitive_words').all();
    for (const sw of sensitiveWords) {
      if (template.template_content.toLowerCase().includes(sw.word.toLowerCase())) {
        const response = {
          success: false,
          error: {
            code: 'SENSITIVE_WORD_FOUND',
            message: `模板内容包含敏感词: ${sw.word}，无法激活`,
          },
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }
    }

    db.prepare(`
      UPDATE sms_templates SET status = 2, reviewed_by = ?, reviewed_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(userId, id);

    db.prepare(`
      INSERT INTO audit_logs (
        audit_code, user_id, module, action, target_type, target_id,
        old_value, new_value, ip_address, created_at
      ) VALUES (?, ?, 'template', 'activate', 'sms_template', ?, ?, ?, ?, datetime('now'))
    `).run(
      generateCode('AUD'),
      userId,
      id,
      JSON.stringify({ status: template.status }),
      JSON.stringify({ status: 2 }),
      req.ip
    );

    const response = {
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

    const db = getDatabase();

    const template = db.prepare('SELECT * FROM sms_templates WHERE id = ?').get(id);
    if (!template) {
      throw new NotFoundError('模板不存在');
    }

    db.prepare(`
      UPDATE sms_templates SET status = 3, updated_at = datetime('now') WHERE id = ?
    `).run(id);

    db.prepare(`
      INSERT INTO audit_logs (
        audit_code, user_id, module, action, target_type, target_id,
        old_value, new_value, ip_address, created_at
      ) VALUES (?, ?, 'template', 'deactivate', 'sms_template', ?, ?, ?, ?, datetime('now'))
    `).run(
      generateCode('AUD'),
      userId,
      id,
      JSON.stringify({ status: template.status }),
      JSON.stringify({ status: 3 }),
      req.ip
    );

    const response = {
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

templateRouter.get(
  '/:id',
  permissionMiddleware(['template:view']),
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new BadRequestError('无效的模板ID');
    }

    const db = getDatabase();
    const template = db.prepare(`
      SELECT * FROM sms_templates WHERE id = ?
    `).get(id);

    if (!template) {
      throw new NotFoundError('模板不存在');
    }

    const response = {
      success: true,
      data: {
        id: template.id,
        templateCode: template.template_code,
        templateName: template.template_name,
        templateContent: template.template_content,
        templateType: template.template_type,
        signName: template.sign_name,
        variables: template.variables ? JSON.parse(template.variables) : null,
        status: template.status,
        operatorId: template.operator_id,
        reviewedBy: template.reviewed_by,
        reviewedAt: template.reviewed_at,
        reviewReason: template.review_reason,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

templateRouter.put(
  '/:id',
  permissionMiddleware(['template:edit']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const id = parseInt(req.params.id);
    const userId = req.user?.userId;
    const { templateName, templateContent, templateType, signName } = req.body;

    if (isNaN(id)) {
      throw new BadRequestError('无效的模板ID');
    }

    const db = getDatabase();
    const oldTemplate = db.prepare('SELECT * FROM sms_templates WHERE id = ?').get(id);

    if (!oldTemplate) {
      throw new NotFoundError('模板不存在');
    }

    if (oldTemplate.status === 2) {
      throw new BadRequestError('已激活的模板无法修改，请先禁用');
    }

    const newTemplateContent = templateContent || oldTemplate.template_content;

    if (templateContent) {
      const sensitiveWords = db.prepare('SELECT word FROM sensitive_words').all();
      for (const sw of sensitiveWords) {
        if (newTemplateContent.toLowerCase().includes(sw.word.toLowerCase())) {
          const response = {
            success: false,
            error: {
              code: 'SENSITIVE_WORD_FOUND',
              message: `模板内容包含敏感词: ${sw.word}`,
            },
            timestamp: new Date().toISOString(),
          };
          res.status(400).json(response);
          return;
        }
      }
    }

    const variables = extractTemplateVariables(newTemplateContent);

    const updates: string[] = [];
    const params: any[] = [];

    if (templateName !== undefined) {
      updates.push('template_name = ?');
      params.push(templateName);
    }
    if (templateContent !== undefined) {
      updates.push('template_content = ?');
      params.push(templateContent);
      updates.push('variables = ?');
      params.push(JSON.stringify(variables));
    }
    if (templateType !== undefined) {
      updates.push('template_type = ?');
      params.push(templateType);
    }
    if (signName !== undefined) {
      updates.push('sign_name = ?');
      params.push(signName);
    }

    if (updates.length > 0) {
      updates.push('status = 0');
      updates.push('updated_at = datetime("now")');
      params.push(id);

      db.prepare(`
        UPDATE sms_templates SET ${updates.join(', ')} WHERE id = ?
      `).run(...params);
    }

    db.prepare(`
      INSERT INTO audit_logs (
        audit_code, user_id, module, action, target_type, target_id,
        old_value, new_value, ip_address, created_at
      ) VALUES (?, ?, 'template', 'update', 'sms_template', ?, ?, ?, ?, datetime('now'))
    `).run(
      generateCode('AUD'),
      userId,
      id,
      JSON.stringify({
        templateName: oldTemplate.template_name,
        templateContent: oldTemplate.template_content,
        templateType: oldTemplate.template_type,
        signName: oldTemplate.sign_name,
      }),
      JSON.stringify({
        templateName: templateName || oldTemplate.template_name,
        templateContent: templateContent || oldTemplate.template_content,
        templateType: templateType || oldTemplate.template_type,
        signName: signName || oldTemplate.sign_name,
      }),
      req.ip
    );

    const response = {
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
