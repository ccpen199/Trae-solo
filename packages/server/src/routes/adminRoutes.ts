import { Router } from 'express';
import prisma from '../config/prisma';
import { sign } from '../utils/jwt';
import { error, success } from '../utils/response';

const router = Router();

const toInt = (value: unknown, fallback: number) => {
  const parsed = parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const adminStationStatus = (status: string) => {
  if (status === 'active') return 'online';
  return status || 'offline';
};

const stationDbStatus = (status?: unknown) => {
  if (status === 'online') return 'active';
  return typeof status === 'string' ? status : undefined;
};

const pageResult = <T>(list: T[], total: number, page: number, pageSize: number) => ({
  list,
  total,
  page,
  pageSize,
});

const orderNo = (id: string, createdAt: Date) => {
  const stamp = createdAt.toISOString().slice(0, 10).replace(/-/g, '');
  return `ORD${stamp}${id.replace(/\W/g, '').slice(-6).toUpperCase()}`;
};

const mapOrder = (order: any) => ({
  id: order.id,
  orderNo: orderNo(order.id, order.createdAt),
  userId: order.userId,
  userName: order.user?.nickname || order.user?.phone || '匿名用户',
  pileId: order.pileId,
  pileName: order.pile?.pileNo || order.pileId,
  stationName: order.station?.name || order.stationId,
  startTime: order.startTime || order.createdAt,
  endTime: order.endTime,
  duration: order.startTime && order.endTime
    ? Math.round((order.endTime.getTime() - order.startTime.getTime()) / 1000)
    : undefined,
  energy: Number(order.chargedKwh),
  amount: Number(order.totalAmount),
  status: order.status === 'pending' ? 'charging' : order.status,
});

router.post('/auth/login', (req, res) => {
  const username = req.body?.username || 'admin';
  success(res, {
    token: sign({ userId: 'admin-demo', phone: String(username) }),
    userInfo: {
      id: 'admin-demo',
      username,
      role: 'admin',
    },
  }, '登录成功');
});

router.post('/auth/logout', (_req, res) => {
  success(res, null, '退出成功');
});

router.post('/auth/profile', (_req, res) => {
  success(res, {
    id: 'admin-demo',
    username: 'admin',
    role: 'admin',
  });
});

router.get('/stations', async (req, res) => {
  const page = toInt(req.query.page, 1);
  const pageSize = toInt(req.query.pageSize, 10);
  const keyword = String(req.query.keyword || '');
  const status = stationDbStatus(req.query.status);
  const where: any = {};

  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { address: { contains: keyword } },
    ];
  }
  if (status) where.status = status;
  if (req.query.operatorId) where.operatorId = String(req.query.operatorId);

  const [stations, total] = await Promise.all([
    prisma.chargingStation.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        operator: true,
        _count: { select: { piles: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.chargingStation.count({ where }),
  ]);

  success(res, pageResult(stations.map((station) => ({
    id: station.id,
    name: station.name,
    address: station.address,
    pileCount: station._count.piles,
    status: adminStationStatus(station.status),
    operator: station.operator.name,
    createTime: station.createdAt,
  })), total, page, pageSize));
});

router.post('/stations', async (req, res) => {
  const operator = await prisma.operator.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!operator) {
    error(res, '缺少运营商数据');
    return;
  }

  const station = await prisma.chargingStation.create({
    data: {
      name: req.body.name,
      address: req.body.address,
      longitude: Number(req.body.longitude || 116.4),
      latitude: Number(req.body.latitude || 39.9),
      operatorId: req.body.operatorId || operator.id,
      type: req.body.type || 'public',
      totalPiles: Number(req.body.pileCount || 0),
      availablePiles: Number(req.body.pileCount || 0),
      pricePerKwh: Number(req.body.pricePerKwh || 1.25),
      serviceFee: Number(req.body.serviceFee || 0.28),
      status: stationDbStatus(req.body.status) || 'active',
    },
  });

  success(res, station, '创建成功');
});

router.put('/stations/:id', async (req, res) => {
  const station = await prisma.chargingStation.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name,
      address: req.body.address,
      status: stationDbStatus(req.body.status),
      totalPiles: req.body.pileCount ? Number(req.body.pileCount) : undefined,
    },
  });
  success(res, station, '更新成功');
});

router.delete('/stations/:id', async (req, res) => {
  await prisma.chargingStation.delete({ where: { id: req.params.id } });
  success(res, null, '删除成功');
});

router.get('/piles/status/overview', async (_req, res) => {
  const groups = await prisma.chargingPile.groupBy({
    by: ['status'],
    _count: { status: true },
  });
  success(res, groups.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = item._count.status;
    return acc;
  }, {}));
});

router.get('/piles', async (req, res) => {
  const page = toInt(req.query.page, 1);
  const pageSize = toInt(req.query.pageSize, 10);
  const where: any = {};
  if (req.query.status) where.status = String(req.query.status);
  if (req.query.stationId) where.stationId = String(req.query.stationId);
  if (req.query.type) where.type = String(req.query.type);

  const [piles, total] = await Promise.all([
    prisma.chargingPile.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { station: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.chargingPile.count({ where }),
  ]);

  success(res, pageResult(piles.map((pile) => ({
    id: pile.id,
    name: pile.pileNo,
    stationId: pile.stationId,
    stationName: pile.station.name,
    power: Number(pile.power),
    type: pile.type,
    status: pile.status,
    createTime: pile.createdAt,
  })), total, page, pageSize));
});

router.get('/piles/:id', async (req, res) => {
  const pile = await prisma.chargingPile.findUnique({
    where: { id: req.params.id },
    include: { station: true },
  });
  if (!pile) {
    error(res, '充电桩不存在', 404);
    return;
  }
  success(res, pile);
});

router.get('/orders/statistics', async (_req, res) => {
  const [total, charging, completed] = await Promise.all([
    prisma.chargingOrder.count(),
    prisma.chargingOrder.count({ where: { status: 'charging' } }),
    prisma.chargingOrder.count({ where: { status: 'completed' } }),
  ]);
  const amount = await prisma.chargingOrder.aggregate({ _sum: { totalAmount: true } });
  success(res, {
    total,
    charging,
    completed,
    totalAmount: Number(amount._sum.totalAmount || 0),
  });
});

router.get('/orders', async (req, res) => {
  const page = toInt(req.query.page, 1);
  const pageSize = toInt(req.query.pageSize, 10);
  const where: any = {};
  if (req.query.status) where.status = String(req.query.status);
  if (req.query.stationId) where.stationId = String(req.query.stationId);

  const [orders, total] = await Promise.all([
    prisma.chargingOrder.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, phone: true, nickname: true } },
        station: true,
        pile: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.chargingOrder.count({ where }),
  ]);
  success(res, pageResult(orders.map(mapOrder), total, page, pageSize));
});

router.get('/orders/:id', async (req, res) => {
  const order = await prisma.chargingOrder.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, phone: true, nickname: true } },
      station: true,
      pile: true,
    },
  });
  if (!order) {
    error(res, '订单不存在', 404);
    return;
  }
  success(res, mapOrder(order));
});

router.get('/operators', async (req, res) => {
  const page = toInt(req.query.page, 1);
  const pageSize = toInt(req.query.pageSize, 10);
  const where: any = {};
  if (req.query.status) where.status = String(req.query.status);

  const [operators, total] = await Promise.all([
    prisma.operator.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { stations: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.operator.count({ where }),
  ]);

  success(res, pageResult(operators.map((operator) => ({
    id: operator.id,
    name: operator.name,
    contact: operator.contact || '',
    phone: operator.phone || '',
    stationCount: operator._count.stations,
    status: operator.status,
    createTime: operator.createdAt,
  })), total, page, pageSize));
});

router.get('/users/statistics', async (_req, res) => {
  const total = await prisma.user.count();
  success(res, {
    total,
    vip: await prisma.user.count({ where: { vipLevel: { gt: 0 } } }),
    active: total,
  });
});

router.get('/users', async (req, res) => {
  const page = toInt(req.query.page, 1);
  const pageSize = toInt(req.query.pageSize, 10);
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  success(res, pageResult(users.map((user) => ({
    id: user.id,
    username: user.nickname || user.phone,
    phone: user.phone,
    avatar: user.avatar || undefined,
    level: user.vipLevel > 0 ? '黄金会员' : '普通会员',
    totalCharges: user.profile?.totalCharges || 0,
    totalEnergy: Number(user.profile?.totalKwh || 0),
    totalAmount: Number(user.profile?.totalAmount || 0),
    tags: user.tags ? JSON.parse(user.tags) : [],
    registerTime: user.createdAt,
  })), total, page, pageSize));
});

router.get('/settlements/statistics', async (_req, res) => {
  const [total, pending, completed] = await Promise.all([
    prisma.settlementRecord.count(),
    prisma.settlementRecord.count({ where: { status: 'pending' } }),
    prisma.settlementRecord.count({ where: { status: 'completed' } }),
  ]);
  const amount = await prisma.settlementRecord.aggregate({ _sum: { amount: true } });
  success(res, {
    total,
    pending,
    settled: completed,
    amount: Number(amount._sum.amount || 0),
  });
});

router.get('/settlements', async (req, res) => {
  const page = toInt(req.query.page, 1);
  const pageSize = toInt(req.query.pageSize, 10);
  const [records, total] = await Promise.all([
    prisma.settlementRecord.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { operator: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.settlementRecord.count(),
  ]);

  success(res, pageResult(records.map((record) => ({
    id: record.id,
    settlementNo: `SET${record.createdAt.toISOString().slice(0, 10).replace(/-/g, '')}${record.id.slice(-3).toUpperCase()}`,
    operator: record.operator.name,
    amount: Number(record.amount),
    fee: Number(record.platformFee),
    actualAmount: Number(record.amount) - Number(record.platformFee),
    status: record.status === 'completed' ? 'settled' : record.status,
    orderCount: 1,
    createTime: record.createdAt,
    settleTime: record.settlementDate,
  })), total, page, pageSize));
});

router.get('/community/contents', async (req, res) => {
  const page = toInt(req.query.page, 1);
  const pageSize = toInt(req.query.pageSize, 10);
  const [posts, total] = await Promise.all([
    prisma.communityPost.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { nickname: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.communityPost.count(),
  ]);

  success(res, pageResult(posts.map((post) => ({
    id: post.id,
    title: post.title,
    author: post.user.nickname || post.user.phone,
    type: 'post',
    status: post.status === 'published' ? 'approved' : post.status,
    createTime: post.createdAt,
    content: post.content,
  })), total, page, pageSize));
});

router.get('/community/comments', async (req, res) => {
  const page = toInt(req.query.page, 1);
  const pageSize = toInt(req.query.pageSize, 10);
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { nickname: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.comment.count(),
  ]);

  success(res, pageResult(comments.map((comment) => ({
    id: comment.id,
    title: `评论 ${comment.id}`,
    author: comment.user.nickname || comment.user.phone,
    type: 'comment',
    status: comment.status === 'published' ? 'approved' : comment.status,
    createTime: comment.createdAt,
    content: comment.content,
  })), total, page, pageSize));
});

router.get('/revenue/overview', async (_req, res) => {
  const orderAmount = await prisma.chargingOrder.aggregate({
    _sum: {
      totalAmount: true,
      chargedKwh: true,
    },
  });
  success(res, {
    totalRevenue: Number(orderAmount._sum.totalAmount || 0),
    totalEnergy: Number(orderAmount._sum.chargedKwh || 0),
    todayRevenue: Number(orderAmount._sum.totalAmount || 0),
    orderCount: await prisma.chargingOrder.count(),
  });
});

router.get('/revenue/trend', (_req, res) => {
  success(res, [
    { date: '2026-06-12', revenue: 8200, energy: 6200 },
    { date: '2026-06-13', revenue: 9100, energy: 6900 },
    { date: '2026-06-14', revenue: 8600, energy: 6450 },
    { date: '2026-06-15', revenue: 11200, energy: 8120 },
    { date: '2026-06-16', revenue: 12480, energy: 8840 },
    { date: '2026-06-17', revenue: 11860, energy: 8310 },
    { date: '2026-06-18', revenue: 13650, energy: 9280 },
  ]);
});

router.get('/revenue/by-station', async (_req, res) => {
  const stations = await prisma.chargingStation.findMany({ include: { orders: true } });
  success(res, stations.map((station) => ({
    stationName: station.name,
    revenue: station.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
    orderCount: station.orders.length,
  })));
});

export default router;
