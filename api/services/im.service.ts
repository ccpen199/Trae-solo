import type { ChatSession, ChatMessage, InterviewInvite, SenderType, MessageType, InterviewStatus } from '@shared/types';
import { mockSessions, mockMessages, mockInterviewInvites } from '@shared/mock/data.js';
import { v4 as uuidv4 } from 'uuid';

export class IMService {
  static async getSessionList(userId: string, role: string): Promise<{ success: boolean; data?: ChatSession[]; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const sessions = mockSessions.filter(session => {
      if (role === 'hr') {
        return session.hrId === userId;
      } else if (role === 'talent') {
        return session.talentId === userId;
      }
      return false;
    });

    return { success: true, data: sessions };
  }

  static async getSessionMessages(sessionId: string): Promise<{ success: boolean; data?: ChatMessage[]; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const messages = mockMessages.filter(msg => msg.sessionId === sessionId);
    return { success: true, data: messages };
  }

  static async sendMessage(
    sessionId: string,
    senderId: string,
    senderType: SenderType,
    content: string,
    type: MessageType
  ): Promise<{ success: boolean; data?: ChatMessage; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const session = mockSessions.find(s => s.id === sessionId);
    if (!session) {
      return { success: false, error: '会话不存在' };
    }

    const newMessage: ChatMessage = {
      id: uuidv4(),
      sessionId,
      senderId,
      senderType,
      content,
      type,
      encrypted: session.encryptionEnabled,
      createdAt: new Date(),
    };

    mockMessages.push(newMessage);

    session.lastMessage = newMessage;
    session.lastMessageAt = newMessage.createdAt;
    if (senderType === 'hr') {
      session.unreadCount = (session.unreadCount || 0) + 1;
    }

    return { success: true, data: newMessage };
  }

  static async createInterviewInvite(
    sessionId: string,
    jobId: string,
    talentId: string,
    hrId: string,
    interviewTime: Date,
    location: string,
    notes: string
  ): Promise<{ success: boolean; data?: InterviewInvite; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const session = mockSessions.find(s => s.id === sessionId);
    if (!session) {
      return { success: false, error: '会话不存在' };
    }

    const newInvite: InterviewInvite = {
      id: uuidv4(),
      sessionId,
      jobId,
      talentId,
      hrId,
      interviewTime: new Date(interviewTime),
      location,
      notes,
      status: 'pending',
      createdAt: new Date(),
    };

    mockInterviewInvites.push(newInvite);

    await this.sendMessage(
      sessionId,
      hrId,
      'hr',
      `面试邀请：${interviewTime.toLocaleString()}，地点：${location}`,
      'interview_invite'
    );

    return { success: true, data: newInvite };
  }

  static async updateInterviewStatus(
    inviteId: string,
    status: InterviewStatus
  ): Promise<{ success: boolean; data?: InterviewInvite; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const invite = mockInterviewInvites.find(i => i.id === inviteId);
    if (!invite) {
      return { success: false, error: '面试邀请不存在' };
    }

    invite.status = status;

    const statusMessages: Record<InterviewStatus, string> = {
      accepted: '候选人已接受面试邀请',
      rejected: '候选人已拒绝面试邀请',
      completed: '面试已完成',
      no_show: '候选人未到场',
      pending: '面试邀请待确认',
    };

    await this.sendMessage(
      invite.sessionId,
      invite.hrId,
      'hr',
      statusMessages[status],
      'system'
    );

    return { success: true, data: invite };
  }

  static async getInterviewInvites(
    userId: string,
    role: string
  ): Promise<{ success: boolean; data?: InterviewInvite[]; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const invites = mockInterviewInvites.filter(invite => {
      if (role === 'hr') {
        return invite.hrId === userId;
      } else if (role === 'talent') {
        return invite.talentId === userId;
      }
      return false;
    });

    return { success: true, data: invites };
  }
}
