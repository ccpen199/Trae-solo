import { http, HttpResponse } from 'msw';
import {
  mockReservations,
  successResponse,
  errorResponse,
  generateMockReservationConfig,
  mockPlaces,
} from '../data/mockData';
import type {
  Reservation,
  ReservationListParams,
  ReservationCreateParams,
  ReservationVerifyParams,
  ReservationVerifyResult,
  ReservationStatus,
  CapacityBoardData,
  CapacitySlot,
} from '../../api/reservation';

let reservations = [...mockReservations];

const reservationStatusNames: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  cancelled: '已取消',
  used: '已使用',
  expired: '已过期',
};

const verifyStatusNames: Record<string, string> = {
  unverified: '未核销',
  verified: '已核销',
  timeout: '超时未核销',
  mismatch: '人数不符',
};

const generateCapacityBoard = (): CapacityBoardData[] => {
  const timeSlots = ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00'];
  const today = new Date().toISOString().split('T')[0];

  return mockPlaces.slice(0, 8).map((place) => {
    const totalCapacity = place.capacity || 5000;
    const slots: CapacitySlot[] = timeSlots.map((slot) => {
      const slotCapacity = Math.floor(totalCapacity / timeSlots.length);
      const reserved = Math.floor(slotCapacity * (0.3 + Math.random() * 0.65));
      const checkedIn = Math.floor(reserved * (0.4 + Math.random() * 0.5));
      const remaining = slotCapacity - reserved;
      let status: CapacitySlot['status'] = 'normal';
      if (remaining <= 0) status = 'full';
      else if (reserved / slotCapacity >= 0.8) status = 'tight';

      return {
        timeSlot: slot,
        totalCapacity: slotCapacity,
        reserved,
        checkedIn,
        remaining: Math.max(0, remaining),
        status,
        statusName: status === 'normal' ? '正常' : status === 'tight' ? '紧张' : '已满',
      };
    });

    const totalReserved = slots.reduce((s, sl) => s + sl.reserved, 0);
    const totalCheckedIn = slots.reduce((s, sl) => s + sl.checkedIn, 0);

    return {
      placeId: place.id,
      placeName: place.name,
      date: today,
      totalCapacity,
      totalReserved,
      totalCheckedIn,
      totalRemaining: Math.max(0, totalCapacity - totalReserved),
      slots,
    };
  });
};

export const reservationHandlers = [
  http.get('/api/reservation/list', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const placeId = url.searchParams.get('placeId') || '';
    const status = url.searchParams.get('status') || '';
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';
    const keyword = url.searchParams.get('keyword') || '';

    let filtered = [...reservations];

    if (placeId) filtered = filtered.filter((r) => r.placeId === placeId);
    if (status) filtered = filtered.filter((r) => r.status === status);
    if (startDate) filtered = filtered.filter((r) => r.visitDate >= startDate);
    if (endDate) filtered = filtered.filter((r) => r.visitDate <= endDate);
    if (keyword) {
      filtered = filtered.filter(
        (r) => r.orderNo.includes(keyword) || r.visitorName.includes(keyword) || r.visitorPhone.includes(keyword)
      );
    }

    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize).map((r) => ({
      ...r,
      verifyStatus: r.status === 'used' ? 'verified' as const : r.status === 'confirmed' ? 'unverified' as const : undefined,
      verifyStatusName: r.status === 'used' ? '已核销' : r.status === 'confirmed' ? '未核销' : undefined,
      verifyTime: r.status === 'used' ? r.usedAt : undefined,
      isAbnormal: Math.random() > 0.9,
      abnormalReason: Math.random() > 0.9 ? '超时未核销' : undefined,
    }));

    return HttpResponse.json(successResponse({ list, total: filtered.length, page, pageSize }));
  }),

  http.get('/api/reservation/:id', ({ params }) => {
    const { id } = params;
    const reservation = reservations.find((r) => r.id === id);
    if (!reservation) return HttpResponse.json(errorResponse(404, '预约不存在'));
    return HttpResponse.json(successResponse(reservation));
  }),

  http.post('/api/reservation', async ({ request }) => {
    const body = (await request.json()) as ReservationCreateParams;
    const place = mockPlaces.find((p) => p.id === body.placeId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newReservation: Reservation = {
      id: crypto.randomUUID(),
      orderNo: 'RES' + Date.now().toString(),
      ...body,
      placeName: place?.name || '未知场所',
      status: 'confirmed',
      statusName: '已确认',
      createdAt: now,
      confirmedAt: now,
    };

    reservations.unshift(newReservation);
    return HttpResponse.json(successResponse(newReservation, '预约成功'));
  }),

  http.put('/api/reservation/:id/cancel', async ({ request, params }) => {
    const { id } = params;
    const body = await request.json();
    const { reason } = body as { reason: string };
    const index = reservations.findIndex((r) => r.id === id);
    if (index === -1) return HttpResponse.json(errorResponse(404, '预约不存在'));

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = {
      ...reservations[index],
      status: 'cancelled' as ReservationStatus,
      statusName: '已取消',
      cancelledAt: now,
      cancelReason: reason,
    };
    reservations[index] = updated;
    return HttpResponse.json(successResponse(updated, '取消成功'));
  }),

  http.post('/api/reservation/verify', async ({ request }) => {
    const body = (await request.json()) as ReservationVerifyParams;
    const { orderNo } = body;
    const index = reservations.findIndex((r) => r.orderNo === orderNo);
    if (index === -1) return HttpResponse.json(errorResponse(404, '预约不存在'));
    if (reservations[index].status !== 'confirmed') return HttpResponse.json(errorResponse(400, '该预约状态不正确'));

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = {
      ...reservations[index],
      status: 'used' as ReservationStatus,
      statusName: '已使用',
      usedAt: now,
    };
    reservations[index] = updated;

    const result: ReservationVerifyResult = { success: true, message: '核销成功', reservation: updated };
    return HttpResponse.json(successResponse(result, '核销成功'));
  }),

  http.get('/api/reservation/config/:placeId', ({ params }) => {
    const { placeId } = params;
    const place = mockPlaces.find((p) => p.id === placeId);
    if (!place) return HttpResponse.json(errorResponse(404, '场所不存在'));

    const config = {
      ...generateMockReservationConfig(place),
      overCapacityPolicy: 'auto_reject' as const,
      overCapacityPolicyName: '自动拒绝',
      lateCancelMinutes: 30,
      noShowHandling: 'auto_cancel' as const,
      maxDailyReservationsPerPhone: 3,
      abnormalRules: {
        maxDailyReservationsPerPhone: 3,
        lateCancelMinutes: 30,
        noShowHandling: 'auto_cancel' as const,
      },
    };

    return HttpResponse.json(successResponse(config));
  }),

  http.put('/api/reservation/config/:placeId', async ({ request, params }) => {
    const { placeId } = params;
    const body = await request.json();
    const place = mockPlaces.find((p) => p.id === placeId);
    if (!place) return HttpResponse.json(errorResponse(404, '场所不存在'));

    const config = {
      ...generateMockReservationConfig(place),
      ...body,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    return HttpResponse.json(successResponse(config, '配置更新成功'));
  }),

  http.get('/api/reservation/statistics', ({ request }) => {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';
    const placeId = url.searchParams.get('placeId') || '';

    let filtered = [...reservations];
    if (placeId) filtered = filtered.filter((r) => r.placeId === placeId);
    if (startDate) filtered = filtered.filter((r) => r.createdAt >= startDate);
    if (endDate) filtered = filtered.filter((r) => r.createdAt <= endDate + ' 23:59:59');

    const stats = {
      total: filtered.length,
      pending: filtered.filter((r) => r.status === 'pending').length,
      confirmed: filtered.filter((r) => r.status === 'confirmed').length,
      cancelled: filtered.filter((r) => r.status === 'cancelled').length,
      used: filtered.filter((r) => r.status === 'used').length,
      expired: filtered.filter((r) => r.status === 'expired').length,
      totalVisitors: filtered.reduce((sum, r) => sum + r.visitorCount, 0),
    };

    return HttpResponse.json(successResponse(stats));
  }),

  http.get('/api/reservation/capacity-board', ({ request }) => {
    const url = new URL(request.url);
    const placeId = url.searchParams.get('placeId') || '';

    let data = generateCapacityBoard();
    if (placeId) data = data.filter((d) => d.placeId === placeId);

    return HttpResponse.json(successResponse(data));
  }),
];
