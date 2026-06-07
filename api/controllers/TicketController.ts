import type { Request, Response } from 'express';
import { TicketService } from '../services/TicketService.js';
import { TicketAssignService } from '../services/TicketAssignService.js';
import { AISummarizeService } from '../services/AISummarizeService.js';
import type { WorkTicket } from '../types/index.js';

export class TicketController {
  private ticketService: TicketService;
  private ticketAssignService: TicketAssignService;
  private aiSummarizeService: AISummarizeService;

  constructor() {
    this.ticketService = new TicketService();
    this.ticketAssignService = new TicketAssignService();
    this.aiSummarizeService = new AISummarizeService();
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未登录',
        });
        return;
      }

      const { title, description, type, priority, unit_id, location, contact_name, contact_phone, skills_required } = req.body;

      if (!title || !description || !type) {
        res.status(400).json({
          success: false,
          error: '请填写完整信息',
        });
        return;
      }

      const ticketData: Omit<WorkTicket, 'id' | 'created_at' | 'updated_at'> = {
        title,
        description,
        type,
        priority: priority || 'medium',
        status: 'pending',
        reporter_id: req.user.id,
        unit_id,
        location,
        contact_name,
        contact_phone,
        skills_required,
      };

      const ticketId = this.ticketService.createTicket(ticketData);

      const ticket = this.ticketService.getTicketById(ticketId);
      if (ticket) {
        const summary = this.aiSummarizeService.summarizeTicket(ticket);
        res.status(201).json({
          success: true,
          data: {
            ticket,
            ai_summary: summary,
          },
        });
      } else {
        res.status(201).json({
          success: true,
          data: { id: ticketId },
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '创建工单失败',
      });
    }
  }

  public async list(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 10;
      
      const filters: Record<string, unknown> = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.type) filters.type = req.query.type;
      if (req.query.priority) filters.priority = req.query.priority;
      if (req.query.assignee_id) filters.assignee_id = parseInt(req.query.assignee_id as string);
      if (req.query.reporter_id) filters.reporter_id = parseInt(req.query.reporter_id as string);

      const result = this.ticketService.getTickets(page, pageSize, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取工单列表失败',
      });
    }
  }

  public async get(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的工单ID',
        });
        return;
      }

      const ticket = this.ticketService.getTicketById(id);

      if (!ticket) {
        res.status(404).json({
          success: false,
          error: '工单不存在',
        });
        return;
      }

      res.json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取工单详情失败',
      });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的工单ID',
        });
        return;
      }

      const ticket = this.ticketService.getTicketById(id);
      if (!ticket) {
        res.status(404).json({
          success: false,
          error: '工单不存在',
        });
        return;
      }

      const { title, description, type, priority, status, unit_id, location, contact_name, contact_phone, skills_required } = req.body;

      const updateData: Partial<WorkTicket> = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (type !== undefined) updateData.type = type;
      if (priority !== undefined) updateData.priority = priority;
      if (status !== undefined) updateData.status = status;
      if (unit_id !== undefined) updateData.unit_id = unit_id;
      if (location !== undefined) updateData.location = location;
      if (contact_name !== undefined) updateData.contact_name = contact_name;
      if (contact_phone !== undefined) updateData.contact_phone = contact_phone;
      if (skills_required !== undefined) updateData.skills_required = skills_required;

      const success = this.ticketService.updateTicket(id, updateData);

      if (!success) {
        res.status(400).json({
          success: false,
          error: '更新工单失败',
        });
        return;
      }

      res.json({
        success: true,
        message: '更新成功',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '更新工单失败',
      });
    }
  }

  public async assign(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的工单ID',
        });
        return;
      }

      const ticket = this.ticketService.getTicketById(id);
      if (!ticket) {
        res.status(404).json({
          success: false,
          error: '工单不存在',
        });
        return;
      }

      const { assignee_id, auto } = req.body;

      if (auto) {
        const assignResult = this.ticketAssignService.autoAssign(ticket);
        if (!assignResult) {
          res.status(400).json({
            success: false,
            error: '没有可用的处理人员',
          });
          return;
        }

        const success = this.ticketService.assignTicket(id, assignResult.assignee_id);
        if (success) {
          res.json({
            success: true,
            data: assignResult,
          });
        } else {
          res.status(400).json({
            success: false,
            error: '分派失败',
          });
        }
      } else {
        if (!assignee_id) {
          res.status(400).json({
            success: false,
            error: '请指定处理人员',
          });
          return;
        }

        const success = this.ticketService.assignTicket(id, assignee_id);
        if (success) {
          res.json({
            success: true,
            message: '分派成功',
          });
        } else {
          res.status(400).json({
            success: false,
            error: '分派失败',
          });
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '分派工单失败',
      });
    }
  }

  public async getAssignCandidates(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的工单ID',
        });
        return;
      }

      const ticket = this.ticketService.getTicketById(id);
      if (!ticket) {
        res.status(404).json({
          success: false,
          error: '工单不存在',
        });
        return;
      }

      const candidates = this.ticketAssignService.getCandidateScores(ticket);

      res.json({
        success: true,
        data: candidates,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取分派候选人失败',
      });
    }
  }

  public async start(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的工单ID',
        });
        return;
      }

      const success = this.ticketService.startTicket(id);

      if (!success) {
        res.status(400).json({
          success: false,
          error: '开始处理失败',
        });
        return;
      }

      res.json({
        success: true,
        message: '已开始处理',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '操作失败',
      });
    }
  }

  public async complete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的工单ID',
        });
        return;
      }

      const { rating, feedback } = req.body;

      const success = this.ticketService.completeTicket(id, rating, feedback);

      if (!success) {
        res.status(400).json({
          success: false,
          error: '完成工单失败',
        });
        return;
      }

      res.json({
        success: true,
        message: '工单已完成',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '操作失败',
      });
    }
  }

  public async cancel(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的工单ID',
        });
        return;
      }

      const success = this.ticketService.cancelTicket(id);

      if (!success) {
        res.status(400).json({
          success: false,
          error: '取消工单失败',
        });
        return;
      }

      res.json({
        success: true,
        message: '工单已取消',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '操作失败',
      });
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的工单ID',
        });
        return;
      }

      const success = this.ticketService.deleteTicket(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: '工单不存在',
        });
        return;
      }

      res.json({
        success: true,
        message: '删除成功',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '删除工单失败',
      });
    }
  }

  public async stats(req: Request, res: Response): Promise<void> {
    try {
      const stats = this.ticketService.getTicketStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取统计数据失败',
      });
    }
  }

  public async summarize(req: Request, res: Response): Promise<void> {
    try {
      const { text } = req.body;

      if (!text) {
        res.status(400).json({
          success: false,
          error: '请提供要摘要的文本',
        });
        return;
      }

      const summary = this.aiSummarizeService.summarizeText(text);
      const autoReply = this.aiSummarizeService.generateAutoReply(summary);

      res.json({
        success: true,
        data: {
          summary,
          auto_reply: autoReply,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '摘要生成失败',
      });
    }
  }
}

export default TicketController;
