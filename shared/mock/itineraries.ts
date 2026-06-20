import { Itinerary, GDPRRequest, GDPRRequestType, GDPRRequestStatus, PointsTransaction } from '../types';

export const mockItineraries: Itinerary[] = [
  {
    id: 'itinerary-001',
    userId: 'user-001',
    name: '欧洲浪漫之旅',
    description: '2025年夏季欧洲度假，包含巴黎和巴塞罗那',
    bookings: ['booking-001'],
    shareToken: 'share-europe-2025-abc123',
    isShared: true,
    createdAt: '2025-03-10T10:00:00Z',
    updatedAt: '2025-03-20T14:30:00Z',
  },
  {
    id: 'itinerary-002',
    userId: 'user-001',
    name: '亚洲商务旅行',
    description: '5月迪拜商务会议 + 休闲',
    bookings: ['booking-005'],
    isShared: false,
    createdAt: '2025-03-05T08:00:00Z',
    updatedAt: '2025-03-10T12:00:00Z',
  },
  {
    id: 'itinerary-003',
    userId: 'user-002',
    name: '日本樱花之旅',
    description: '4月东京赏樱',
    bookings: ['booking-002'],
    isShared: false,
    createdAt: '2025-02-15T16:00:00Z',
    updatedAt: '2025-02-20T10:00:00Z',
  },
];

export const mockGDPRRequests: GDPRRequest[] = [
  {
    id: 'gdpr-001',
    userId: 'user-001',
    type: GDPRRequestType.ACCESS,
    status: GDPRRequestStatus.COMPLETED,
    description: '请求获取我的所有个人数据副本',
    responseDetails: '已通过安全链接发送您的个人数据副本，包括预订历史、个人资料和会员信息。链接有效期为7天。',
    processedBy: 'user-admin-001',
    submittedAt: '2025-02-10T10:00:00Z',
    completedAt: '2025-02-12T14:30:00Z',
  },
  {
    id: 'gdpr-002',
    userId: 'user-001',
    type: GDPRRequestType.RECTIFICATION,
    status: GDPRRequestStatus.COMPLETED,
    description: '更正我的联系电话',
    responseDetails: '您的联系电话已从+86 138 0000 0000更新为+86 138 0000 0001。',
    processedBy: 'user-admin-001',
    submittedAt: '2025-01-15T09:00:00Z',
    completedAt: '2025-01-15T11:00:00Z',
  },
  {
    id: 'gdpr-003',
    userId: 'user-003',
    type: GDPRRequestType.EXPORT,
    status: GDPRRequestStatus.IN_PROGRESS,
    description: '以机器可读格式导出我的所有数据',
    processedBy: 'user-admin-001',
    submittedAt: '2025-03-18T13:00:00Z',
  },
];

export const mockPointsTransactions: PointsTransaction[] = [
  {
    id: 'points-001',
    memberId: 'member-001',
    amount: 7979,
    type: 'earn',
    referenceType: 'booking',
    referenceId: 'booking-001',
    description: '入住Le Château Élysée累积积分',
    createdAt: '2025-03-15T10:35:00Z',
  },
  {
    id: 'points-002',
    memberId: 'member-001',
    amount: 18876,
    type: 'earn',
    referenceType: 'booking',
    referenceId: 'booking-005',
    description: '入住Atlantis The Royal累积积分',
    createdAt: '2025-03-10T11:05:00Z',
  },
  {
    id: 'points-003',
    memberId: 'member-001',
    amount: -50000,
    type: 'redeem',
    referenceType: 'booking',
    description: '积分兑换免费住宿',
    createdAt: '2025-02-01T14:00:00Z',
  },
  {
    id: 'points-004',
    memberId: 'member-001',
    amount: 2393,
    type: 'earn',
    referenceType: 'bonus',
    description: 'Gold会员额外30%积分奖励',
    createdAt: '2025-03-10T11:10:00Z',
  },
  {
    id: 'points-005',
    memberId: 'member-002',
    amount: 8250,
    type: 'earn',
    referenceType: 'booking',
    referenceId: 'booking-002',
    description: '入住银座四季酒店累积积分',
    createdAt: '2025-02-20T14:25:00Z',
  },
];

export function getItinerariesByUserId(userId: string): Itinerary[] {
  return mockItineraries.filter(i => i.userId === userId);
}

export function getItineraryById(itineraryId: string): Itinerary | undefined {
  return mockItineraries.find(i => i.id === itineraryId);
}

export function getItineraryByShareToken(shareToken: string): Itinerary | undefined {
  return mockItineraries.find(i => i.shareToken === shareToken);
}

export function getGDPRRequestsByUserId(userId: string): GDPRRequest[] {
  return mockGDPRRequests.filter(r => r.userId === userId);
}

export function getGDPRRequestById(requestId: string): GDPRRequest | undefined {
  return mockGDPRRequests.find(r => r.id === requestId);
}

export function getPointsTransactionsByMemberId(memberId: string): PointsTransaction[] {
  return mockPointsTransactions.filter(t => t.memberId === memberId);
}

export function generateShareToken(): string {
  return `share-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}
