import { Response } from "express";
import { AppDataSource } from "../database/data-source";
import { Position, PositionStatus, PositionChannel } from "../entities/Position";
import { AuthRequest } from "../middleware/auth";
import { auditLog } from "../middleware/audit";
import { Approval } from "../entities/Approval";

export class PositionController {
  public static async createPosition(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      const {
        title,
        department,
        jobType,
        location,
        description,
        requirements,
        benefits,
        headcount,
        salaryMin,
        salaryMax,
        experienceMin,
        experienceMax,
        education,
        keywords,
        publishChannels,
        skillTags,
        hiringManagerId,
      } = req.body;

      if (!title || !department) {
        res.status(400).json({ error: "职位名称和部门不能为空" });
        return;
      }

      const positionRepository = AppDataSource.getRepository(Position);

      const position = positionRepository.create({
        title,
        department,
        jobType,
        location,
        description,
        requirements,
        benefits,
        headcount: headcount || 1,
        salaryMin,
        salaryMax,
        experienceMin,
        experienceMax,
        education,
        keywords,
        publishChannels,
        skillTags,
        status: "draft",
        createdById: req.user.id,
        hiringManagerId: hiringManagerId || req.user.id,
        publishStatus: {},
      });

      await positionRepository.save(position);

      await auditLog("position_create", req, position.id, "Position", undefined, position, "创建职位");

      res.status(201).json(position);
    } catch (error) {
      console.error("Create position error:", error);
      res.status(500).json({ error: "创建职位失败" });
    }
  }

  public static async getPositions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, pageSize = 20, status, department, keyword } = req.query;

      const positionRepository = AppDataSource.getRepository(Position);

      let whereClause: any = {};
      if (status) {
        whereClause.status = status as PositionStatus;
      }
      if (department) {
        whereClause.department = department as string;
      }

      const queryBuilder = positionRepository
        .createQueryBuilder("position")
        .leftJoinAndSelect("position.createdBy", "createdBy")
        .leftJoinAndSelect("position.hiringManager", "hiringManager")
        .where(whereClause);

      if (keyword) {
        queryBuilder.andWhere(
          "(position.title LIKE :keyword OR position.department LIKE :keyword OR position.description LIKE :keyword)",
          { keyword: `%${keyword}%` }
        );
      }

      const [positions, total] = await queryBuilder
        .orderBy("position.createdAt", "DESC")
        .skip((Number(page) - 1) * Number(pageSize))
        .take(Number(pageSize))
        .getManyAndCount();

      res.json({
        data: positions,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      });
    } catch (error) {
      console.error("Get positions error:", error);
      res.status(500).json({ error: "获取职位列表失败" });
    }
  }

  public static async getPositionById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const positionRepository = AppDataSource.getRepository(Position);
      const position = await positionRepository.findOne({
        where: { id: Number(id) },
        relations: ["createdBy", "hiringManager", "candidates"],
      });

      if (!position) {
        res.status(404).json({ error: "职位不存在" });
        return;
      }

      res.json(position);
    } catch (error) {
      console.error("Get position error:", error);
      res.status(500).json({ error: "获取职位详情失败" });
    }
  }

  public static async updatePosition(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const positionRepository = AppDataSource.getRepository(Position);
      const position = await positionRepository.findOne({ where: { id: Number(id) } });

      if (!position) {
        res.status(404).json({ error: "职位不存在" });
        return;
      }

      const oldValue = { ...position };

      Object.assign(position, updateData);
      await positionRepository.save(position);

      await auditLog("position_update", req, position.id, "Position", oldValue, position, "更新职位");

      res.json(position);
    } catch (error) {
      console.error("Update position error:", error);
      res.status(500).json({ error: "更新职位失败" });
    }
  }

  public static async submitForApproval(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      const { id } = req.params;
      const { approverId } = req.body;

      const positionRepository = AppDataSource.getRepository(Position);
      const position = await positionRepository.findOne({ where: { id: Number(id) } });

      if (!position) {
        res.status(404).json({ error: "职位不存在" });
        return;
      }

      if (position.status !== "draft") {
        res.status(400).json({ error: "只有草稿状态的职位可以提交审批" });
        return;
      }

      position.status = "pending_approval";
      await positionRepository.save(position);

      const approvalRepository = AppDataSource.getRepository(Approval);
      const approval = approvalRepository.create({
        type: "position_publish",
        status: "pending",
        applicantId: req.user.id,
        approverId: approverId || 1,
        positionId: position.id,
        reason: "职位发布审批",
        approvalOrder: 1,
      });

      await approvalRepository.save(approval);

      await auditLog("position_publish", req, position.id, "Position", undefined, { status: "pending_approval" }, "提交职位发布审批");

      res.json({ message: "已提交审批", position, approval });
    } catch (error) {
      console.error("Submit for approval error:", error);
      res.status(500).json({ error: "提交审批失败" });
    }
  }

  public static async publishPosition(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { channels } = req.body;

      const positionRepository = AppDataSource.getRepository(Position);
      const position = await positionRepository.findOne({ where: { id: Number(id) } });

      if (!position) {
        res.status(404).json({ error: "职位不存在" });
        return;
      }

      const publishChannels: PositionChannel[] = channels || ["boss", "51job", "internal"];
      const publishStatus: Record<string, { published: boolean; url?: string; publishedAt?: Date }> = {};

      for (const channel of publishChannels) {
        publishStatus[channel] = {
          published: true,
          url: `https://example.com/jobs/${channel}/${position.id}`,
          publishedAt: new Date(),
        };
      }

      position.status = "published";
      position.publishChannels = publishChannels;
      position.publishStatus = publishStatus;

      await positionRepository.save(position);

      await auditLog("position_publish", req, position.id, "Position", undefined, { status: "published", channels: publishChannels }, "发布职位");

      res.json({ message: "职位已发布", position });
    } catch (error) {
      console.error("Publish position error:", error);
      res.status(500).json({ error: "发布职位失败" });
    }
  }

  public static async closePosition(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const positionRepository = AppDataSource.getRepository(Position);
      const position = await positionRepository.findOne({ where: { id: Number(id) } });

      if (!position) {
        res.status(404).json({ error: "职位不存在" });
        return;
      }

      position.status = "closed";
      position.closedAt = new Date();

      await positionRepository.save(position);

      await auditLog("position_delete", req, position.id, "Position", undefined, { status: "closed" }, "关闭职位");

      res.json({ message: "职位已关闭", position });
    } catch (error) {
      console.error("Close position error:", error);
      res.status(500).json({ error: "关闭职位失败" });
    }
  }

  public static async syncToATS(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const positionRepository = AppDataSource.getRepository(Position);
      const position = await positionRepository.findOne({ where: { id: Number(id) } });

      if (!position) {
        res.status(404).json({ error: "职位不存在" });
        return;
      }

      await auditLog("ats_sync", req, position.id, "Position", undefined, { atsSynced: true }, "同步职位到ATS");

      res.json({
        message: "已同步到ATS系统（模拟）",
        atsId: `ATS-${position.id}-${Date.now()}`,
        syncedAt: new Date(),
      });
    } catch (error) {
      console.error("Sync to ATS error:", error);
      res.status(500).json({ error: "同步到ATS失败" });
    }
  }

  public static async generateJobDescription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, department, keywords } = req.body;

      const generatedJD = `
【${title}】

**部门**：${department}
**工作地点**：上海
**薪资范围**：面议

**岗位职责**：
1. 负责${title}相关的日常工作
2. 参与项目设计、开发和优化
3. 与团队成员紧密协作，共同完成项目目标
4. 持续学习和研究新技术，提升团队技术水平

**任职要求**：
1. 本科及以上学历，相关专业背景
2. 3年以上相关工作经验
3. 熟悉${(keywords || []).join("、")}等技术栈
4. 具备良好的沟通能力和团队协作精神
5. 有较强的学习能力和问题解决能力

**我们提供**：
- 具有竞争力的薪资待遇
- 完善的五险一金
- 年度体检
- 带薪年假
- 丰富的团队活动
      `;

      res.json({
        title,
        department,
        description: generatedJD.trim(),
        requirements: "1. 本科及以上学历\n2. 3年以上相关工作经验\n3. 具备良好的沟通能力",
        benefits: "五险一金、带薪年假、年度体检、团队活动",
      });
    } catch (error) {
      console.error("Generate JD error:", error);
      res.status(500).json({ error: "生成职位描述失败" });
    }
  }
}
