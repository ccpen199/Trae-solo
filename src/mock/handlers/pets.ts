import { http, HttpResponse } from 'msw';
import { mockPets } from '../fixtures/pets';
import { mockVaccineRecords, mockDewormingRecords, mockMedicalRecords } from '../fixtures/medical';
import { successResponse, delay } from '../utils';

export const petHandlers = [
  http.get('/api/pets', async () => {
    await delay(300);
    return HttpResponse.json(successResponse(mockPets));
  }),

  http.get('/api/pets/:id', async ({ params }) => {
    await delay(300);
    const id = params.id as string;
    const pet = mockPets.find((p) => p.id === id);
    if (!pet) {
      return HttpResponse.json(successResponse(null, '宠物不存在'), { status: 404 });
    }
    return HttpResponse.json(successResponse(pet));
  }),

  http.post('/api/pets', async ({ request }) => {
    await delay(400);
    const body = await request.json();
    const newPet = {
      ...body,
      id: `pet_${Date.now()}`,
      healthScore: 85,
      tags: [],
      chronicConditions: [],
    };
    return HttpResponse.json(successResponse(newPet));
  }),

  http.put('/api/pets/:id', async ({ params, request }) => {
    await delay(300);
    const id = params.id as string;
    const body = await request.json();
    const pet = mockPets.find((p) => p.id === id);
    if (!pet) {
      return HttpResponse.json(successResponse(null, '宠物不存在'), { status: 404 });
    }
    return HttpResponse.json(successResponse({ ...pet, ...body }));
  }),

  http.get('/api/pets/:id/vaccines', async ({ params }) => {
    await delay(300);
    const petId = params.id as string;
    const records = mockVaccineRecords.filter((v) => v.petId === petId);
    return HttpResponse.json(successResponse(records));
  }),

  http.get('/api/pets/:id/dewormings', async ({ params }) => {
    await delay(300);
    const petId = params.id as string;
    const records = mockDewormingRecords.filter((d) => d.petId === petId);
    return HttpResponse.json(successResponse(records));
  }),

  http.get('/api/pets/:id/records', async ({ params }) => {
    await delay(400);
    const petId = params.id as string;
    const records = mockMedicalRecords.filter((r) => r.petId === petId);
    return HttpResponse.json(successResponse(records));
  }),

  http.get('/api/pets/:id/chronic', async ({ params }) => {
    await delay(300);
    const petId = params.id as string;
    const pet = mockPets.find((p) => p.id === petId);
    return HttpResponse.json(successResponse(pet?.chronicConditions || []));
  }),

  http.post('/api/pets/:id/chronic/:conditionId/metrics', async ({ request }) => {
    await delay(300);
    const body = await request.json();
    const newMetric = {
      ...body,
      id: `metric_${Date.now()}`,
    };
    return HttpResponse.json(successResponse(newMetric));
  }),
];
