import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { IMService } from "../services/im.service";
import { auditLog } from "../middleware/audit";
import { MessageType } from "../entities/IMMessage";

export class IMController {
  public static async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      const { receiverId, type, content } = req.body;
      const file = req.file;

      if (!receiverId) {
        res.status(400).json({ error: "接收者ID不能为空" });
        return;
      }

      if (!content && !file) {
        res.status(400).json({ error: "消息内容或文件不能为空" });
        return;
      }

      const message = await IMService.sendMessage(
        req.user.id,
        Number(receiverId),
        (type as MessageType) || "text",
        content,
        file
      );

      await auditLog("message_send", req, message.id, "IMMessage", undefined, { type, receiverId }, "发送消息");

      res.status(201).json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "发送消息失败" });
    }
  }

  public static async getConversations(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      const conversations = await IMService.getConversations(req.user.id);

      res.json({ data: conversations });
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ error: "获取会话列表失败" });
    }
  }

  public static async getMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      const { userId } = req.params;
      const { limit = 100 } = req.query;

      const messages = await IMService.getConversationMessages(
        req.user.id,
        Number(userId),
        Number(limit)
      );

      await IMService.markAsRead(req.user.id, Number(userId));

      res.json({ data: messages });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "获取消息列表失败" });
    }
  }

  public static async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      const { senderId } = req.params;

      const count = await IMService.markAsRead(req.user.id, Number(senderId));

      await auditLog("message_read", req, undefined, "IMMessage", undefined, { senderId, count }, "标记消息已读");

      res.json({ message: `已标记 ${count} 条消息为已读`, count });
    } catch (error) {
      console.error("Mark as read error:", error);
      res.status(500).json({ error: "标记已读失败" });
    }
  }

  public static async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      const unreadCount = await IMService.getUnreadCount(req.user.id);

      res.json(unreadCount);
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "获取未读消息数失败" });
    }
  }

  public static async deleteMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      const { id } = req.params;

      await IMService.deleteMessage(Number(id), req.user.id);

      res.json({ message: "消息已删除" });
    } catch (error) {
      console.error("Delete message error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "删除消息失败" });
    }
  }

  public static async getAuditPendingMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const messages = await IMService.getAuditPendingMessages();

      res.json({ data: messages });
    } catch (error) {
      console.error("Get audit pending messages error:", error);
      res.status(500).json({ error: "获取待审核消息失败" });
    }
  }

  public static async auditMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      const { id } = req.params;
      const { result, notes, violationType } = req.body;

      if (!result) {
        res.status(400).json({ error: "审核结果不能为空" });
        return;
      }

      const message = await IMService.auditMessage(
        Number(id),
        req.user.id,
        result as "compliant" | "warning" | "violation",
        notes,
        violationType
      );

      res.json({ message: "审核完成", auditResult: message.auditInfo });
    } catch (error) {
      console.error("Audit message error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "审核消息失败" });
    }
  }
}
