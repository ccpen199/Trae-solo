import request from './request';
import type { Announcement, PageResult } from '@/types';

export const announcementApi = {
  getAnnouncementList: (params: {
    type?: string;
    serviceType?: string;
    areaCode?: string;
    keyword?: string;
    page: number;
    pageSize: number;
  }) => {
    return request.get<PageResult<Announcement>>('/announcement/list', { params });
  },

  getAnnouncementDetail: (id: number) => {
    return request.get<Announcement>(`/announcement/${id}`);
  },

  getLatestAnnouncements: (limit = 5) => {
    return request.get<Announcement[]>('/announcement/latest', { params: { limit } });
  },

  createAnnouncement: (data: Partial<Announcement>) => {
    return request.post<Announcement>('/admin/announcement/create', data);
  },

  updateAnnouncement: (id: number, data: Partial<Announcement>) => {
    return request.put(`/admin/announcement/${id}`, data);
  },

  submitAudit: (id: number) => {
    return request.post(`/admin/announcement/submit-audit/${id}`);
  },

  auditAnnouncement: (id: number, data: { result: number; opinion: string }) => {
    return request.post(`/admin/announcement/audit/${id}`, data);
  },

  publishAnnouncement: (id: number) => {
    return request.post(`/admin/announcement/publish/${id}`);
  },

  offlineAnnouncement: (id: number) => {
    return request.post(`/admin/announcement/offline/${id}`);
  },

  deleteAnnouncement: (id: number) => {
    return request.delete(`/admin/announcement/${id}`);
  },

  getMyNotifications: (params: { page: number; pageSize: number; isRead?: number }) => {
    return request.get<PageResult<any>>('/announcement/notifications', { params });
  },

  markNotificationRead: (id: number) => {
    return request.put(`/announcement/notification/read/${id}`);
  },
};
