import { Router, Response, Request } from 'express';
import { param, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest, auditMiddleware } from '../middleware';
import { logger } from '../lib/logger';
import { analyticsTrackerEngine } from '../engines/analytics-tracker.engine';
import { deliverabilityOptEngine } from '../engines/deliverability-opt.engine';
import { marketingAutomationEngine } from '../engines/marketing-automation.engine';

const router = Router();

router.get(
  '/open/:trackingId.gif',
  [param('trackingId').notEmpty().withMessage('无效的追踪ID')],
  async (req: Request, res: Response) => {
    try {
      const { trackingId } = req.params;
      
      const event = {
        trackingId,
        ipAddress: req.ip || req.socket.remoteAddress || undefined,
        userAgent: req.headers['user-agent'],
        timestamp: new Date(),
      };
      
      await analyticsTrackerEngine.trackOpen(event);
      
      const transparentGif = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
        'base64'
      );
      
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.send(transparentGif);
    } catch (error) {
      logger.error('Track open error:', error);
      
      const transparentGif = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
        'base64'
      );
      res.setHeader('Content-Type', 'image/gif');
      res.send(transparentGif);
    }
  }
);

router.get(
  '/click/:trackingId/:linkIndex',
  [
    param('trackingId').notEmpty().withMessage('无效的追踪ID'),
    param('linkIndex').isInt().withMessage('无效的链接索引'),
  ],
  async (req: Request, res: Response) => {
    try {
      const { trackingId, linkIndex } = req.params;
      
      const event = {
        trackingId,
        linkIndex: parseInt(linkIndex, 10),
        ipAddress: req.ip || req.socket.remoteAddress || undefined,
        userAgent: req.headers['user-agent'],
        referrer: req.headers.referer,
        timestamp: new Date(),
      };
      
      const result = await analyticsTrackerEngine.trackClick(event);
      
      if (result.success && result.originalUrl) {
        res.redirect(result.originalUrl);
      } else {
        res.status(404).send('链接不存在或已失效');
      }
    } catch (error) {
      logger.error('Track click error:', error);
      res.status(500).send('处理点击时发生错误');
    }
  }
);

router.get(
  '/unsubscribe/:trackingId',
  [param('trackingId').notEmpty().withMessage('无效的追踪ID')],
  async (req: Request, res: Response) => {
    try {
      const { trackingId } = req.params;
      const { reason } = req.query;
      
      const result = await analyticsTrackerEngine.trackUnsubscribe(
        trackingId,
        reason as string,
        req.ip || req.socket.remoteAddress || undefined
      );
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>退订确认</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .success { color: #2e7d32; background: #e8f5e9; padding: 20px; border-radius: 8px; }
            .error { color: #c62828; background: #ffebee; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          ${result.success 
            ? `<div class="success"><h1>退订成功</h1><p>您已成功退订我们的邮件列表。</p><p>如果您改变主意，可以随时重新订阅。</p></div>`
            : `<div class="error"><h1>退订失败</h1><p>${result.explanation || '无法完成退订操作'}</p></div>`
          }
        </body>
        </html>
      `;
      
      res.send(html);
    } catch (error) {
      logger.error('Unsubscribe error:', error);
      res.status(500).send('<h1>处理退订时发生错误</h1>');
    }
  }
);

router.use(authMiddleware);

router.get(
  '/campaign/:campaignId/stats',
  [param('campaignId').isUUID().withMessage('无效的活动ID')],
  auditMiddleware('GET_CAMPAIGN_STATS', 'Campaign'),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }
      
      const { campaignId } = req.params;
      
      const stats = await analyticsTrackerEngine.getCampaignStats(campaignId);
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Get campaign stats error:', error);
      res.status(500).json({
        success: false,
        error: '获取统计数据失败',
      });
    }
  }
);

router.get(
  '/reputation',
  auditMiddleware('GET_REPUTATION', 'System'),
  async (_req: AuthRequest, res: Response) => {
    try {
      const reputation = await deliverabilityOptEngine.getSenderReputation();
      
      res.json({
        success: true,
        data: reputation,
      });
    } catch (error) {
      logger.error('Get reputation error:', error);
      res.status(500).json({
        success: false,
        error: '获取发件人声誉失败',
      });
    }
  }
);

router.get(
  '/engagement/:memberId',
  [param('memberId').isUUID().withMessage('无效的成员ID')],
  auditMiddleware('GET_ENGAGEMENT', 'AudienceMember'),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }
      
      const { memberId } = req.params;
      
      const engagement = await deliverabilityOptEngine.getEngagementScore(memberId);
      
      res.json({
        success: true,
        data: engagement,
      });
    } catch (error) {
      logger.error('Get engagement error:', error);
      res.status(500).json({
        success: false,
        error: '获取活跃度数据失败',
      });
    }
  }
);

router.post(
  '/journey/execute',
  auditMiddleware('EXECUTE_JOURNEY', 'Journey'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { journeyId, memberId, nodeId } = req.body;
      
      if (!journeyId || !memberId) {
        return res.status(400).json({
          success: false,
          error: '缺少必要参数',
        });
      }
      
      let result;
      
      if (nodeId) {
        const context = await marketingAutomationEngine.startJourney(journeyId, memberId);
        result = await marketingAutomationEngine.executeNode(context, nodeId);
      } else {
        result = await marketingAutomationEngine.startJourney(journeyId, memberId);
      }
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Execute journey error:', error);
      res.status(500).json({
        success: false,
        error: '执行旅程失败',
      });
    }
  }
);

router.get(
  '/journey/progress/:executionId',
  [param('executionId').isUUID().withMessage('无效的执行ID')],
  auditMiddleware('GET_JOURNEY_PROGRESS', 'Journey'),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }
      
      const { executionId } = req.params;
      
      const progress = await marketingAutomationEngine.getExecutionProgress(executionId);
      
      if (!progress) {
        return res.status(404).json({
          success: false,
          error: '执行记录不存在',
        });
      }
      
      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      logger.error('Get journey progress error:', error);
      res.status(500).json({
        success: false,
        error: '获取旅程进度失败',
      });
    }
  }
);

router.get(
  '/logs/:sendLogId/explanation',
  [param('sendLogId').isUUID().withMessage('无效的发送日志ID')],
  auditMiddleware('GET_LOG_EXPLANATION', 'SendLog'),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }
      
      const { sendLogId } = req.params;
      
      const sendLog = await prisma.sendLog.findUnique({
        where: { id: sendLogId },
        include: {
          batch: {
            include: {
              campaign: true,
            },
          },
          member: true,
          clickLogs: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      
      if (!sendLog) {
        return res.status(404).json({
          success: false,
          error: '发送日志不存在',
        });
      }
      
      const explanation = [
        '【发送记录详情说明】',
        '',
        `发送记录ID: ${sendLog.id}`,
        `追踪ID: ${sendLog.trackingId}`,
        `目标邮箱: ${sendLog.email}`,
        `邮件主题: ${sendLog.subject || 'N/A'}`,
        '',
        '=== 状态时间线 ===',
        `创建时间: ${sendLog.createdAt.toISOString()}`,
        sendLog.sentAt ? `发送时间: ${sendLog.sentAt.toISOString()}` : '发送时间: 未发送',
        sendLog.deliveredAt ? `送达时间: ${sendLog.deliveredAt.toISOString()}` : '送达时间: 未送达',
        sendLog.openedAt ? `打开时间: ${sendLog.openedAt.toISOString()}` : '打开时间: 未打开',
        sendLog.clickedAt ? `点击时间: ${sendLog.clickedAt.toISOString()}` : '点击时间: 未点击',
        sendLog.bouncedAt ? `退信时间: ${sendLog.bouncedAt.toISOString()}` : '退信时间: 无',
        sendLog.unsubscribedAt ? `退订时间: ${sendLog.unsubscribedAt.toISOString()}` : '退订时间: 无',
        '',
        '=== 状态说明 ===',
        `当前状态: ${sendLog.status}`,
        '',
        '状态流转说明:',
        `  PENDING: 待发送`,
        `  SENDING: 发送中`,
        `  SENT: 已发送`,
        `  DELIVERED: 已送达`,
        `  OPENED: 已打开`,
        `  CLICKED: 已点击`,
        `  BOUNCED: 已退信`,
        `  UNSUBSCRIBED: 已退订`,
        `  FAILED: 发送失败`,
        `  SPAM: 标记为垃圾邮件`,
        '',
        '=== 用户画像 ===',
        `用户ID: ${sendLog.memberId}`,
        `姓名: ${sendLog.member.name || 'N/A'}`,
        `公司: ${sendLog.member.company || 'N/A'}`,
        `职位: ${sendLog.member.position || 'N/A'}`,
        `国家: ${sendLog.member.country || 'N/A'}`,
        `城市: ${sendLog.member.city || 'N/A'}`,
        `标签: ${sendLog.member.tags ? JSON.stringify(sendLog.member.tags) : '无'}`,
        '',
        '=== 活跃度统计 ===',
        `累计发送: ${sendLog.member.totalSent} 封`,
        `累计打开: ${sendLog.member.totalOpens} 次`,
        `累计点击: ${sendLog.member.totalClicks} 次`,
        `订阅状态: ${sendLog.member.isSubscribed ? '已订阅' : '已退订'}`,
        `最后活跃: ${sendLog.member.lastActivityAt ? sendLog.member.lastActivityAt.toISOString() : '无'}`,
        '',
        '=== 点击记录 ===',
      ];
      
      if (sendLog.clickLogs.length > 0) {
        sendLog.clickLogs.forEach((log, index) => {
          explanation.push(`  ${index + 1}. 点击时间: ${log.createdAt.toISOString()}`);
          explanation.push(`     原始URL: ${log.originalUrl}`);
          explanation.push(`     独立点击: ${log.isUnique ? '是' : '否'}`);
          explanation.push(`     IP地址: ${log.ipAddress || 'N/A'}`);
          if (log.deviceInfo) {
            const device = log.deviceInfo as Record<string, string>;
            explanation.push(`     设备: ${device.device || 'N/A'} / ${device.browser || 'N/A'} / ${device.os || 'N/A'}`);
          }
        });
      } else {
        explanation.push('  暂无点击记录');
      }
      
      if (sendLog.errorMessage) {
        explanation.push('');
        explanation.push('=== 错误信息 ===');
        explanation.push(sendLog.errorMessage);
      }
      
      if (sendLog.bounceReason) {
        explanation.push('');
        explanation.push('=== 退信原因 ===');
        explanation.push(sendLog.bounceReason);
      }
      
      res.json({
        success: true,
        data: {
          sendLog,
          explanation: explanation.join('\n'),
        },
      });
    } catch (error) {
      logger.error('Get log explanation error:', error);
      res.status(500).json({
        success: false,
        error: '获取发送日志说明失败',
      });
    }
  }
);

export default router;
