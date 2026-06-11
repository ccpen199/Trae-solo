import { get, post, put, del } from '@/utils/request';
import type { Message, MessageStats, MessageSettings } from '@/types/message';
import { mockMessages, mockMessageStats, mockMessageSettings } from '@/data/messages';

export const getMessageList = async (): Promise<Message[]> => {
  console.log('[MessageService] 获取消息列表');
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockMessages;
};

export const getMessageDetail = async (messageId: string): Promise<Message | null> => {
  console.log('[MessageService] 获取消息详情', messageId);
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockMessages.find(m => m.id === messageId) || null;
};

export const getUnreadCount = async (): Promise<number> => {
  console.log('[MessageService] 获取未读消息数');
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockMessages.filter(m => !m.read).length;
};

export const getMessageStats = async (): Promise<MessageStats> => {
  console.log('[MessageService] 获取消息统计');
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockMessageStats;
};

export const markAsRead = async (messageId: string): Promise<boolean> => {
  console.log('[MessageService] 标记已读', messageId);
  await new Promise(resolve => setTimeout(resolve, 300));
  return true;
};

export const markAllAsRead = async (): Promise<{ success: boolean; count: number }> => {
  console.log('[MessageService] 全部标记已读');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const unreadCount = mockMessages.filter(m => !m.read).length;
  return {
    success: true,
    count: unreadCount
  };
};

export const deleteMessage = async (messageId: string): Promise<boolean> => {
  console.log('[MessageService] 删除消息', messageId);
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
};

export const getMessageSettings = async (): Promise<MessageSettings> => {
  console.log('[MessageService] 获取消息设置');
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockMessageSettings;
};

export const updateMessageSettings = async (settings: Partial<MessageSettings>): Promise<boolean> => {
  console.log('[MessageService] 更新消息设置', settings);
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
};
