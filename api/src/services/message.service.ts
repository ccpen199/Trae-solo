import { messageRepository } from '../repositories/message.repository';
import type { Message, MessageType } from '../../../shared/types';

interface ListParams {
  userId?: string;
  role?: string;
  outletId?: string;
  type?: MessageType;
  isRead?: boolean;
  page?: number;
  pageSize?: number;
}

export const messageService = {
  list(params: ListParams): { list: Message[]; total: number } {
    const { userId, role, outletId, type, isRead, page, pageSize } = params;

    let filters: Parameters<typeof messageRepository.findAll>[0] = {};

    if (role === 'courier') {
      filters.courierId = userId;
    } else if (role === 'admin') {
      filters.outletId = outletId;
    }

    if (type) filters.type = type;
    if (isRead !== undefined) filters.isRead = isRead;
    if (page) filters.page = page;
    if (pageSize) filters.pageSize = pageSize;

    return messageRepository.findAll(filters);
  },

  markAsRead(id: string): Message | null {
    return messageRepository.markAsRead(id);
  },

  markAllAsRead(userId?: string, role?: string, outletId?: string): number {
    const courierId = role === 'courier' ? userId : undefined;
    const targetOutletId = role === 'admin' ? outletId : undefined;
    return messageRepository.markAllAsRead(courierId, targetOutletId);
  },

  getUnreadCount(userId?: string, role?: string, outletId?: string): number {
    const courierId = role === 'courier' ? userId : undefined;
    const targetOutletId = role === 'admin' ? outletId : undefined;
    return messageRepository.getUnreadCount(courierId, targetOutletId);
  },
};
