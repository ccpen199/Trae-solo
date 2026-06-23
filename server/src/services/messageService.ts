import { Repository } from 'typeorm';
import { Message } from '../entities/Message';
import { v4 as uuidv4 } from 'uuid';

export interface MessagePayload {
  userId: string;
  title: string;
  content: string;
  category?: string;
  channels?: { sms?: boolean; inbox?: boolean; template?: boolean };
  meta?: Record<string, any>;
}

export class MessageService {
  private messageRepo: Repository<Message>;

  constructor(messageRepo: Repository<Message>) {
    this.messageRepo = messageRepo;
  }

  async sendMessage(payload: MessagePayload): Promise<Message> {
    const message = this.messageRepo.create({
      id: uuidv4(),
      userId: payload.userId,
      title: payload.title,
      content: payload.content,
      type: 'inbox',
      category: payload.category || 'system',
      status: 'unread',
      channels: payload.channels || { inbox: true },
      meta: payload.meta,
    });

    const saved = await this.messageRepo.save(message);

    if (payload.channels?.sms) {
      console.log(`[SMS] 发送短信给用户 ${payload.userId}: ${payload.title}`);
    }
    if (payload.channels?.template) {
      console.log(`[Template] 发送小程序模板消息给用户 ${payload.userId}: ${payload.title}`);
    }
    if (payload.channels?.inbox) {
      console.log(`[Inbox] 站内信已保存: ${saved.id}`);
    }

    return saved;
  }

  async batchSend(userIds: string[], payload: Omit<MessagePayload, 'userId'>): Promise<Message[]> {
    const messages: Message[] = [];
    for (const userId of userIds) {
      const msg = await this.sendMessage({ userId, ...payload });
      messages.push(msg);
    }
    return messages;
  }

  async markAsRead(messageId: string): Promise<Message | null> {
    const msg = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!msg) return null;
    msg.status = 'read';
    return this.messageRepo.save(msg);
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.messageRepo.update(
      { userId, status: 'unread' },
      { status: 'read' }
    );
    return result.affected || 0;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messageRepo.count({ where: { userId, status: 'unread' } });
  }
}
