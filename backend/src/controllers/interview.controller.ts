import { Response } from "express";
import { AppDataSource } from "../database/data-source";
import { Interview } from "../entities/Interview";
import { AuthRequest } from "../middleware/auth";
import { auditLog } from "../middleware/audit";
import { InterviewService } from "../services/interview.service";

export class InterviewController {
  public static async createInterview(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      const { candidateId, interviewerId, positionId, scheduledAt, type, round, duration, interviewQuestions } = req.body;

      if (!candidateId || !interviewerId || !positionId || !scheduledAt) {
        res.status(400).json({ error: "候选人ID、面试官ID、职位ID和面试时间不能为空" });
        return;
      }

      const interview = await InterviewService.createInterview(
        candidateId,
        interviewerId,
        positionId,
        new Date(scheduledAt),
        type || "video",
        round || "first",
        duration || 60
      );

      interview.interviewQuestions = interviewQuestions;
      await AppDataSource.getRepository(Interview).save(interview);

      await auditLog("interview_schedule", req, interview.id, "Interview", undefined, interview, "安排面试");

      res.status(201).json(interview);
    } catch (error) {
      console.error("Create interview error:", error);
      res.status(500).json({ error: "创建面试失败" });
    }
  }

  public static async getInterviews(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, pageSize = 20, candidateId, interviewerId, positionId, status, date } = req.query;

      const interviewRepository = AppDataSource.getRepository(Interview);

      let whereClause: any = {};
      if (candidateId) whereClause.candidateId = Number(candidateId);
      if (interviewerId) whereClause.interviewerId = Number(interviewerId);
      if (positionId) whereClause.positionId = Number(positionId);
      if (status) whereClause.status = status;

      if (date) {
        const dateObj = new Date(date as string);
        const nextDay = new Date(dateObj);
        nextDay.setDate(nextDay.getDate() + 1);
        whereClause.scheduledAt = (): any => ({
          $gte: dateObj,
          $lt: nextDay,
        });
      }

      const [interviews, total] = await interviewRepository.findAndCount({
        where: whereClause,
        relations: ["candidate", "candidate.position", "interviewer", "position"],
        order: { scheduledAt: "DESC" },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      });

      res.json({
        data: interviews,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      });
    } catch (error) {
      console.error("Get interviews error:", error);
      res.status(500).json({ error: "获取面试列表失败" });
    }
  }

  public static async getInterviewById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const interviewRepository = AppDataSource.getRepository(Interview);
      const interview = await interviewRepository.findOne({
        where: { id: Number(id) },
        relations: ["candidate", "candidate.position", "interviewer", "position"],
      });

      if (!interview) {
        res.status(404).json({ error: "面试不存在" });
        return;
      }

      res.json(interview);
    } catch (error) {
      console.error("Get interview error:", error);
      res.status(500).json({ error: "获取面试详情失败" });
    }
  }

  public static async updateInterview(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const interviewRepository = AppDataSource.getRepository(Interview);
      const interview = await interviewRepository.findOne({ where: { id: Number(id) } });

      if (!interview) {
        res.status(404).json({ error: "面试不存在" });
        return;
      }

      Object.assign(interview, updateData);
      await interviewRepository.save(interview);

      res.json(interview);
    } catch (error) {
      console.error("Update interview error:", error);
      res.status(500).json({ error: "更新面试失败" });
    }
  }

  public static async startInterview(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const room = await InterviewService.startInterview(Number(id));

      await auditLog("interview_start", req, Number(id), "Interview", undefined, { status: "in_progress" }, "开始面试");

      res.json({ message: "面试已开始", room });
    } catch (error) {
      console.error("Start interview error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "开始面试失败" });
    }
  }

  public static async endInterview(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const interview = await InterviewService.endInterview(Number(id));

      await auditLog("interview_complete", req, Number(id), "Interview", undefined, { status: "completed" }, "结束面试");

      res.json({ message: "面试已结束", interview });
    } catch (error) {
      console.error("End interview error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "结束面试失败" });
    }
  }

  public static async saveTranscript(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { transcriptData } = req.body;

      await InterviewService.saveTranscript(Number(id), transcriptData);

      res.json({ message: "面试记录已保存" });
    } catch (error) {
      console.error("Save transcript error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "保存面试记录失败" });
    }
  }

  public static async addBehaviorMarker(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { timestamp, marker, description, severity } = req.body;

      await InterviewService.addBehaviorMarker(Number(id), timestamp, marker, description, severity);

      res.json({ message: "行为标记已添加" });
    } catch (error) {
      console.error("Add behavior marker error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "添加行为标记失败" });
    }
  }

  public static async submitEvaluation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const evaluation = req.body;

      const interview = await InterviewService.submitEvaluation(Number(id), evaluation);

      res.json({ message: "面试评价已提交", interview });
    } catch (error) {
      console.error("Submit evaluation error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "提交面试评价失败" });
    }
  }

  public static async generateQuestions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { position, round } = req.body;

      const questions = InterviewService.generateInterviewQuestions(position, round);

      res.json({ questions });
    } catch (error) {
      console.error("Generate questions error:", error);
      res.status(500).json({ error: "生成面试问题失败" });
    }
  }

  public static async cancelInterview(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const interviewRepository = AppDataSource.getRepository(Interview);
      const interview = await interviewRepository.findOne({ where: { id: Number(id) } });

      if (!interview) {
        res.status(404).json({ error: "面试不存在" });
        return;
      }

      interview.status = "cancelled";
      interview.cancelledReason = reason;

      await interviewRepository.save(interview);

      res.json({ message: "面试已取消", interview });
    } catch (error) {
      console.error("Cancel interview error:", error);
      res.status(500).json({ error: "取消面试失败" });
    }
  }

  public static async getRoomInfo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;

      const room = InterviewService.getRoom(roomId);

      if (!room) {
        res.status(404).json({ error: "面试房间不存在" });
        return;
      }

      res.json(room);
    } catch (error) {
      console.error("Get room info error:", error);
      res.status(500).json({ error: "获取房间信息失败" });
    }
  }
}
