import { Response } from "express";
import { AppDataSource } from "../database/data-source";
import { Approval, ApprovalStatus } from "../entities/Approval";
import { AuthRequest } from "../middleware/auth";
import { auditLog } from "../middleware/audit";
import { Position } from "../entities/Position";

export class ApprovalController {
  public static async getApprovals(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      const { page = 1, pageSize = 20, status, type, asApprover } = req.query;

      const approvalRepository = AppDataSource.getRepository(Approval);

      let whereClause: any = {};
      if (asApprover === "true") {
        whereClause.approverId = req.user.id;
      } else {
        whereClause.applicantId = req.user.id;
      }
      if (status) whereClause.status = status as ApprovalStatus;
      if (type) whereClause.type = type;

      const [approvals, total] = await approvalRepository.findAndCount({
        where: whereClause,
        relations: ["approver", "candidate", "applicantId"],
        order: { createdAt: "DESC" },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      });

      res.json({
        data: approvals,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      });
    } catch (error) {
      console.error("Get approvals error:", error);
      res.status(500).json({ error: "获取审批列表失败" });
    }
  }

  public static async getApprovalById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const approvalRepository = AppDataSource.getRepository(Approval);
      const approval = await approvalRepository.findOne({
        where: { id: Number(id) },
        relations: ["approver", "candidate"],
      });

      if (!approval) {
        res.status(404).json({ error: "审批不存在" });
        return;
      }

      res.json(approval);
    } catch (error) {
      console.error("Get approval error:", error);
      res.status(500).json({ error: "获取审批详情失败" });
    }
  }

  public static async approve(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      const { id } = req.params;
      const { comments } = req.body;

      const approvalRepository = AppDataSource.getRepository(Approval);
      const approval = await approvalRepository.findOne({ where: { id: Number(id) } });

      if (!approval) {
        res.status(404).json({ error: "审批不存在" });
        return;
      }

      if (approval.approverId !== req.user.id && req.user.role !== "admin") {
        res.status(403).json({ error: "无权限审批此申请" });
        return;
      }

      if (approval.status !== "pending") {
        res.status(400).json({ error: "此审批已处理" });
        return;
      }

      approval.status = "approved";
      approval.approvalComments = comments;
      approval.approvedAt = new Date();

      await approvalRepository.save(approval);

      if (approval.type === "position_publish" && approval.positionId) {
        const positionRepository = AppDataSource.getRepository(Position);
        await positionRepository.update(approval.positionId, { status: "approved" });
      }

      await auditLog("approval_approve", req, approval.id, "Approval", undefined, { status: "approved", comments }, "审批通过");

      res.json({ message: "审批已通过", approval });
    } catch (error) {
      console.error("Approve error:", error);
      res.status(500).json({ error: "审批失败" });
    }
  }

  public static async reject(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      const { id } = req.params;
      const { comments } = req.body;

      if (!comments) {
        res.status(400).json({ error: "驳回原因不能为空" });
        return;
      }

      const approvalRepository = AppDataSource.getRepository(Approval);
      const approval = await approvalRepository.findOne({ where: { id: Number(id) } });

      if (!approval) {
        res.status(404).json({ error: "审批不存在" });
        return;
      }

      if (approval.approverId !== req.user.id && req.user.role !== "admin") {
        res.status(403).json({ error: "无权限审批此申请" });
        return;
      }

      if (approval.status !== "pending") {
        res.status(400).json({ error: "此审批已处理" });
        return;
      }

      approval.status = "rejected";
      approval.approvalComments = comments;
      approval.rejectedAt = new Date();

      await approvalRepository.save(approval);

      if (approval.type === "position_publish" && approval.positionId) {
        const positionRepository = AppDataSource.getRepository(Position);
        await positionRepository.update(approval.positionId, { status: "draft" });
      }

      await auditLog("approval_reject", req, approval.id, "Approval", undefined, { status: "rejected", comments }, "审批驳回");

      res.json({ message: "审批已驳回", approval });
    } catch (error) {
      console.error("Reject error:", error);
      res.status(500).json({ error: "驳回失败" });
    }
  }

  public static async cancel(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      const { id } = req.params;

      const approvalRepository = AppDataSource.getRepository(Approval);
      const approval = await approvalRepository.findOne({ where: { id: Number(id) } });

      if (!approval) {
        res.status(404).json({ error: "审批不存在" });
        return;
      }

      if (approval.applicantId !== req.user.id && req.user.role !== "admin") {
        res.status(403).json({ error: "无权限取消此申请" });
        return;
      }

      if (approval.status !== "pending") {
        res.status(400).json({ error: "此审批已处理，无法取消" });
        return;
      }

      approval.status = "cancelled";

      await approvalRepository.save(approval);

      res.json({ message: "审批已取消", approval });
    } catch (error) {
      console.error("Cancel approval error:", error);
      res.status(500).json({ error: "取消审批失败" });
    }
  }

  public static async getApprovalStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      const approvalRepository = AppDataSource.getRepository(Approval);

      const pendingCount = await approvalRepository.count({
        where: { approverId: req.user.id, status: "pending" },
      });

      const approvedCount = await approvalRepository.count({
        where: { approverId: req.user.id, status: "approved" },
      });

      const rejectedCount = await approvalRepository.count({
        where: { approverId: req.user.id, status: "rejected" },
      });

      const myPendingCount = await approvalRepository.count({
        where: { applicantId: req.user.id, status: "pending" },
      });

      res.json({
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        myPending: myPendingCount,
      });
    } catch (error) {
      console.error("Get approval stats error:", error);
      res.status(500).json({ error: "获取审批统计失败" });
    }
  }
}
