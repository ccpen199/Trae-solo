import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 类型定义
interface User {
  id: string;
  username: string;
  passwordHash: string;
  nickname: string;
  avatar: string | null;
  status: number;
  createdAt: Date;
}

interface Union {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  creatorId: string;
  leaderId: string;
  level: number;
  reputation: number;
  memberCount: number;
  maxMembers: number;
  isRecommend: boolean;
  status: number;
  createdAt: Date;
}

interface UnionMember {
  id: string;
  unionId: string;
  userId: string;
  role: number;
  contribution: number;
  joinAt: Date;
  lastActiveAt: Date;
  status: number;
}

interface LevelConfig {
  level: number;
  name: string;
  minReputation: number;
  maxReputation: number;
  maxMembers: number;
  dailyCost: number;
  rewardRatio: number;
}

// 等级配置
const levelConfigs: LevelConfig[] = [
  { level: 1, name: '新手联盟', minReputation: 0, maxReputation: 999, maxMembers: 50, dailyCost: 0, rewardRatio: 1.0 },
  { level: 2, name: '普通联盟', minReputation: 1000, maxReputation: 4999, maxMembers: 100, dailyCost: 10, rewardRatio: 1.2 },
  { level: 3, name: '精英联盟', minReputation: 5000, maxReputation: 19999, maxMembers: 200, dailyCost: 50, rewardRatio: 1.5 },
  { level: 4, name: '顶级联盟', minReputation: 20000, maxReputation: 49999, maxMembers: 300, dailyCost: 100, rewardRatio: 2.0 },
  { level: 5, name: '传奇联盟', minReputation: 50000, maxReputation: 999999, maxMembers: 500, dailyCost: 200, rewardRatio: 3.0 },
];

// 内存数据存储
const users: Map<string, User> = new Map();
const unions: Map<string, Union> = new Map();
const unionMembers: Map<string, UnionMember> = new Map();
const usernameToId: Map<string, string> = new Map();

const JWT_SECRET = 'mop-union-jwt-secret-key-2024';
const SALT_ROUNDS = 10;
const MAX_UNIONS_PER_USER = 10;
const PORT = 22531;

// 辅助函数
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function getLevelConfig(level: number): LevelConfig {
  return levelConfigs.find(c => c.level === level) || levelConfigs[0];
}

function getPublicUser(user: User): any {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
}

function getPublicUnion(union: Union, includeLeader: boolean = true): any {
  const leader = users.get(union.leaderId);
  return {
    ...union,
    leader: leader ? getPublicUser(leader) : null,
    levelConfig: getLevelConfig(union.level),
  };
}

// 初始化一些测试数据
function initTestData() {
  // 创建测试用户
  const testUsers = [
    { username: 'admin', password: '123456', nickname: '管理员' },
    { username: 'user1', password: '123456', nickname: '用户一' },
    { username: 'user2', password: '123456', nickname: '用户二' },
  ];

  for (const u of testUsers) {
    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(u.password, SALT_ROUNDS);
    const user: User = {
      id: userId,
      username: u.username,
      passwordHash,
      nickname: u.nickname,
      avatar: null,
      status: 1,
      createdAt: new Date(),
    };
    users.set(userId, user);
    usernameToId.set(u.username, userId);
  }

  // 创建测试联盟
  const adminId = usernameToId.get('admin')!;
  const user1Id = usernameToId.get('user1')!;
  const user2Id = usernameToId.get('user2')!;

  const union1: Union = {
    id: uuidv4(),
    name: '猫扑精英联盟',
    description: '这是一个精英联盟，欢迎志同道合的朋友加入！',
    avatar: null,
    creatorId: adminId,
    leaderId: adminId,
    level: 3,
    reputation: 8500,
    memberCount: 3,
    maxMembers: 200,
    isRecommend: true,
    status: 1,
    createdAt: new Date(Date.now() - 86400000 * 30),
  };
  unions.set(union1.id, union1);

  const union2: Union = {
    id: uuidv4(),
    name: '新手村联盟',
    description: '新手友好，共同成长！',
    avatar: null,
    creatorId: user1Id,
    leaderId: user1Id,
    level: 1,
    reputation: 500,
    memberCount: 1,
    maxMembers: 50,
    isRecommend: false,
    status: 1,
    createdAt: new Date(Date.now() - 86400000 * 10),
  };
  unions.set(union2.id, union2);

  const union3: Union = {
    id: uuidv4(),
    name: '传奇战队',
    description: '追求极致，挑战巅峰！',
    avatar: null,
    creatorId: user2Id,
    leaderId: user2Id,
    level: 2,
    reputation: 2500,
    memberCount: 1,
    maxMembers: 100,
    isRecommend: false,
    status: 1,
    createdAt: new Date(Date.now() - 86400000 * 5),
  };
  unions.set(union3.id, union3);

  // 创建成员关系
  const members = [
    { unionId: union1.id, userId: adminId, role: 1, contribution: 5000 },
    { unionId: union1.id, userId: user1Id, role: 3, contribution: 1200 },
    { unionId: union1.id, userId: user2Id, role: 3, contribution: 800 },
    { unionId: union2.id, userId: user1Id, role: 1, contribution: 500 },
    { unionId: union3.id, userId: user2Id, role: 1, contribution: 2500 },
  ];

  for (const m of members) {
    const memberId = uuidv4();
    const member: UnionMember = {
      id: memberId,
      unionId: m.unionId,
      userId: m.userId,
      role: m.role,
      contribution: m.contribution,
      joinAt: new Date(),
      lastActiveAt: new Date(),
      status: 1,
    };
    unionMembers.set(memberId, member);
  }

  console.log('测试数据已初始化:');
  console.log('  - 用户: admin/123456, user1/123456, user2/123456');
  console.log('  - 联盟: 猫扑精英联盟, 新手村联盟, 传奇战队');
}

// 创建 Express 应用
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: ['http://localhost:22532', 'http://127.0.0.1:22532'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 认证中间件
function authMiddleware(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录或登录已过期' });
  }
  
  const token = authHeader.slice(7);
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.userId);
    if (!user || user.status !== 1) {
      return res.status(401).json({ code: 401, message: '用户不存在或已被禁用' });
    }
    req.userId = user.id;
    req.user = getPublicUser(user);
    next();
  } catch {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
  }
}

// 统一响应格式
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ code: 200, message: 'OK', timestamp: new Date().toISOString() });
});

// 用户注册
app.post('/api/users/register', async (req: Request, res: Response) => {
  try {
    const { username, password, nickname } = req.body;
    
    if (!username || username.length < 3 || username.length > 20) {
      return res.status(400).json({ code: 400, message: '用户名长度应为3-20个字符' });
    }
    if (!password || password.length < 6 || password.length > 32) {
      return res.status(400).json({ code: 400, message: '密码长度应为6-32个字符' });
    }
    
    if (usernameToId.has(username)) {
      return res.status(400).json({ code: 400, message: '用户名已存在' });
    }
    
    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
    const user: User = {
      id: userId,
      username,
      passwordHash,
      nickname: nickname || username,
      avatar: null,
      status: 1,
      createdAt: new Date(),
    };
    
    users.set(userId, user);
    usernameToId.set(username, userId);
    
    res.json({ code: 200, message: '注册成功', data: getPublicUser(user) });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 用户登录
app.post('/api/users/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    const userId = usernameToId.get(username);
    if (!userId) {
      return res.status(400).json({ code: 400, message: '用户名或密码错误' });
    }
    
    const user = users.get(userId);
    if (!user || user.status !== 1) {
      return res.status(400).json({ code: 400, message: '用户名或密码错误' });
    }
    
    const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ code: 400, message: '用户名或密码错误' });
    }
    
    const token = generateToken(user.id);
    
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: getPublicUser(user),
      },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 获取用户信息
app.get('/api/users/profile', authMiddleware, (req: any, res: Response) => {
  res.json({ code: 200, data: req.user });
});

// 获取联盟列表
app.get('/api/unions', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const pageSize = parseInt(req.query.pageSize as string || '20', 10);
    const keyword = req.query.keyword as string;
    const isRecommend = req.query.isRecommend as string;
    const sortBy = (req.query.sortBy as string) || 'reputation';
    const sortOrder = (req.query.sortOrder as string) || 'desc';
    
    let unionList = Array.from(unions.values()).filter(u => u.status === 1);
    
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      unionList = unionList.filter(u => 
        u.name.toLowerCase().includes(lowerKeyword) || 
        (u.description && u.description.toLowerCase().includes(lowerKeyword))
      );
    }
    
    if (isRecommend === 'true') {
      unionList = unionList.filter(u => u.isRecommend);
    }
    
    // 排序
    unionList.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'reputation') {
        comparison = a.reputation - b.reputation;
      } else if (sortBy === 'memberCount') {
        comparison = a.memberCount - b.memberCount;
      } else {
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    const total = unionList.length;
    const start = (page - 1) * pageSize;
    const list = unionList.slice(start, start + pageSize).map(u => getPublicUnion(u));
    
    res.json({
      code: 200,
      data: {
        list,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 获取推荐联盟
app.get('/api/unions/recommended', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string || '10', 10);
    const recommended = Array.from(unions.values())
      .filter(u => u.status === 1 && u.isRecommend)
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, limit)
      .map(u => getPublicUnion(u, false));
    
    res.json({ code: 200, data: recommended });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 获取联盟排行榜
app.get('/api/unions/ranking', (req: Request, res: Response) => {
  try {
    const type = (req.query.type as 'reputation' | 'member') || 'reputation';
    const page = parseInt(req.query.page as string || '1', 10);
    const pageSize = parseInt(req.query.pageSize as string || '20', 10);
    
    let unionList = Array.from(unions.values()).filter(u => u.status === 1);
    
    if (type === 'reputation') {
      unionList.sort((a, b) => b.reputation - a.reputation);
    } else {
      unionList.sort((a, b) => b.memberCount - a.memberCount);
    }
    
    const total = unionList.length;
    const start = (page - 1) * pageSize;
    const list = unionList.slice(start, start + pageSize).map((u, i) => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      level: u.level,
      reputation: u.reputation,
      memberCount: u.memberCount,
      rank: start + i + 1,
    }));
    
    res.json({
      code: 200,
      data: {
        list,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 获取我的联盟
app.get('/api/unions/my', authMiddleware, (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const userMembers = Array.from(unionMembers.values())
      .filter(m => m.userId === userId && m.status === 1);
    
    const myUnions = userMembers.map(m => {
      const union = unions.get(m.unionId);
      if (!union) return null;
      
      const leader = users.get(union.leaderId);
      return {
        ...getPublicUnion(union),
        role: m.role,
        contribution: m.contribution,
        joinAt: m.joinAt,
        lastActiveAt: m.lastActiveAt,
        leader: leader ? getPublicUser(leader) : null,
      };
    }).filter(Boolean) as any[];
    
    myUnions.sort((a, b) => a.role - b.role);
    
    res.json({ code: 200, data: myUnions });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 创建联盟
app.post('/api/unions', authMiddleware, (req: any, res: Response) => {
  try {
    const { name, description, avatar } = req.body;
    const userId = req.userId;
    
    if (!name || name.length < 2 || name.length > 20) {
      return res.status(400).json({ code: 400, message: '联盟名称长度应为2-20个字符' });
    }
    
    // 检查是否已创建过联盟
    const existingCreated = Array.from(unions.values()).find(u => u.creatorId === userId && u.status === 1);
    if (existingCreated) {
      return res.status(400).json({ code: 400, message: '您已创建过联盟，每个用户只能创建一个联盟' });
    }
    
    // 检查是否已加入太多联盟
    const currentUnions = Array.from(unionMembers.values()).filter(m => m.userId === userId && m.status === 1);
    if (currentUnions.length >= MAX_UNIONS_PER_USER) {
      return res.status(400).json({ 
        code: 400, 
        message: `您已加入 ${currentUnions.length} 个联盟，最多只能加入 ${MAX_UNIONS_PER_USER} 个联盟` 
      });
    }
    
    // 检查名称是否已存在
    const existingName = Array.from(unions.values()).find(u => u.name === name);
    if (existingName) {
      return res.status(400).json({ code: 400, message: '联盟名称已存在' });
    }
    
    const unionId = uuidv4();
    const union: Union = {
      id: unionId,
      name,
      description: description || null,
      avatar: avatar || null,
      creatorId: userId,
      leaderId: userId,
      level: 1,
      reputation: 0,
      memberCount: 1,
      maxMembers: 50,
      isRecommend: false,
      status: 1,
      createdAt: new Date(),
    };
    
    unions.set(unionId, union);
    
    const memberId = uuidv4();
    const member: UnionMember = {
      id: memberId,
      unionId,
      userId,
      role: 1,
      contribution: 0,
      joinAt: new Date(),
      lastActiveAt: new Date(),
      status: 1,
    };
    
    unionMembers.set(memberId, member);
    
    res.json({ code: 200, message: '创建联盟成功', data: getPublicUnion(union) });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 获取联盟详情
app.get('/api/unions/:id', (req: any, res: Response) => {
  try {
    const unionId = req.params.id;
    const union = unions.get(unionId);
    
    if (!union || union.status !== 1) {
      return res.status(404).json({ code: 404, message: '联盟不存在或已解散' });
    }
    
    const authHeader = req.headers.authorization;
    let currentMember: UnionMember | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const decoded: any = jwt.verify(token, JWT_SECRET);
        currentMember = Array.from(unionMembers.values()).find(
          m => m.unionId === unionId && m.userId === decoded.userId && m.status === 1
        ) || null;
      } catch {}
    }
    
    const leader = users.get(union.leaderId);
    const creator = users.get(union.creatorId);
    
    res.json({
      code: 200,
      data: {
        ...union,
        leader: leader ? getPublicUser(leader) : null,
        creator: creator ? getPublicUser(creator) : null,
        levelConfig: getLevelConfig(union.level),
        currentMember: currentMember ? {
          ...currentMember,
          user: currentMember.userId ? getPublicUser(users.get(currentMember.userId)!) : null,
        } : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 加入联盟
app.post('/api/unions/:id/join', authMiddleware, (req: any, res: Response) => {
  try {
    const unionId = req.params.id;
    const userId = req.userId;
    
    const union = unions.get(unionId);
    if (!union || union.status !== 1) {
      return res.status(404).json({ code: 404, message: '联盟不存在或已解散' });
    }
    
    if (union.memberCount >= union.maxMembers) {
      return res.status(400).json({ code: 400, message: '联盟人数已满' });
    }
    
    const currentUnions = Array.from(unionMembers.values()).filter(m => m.userId === userId && m.status === 1);
    if (currentUnions.length >= MAX_UNIONS_PER_USER) {
      return res.status(400).json({ 
        code: 400, 
        message: `您已加入 ${currentUnions.length} 个联盟，最多只能加入 ${MAX_UNIONS_PER_USER} 个联盟` 
      });
    }
    
    const existingMember = Array.from(unionMembers.values()).find(
      m => m.unionId === unionId && m.userId === userId
    );
    
    if (existingMember?.status === 1) {
      return res.status(400).json({ code: 400, message: '您已加入该联盟' });
    }
    
    if (existingMember) {
      existingMember.status = 1;
      existingMember.contribution = 0;
      existingMember.joinAt = new Date();
      existingMember.lastActiveAt = new Date();
    } else {
      const memberId = uuidv4();
      const member: UnionMember = {
        id: memberId,
        unionId,
        userId,
        role: 3,
        contribution: 0,
        joinAt: new Date(),
        lastActiveAt: new Date(),
        status: 1,
      };
      unionMembers.set(memberId, member);
    }
    
    union.memberCount++;
    union.reputation += 50;
    
    res.json({
      code: 200,
      message: '加入联盟成功',
      data: { member: existingMember, union: getPublicUnion(union) },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 退出联盟
app.post('/api/unions/:id/leave', authMiddleware, (req: any, res: Response) => {
  try {
    const unionId = req.params.id;
    const userId = req.userId;
    
    const member = Array.from(unionMembers.values()).find(
      m => m.unionId === unionId && m.userId === userId
    );
    
    if (!member || member.status !== 1) {
      return res.status(400).json({ code: 400, message: '您不是该联盟成员' });
    }
    
    if (member.role === 1) {
      return res.status(400).json({ code: 400, message: '盟主不能直接退出，需要先移交盟主' });
    }
    
    member.status = 0;
    member.contribution = 0;
    
    const union = unions.get(unionId);
    if (union) {
      union.memberCount--;
      union.reputation = Math.max(0, union.reputation - 50);
    }
    
    res.json({ code: 200, message: '退出联盟成功' });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 获取联盟成员列表
app.get('/api/unions/:id/members', (req: Request, res: Response) => {
  try {
    const unionId = req.params.id;
    const page = parseInt(req.query.page as string || '1', 10);
    const pageSize = parseInt(req.query.pageSize as string || '20', 10);
    const sortBy = (req.query.sortBy as string) || 'contribution';
    const sortOrder = (req.query.sortOrder as string) || 'desc';
    
    let memberList = Array.from(unionMembers.values())
      .filter(m => m.unionId === unionId && m.status === 1);
    
    // 排序: 先按角色，再按指定字段
    memberList.sort((a, b) => {
      if (a.role !== b.role) return a.role - b.role;
      
      let comparison = 0;
      if (sortBy === 'contribution') {
        comparison = a.contribution - b.contribution;
      } else if (sortBy === 'joinAt') {
        comparison = a.joinAt.getTime() - b.joinAt.getTime();
      } else {
        comparison = a.lastActiveAt.getTime() - b.lastActiveAt.getTime();
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    const total = memberList.length;
    const start = (page - 1) * pageSize;
    const list = memberList.slice(start, start + pageSize).map(m => {
      const user = users.get(m.userId);
      return {
        ...m,
        user: user ? getPublicUser(user) : null,
      };
    });
    
    res.json({
      code: 200,
      data: {
        list,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 获取贡献排行榜
app.get('/api/unions/:id/ranking/contribution', (req: Request, res: Response) => {
  try {
    const unionId = req.params.id;
    const page = parseInt(req.query.page as string || '1', 10);
    const pageSize = parseInt(req.query.pageSize as string || '20', 10);
    
    let memberList = Array.from(unionMembers.values())
      .filter(m => m.unionId === unionId && m.status === 1)
      .sort((a, b) => b.contribution - a.contribution);
    
    const total = memberList.length;
    const start = (page - 1) * pageSize;
    const list = memberList.slice(start, start + pageSize).map((m, i) => {
      const user = users.get(m.userId);
      return {
        ...m,
        rank: start + i + 1,
        user: user ? getPublicUser(user) : null,
      };
    });
    
    res.json({
      code: 200,
      data: {
        list,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 设置/取消副盟主
app.post('/api/unions/:id/members/:userId/set-vice', authMiddleware, (req: any, res: Response) => {
  try {
    const unionId = req.params.id;
    const operatorId = req.userId;
    const targetUserId = req.params.userId;
    const isVice = req.body.isVice;
    
    const operatorMember = Array.from(unionMembers.values()).find(
      m => m.unionId === unionId && m.userId === operatorId && m.status === 1
    );
    
    if (!operatorMember) {
      return res.status(400).json({ code: 400, message: '您不是该联盟成员' });
    }
    
    if (operatorMember.role !== 1) {
      return res.status(403).json({ code: 403, message: '只有盟主可以设置副盟主' });
    }
    
    const targetMember = Array.from(unionMembers.values()).find(
      m => m.unionId === unionId && m.userId === targetUserId && m.status === 1
    );
    
    if (!targetMember) {
      return res.status(400).json({ code: 400, message: '目标用户不是该联盟成员' });
    }
    
    if (targetMember.role === 1) {
      return res.status(400).json({ code: 400, message: '不能修改盟主角色' });
    }
    
    targetMember.role = isVice ? 2 : 3;
    
    const user = users.get(targetUserId);
    res.json({
      code: 200,
      message: isVice ? '设置副盟主成功' : '取消副盟主成功',
      data: { ...targetMember, user: user ? getPublicUser(user) : null },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 开除成员
app.post('/api/unions/:id/members/:userId/kick', authMiddleware, (req: any, res: Response) => {
  try {
    const unionId = req.params.id;
    const operatorId = req.userId;
    const targetUserId = req.params.userId;
    
    if (operatorId === targetUserId) {
      return res.status(400).json({ code: 400, message: '不能开除自己' });
    }
    
    const operatorMember = Array.from(unionMembers.values()).find(
      m => m.unionId === unionId && m.userId === operatorId && m.status === 1
    );
    
    if (!operatorMember) {
      return res.status(400).json({ code: 400, message: '您不是该联盟成员' });
    }
    
    if (operatorMember.role !== 1 && operatorMember.role !== 2) {
      return res.status(403).json({ code: 403, message: '只有盟主或副盟主可以开除成员' });
    }
    
    const targetMember = Array.from(unionMembers.values()).find(
      m => m.unionId === unionId && m.userId === targetUserId && m.status === 1
    );
    
    if (!targetMember) {
      return res.status(400).json({ code: 400, message: '目标用户不是该联盟成员' });
    }
    
    if (targetMember.role === 1) {
      return res.status(400).json({ code: 400, message: '不能开除盟主' });
    }
    
    if (operatorMember.role === 2 && targetMember.role === 2) {
      return res.status(400).json({ code: 400, message: '副盟主不能开除其他副盟主' });
    }
    
    targetMember.status = 0;
    targetMember.contribution = 0;
    
    const union = unions.get(unionId);
    if (union) {
      union.memberCount--;
      union.reputation = Math.max(0, union.reputation - 50);
    }
    
    res.json({ code: 200, message: '已开除该成员' });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 移交盟主
app.post('/api/unions/:id/transfer-leader', authMiddleware, (req: any, res: Response) => {
  try {
    const unionId = req.params.id;
    const currentLeaderId = req.userId;
    const newLeaderId = req.body.newLeaderId;
    
    if (currentLeaderId === newLeaderId) {
      return res.status(400).json({ code: 400, message: '不能移交给自己' });
    }
    
    const currentMember = Array.from(unionMembers.values()).find(
      m => m.unionId === unionId && m.userId === currentLeaderId && m.status === 1
    );
    
    if (!currentMember) {
      return res.status(400).json({ code: 400, message: '您不是该联盟成员' });
    }
    
    if (currentMember.role !== 1) {
      return res.status(403).json({ code: 403, message: '只有盟主可以移交盟主' });
    }
    
    const newMember = Array.from(unionMembers.values()).find(
      m => m.unionId === unionId && m.userId === newLeaderId && m.status === 1
    );
    
    if (!newMember) {
      return res.status(400).json({ code: 400, message: '目标用户不是该联盟成员' });
    }
    
    currentMember.role = 3;
    newMember.role = 1;
    
    const union = unions.get(unionId);
    if (union) {
      union.leaderId = newLeaderId;
    }
    
    res.json({ code: 200, message: '移交盟主成功' });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 记录用户行为
app.post('/api/unions/action', authMiddleware, (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const type = req.body.type as 'post' | 'reply' | 'login';
    
    const reputationMap: Record<string, number> = { post: 10, reply: 3, login: 1 };
    const contributionMap: Record<string, number> = { post: 10, reply: 3, login: 1 };
    
    const userMembers = Array.from(unionMembers.values())
      .filter(m => m.userId === userId && m.status === 1);
    
    for (const member of userMembers) {
      const union = unions.get(member.unionId);
      if (union) {
        union.reputation += reputationMap[type] || 0;
        member.contribution += contributionMap[type] || 0;
        member.lastActiveAt = new Date();
      }
    }
    
    res.json({ code: 200, message: '记录成功' });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 根路径
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: '猫扑联盟系统 API (内存版本)',
    version: '1.0.0',
    docs: '请参考 API 文档',
  });
});

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ code: 404, message: '请求的资源不存在' });
});

// 错误处理
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ code: 500, message: err.message || '服务器内部错误' });
});

// 初始化测试数据并启动服务器
initTestData();

app.listen(PORT, () => {
  console.log(`
========================================
  🚀 猫扑联盟系统后端服务已启动
========================================
  📡 服务地址: http://localhost:${PORT}
  📚 API 前缀: http://localhost:${PORT}/api
  🌐 环境: 内存存储模式（无需数据库）
========================================
  🧪 测试账号:
    - admin / 123456 (盟主)
    - user1 / 123456 (成员)
    - user2 / 123456 (成员)
========================================
  `);
});
