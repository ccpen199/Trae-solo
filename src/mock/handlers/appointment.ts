import { http, HttpResponse } from 'msw';
import { mockServices, mockStores, mockStaff, mockAppointments, mockSchedules } from '../fixtures/appointment';
import { successResponse, delay } from '../utils';
import { generateId } from '@/utils/common';

export const appointmentHandlers = [
  http.get('/api/services', async () => {
    await delay(300);
    return HttpResponse.json(successResponse(mockServices));
  }),

  http.get('/api/services/:id', async ({ params }) => {
    await delay(300);
    const id = params.id as string;
    const service = mockServices.find((s) => s.id === id);
    return HttpResponse.json(successResponse(service));
  }),

  http.get('/api/stores', async () => {
    await delay(400);
    return HttpResponse.json(successResponse(mockStores));
  }),

  http.get('/api/stores/:id', async ({ params }) => {
    await delay(300);
    const id = params.id as string;
    const store = mockStores.find((s) => s.id === id);
    return HttpResponse.json(successResponse(store));
  }),

  http.get('/api/stores/:id/staff', async ({ params }) => {
    await delay(300);
    const storeId = params.id as string;
    const staff = mockStaff.filter((s) => s.storeId === storeId);
    return HttpResponse.json(successResponse(staff));
  }),

  http.get('/api/stores/:id/availability', async () => {
    await delay(300);
    const slots = [];
    for (let h = 9; h < 18; h++) {
      slots.push({
        time: `${h.toString().padStart(2, '0')}:00`,
        available: Math.random() > 0.3,
      });
      slots.push({
        time: `${h.toString().padStart(2, '0')}:30`,
        available: Math.random() > 0.4,
      });
    }
    return HttpResponse.json(successResponse(slots));
  }),

  http.post('/api/appointments', async ({ request }) => {
    await delay(500);
    const body = await request.json();
    const newAppointment = {
      ...body,
      id: `apt_${Date.now()}`,
      orderNo: `AP${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${generateId()}`,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      serviceTraces: [],
    };
    return HttpResponse.json(successResponse(newAppointment));
  }),

  http.get('/api/appointments', async () => {
    await delay(400);
    return HttpResponse.json(successResponse(mockAppointments));
  }),

  http.get('/api/appointments/:id', async ({ params }) => {
    await delay(300);
    const id = params.id as string;
    const apt = mockAppointments.find((a) => a.id === id);
    return HttpResponse.json(successResponse(apt));
  }),

  http.put('/api/appointments/:id/cancel', async ({ params }) => {
    await delay(300);
    const id = params.id as string;
    const apt = mockAppointments.find((a) => a.id === id);
    if (apt) {
      apt.status = 'cancelled';
    }
    return HttpResponse.json(successResponse(apt));
  }),

  http.get('/api/store/schedules', async () => {
    await delay(300);
    return HttpResponse.json(successResponse(mockSchedules));
  }),

  http.post('/api/store/schedules', async ({ request }) => {
    await delay(400);
    const body = await request.json();
    const newSchedule = { ...body, id: `sch_${Date.now()}` };
    return HttpResponse.json(successResponse(newSchedule));
  }),

  http.put('/api/store/schedules/:id', async ({ params, request }) => {
    await delay(300);
    const id = params.id as string;
    const body = await request.json();
    const sch = mockSchedules.find((s) => s.id === id);
    return HttpResponse.json(successResponse({ ...sch, ...body }));
  }),

  http.get('/api/store/services', async () => {
    await delay(400);
    return HttpResponse.json(successResponse(mockAppointments));
  }),

  http.put('/api/store/services/:id/step', async ({ params, request }) => {
    await delay(400);
    const id = params.id as string;
    const body = await request.json();
    const trace = {
      id: `trace_${Date.now()}`,
      appointmentId: id,
      ...body,
      completedAt: new Date().toISOString(),
      completedBy: '李明',
    };
    return HttpResponse.json(successResponse(trace));
  }),

  http.post('/api/store/services/:id/photos', async () => {
    await delay(500);
    return HttpResponse.json(successResponse({ success: true }));
  }),
];
