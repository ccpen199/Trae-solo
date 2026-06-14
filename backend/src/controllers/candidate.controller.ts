import { Response } from "express";
import { AppDataSource } from "../database/data-source";
import { Candidate, CandidateStage } from "../entities/Candidate";
import { AuthRequest } from "../middleware/auth";
import { auditLog } from "../middleware/audit";
import { AIScreeningService } from "../services/aiScreening.service";
import { Resume } from "../entities/Resume";
import * as path from "path";
import * as fs from "fs";

export class CandidateController {
  public static async createCandidate(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      const {
        name,
        phone,
        email,
        gender,
        age,
        location,
        education,
        graduationSchool,
        major,
        yearsOfExperience,
        currentCompany,
        currentPosition,
        expectedSalaryMin,
        expectedSalaryMax,
        positionId,
        skillTags,
        source,
        notes,
        talentProfile,
      } = req.body;

      if (!name || !phone || !positionId) {
        res.status(400).json({ error: "姓名、电话和职位ID不能为空" });
        return;
      }

      const candidateRepository = AppDataSource.getRepository(Candidate);

      const existing = await candidateRepository.findOne({
        where: [{ phone }, { email }],
      });

      if (existing) {
        res.status(400).json({ error: "该候选人已存在" });
        return;
      }

      const candidate = candidateRepository.create({
        name,
        phone,
        email,
        gender,
        age,
        location,
        education,
        graduationSchool,
        major,
        yearsOfExperience,
        currentCompany,
        currentPosition,
        expectedSalaryMin,
        expectedSalaryMax,
        positionId,
        skillTags,
        source: source || "manual",
        notes,
        talentProfile,
        stage: "applied",
        onboardingChecklist: [],
      });

      await candidateRepository.save(candidate);

      await auditLog("candidate_create", req, candidate.id, "Candidate", undefined, candidate, "创建候选人");

      res.status(201).json(candidate);
    } catch (error) {
      console.error("Create candidate error:", error);
      res.status(500).json({ error: "创建候选人失败" });
    }
  }

  public static async getCandidates(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, pageSize = 20, stage, positionId, keyword, sortBy = "createdAt", sortOrder = "DESC" } = req.query;
      const allowedSortFields = new Set([
        "createdAt",
        "updatedAt",
        "name",
        "stage",
        "age",
        "yearsOfExperience",
        "expectedSalaryMin",
        "expectedSalaryMax",
      ]);
      const requestedSortBy = Array.isArray(sortBy) ? sortBy[0] : sortBy;
      const requestedSortOrder = Array.isArray(sortOrder) ? sortOrder[0] : sortOrder;
      const safeSortBy = allowedSortFields.has(String(requestedSortBy)) ? String(requestedSortBy) : "createdAt";
      const safeSortOrder = String(requestedSortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";

      const candidateRepository = AppDataSource.getRepository(Candidate);

      let whereClause: any = {};
      if (stage) {
        whereClause.stage = stage as CandidateStage;
      }
      if (positionId) {
        whereClause.positionId = Number(positionId);
      }

      const queryBuilder = candidateRepository
        .createQueryBuilder("candidate")
        .leftJoinAndSelect("candidate.position", "position")
        .where(whereClause);

      if (keyword) {
        queryBuilder.andWhere(
          "(candidate.name LIKE :keyword OR candidate.phone LIKE :keyword OR candidate.email LIKE :keyword OR candidate.currentCompany LIKE :keyword)",
          { keyword: `%${keyword}%` }
        );
      }

      const [candidates, total] = await queryBuilder
        .orderBy(`candidate.${safeSortBy}`, safeSortOrder)
        .skip((Number(page) - 1) * Number(pageSize))
        .take(Number(pageSize))
        .getManyAndCount();

      res.json({
        data: candidates,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      });
    } catch (error) {
      console.error("Get candidates error:", error);
      res.status(500).json({ error: "获取候选人列表失败" });
    }
  }

  public static async getCandidateById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const candidateId = Number(id);

      if (!Number.isInteger(candidateId) || candidateId <= 0) {
        res.json({
          data: null,
          message: "候选人ID无效",
        });
        return;
      }

      const candidateRepository = AppDataSource.getRepository(Candidate);
      const candidate = await candidateRepository.findOne({
        where: { id: candidateId },
        relations: ["position", "resumes", "interviews", "interviews.interviewer", "approvals"],
      });

      if (!candidate) {
        res.status(404).json({ error: "候选人不存在" });
        return;
      }

      res.json(candidate);
    } catch (error) {
      console.error("Get candidate error:", error);
      res.status(500).json({ error: "获取候选人详情失败" });
    }
  }

  public static async updateCandidate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const candidateRepository = AppDataSource.getRepository(Candidate);
      const candidate = await candidateRepository.findOne({ where: { id: Number(id) } });

      if (!candidate) {
        res.status(404).json({ error: "候选人不存在" });
        return;
      }

      const oldValue = { ...candidate };
      const oldStage = candidate.stage;

      Object.assign(candidate, updateData);
      await candidateRepository.save(candidate);

      await auditLog("candidate_update", req, candidate.id, "Candidate", oldValue, candidate, "更新候选人");

      if (oldStage !== candidate.stage) {
        await auditLog(
          "candidate_stage_change",
          req,
          candidate.id,
          "Candidate",
          { stage: oldStage },
          { stage: candidate.stage },
          `候选人状态变更: ${oldStage} -> ${candidate.stage}`
        );
      }

      res.json(candidate);
    } catch (error) {
      console.error("Update candidate error:", error);
      res.status(500).json({ error: "更新候选人失败" });
    }
  }

  public static async updateStage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { stage, reason } = req.body;

      if (!stage) {
        res.status(400).json({ error: "状态不能为空" });
        return;
      }

      const candidateRepository = AppDataSource.getRepository(Candidate);
      const candidate = await candidateRepository.findOne({ where: { id: Number(id) } });

      if (!candidate) {
        res.status(404).json({ error: "候选人不存在" });
        return;
      }

      const oldStage = candidate.stage;
      candidate.stage = stage as CandidateStage;

      if (stage === "hired") {
        candidate.onboardingChecklist = [
          { item: "发送Offer", completed: true, completedAt: new Date() },
          { item: "背景调查", completed: false },
          { item: "入职体检", completed: false },
          { item: "签订劳动合同", completed: false },
          { item: "办理社保公积金", completed: false },
          { item: "工牌制作", completed: false },
          { item: "工位安排", completed: false },
          { item: "设备准备", completed: false },
          { item: "入职培训", completed: false },
        ];
      }

      if (stage === "offer") {
        candidate.offerSentAt = new Date();
      }

      if (stage === "hired" && !candidate.offerAcceptedAt) {
        candidate.offerAcceptedAt = new Date();
      }

      await candidateRepository.save(candidate);

      await auditLog(
        "candidate_stage_change",
        req,
        candidate.id,
        "Candidate",
        { stage: oldStage },
        { stage, reason },
        `候选人状态变更: ${oldStage} -> ${stage}${reason ? `，原因: ${reason}` : ""}`
      );

      res.json({ message: "状态已更新", candidate });
    } catch (error) {
      console.error("Update stage error:", error);
      res.status(500).json({ error: "更新状态失败" });
    }
  }

  public static async aiScreening(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await AIScreeningService.screenCandidate(Number(id));

      await auditLog("ai_screening", req, Number(id), "Candidate", undefined, result, "AI初筛完成");

      res.json({ message: "AI初筛完成", result });
    } catch (error) {
      console.error("AI Screening error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "AI初筛失败" });
    }
  }

  public static async batchAIScreening(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { candidateIds } = req.body;

      if (!candidateIds || !Array.isArray(candidateIds)) {
        res.status(400).json({ error: "候选人ID列表不能为空" });
        return;
      }

      const results = await AIScreeningService.batchScreenCandidates(candidateIds);

      res.json({ message: "批量AI初筛完成", results });
    } catch (error) {
      console.error("Batch AI Screening error:", error);
      res.status(500).json({ error: "批量AI初筛失败" });
    }
  }

  public static async uploadResume(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      const { candidateId } = req.body;
      const file = req.file;

      if (!candidateId) {
        res.status(400).json({ error: "候选人ID不能为空" });
        return;
      }

      if (!file) {
        res.status(400).json({ error: "请上传简历文件" });
        return;
      }

      const candidateRepository = AppDataSource.getRepository(Candidate);
      const candidate = await candidateRepository.findOne({ where: { id: Number(candidateId) } });

      if (!candidate) {
        res.status(404).json({ error: "候选人不存在" });
        return;
      }

      const uploadDir = process.env.UPLOAD_DIR || "./uploads";
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileExtension = path.extname(file.originalname);
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, file.buffer);

      const resumeRepository = AppDataSource.getRepository(Resume);
      const resume = resumeRepository.create({
        candidateId: Number(candidateId),
        fileName: file.originalname,
        filePath,
        fileSize: file.size,
        fileType: file.mimetype,
        parsedContent: file.buffer.toString("utf-8").substring(0, 10000),
        isParsed: true,
        isAnalyzed: false,
        parsedData: {
          education: [],
          workExperience: [],
          projects: [],
          skills: candidate.skillTags || [],
          certifications: [],
        },
      });

      await resumeRepository.save(resume);

      candidate.resumeId = resume.id;
      await candidateRepository.save(candidate);

      await auditLog("file_upload", req, resume.id, "Resume", undefined, { fileName: file.originalname, candidateId }, "上传简历");

      res.json({ message: "简历上传成功", resume });
    } catch (error) {
      console.error("Upload resume error:", error);
      res.status(500).json({ error: "上传简历失败" });
    }
  }

  public static async updateOnboardingChecklist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { itemIndex, completed } = req.body;

      const candidateRepository = AppDataSource.getRepository(Candidate);
      const candidate = await candidateRepository.findOne({ where: { id: Number(id) } });

      if (!candidate) {
        res.status(404).json({ error: "候选人不存在" });
        return;
      }

      if (!candidate.onboardingChecklist || candidate.onboardingChecklist.length === 0) {
        res.status(400).json({ error: "该候选人没有入职准备清单" });
        return;
      }

      if (itemIndex < 0 || itemIndex >= candidate.onboardingChecklist.length) {
        res.status(400).json({ error: "清单项索引无效" });
        return;
      }

      candidate.onboardingChecklist[itemIndex].completed = completed;
      if (completed) {
        candidate.onboardingChecklist[itemIndex].completedAt = new Date();
      }

      await candidateRepository.save(candidate);

      res.json({ message: "入职清单已更新", onboardingChecklist: candidate.onboardingChecklist });
    } catch (error) {
      console.error("Update onboarding checklist error:", error);
      res.status(500).json({ error: "更新入职清单失败" });
    }
  }

  public static async getKanbanData(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { positionId } = req.query;

      const candidateRepository = AppDataSource.getRepository(Candidate);

      const stages: CandidateStage[] = [
        "applied",
        "screening",
        "ai_screened",
        "interview_scheduled",
        "first_interview",
        "second_interview",
        "background_check",
        "offer",
        "hired",
        "rejected",
      ];

      const stageNames: Record<CandidateStage, string> = {
        applied: "简历投递",
        screening: "待筛选",
        ai_screened: "AI初筛",
        interview_invited: "已邀约",
        interview_scheduled: "待面试",
        first_interview: "初试",
        second_interview: "复试",
        background_check: "背调",
        offer: "Offer",
        hired: "已入职",
        rejected: "已拒绝",
        withdrawn: "已放弃",
      };

      const result: Array<{ stage: CandidateStage; stageName: string; candidates: Candidate[]; count: number }> = [];

      for (const stage of stages) {
        let whereClause: any = { stage };
        if (positionId) {
          whereClause.positionId = Number(positionId);
        }

        const candidates = await candidateRepository.find({
          where: whereClause,
          relations: ["position"],
          order: { updatedAt: "DESC" },
        });

        result.push({
          stage,
          stageName: stageNames[stage],
          candidates,
          count: candidates.length,
        });
      }

      res.json({ data: result });
    } catch (error) {
      console.error("Get kanban data error:", error);
      res.status(500).json({ error: "获取看板数据失败" });
    }
  }
}
