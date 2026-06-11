import { AppDataSource } from "../database/data-source";
import { IMMessage, MessageType } from "../entities/IMMessage";
import { User } from "../entities/User";
import { encryptMessage, decryptMessage, generateEncryptionKey, encryptFile } from "../utils/encryption";
import * as path from "path";
import * as fs from "fs";

const SENSITIVE_WORDS = ["薪资", "薪水", "工资", "待遇", "银行卡", "身份证", "密码", "私密", "保密", "内推费", "好处费"];

export class IMService {
  private static encryptionKeys: Map<string, string> = new Map();

  public static getConversationId(userId1: number, userId2: number): string {
    return [Math.min(userId1, userId2), Math.max(userId1, userId2)].join("_");
  }

  public static getOrCreateEncryptionKey(conversationId: string): string {
    if (!this.encryptionKeys.has(conversationId)) {
      this.encryptionKeys.set(conversationId, generateEncryptionKey());
    }
    return this.encryptionKeys.get(conversationId)!;
  }

  public static checkCompliance(content: string): { hasSensitiveContent: boolean; sensitiveWords: string[]; riskLevel: "low" | "medium" | "high" } {
    const foundWords: string[] = [];
    for (const word of SENSITIVE_WORDS) {
      if (content.includes(word)) {
        foundWords.push(word);
      }
    }

    let riskLevel: "low" | "medium" | "high" = "low";
    if (foundWords.length > 0) {
      if (foundWords.some((w) => ["密码", "银行卡", "身份证", "内推费", "好处费"].includes(w))) {
        riskLevel = "high";
      } else if (foundWords.length >= 3) {
        riskLevel = "high";
      } else if (foundWords.length >= 2) {
        riskLevel = "medium";
      } else {
        riskLevel = "medium";
      }
    }

    return {
      hasSensitiveContent: foundWords.length > 0,
      sensitiveWords: foundWords,
      riskLevel,
    };
  }

  public static async sendMessage(
    senderId: number,
    receiverId: number,
    type: MessageType,
    content?: string,
    file?: Express.Multer.File
  ): Promise<IMMessage> {
    const messageRepository = AppDataSource.getRepository(IMMessage);
    const conversationId = this.getConversationId(senderId, receiverId);
    const encryptionKey = this.getOrCreateEncryptionKey(conversationId);

    let finalContent = content || "";
    let fileInfo: any = null;
    const isEncrypted = true;

    if (type === "text" && content) {
      finalContent = encryptMessage(content, encryptionKey);
    }

    if (file && (type === "file" || type === "image")) {
      const uploadDir = process.env.UPLOAD_DIR || "./uploads";
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileExtension = path.extname(file.originalname);
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      const fileContent = file.buffer.toString("base64");
      const encryptedContent = encryptFile(fileContent, encryptionKey);
      fs.writeFileSync(filePath, encryptedContent);

      fileInfo = {
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        filePath,
        encrypted: true,
        encryptionKey,
      };
    }

    const complianceCheck = this.checkCompliance(content || "");

    const message = messageRepository.create({
      senderId,
      receiverId,
      type,
      content: finalContent,
      fileInfo,
      isRead: false,
      isEncrypted,
      conversationId,
      complianceCheck,
      isAudited: false,
    });

    await messageRepository.save(message);
    return message;
  }

  public static async getConversationMessages(userId1: number, userId2: number, limit: number = 100): Promise<Array<IMMessage & { decryptedContent?: string }>> {
    const messageRepository = AppDataSource.getRepository(IMMessage);
    const conversationId = this.getConversationId(userId1, userId2);
    const encryptionKey = this.getOrCreateEncryptionKey(conversationId);

    const messages = await messageRepository.find({
      where: { conversationId, isDeleted: false },
      order: { createdAt: "DESC" },
      take: limit,
      relations: ["sender", "receiver"],
    });

    return messages.reverse().map((msg) => {
      let decryptedContent = msg.content;
      if (msg.isEncrypted && msg.type === "text" && msg.content) {
        try {
          decryptedContent = decryptMessage(msg.content, encryptionKey);
        } catch {
          decryptedContent = "[解密失败]";
        }
      }
      return { ...msg, decryptedContent };
    });
  }

  public static async markAsRead(userId: number, senderId: number): Promise<number> {
    const messageRepository = AppDataSource.getRepository(IMMessage);
    const result = await messageRepository.update(
      { receiverId: userId, senderId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return result.affected || 0;
  }

  public static async getUnreadCount(userId: number): Promise<{ total: number; bySender: Record<number, number> }> {
    const messageRepository = AppDataSource.getRepository(IMMessage);
    const messages = await messageRepository.find({
      where: { receiverId: userId, isRead: false, isDeleted: false },
      select: ["senderId"],
    });

    const bySender: Record<number, number> = {};
    for (const msg of messages) {
      bySender[msg.senderId] = (bySender[msg.senderId] || 0) + 1;
    }

    return {
      total: messages.length,
      bySender,
    };
  }

  public static async auditMessage(messageId: number, auditorId: number, result: "compliant" | "warning" | "violation", notes?: string, violationType?: string): Promise<IMMessage> {
    const messageRepository = AppDataSource.getRepository(IMMessage);
    const message = await messageRepository.findOne({ where: { id: messageId } });

    if (!message) {
      throw new Error("消息不存在");
    }

    message.isAudited = true;
    message.auditInfo = {
      auditedBy: auditorId,
      auditedAt: new Date(),
      auditResult: result,
      violationType,
      notes,
    };

    await messageRepository.save(message);
    return message;
  }

  public static async getAuditPendingMessages(): Promise<IMMessage[]> {
    const messageRepository = AppDataSource.getRepository(IMMessage);
    return messageRepository.find({
      where: { isAudited: false, complianceCheck: { hasSensitiveContent: true } },
      order: { createdAt: "DESC" },
    });
  }

  public static async deleteMessage(messageId: number, userId: number): Promise<void> {
    const messageRepository = AppDataSource.getRepository(IMMessage);
    const message = await messageRepository.findOne({ where: { id: messageId } });

    if (!message) {
      throw new Error("消息不存在");
    }

    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new Error("无权限删除此消息");
    }

    message.isDeleted = true;
    await messageRepository.save(message);
  }

  public static async getConversations(userId: number): Promise<Array<{ userId: number; user: User; lastMessage: IMMessage; unreadCount: number }>> {
    const messageRepository = AppDataSource.getRepository(IMMessage);
    const userRepository = AppDataSource.getRepository(User);

    const messages = await messageRepository
      .createQueryBuilder("message")
      .where("(message.senderId = :userId OR message.receiverId = :userId)", { userId })
      .andWhere("message.isDeleted = :isDeleted", { isDeleted: false })
      .orderBy("message.createdAt", "DESC")
      .getMany();

    const conversationMap = new Map<number, IMMessage>();
    for (const msg of messages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, msg);
      }
    }

    const unreadCounts = await this.getUnreadCount(userId);
    const results: Array<{ userId: number; user: User; lastMessage: IMMessage; unreadCount: number }> = [];

    for (const [otherUserId, lastMessage] of conversationMap.entries()) {
      const user = await userRepository.findOne({ where: { id: otherUserId } });
      if (user) {
        results.push({
          userId: otherUserId,
          user,
          lastMessage,
          unreadCount: unreadCounts.bySender[otherUserId] || 0,
        });
      }
    }

    return results.sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
  }
}
