import express from 'express';
import cors from 'cors';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mockAppointments, mockSchedules, mockServices, mockStaff, mockStores } from '../src/mock/fixtures/appointment';
import { mockInventoryBatches, mockInventoryItems, mockProducts } from '../src/mock/fixtures/inventory';
import { mockMedicalRecords } from '../src/mock/fixtures/medical';
import { mockBreeds, mockConsults, mockDiseases, mockMemberProfile, mockPointsTransactions, mockSymptoms } from '../src/mock/fixtures/member';
import { mockPets } from '../src/mock/fixtures/pets';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function loadProjectEnv() {
  const envPath = path.resolve(projectRoot, '.env');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadProjectEnv();

const app = express();
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59158);

app.use(cors({ origin: true }));
app.use(express.json());

function sendApiData(res: express.Response, data: unknown, message = 'ok') {
  res.json({ code: 0, data, message });
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'may-89158-backend',
    app: '宠物健康全周期管理 SaaS 平台',
    dataMode: 'local mock fixtures',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/bootstrap', (_req, res) => {
  res.json({
    code: 0,
    data: {
      roles: ['owner', 'store_staff', 'store_manager', 'veterinarian'],
      modules: ['pets', 'appointments', 'inventory', 'members', 'medical-records'],
    },
    message: 'ok',
  });
});

app.post('/api/auth/login', (_req, res) => {
  sendApiData(res, {
    token: 'local-may-89158-token',
    user: {
      id: 'owner_001',
      phone: '13800138000',
      name: '示例宠主',
      role: 'owner',
    },
  }, '登录成功');
});

app.post('/api/auth/sms', (_req, res) => {
  sendApiData(res, { sent: true }, '验证码已发送');
});

app.post('/api/auth/logout', (_req, res) => {
  sendApiData(res, { success: true }, '已退出');
});

app.get('/api/auth/me', (_req, res) => {
  sendApiData(res, {
    id: 'owner_001',
    phone: '13800138000',
    name: '示例宠主',
    role: 'owner',
  });
});

app.get('/api/pets/:id/vaccines', (_req, res) => {
  sendApiData(res, []);
});

app.get('/api/pets/:id/dewormings', (_req, res) => {
  sendApiData(res, []);
});

app.get('/api/pets/:id/records', (_req, res) => {
  sendApiData(res, mockMedicalRecords);
});

app.get('/api/pets/:id/chronic', (req, res) => {
  const pet = mockPets.find((item) => item.id === req.params.id);
  sendApiData(res, pet?.chronicConditions || []);
});

app.get('/api/pets/:id', (req, res) => {
  sendApiData(res, mockPets.find((item) => item.id === req.params.id) || mockPets[0]);
});

app.get('/api/pets', (_req, res) => {
  sendApiData(res, mockPets);
});

app.post('/api/pets', (req, res) => {
  sendApiData(res, { id: `pet_${Date.now()}`, ...req.body }, '宠物档案已创建');
});

app.put('/api/pets/:id', (req, res) => {
  const pet = mockPets.find((item) => item.id === req.params.id) || mockPets[0];
  sendApiData(res, { ...pet, ...req.body }, '宠物档案已更新');
});

app.get('/api/services/:id', (req, res) => {
  sendApiData(res, mockServices.find((item) => item.id === req.params.id) || mockServices[0]);
});

app.get('/api/services', (_req, res) => {
  sendApiData(res, mockServices);
});

app.get('/api/stores/:id/staff', (_req, res) => {
  sendApiData(res, mockStaff);
});

app.get('/api/stores/:id/availability', (_req, res) => {
  sendApiData(res, {
    date: String(_req.query.date || new Date().toISOString().slice(0, 10)),
    slots: ['09:00', '10:30', '14:00', '15:30', '17:00'],
  });
});

app.get('/api/stores/:id', (req, res) => {
  sendApiData(res, mockStores.find((item) => item.id === req.params.id) || mockStores[0]);
});

app.get('/api/stores', (_req, res) => {
  sendApiData(res, mockStores);
});

app.get('/api/appointments/:id', (req, res) => {
  sendApiData(res, mockAppointments.find((item) => item.id === req.params.id) || mockAppointments[0]);
});

app.get('/api/appointments', (_req, res) => {
  sendApiData(res, mockAppointments);
});

app.post('/api/appointments', (req, res) => {
  sendApiData(res, {
    id: `apt_${Date.now()}`,
    orderNo: `AP${Date.now()}`,
    createdAt: new Date().toISOString(),
    serviceTraces: [],
    ...req.body,
  }, '预约已提交');
});

app.put('/api/appointments/:id/cancel', (req, res) => {
  const appointment = mockAppointments.find((item) => item.id === req.params.id) || mockAppointments[0];
  sendApiData(res, { ...appointment, status: 'cancelled' }, '预约已取消');
});

app.get('/api/store/schedules', (_req, res) => {
  sendApiData(res, mockSchedules);
});

app.post('/api/store/schedules', (req, res) => {
  sendApiData(res, { id: `schedule_${Date.now()}`, ...req.body }, '排班已创建');
});

app.put('/api/store/schedules/:id', (req, res) => {
  const schedule = mockSchedules.find((item) => item.id === req.params.id) || mockSchedules[0];
  sendApiData(res, { ...schedule, ...req.body }, '排班已更新');
});

app.get('/api/store/services', (_req, res) => {
  sendApiData(res, mockAppointments);
});

app.put('/api/store/services/:id/step', (req, res) => {
  sendApiData(res, {
    id: `trace_${Date.now()}`,
    appointmentId: req.params.id,
    completedAt: new Date().toISOString(),
    completedBy: '本地后端',
    ...req.body,
  }, '服务步骤已更新');
});

app.post('/api/store/services/:id/photos', (_req, res) => {
  sendApiData(res, { success: true }, '照片已上传');
});

app.get('/api/store/inventory/:id/batches', (req, res) => {
  sendApiData(res, mockInventoryBatches.filter((item) => item.inventoryItemId === req.params.id));
});

app.get('/api/store/inventory/alerts', (_req, res) => {
  sendApiData(res, mockInventoryItems.filter((item) => item.currentStock <= item.safetyStock));
});

app.get('/api/store/inventory', (_req, res) => {
  sendApiData(res, mockInventoryItems);
});

app.get('/api/shop/products/:id', (req, res) => {
  sendApiData(res, mockProducts.find((item) => item.id === req.params.id) || mockProducts[0]);
});

app.get('/api/shop/products', (req, res) => {
  const category = String(req.query.category || '');
  sendApiData(res, category ? mockProducts.filter((item) => item.category === category) : mockProducts);
});

app.get('/api/shop/cart', (_req, res) => {
  sendApiData(res, { items: [{ productId: 'prod_003', quantity: 1 }], total: 168 });
});

app.post('/api/shop/cart', (_req, res) => {
  sendApiData(res, { items: [{ productId: 'prod_003', quantity: 1 }], total: 168 }, '已加入购物车');
});

app.post('/api/reviews', (req, res) => {
  sendApiData(res, { id: `review_${Date.now()}`, status: 'pending', submittedAt: new Date().toISOString(), ...req.body }, '处方审核已提交');
});

app.get('/api/reviews/:id', (req, res) => {
  sendApiData(res, { id: req.params.id, status: 'approved', reviewNotes: '本地审核通过' });
});

app.get('/api/store/records', (_req, res) => {
  sendApiData(res, mockMedicalRecords);
});

app.post('/api/store/records', (req, res) => {
  sendApiData(res, { id: `record_${Date.now()}`, ...req.body }, '病历已创建');
});

app.put('/api/store/records/:id/sign', (req, res) => {
  const record = mockMedicalRecords.find((item) => item.id === req.params.id) || mockMedicalRecords[0];
  sendApiData(res, { ...record, signed: true, signature: req.body.signature }, '病历已签名');
});

app.get('/api/store/dashboard', (_req, res) => {
  sendApiData(res, {
    todayAppointments: mockAppointments.length,
    lowStockItems: mockInventoryItems.filter((item) => item.currentStock <= item.safetyStock).length,
    activeMembers: 128,
    revenue: 23860,
  });
});

app.get('/api/store/prescriptions', (_req, res) => {
  sendApiData(res, [
    { id: 'rx_001', petId: 'pet_001', drugName: '复方新霉素滴耳液', status: 'pending', submittedAt: new Date().toISOString() },
  ]);
});

app.put('/api/store/prescriptions/:id/review', (req, res) => {
  sendApiData(res, { id: req.params.id, status: req.body.approved ? 'approved' : 'rejected', reviewNotes: req.body.reviewNotes || '' });
});

app.get('/api/member/profile', (_req, res) => {
  sendApiData(res, mockMemberProfile);
});

app.get('/api/member/points/transactions', (_req, res) => {
  sendApiData(res, mockPointsTransactions);
});

app.get('/api/member/benefits', (_req, res) => {
  sendApiData(res, mockMemberProfile.benefits);
});

app.get('/api/consults/:id/messages', (req, res) => {
  const consult = mockConsults.find((item) => item.id === req.params.id) || mockConsults[0];
  sendApiData(res, consult.messages || []);
});

app.get('/api/consults', (_req, res) => {
  sendApiData(res, mockConsults);
});

app.post('/api/consults', (req, res) => {
  sendApiData(res, { id: `consult_${Date.now()}`, status: 'in_progress', startedAt: new Date().toISOString(), ...req.body }, '问诊已创建');
});

app.post('/api/consults/:id/messages', (req, res) => {
  sendApiData(res, { id: `msg_${Date.now()}`, sessionId: req.params.id, createdAt: new Date().toISOString(), ...req.body }, '消息已发送');
});

app.get('/api/knowledge/breeds', (req, res) => {
  const species = String(req.query.species || '');
  sendApiData(res, species ? mockBreeds.filter((item) => item.species === species) : mockBreeds);
});

app.get('/api/knowledge/symptoms', (_req, res) => {
  sendApiData(res, mockSymptoms);
});

app.get('/api/knowledge/diseases', (_req, res) => {
  sendApiData(res, mockDiseases);
});

app.post('/api/symptom-check', (_req, res) => {
  sendApiData(res, {
    urgencyLevel: 'soon',
    possibleDiseases: mockDiseases.slice(0, 3),
    recommendedServices: mockServices.slice(1, 4),
  }, '症状评估完成');
});

app.get(['/api/products', '/api/orders', '/api/cart', '/api/teachers', '/api/courses', '/api/bookings'], (req, res) => {
  const data: Record<string, unknown> = {
    '/api/products': mockProducts,
    '/api/orders': [
      { id: 'order_001', status: 'paid', amount: 168, title: '精致洗护套餐' },
    ],
    '/api/cart': { items: [{ productId: 'prod_003', quantity: 1 }], total: 168 },
    '/api/teachers': mockStaff.filter((item) => item.role === 'veterinarian'),
    '/api/courses': mockServices,
    '/api/bookings': mockAppointments,
  };
  sendApiData(res, data[req.path] || []);
});

app.get('/api/search', (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '');
  const items = [...mockProducts, ...mockServices].filter((item) => JSON.stringify(item).includes(keyword));
  sendApiData(res, { keyword, items, total: items.length });
});

app.get('/api/admin/stats', (_req, res) => {
  sendApiData(res, { stores: mockStores.length, appointments: mockAppointments.length, inventoryAlerts: 3 });
});

app.get('/api/admin/dashboard', (_req, res) => {
  sendApiData(res, { modules: ['排班调度', '库存管理', '处方审核'], pendingTasks: 6 });
});

app.all('/api/*', (req, res) => {
  const method = req.method.toUpperCase();
  const fallbackData = method === 'GET' ? [] : { success: true, id: `local_${Date.now()}` };
  sendApiData(res, fallbackData, 'local fallback response');
});

const server = app.listen(port, host, () => {
  console.log(`may-89158 backend listening on http://${host}:${port}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});
