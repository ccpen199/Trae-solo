import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AnalyticsService } from "../services/analytics.service";
import { AppDataSource } from "../database/data-source";
import { TalentTag, TagCategory } from "../entities/TalentTag";

export class AnalyticsController {
  public static async getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await AnalyticsService.getDashboardStats(start, end);

      res.json(stats);
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ error: "获取仪表盘统计失败" });
    }
  }

  public static async getRecruitmentFunnel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { positionId, startDate, endDate } = req.query;

      const posId = positionId ? Number(positionId) : undefined;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const funnel = await AnalyticsService.getRecruitmentFunnel(posId, start, end);

      res.json({ data: funnel });
    } catch (error) {
      console.error("Get recruitment funnel error:", error);
      res.status(500).json({ error: "获取招聘漏斗失败" });
    }
  }

  public static async getPositionHeatmap(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const heatmap = await AnalyticsService.getPositionHeatmap(start, end);

      res.json({ data: heatmap });
    } catch (error) {
      console.error("Get position heatmap error:", error);
      res.status(500).json({ error: "获取岗位热力图失败" });
    }
  }

  public static async getTalentTagStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { category } = req.query;

      const stats = await AnalyticsService.getTalentTagStats(category as string);

      res.json({ data: stats });
    } catch (error) {
      console.error("Get talent tag stats error:", error);
      res.status(500).json({ error: "获取人才标签统计失败" });
    }
  }

  public static async getTags(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { category } = req.query;

      const tagRepository = AppDataSource.getRepository(TalentTag);

      let whereClause: any = { isActive: true };
      if (category) {
        whereClause.category = category as TagCategory;
      }

      const tags = await tagRepository.find({
        where: whereClause,
        order: { usageCount: "DESC" },
      });

      res.json({ data: tags });
    } catch (error) {
      console.error("Get tags error:", error);
      res.status(500).json({ error: "获取标签列表失败" });
    }
  }

  public static async createTag(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, category, description, metadata } = req.body;

      if (!name || !category) {
        res.status(400).json({ error: "标签名称和分类不能为空" });
        return;
      }

      const tagRepository = AppDataSource.getRepository(TalentTag);

      const existing = await tagRepository.findOne({ where: { name, category: category as TagCategory } });
      if (existing) {
        res.status(400).json({ error: "该标签已存在" });
        return;
      }

      const tag = tagRepository.create({
        name,
        category: category as TagCategory,
        description,
        metadata,
        isActive: true,
        usageCount: 0,
      });

      await tagRepository.save(tag);

      res.status(201).json(tag);
    } catch (error) {
      console.error("Create tag error:", error);
      res.status(500).json({ error: "创建标签失败" });
    }
  }

  public static async updateTag(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const tagRepository = AppDataSource.getRepository(TalentTag);
      const tag = await tagRepository.findOne({ where: { id: Number(id) } });

      if (!tag) {
        res.status(404).json({ error: "标签不存在" });
        return;
      }

      Object.assign(tag, updateData);
      await tagRepository.save(tag);

      res.json(tag);
    } catch (error) {
      console.error("Update tag error:", error);
      res.status(500).json({ error: "更新标签失败" });
    }
  }

  public static async deleteTag(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const tagRepository = AppDataSource.getRepository(TalentTag);
      const tag = await tagRepository.findOne({ where: { id: Number(id) } });

      if (!tag) {
        res.status(404).json({ error: "标签不存在" });
        return;
      }

      tag.isActive = false;
      await tagRepository.save(tag);

      res.json({ message: "标签已删除" });
    } catch (error) {
      console.error("Delete tag error:", error);
      res.status(500).json({ error: "删除标签失败" });
    }
  }

  public static async getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, pageSize = 20, action, userId, startDate, endDate } = req.query;

      const auditRepository = AppDataSource.getRepository("AuditLog" as any);

      let whereClause: any = {};
      if (action) whereClause.action = action;
      if (userId) whereClause.userId = Number(userId);

      const queryBuilder = auditRepository
        .createQueryBuilder("audit")
        .where(whereClause);

      if (startDate && endDate) {
        queryBuilder.andWhere("audit.createdAt BETWEEN :start AND :end", {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        });
      }

      const [logs, total] = await queryBuilder
        .orderBy("audit.createdAt", "DESC")
        .skip((Number(page) - 1) * Number(pageSize))
        .take(Number(pageSize))
        .getManyAndCount();

      res.json({
        data: logs,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      });
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ error: "获取审计日志失败" });
    }
  }

  public static async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { role } = req.query;

      const userRepository = AppDataSource.getRepository("User" as any);

      let whereClause: any = { isActive: true };
      if (role) {
        whereClause.role = role;
      }

      const users = await userRepository.find({
        where: whereClause,
        select: ["id", "name", "email", "phone", "role", "department", "avatar"],
        order: { name: "ASC" },
      });

      res.json({ data: users });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "获取用户列表失败" });
    }
  }
}
