import { http, HttpResponse } from 'msw';
import { mockMemberProfile, mockPointsTransactions, mockConsults, mockBreeds, mockSymptoms, mockDiseases } from '../fixtures/member';
import { successResponse, delay } from '../utils';
import type { SymptomCheckRequest } from '@/types/knowledge';

export const memberHandlers = [
  http.get('/api/member/profile', async () => {
    await delay(400);
    return HttpResponse.json(successResponse(mockMemberProfile));
  }),

  http.get('/api/member/points/transactions', async () => {
    await delay(300);
    return HttpResponse.json(successResponse(mockPointsTransactions));
  }),

  http.get('/api/member/benefits', async () => {
    await delay(300);
    return HttpResponse.json(successResponse(mockMemberProfile.benefits));
  }),

  http.get('/api/consults', async () => {
    await delay(400);
    return HttpResponse.json(successResponse(mockConsults));
  }),

  http.post('/api/consults', async ({ request }) => {
    await delay(500);
    const body = await request.json();
    const newConsult = {
      ...body,
      id: `consult_${Date.now()}`,
      orderNo: `CS${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Date.now().toString().slice(-4)}`,
      veterinarianId: 'vet_001',
      status: 'waiting',
      amount: body.type === 'video' ? 100 : 50,
      isPriorityChannel: mockMemberProfile.level >= 3,
      messages: [
        {
          id: `msg_${Date.now()}`,
          senderType: 'owner',
          senderId: 'owner_001',
          messageType: 'text',
          content: body.question,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    return HttpResponse.json(successResponse(newConsult));
  }),

  http.get('/api/consults/:id/messages', async ({ params }) => {
    await delay(300);
    const id = params.id as string;
    const consult = mockConsults.find((c) => c.id === id);
    return HttpResponse.json(successResponse(consult?.messages || []));
  }),

  http.post('/api/consults/:id/messages', async ({ params, request }) => {
    await delay(300);
    const id = params.id as string;
    const body = await request.json();
    const newMsg = {
      id: `msg_${Date.now()}`,
      sessionId: id,
      senderType: 'owner' as const,
      senderId: 'owner_001',
      ...body,
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(successResponse(newMsg));
  }),

  http.get('/api/knowledge/breeds', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const species = url.searchParams.get('species');
    let breeds = mockBreeds;
    if (species) {
      breeds = breeds.filter((b) => b.species === species);
    }
    return HttpResponse.json(successResponse(breeds));
  }),

  http.get('/api/knowledge/symptoms', async () => {
    await delay(300);
    return HttpResponse.json(successResponse(mockSymptoms));
  }),

  http.get('/api/knowledge/diseases', async () => {
    await delay(300);
    return HttpResponse.json(successResponse(mockDiseases));
  }),

  http.post('/api/symptom-check', async ({ request }) => {
    await delay(800);
    const body = (await request.json()) as SymptomCheckRequest;
    
    const matchedDiseases = mockDiseases
      .filter((d) => d.commonSymptoms.some((s) => body.symptomIds.map(id => {
        const sym = mockSymptoms.find(sym => sym.id === id);
        return sym?.name === s;
      }).includes(true)))
      .map((d) => ({
        diseaseId: d.id,
        diseaseName: d.name,
        matchScore: Math.round(50 + Math.random() * 45),
        description: d.description,
      }))
      .sort((a, b) => b.matchScore - a.matchScore);

    const result = {
      sessionId: `check_${Date.now()}`,
      pet: {
        species: body.species,
        breedId: body.breedId,
        ageMonths: body.ageMonths,
        gender: body.gender,
      },
      selectedSymptoms: body.symptomIds,
      possibleDiseases: matchedDiseases.length > 0 ? matchedDiseases : [
        { diseaseId: 'dis_unknow', diseaseName: '需进一步检查', matchScore: 0, description: '建议前往医院做详细检查' }
      ],
      recommendedTests: ['血常规', '生化检查'],
      recommendedServices: ['专科问诊', '基础体检'],
      urgencyAdvice: matchedDiseases.some(d => d.matchScore > 70) 
        ? '建议尽快就医检查' 
        : '可先观察，如症状加重请及时就医',
    };

    return HttpResponse.json(successResponse(result));
  }),

  http.get('/api/store/dashboard', async () => {
    await delay(500);
    return HttpResponse.json(
      successResponse({
        todayAppointments: 8,
        pendingServices: 3,
        inventoryAlerts: 4,
        todayRevenue: 3280,
        weeklyAppointments: [12, 8, 15, 10, 8, 5, 3],
        topServices: [
          { name: '精致洗护', count: 28, revenue: 4704 },
          { name: '驱虫服务', count: 18, revenue: 2304 },
          { name: '疫苗接种', count: 15, revenue: 1320 },
          { name: '基础体检', count: 8, revenue: 3104 },
        ],
      })
    );
  }),

  http.get('/api/store/reports', async () => {
    await delay(400);
    return HttpResponse.json(
      successResponse({
        totalServices: 156,
        totalRevenue: 68580,
        totalCustomers: 89,
        inventoryTurnover: 2.3,
      })
    );
  }),
];
