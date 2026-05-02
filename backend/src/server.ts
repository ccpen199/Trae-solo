import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const JWT_SECRET = process.env.JWT_SECRET || 'livestock_management_jwt_secret';

app.use(cors());
app.use(express.json());

interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

interface Livestock {
  id: string;
  earTagId: string;
  livestockType: string;
  breed: string;
  gender: string;
  birthDate: string;
  entryWeight: number;
  entryDate: string;
  source: string;
  barnId: string;
  penId: string;
  status: string;
  currentWeight?: number;
  lastFeedingDate?: string;
  lastVaccinationDate?: string;
  consecutiveDeviationDays: number;
  triggeredHealthCheck: boolean;
  operatorId: string;
  createdAt: string;
  updatedAt: string;
}

interface FeedingRecord {
  id: string;
  earTagId: string;
  livestockType: string;
  breed: string;
  barnId: string;
  penId: string;
  feedingDate: string;
  feedType: string;
  feedAmount: number;
  dailyGain: number;
  baselineGain: number;
  deviation: number;
  deviationDays: number;
  operator: string;
  notes?: string;
  createdAt: string;
}

interface FeedingPlan {
  id: string;
  earTagId: string;
  livestockType: string;
  breed: string;
  barnId: string;
  penId: string;
  currentWeight: number;
  targetWeight: number;
  daysInFarm: number;
  age: number;
  dailyFeedTotal: number;
  dailyFeedFormula: {
    corn: number;
    soybean: number;
    wheat: number;
    premix: number;
    forage: number;
  };
  baselineDailyGain: number;
  targetDailyGain: number;
  actualDailyGain: number;
  planStatus: 'normal' | 'ahead' | 'behind';
  lastFeedingDate: string;
  nextFeedingTime: string;
  createdAt: string;
  updatedAt: string;
}

const users: User[] = [
  {
    id: 'admin-001',
    username: 'admin',
    password: bcrypt.hashSync('admin123', 10),
    name: '系统管理员',
    role: 'admin',
    permissions: ['*'],
    isActive: true,
  },
  {
    id: 'manager-001',
    username: 'manager',
    password: bcrypt.hashSync('manager123', 10),
    name: '张场长',
    role: 'farm_manager',
    permissions: ['livestock:*', 'feeding:*', 'vaccination:*', 'settlement:*', 'anomaly:*', 'statistics:*'],
    isActive: true,
  },
  {
    id: 'feeder-001',
    username: 'feeder',
    password: bcrypt.hashSync('feeder123', 10),
    name: '李饲养员',
    role: 'feeder',
    permissions: ['livestock:read', 'livestock:admission', 'feeding:*'],
    isActive: true,
  },
  {
    id: 'vet-001',
    username: 'vet',
    password: bcrypt.hashSync('vet123', 10),
    name: '王兽医',
    role: 'veterinarian',
    permissions: ['livestock:read', 'vaccination:*', 'anomaly:*'],
    isActive: true,
  },
  {
    id: 'finance-001',
    username: 'finance',
    password: bcrypt.hashSync('finance123', 10),
    name: '赵财务',
    role: 'finance',
    permissions: ['livestock:read', 'settlement:*', 'statistics:*'],
    isActive: true,
  },
];

const livestockList: Livestock[] = [
  {
    id: 'livestock-001',
    earTagId: 'E12345',
    livestockType: 'pig',
    breed: '杜洛克',
    gender: 'male',
    birthDate: '2026-01-01',
    entryWeight: 25.5,
    entryDate: '2026-01-15',
    source: '外购',
    barnId: 'A-01',
    penId: 'A-01-03',
    status: 'in_barn',
    currentWeight: 85.3,
    lastFeedingDate: '2026-04-25',
    lastVaccinationDate: '2026-04-20',
    consecutiveDeviationDays: 0,
    triggeredHealthCheck: false,
    operatorId: 'feeder-001',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-04-25T08:00:00Z',
  },
  {
    id: 'livestock-002',
    earTagId: 'E12346',
    livestockType: 'pig',
    breed: '长白',
    gender: 'female',
    birthDate: '2026-01-05',
    entryWeight: 24.2,
    entryDate: '2026-01-20',
    source: '自繁',
    barnId: 'A-01',
    penId: 'A-01-03',
    status: 'in_barn',
    currentWeight: 78.5,
    lastFeedingDate: '2026-04-25',
    lastVaccinationDate: '2026-04-15',
    consecutiveDeviationDays: 3,
    triggeredHealthCheck: true,
    operatorId: 'feeder-001',
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: '2026-04-25T08:00:00Z',
  },
  {
    id: 'livestock-003',
    earTagId: 'E20001',
    livestockType: 'cattle',
    breed: '西门塔尔',
    gender: 'male',
    birthDate: '2025-06-10',
    entryWeight: 350,
    entryDate: '2025-08-15',
    source: '外购',
    barnId: 'B-01',
    penId: 'B-01-02',
    status: 'in_barn',
    currentWeight: 580,
    lastFeedingDate: '2026-04-25',
    lastVaccinationDate: '2026-03-10',
    consecutiveDeviationDays: 0,
    triggeredHealthCheck: false,
    operatorId: 'feeder-001',
    createdAt: '2025-08-15T08:00:00Z',
    updatedAt: '2026-04-25T08:00:00Z',
  },
  {
    id: 'livestock-004',
    earTagId: 'E12347',
    livestockType: 'pig',
    breed: '大约克',
    gender: 'male',
    birthDate: '2026-01-10',
    entryWeight: 26.0,
    entryDate: '2026-01-25',
    source: '自繁',
    barnId: 'A-02',
    penId: 'A-02-01',
    status: 'in_barn',
    currentWeight: 72.0,
    lastFeedingDate: '2026-04-25',
    lastVaccinationDate: '2026-04-10',
    consecutiveDeviationDays: 0,
    triggeredHealthCheck: false,
    operatorId: 'feeder-001',
    createdAt: '2026-01-25T08:00:00Z',
    updatedAt: '2026-04-25T08:00:00Z',
  },
  {
    id: 'livestock-005',
    earTagId: 'E12348',
    livestockType: 'sheep',
    breed: '湖羊',
    gender: 'female',
    birthDate: '2025-12-01',
    entryWeight: 35.5,
    entryDate: '2026-01-10',
    source: '外购',
    barnId: 'C-01',
    penId: 'C-01-05',
    status: 'in_barn',
    currentWeight: 52.0,
    lastFeedingDate: '2026-04-25',
    lastVaccinationDate: '2026-03-20',
    consecutiveDeviationDays: 1,
    triggeredHealthCheck: false,
    operatorId: 'feeder-001',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-04-25T08:00:00Z',
  },
];

const feedingRecords: FeedingRecord[] = [
  {
    id: 'feeding-001',
    earTagId: 'E12345',
    livestockType: 'pig',
    breed: '杜洛克',
    barnId: 'A-01',
    penId: 'A-01-03',
    feedingDate: new Date().toISOString().split('T')[0],
    feedType: 'corn',
    feedAmount: 2.5,
    dailyGain: 0.65,
    baselineGain: 0.8,
    deviation: -18.75,
    deviationDays: 0,
    operator: '张三',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'feeding-002',
    earTagId: 'E12346',
    livestockType: 'pig',
    breed: '长白',
    barnId: 'A-01',
    penId: 'A-01-03',
    feedingDate: new Date().toISOString().split('T')[0],
    feedType: 'corn',
    feedAmount: 2.3,
    dailyGain: 0.72,
    baselineGain: 0.8,
    deviation: -10,
    deviationDays: 2,
    operator: '张三',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'feeding-003',
    earTagId: 'E20001',
    livestockType: 'cattle',
    breed: '西门塔尔',
    barnId: 'B-01',
    penId: 'B-01-02',
    feedingDate: new Date().toISOString().split('T')[0],
    feedType: 'forage',
    feedAmount: 15,
    dailyGain: 1.2,
    baselineGain: 1.5,
    deviation: -20,
    deviationDays: 3,
    operator: '李四',
    notes: '连续3天异常，已触发健康排查',
    createdAt: new Date().toISOString(),
  },
];

const feedingPlans: FeedingPlan[] = [
  {
    id: 'plan-001',
    earTagId: 'E12345',
    livestockType: 'pig',
    breed: '杜洛克',
    barnId: 'A-01',
    penId: 'A-01-03',
    currentWeight: 85.3,
    targetWeight: 110,
    daysInFarm: 100,
    age: 150,
    dailyFeedTotal: 2.5,
    dailyFeedFormula: {
      corn: 1.5,
      soybean: 0.5,
      wheat: 0.3,
      premix: 0.1,
      forage: 0.1,
    },
    baselineDailyGain: 0.8,
    targetDailyGain: 0.85,
    actualDailyGain: 0.82,
    planStatus: 'ahead',
    lastFeedingDate: new Date().toISOString().split('T')[0],
    nextFeedingTime: '08:00',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan-002',
    earTagId: 'E12346',
    livestockType: 'pig',
    breed: '长白',
    barnId: 'A-01',
    penId: 'A-01-03',
    currentWeight: 78.5,
    targetWeight: 110,
    daysInFarm: 95,
    age: 145,
    dailyFeedTotal: 2.3,
    dailyFeedFormula: {
      corn: 1.4,
      soybean: 0.45,
      wheat: 0.3,
      premix: 0.1,
      forage: 0.05,
    },
    baselineDailyGain: 0.8,
    targetDailyGain: 0.85,
    actualDailyGain: 0.78,
    planStatus: 'behind',
    lastFeedingDate: new Date().toISOString().split('T')[0],
    nextFeedingTime: '08:00',
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan-003',
    earTagId: 'E20001',
    livestockType: 'cattle',
    breed: '西门塔尔',
    barnId: 'B-01',
    penId: 'B-01-02',
    currentWeight: 580,
    targetWeight: 650,
    daysInFarm: 180,
    age: 365,
    dailyFeedTotal: 15,
    dailyFeedFormula: {
      corn: 5,
      soybean: 2,
      wheat: 3,
      premix: 0.5,
      forage: 4.5,
    },
    baselineDailyGain: 1.5,
    targetDailyGain: 1.6,
    actualDailyGain: 1.45,
    planStatus: 'behind',
    lastFeedingDate: new Date().toISOString().split('T')[0],
    nextFeedingTime: '06:00',
    createdAt: '2025-08-15T08:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan-004',
    earTagId: 'E12347',
    livestockType: 'pig',
    breed: '大约克',
    barnId: 'A-02',
    penId: 'A-02-01',
    currentWeight: 72.0,
    targetWeight: 110,
    daysInFarm: 90,
    age: 140,
    dailyFeedTotal: 2.4,
    dailyFeedFormula: {
      corn: 1.45,
      soybean: 0.48,
      wheat: 0.32,
      premix: 0.1,
      forage: 0.05,
    },
    baselineDailyGain: 0.8,
    targetDailyGain: 0.85,
    actualDailyGain: 0.8,
    planStatus: 'normal',
    lastFeedingDate: new Date().toISOString().split('T')[0],
    nextFeedingTime: '08:00',
    createdAt: '2026-01-25T08:00:00Z',
    updatedAt: new Date().toISOString(),
  },
];

const anomalyRecords = [
  {
    id: 'anomaly-001',
    earTagId: 'E12346',
    type: 'consecutive_deviation',
    details: {
      description: '连续3天日增重异常',
      detectedAt: new Date().toISOString(),
      metrics: { actualValue: 0.5, baselineValue: 0.8, deviation: -37.5 },
    },
    status: 'processing',
    priority: 'critical',
    notifications: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'anomaly-002',
    earTagId: 'E12348',
    type: 'vaccine_overdue',
    details: {
      description: '口蹄疫疫苗逾期未接种',
      detectedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    status: 'pending',
    priority: 'high',
    notifications: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = users.find((u) => u.username === username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
    }
    
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const userResponse = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    };
    
    res.json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
});

app.get('/api/statistics/dashboard', (req, res) => {
  const totalInventory = livestockList.length;
  const dailyEntry = 3;
  const dailySlaughter = 2;
  const pendingAnomalies = anomalyRecords.filter(a => a.status === 'pending' || a.status === 'processing').length;
  const monthlyProfit = 45230;
  
  const typeCount: Record<string, number> = {};
  livestockList.forEach((l) => {
    typeCount[l.livestockType] = (typeCount[l.livestockType] || 0) + 1;
  });
  
  const inventoryByType = Object.entries(typeCount).map(([type, count]) => ({
    type,
    count,
    percentage: Math.round((count / totalInventory) * 100),
  }));
  
  res.json({
    success: true,
    data: {
      totalInventory,
      dailyEntry,
      dailySlaughter,
      pendingAnomalies,
      monthlyProfit,
      inventoryByType,
      recentAnomalies: anomalyRecords.slice(0, 5),
    },
  });
});

app.get('/api/livestock', (req, res) => {
  const { type, status, search } = req.query;
  
  let filtered = [...livestockList];
  
  if (type) {
    filtered = filtered.filter((l) => l.livestockType === type);
  }
  
  if (status) {
    filtered = filtered.filter((l) => l.status === status);
  }
  
  if (search) {
    const searchStr = String(search).toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.earTagId.toLowerCase().includes(searchStr) ||
        l.breed.toLowerCase().includes(searchStr)
    );
  }
  
  res.json({
    success: true,
    data: {
      items: filtered,
      total: filtered.length,
      page: 1,
      pageSize: filtered.length,
      totalPages: 1,
    },
  });
});

app.get('/api/livestock/:id', (req, res) => {
  const livestock = livestockList.find((l) => l.id === req.params.id || l.earTagId === req.params.id);
  
  if (!livestock) {
    return res.status(404).json({
      success: false,
      message: '未找到该牲畜',
    });
  }
  
  res.json({
    success: true,
    data: livestock,
  });
});

app.post('/api/livestock/admission', (req, res) => {
  const { earTagId, livestockType, breed, gender, birthDate, entryWeight, source, barnId, penId, notes } = req.body;
  
  const existing = livestockList.find((l) => l.earTagId === earTagId);
  if (existing) {
    return res.status(400).json({
      success: false,
      message: '耳标编号已存在',
    });
  }
  
  const newLivestock: Livestock = {
    id: uuidv4(),
    earTagId,
    livestockType,
    breed,
    gender,
    birthDate,
    entryWeight,
    entryDate: new Date().toISOString().split('T')[0],
    source: source || '外购',
    barnId,
    penId,
    status: 'in_barn',
    currentWeight: entryWeight,
    consecutiveDeviationDays: 0,
    triggeredHealthCheck: false,
    operatorId: 'feeder-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  livestockList.push(newLivestock);
  
  res.json({
    success: true,
    data: newLivestock,
    message: '进场登记成功！系统已自动生成喂养计划和疫苗日历',
  });
});

app.get('/api/feeding/records', (req, res) => {
  const { date, earTagId, status } = req.query;
  
  let filtered = [...feedingRecords];
  
  if (date) {
    filtered = filtered.filter((r) => r.feedingDate === date);
  }
  
  if (earTagId) {
    filtered = filtered.filter((r) => r.earTagId === earTagId);
  }
  
  if (status === 'normal') {
    filtered = filtered.filter((r) => Math.abs(r.deviation) <= 10 && r.deviationDays < 3);
  } else if (status === 'warning') {
    filtered = filtered.filter((r) => (Math.abs(r.deviation) > 10 || r.deviationDays >= 1) && r.deviationDays < 3);
  } else if (status === 'critical') {
    filtered = filtered.filter((r) => r.deviationDays >= 3);
  }
  
  const summary = {
    total: filtered.length,
    normal: filtered.filter((r) => Math.abs(r.deviation) <= 10 && r.deviationDays < 3).length,
    warning: filtered.filter((r) => (Math.abs(r.deviation) > 10 || r.deviationDays >= 1) && r.deviationDays < 3).length,
    critical: filtered.filter((r) => r.deviationDays >= 3).length,
  };
  
  res.json({
    success: true,
    data: {
      items: filtered,
      total: filtered.length,
      summary,
    },
  });
});

app.post('/api/feeding/records', (req, res) => {
  const { earTagId, feedType, feedAmount, previousWeight, actualWeight, baselineGain, operator, notes } = req.body;
  
  const livestock = livestockList.find((l) => l.earTagId === earTagId);
  if (!livestock) {
    return res.status(404).json({
      success: false,
      message: '未找到该牲畜',
    });
  }
  
  const dailyGain = actualWeight - previousWeight;
  const deviation = ((dailyGain - baselineGain) / baselineGain * 100);
  
  let deviationDays = 0;
  const previousRecords = feedingRecords.filter((r) => r.earTagId === earTagId);
  if (previousRecords.length > 0) {
    const lastRecord = previousRecords[previousRecords.length - 1];
    deviationDays = lastRecord.deviationDays;
    if (Math.abs(deviation) > 10) {
      deviationDays += 1;
    } else {
      deviationDays = 0;
    }
  }
  
  const newRecord: FeedingRecord = {
    id: uuidv4(),
    earTagId,
    livestockType: livestock.livestockType,
    breed: livestock.breed,
    barnId: livestock.barnId,
    penId: livestock.penId,
    feedingDate: new Date().toISOString().split('T')[0],
    feedType,
    feedAmount,
    dailyGain,
    baselineGain,
    deviation,
    deviationDays,
    operator: operator || '系统',
    notes,
    createdAt: new Date().toISOString(),
  };
  
  feedingRecords.push(newRecord);
  
  livestock.currentWeight = actualWeight;
  livestock.lastFeedingDate = newRecord.feedingDate;
  livestock.consecutiveDeviationDays = deviationDays;
  if (deviationDays >= 3) {
    livestock.triggeredHealthCheck = true;
  }
  livestock.updatedAt = new Date().toISOString();
  
  const response: Record<string, unknown> = {
    success: true,
    data: newRecord,
  };
  
  if (deviationDays >= 3) {
    response.message = '饲喂记录已保存。警告：连续3天日增重偏离正常区间，已自动触发健康排查单！';
  } else {
    response.message = '饲喂记录保存成功';
  }
  
  res.json(response);
});

app.get('/api/feeding/records/:id', (req, res) => {
  const record = feedingRecords.find((r) => r.id === req.params.id);
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: '未找到该饲喂记录',
    });
  }
  
  res.json({
    success: true,
    data: record,
  });
});

app.delete('/api/feeding/records/:id', (req, res) => {
  const index = feedingRecords.findIndex((r) => r.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: '未找到该饲喂记录',
    });
  }
  
  feedingRecords.splice(index, 1);
  
  res.json({
    success: true,
    message: '删除成功',
  });
});

app.get('/api/feeding/plans', (req, res) => {
  const { status, earTagId, livestockType } = req.query;
  
  let filtered = [...feedingPlans];
  
  if (status) {
    filtered = filtered.filter((p) => p.planStatus === status);
  }
  
  if (earTagId) {
    filtered = filtered.filter((p) => p.earTagId === earTagId);
  }
  
  if (livestockType) {
    filtered = filtered.filter((p) => p.livestockType === livestockType);
  }
  
  const summary = {
    total: filtered.length,
    normal: filtered.filter((p) => p.planStatus === 'normal').length,
    ahead: filtered.filter((p) => p.planStatus === 'ahead').length,
    behind: filtered.filter((p) => p.planStatus === 'behind').length,
  };
  
  res.json({
    success: true,
    data: {
      items: filtered,
      total: filtered.length,
      summary,
    },
  });
});

app.get('/api/feeding/plans/:id', (req, res) => {
  const plan = feedingPlans.find((p) => p.id === req.params.id || p.earTagId === req.params.id);
  
  if (!plan) {
    return res.status(404).json({
      success: false,
      message: '未找到该喂养计划',
    });
  }
  
  const recentRecords = feedingRecords
    .filter((r) => r.earTagId === plan.earTagId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
  
  res.json({
    success: true,
    data: {
      ...plan,
      recentRecords,
    },
  });
});

app.put('/api/feeding/plans/:id', (req, res) => {
  const plan = feedingPlans.find((p) => p.id === req.params.id);
  
  if (!plan) {
    return res.status(404).json({
      success: false,
      message: '未找到该喂养计划',
    });
  }
  
  const { targetWeight, dailyFeedTotal, dailyFeedFormula } = req.body;
  
  if (targetWeight) plan.targetWeight = targetWeight;
  if (dailyFeedTotal) plan.dailyFeedTotal = dailyFeedTotal;
  if (dailyFeedFormula) plan.dailyFeedFormula = { ...plan.dailyFeedFormula, ...dailyFeedFormula };
  plan.updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    data: plan,
    message: '喂养计划更新成功',
  });
});

app.get('/api/anomalies', (req, res) => {
  const { status, type } = req.query;
  
  let filtered = [...anomalyRecords];
  
  if (status) {
    filtered = filtered.filter((a) => a.status === status);
  }
  
  if (type) {
    filtered = filtered.filter((a) => a.type === type);
  }
  
  res.json({
    success: true,
    data: {
      items: filtered,
      total: filtered.length,
      page: 1,
      pageSize: filtered.length,
      totalPages: 1,
    },
  });
});

app.get('/api/health-checks', (req, res) => {
  const healthChecks = anomalyRecords
    .filter((a) => a.type === 'consecutive_deviation')
    .map((a) => ({
      id: uuidv4(),
      anomalyRecordId: a.id,
      earTagId: a.earTagId,
      title: `健康排查 - ${a.earTagId}`,
      description: a.details.description,
      priority: a.priority,
      status: a.status === 'processing' ? 'in_progress' : 'pending',
      assignedTo: 'vet-001',
      assignedAt: new Date().toISOString(),
      checkRequirements: {
        temperature: true,
        appetite: true,
        behavior: true,
        feces: true,
      },
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  
  res.json({
    success: true,
    data: {
      items: healthChecks,
      total: healthChecks.length,
    },
  });
});

app.get('/api/users/current', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: '未授权',
    });
  }
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const user = users.find((u) => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在',
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token无效',
    });
  }
});

app.get('/api/', (req, res) => {
  res.json({
    success: true,
    message: '畜牧养殖管理系统 API',
    version: '1.0.0',
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '畜牧养殖管理系统后端服务运行中',
    endpoints: {
      login: 'POST /api/auth/login',
      currentUser: 'GET /api/users/current',
      dashboard: 'GET /api/statistics/dashboard',
      livestock: 'GET /api/livestock',
      livestockById: 'GET /api/livestock/:id',
      admission: 'POST /api/livestock/admission',
      feedingRecords: 'GET/POST /api/feeding/records',
      feedingRecordById: 'GET/DELETE /api/feeding/records/:id',
      feedingPlans: 'GET /api/feeding/plans',
      feedingPlanById: 'GET/PUT /api/feeding/plans/:id',
      anomalies: 'GET /api/anomalies',
      healthChecks: 'GET /api/health-checks',
    },
    testAccounts: {
      admin: 'admin / admin123',
      manager: 'manager / manager123',
      feeder: 'feeder / feeder123',
      vet: 'vet / vet123',
      finance: 'finance / finance123',
    },
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     畜牧养殖管理系统 - 后端服务                                  ║
╠═══════════════════════════════════════════════════════════════╣
║  服务状态: 运行中                                               ║
║  端口: ${PORT}                                                          ║
║  环境: ${process.env.NODE_ENV || 'development'}                                          ║
╠═══════════════════════════════════════════════════════════════╣
║  测试账号:                                                      ║
║  - 系统管理员: admin / admin123                                ║
║  - 场长: manager / manager123                                  ║
║  - 饲养员: feeder / feeder123                                  ║
║  - 兽医: vet / vet123                                          ║
║  - 财务: finance / finance123                                  ║
╠═══════════════════════════════════════════════════════════════╣
║  API 文档:                                                      ║
║  - GET  /                      - 服务信息                       ║
║  - POST /api/auth/login        - 用户登录                       ║
║  - GET  /api/users/current     - 当前用户信息                   ║
║  - GET  /api/statistics/dashboard - 工作台数据                 ║
║  - GET  /api/livestock         - 牲畜列表                       ║
║  - POST /api/livestock/admission - 进场登记                      ║
║  - GET  /api/feeding/records   - 饲喂记录列表                    ║
║  - POST /api/feeding/records   - 创建饲喂记录                    ║
║  - GET  /api/feeding/plans    - 喂养计划列表                    ║
║  - GET  /api/feeding/plans/:id - 喂养计划详情                    ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
