require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const moment = require('moment');

const { initDatabase, getDb } = require('./config/database');

const app = express();

const PORT = process.env.PORT || 8762;
const JWT_SECRET = process.env.JWT_SECRET || 'news-app-jwt-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id', 'X-Recommendation-Id']
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未提供认证令牌'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: '令牌无效或已过期'
      });
    }
    req.user = user;
    next();
  });
}

function requireRoles(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }
    next();
  };
}

const CATEGORY_KEYWORDS = {
  tech: ['科技', '互联网', '人工智能', 'AI', '云计算', '大数据', '5G', '区块链', '手机', '电脑', '软件', '硬件', '程序', '开发'],
  finance: ['财经', '股票', '基金', '投资', '理财', '银行', '保险', '证券', '经济', '金融', '货币', '汇率', '股市'],
  sports: ['体育', '足球', '篮球', 'NBA', 'CBA', '奥运会', '世界杯', '网球', '运动', '运动员', '比赛', '冠军'],
  entertainment: ['娱乐', '明星', '电影', '电视剧', '音乐', '综艺', '演唱会', '演员', '歌手', '节目', '影视'],
  health: ['健康', '医疗', '养生', '健身', '减肥', '饮食', '运动', '医院', '医生', '药品'],
  education: ['教育', '学习', '学校', '高考', '考研', '留学', '培训', '课程', '学生', '老师'],
  auto: ['汽车', '新能源', '特斯拉', '电动车', 'SUV', '轿车', '跑车', '驾驶', '车展'],
  house: ['房产', '房价', '买房', '租房', '装修', '家具', '家居', '物业', '地产'],
  food: ['美食', '烹饪', '菜谱', '餐厅', '美食推荐', '食材', '料理', '甜品'],
  travel: ['旅游', '旅行', '景点', '酒店', '机票', '攻略', '游记', '度假', '航班'],
  game: ['游戏', '电竞', '手游', '端游', '王者荣耀', '原神', '吃鸡', '玩家'],
  military: ['军事', '武器', '军队', '国防', '战争', '战略', '装备', '部队']
};

const CATEGORY_NAMES = {
  tech: '科技',
  finance: '财经',
  sports: '体育',
  entertainment: '娱乐',
  health: '健康',
  education: '教育',
  auto: '汽车',
  house: '房产',
  food: '美食',
  travel: '旅游',
  game: '游戏',
  military: '军事'
};

const SENSITIVE_WORDS = ['违禁', '违法', '赌博', '诈骗', '毒品', '色情', '暴力', '恐怖', '邪教', '迷信'];

function generateContentHash(title, content) {
  const hashInput = `${title}${content?.substring(0, 200) || ''}`.toLowerCase();
  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

function analyzeCategory(title, content) {
  const fullText = `${title} ${content || ''}`.toLowerCase();
  const scores = {};
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = 0;
    for (const keyword of keywords) {
      if (fullText.includes(keyword.toLowerCase())) {
        scores[category]++;
      }
    }
  }
  
  const topCategory = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0];
  
  if (topCategory[1] > 0) {
    return {
      code: topCategory[0],
      name: CATEGORY_NAMES[topCategory[0]],
      confidence: Math.min(topCategory[1] / 3, 1)
    };
  }
  
  return {
    code: 'tech',
    name: '科技',
    confidence: 0.5
  };
}

function extractSemanticTags(title, content) {
  const fullText = `${title} ${content || ''}`.toLowerCase();
  const tags = [];
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (fullText.includes(keyword.toLowerCase())) {
        tags.push(keyword);
      }
    }
  }
  
  return [...new Set(tags)].slice(0, 10);
}

function filterComment(content) {
  const detectedWords = [];
  
  for (const word of SENSITIVE_WORDS) {
    if (content.toLowerCase().includes(word.toLowerCase())) {
      detectedWords.push(word);
    }
  }
  
  return {
    passed: detectedWords.length === 0,
    reason: detectedWords.length > 0 ? '包含敏感词' : null,
    keywords: detectedWords
  };
}

app.get('/', (req, res) => {
  res.json({
    name: 'News App API',
    version: '1.0.0',
    description: '新闻资讯 App 后端服务 (SQLite版)',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      contents: '/api/v1/contents',
      recommendations: '/api/v1/recommendations',
      interactions: '/api/v1/interactions',
      'negative-feedbacks': '/api/v1/negative-feedbacks',
      ads: '/api/v1/ads',
      analytics: '/api/v1/analytics'
    },
    ports: {
      backend: PORT,
      'admin-frontend': 8763,
      'reader-frontend': 8764,
      'advertiser-dashboard': 8765
    }
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  });
});

app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { username, password, role = 'reader' } = req.body;
    const db = await getDb();
    
    const existingUser = db.data.users.find(u => u.username === username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    
    const user = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      nickname: username,
      role,
      status: 'active',
      email: null,
      phone: null,
      avatar: null,
      lastLoginAt: null,
      lastLoginIp: null,
      createdAt: now,
      updatedAt: now
    };
    
    db.data.users.push(user);
    
    const userProfile = {
      id: uuidv4(),
      userId: user.id,
      interestTags: [],
      categoryPreferences: {},
      readHistory: [],
      negativeFeedbackTags: [],
      createdAt: now,
      updatedAt: now
    };
    db.data.userProfiles.push(userProfile);
    
    await db.write();
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          role: user.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = await getDb();
    
    const user = db.data.users.find(u => u.username === username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = user.lastLoginAt;
    await db.write();
    
    const token = generateToken(user);
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          role: user.role,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v1/auth/logout', verifyToken, async (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  });
});

app.get('/api/v1/auth/profile', verifyToken, async (req, res) => {
  try {
    const db = await getDb();
    const user = db.data.users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          role: user.role,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          status: user.status
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v1/contents', verifyToken, requireRoles(['admin', 'operator']), async (req, res) => {
  try {
    const { title, content, summary, author, source, categoryCode } = req.body;
    const db = await getDb();
    
    const deduplicationHash = generateContentHash(title, content);
    
    const existingContent = db.data.contents.find(c => c.deduplicationHash === deduplicationHash);
    if (existingContent) {
      return res.status(400).json({
        success: false,
        message: '内容已存在（去重检测）',
        data: {
          existingContent: {
            id: existingContent.id,
            title: existingContent.title
          }
        }
      });
    }
    
    let category = categoryCode ? { code: categoryCode, name: CATEGORY_NAMES[categoryCode] || '未分类' } : analyzeCategory(title, content);
    const semanticTags = extractSemanticTags(title, content);
    
    const now = new Date().toISOString();
    const newContent = {
      id: uuidv4(),
      title,
      content,
      summary: summary || content?.substring(0, 200),
      author: author || '匿名',
      source: source || '系统',
      categoryCode: category.code,
      categoryName: category.name,
      status: 'pending_recommendation',
      deduplicationHash,
      semanticTags,
      weightTags: [],
      weightScore: 1.0,
      hotScore: 0,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      collectCount: 0,
      readCount: 0,
      createdBy: req.user.id,
      publishedAt: null,
      createdAt: now,
      updatedAt: now
    };
    
    db.data.contents.push(newContent);
    await db.write();
    
    const auditLog = {
      id: uuidv4(),
      traceId: uuidv4(),
      operation: 'CONTENT_IMPORT',
      operatorId: req.user.id,
      operatorRole: req.user.role,
      targetType: 'Content',
      targetId: newContent.id,
      detail: JSON.stringify({
        action: 'import',
        title: newContent.title,
        category: newContent.categoryName,
        deduplicationHash: newContent.deduplicationHash
      }),
      ip: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'],
      status: 'success',
      createdAt: now
    };
    db.data.auditLogs.push(auditLog);
    await db.write();
    
    res.status(201).json({
      success: true,
      message: '内容入库成功',
      data: {
        content: newContent,
        analysis: {
          category,
          semanticTags,
          deduplication: {
            passed: true,
            hash: deduplicationHash
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v1/contents', verifyToken, async (req, res) => {
  try {
    const { status, categoryCode, page = 1, pageSize = 20, keyword } = req.query;
    const db = await getDb();
    
    let contents = [...db.data.contents];
    
    if (status) {
      contents = contents.filter(c => c.status === status);
    }
    
    if (categoryCode) {
      contents = contents.filter(c => c.categoryCode === categoryCode);
    }
    
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      contents = contents.filter(c => 
        c.title.toLowerCase().includes(lowerKeyword) ||
        c.content?.toLowerCase().includes(lowerKeyword)
      );
    }
    
    contents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const total = contents.length;
    const start = (page - 1) * pageSize;
    const paginatedContents = contents.slice(start, start + parseInt(pageSize));
    
    res.json({
      success: true,
      data: {
        contents: paginatedContents,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v1/contents/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    
    const content = db.data.contents.find(c => c.id === id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }
    
    res.json({
      success: true,
      data: { content }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.put('/api/v1/contents/:id', verifyToken, requireRoles(['admin', 'operator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, author, source, categoryCode, status } = req.body;
    const db = await getDb();
    
    const index = db.data.contents.findIndex(c => c.id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }
    
    const existing = db.data.contents[index];
    
    if (title || content) {
      const deduplicationHash = generateContentHash(title || existing.title, content || existing.content);
      existing.deduplicationHash = deduplicationHash;
      existing.semanticTags = extractSemanticTags(title || existing.title, content || existing.content);
      const category = categoryCode ? 
        { code: categoryCode, name: CATEGORY_NAMES[categoryCode] || '未分类' } : 
        analyzeCategory(title || existing.title, content || existing.content);
      existing.categoryCode = category.code;
      existing.categoryName = category.name;
    }
    
    if (title) existing.title = title;
    if (content) existing.content = content;
    if (summary !== undefined) existing.summary = summary;
    if (author) existing.author = author;
    if (source) existing.source = source;
    if (categoryCode) {
      existing.categoryCode = categoryCode;
      existing.categoryName = CATEGORY_NAMES[categoryCode] || '未分类';
    }
    if (status) existing.status = status;
    if (status === 'published' && !existing.publishedAt) {
      existing.publishedAt = new Date().toISOString();
    }
    
    existing.updatedAt = new Date().toISOString();
    
    await db.write();
    
    res.json({
      success: true,
      message: '内容更新成功',
      data: { content: existing }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.patch('/api/v1/contents/:id/status', verifyToken, requireRoles(['admin', 'operator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = await getDb();
    
    const index = db.data.contents.findIndex(c => c.id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }
    
    const content = db.data.contents[index];
    content.status = status;
    content.updatedAt = new Date().toISOString();
    
    if (status === 'published' && !content.publishedAt) {
      content.publishedAt = new Date().toISOString();
    }
    
    await db.write();
    
    res.json({
      success: true,
      message: '状态更新成功',
      data: { content }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.patch('/api/v1/contents/:id/weight-tags', verifyToken, requireRoles(['admin', 'operator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { weightTags, weightScore } = req.body;
    const db = await getDb();
    
    const index = db.data.contents.findIndex(c => c.id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }
    
    const content = db.data.contents[index];
    
    if (weightTags !== undefined) {
      content.weightTags = weightTags;
    }
    
    if (weightScore !== undefined) {
      content.weightScore = parseFloat(weightScore);
    }
    
    content.updatedAt = new Date().toISOString();
    await db.write();
    
    res.json({
      success: true,
      message: '权重标签更新成功',
      data: { content }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v1/recommendations/feed', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, categoryCode } = req.query;
    const db = await getDb();
    
    let contents = [...db.data.contents].filter(c => 
      c.status === 'published' || c.status === 'pending_recommendation'
    );
    
    if (categoryCode) {
      contents = contents.filter(c => c.categoryCode === categoryCode);
    }
    
    const userProfile = db.data.userProfiles.find(p => p.userId === req.user.id) || {
      categoryPreferences: {},
      interestTags: []
    };
    
    const now = moment();
    
    contents = contents.map(content => {
      let score = content.weightScore || 1.0;
      
      if (userProfile.categoryPreferences[content.categoryCode]) {
        score *= (1 + userProfile.categoryPreferences[content.categoryCode] * 0.3);
      }
      
      for (const tag of content.semanticTags || []) {
        if (userProfile.interestTags?.includes(tag)) {
          score *= 1.2;
        }
      }
      
      if (userProfile.negativeFeedbackTags) {
        for (const tag of content.semanticTags || []) {
          const nfTag = userProfile.negativeFeedbackTags.find(t => t.tag === tag);
          if (nfTag) {
            const daysSince = now.diff(moment(nfTag.createdAt), 'days');
            const decay = Math.max(0, 1 - daysSince / 30);
            score *= (1 - nfTag.impact * decay);
          }
        }
      }
      
      const hotScore = content.hotScore || 0;
      score *= (1 + hotScore * 0.01);
      
      const daysOld = now.diff(moment(content.createdAt), 'days');
      const timeDecay = Math.max(0.5, 1 - daysOld * 0.05);
      score *= timeDecay;
      
      return { ...content, recommendationScore: score };
    });
    
    contents.sort((a, b) => b.recommendationScore - a.recommendationScore);
    
    const total = contents.length;
    const start = (page - 1) * pageSize;
    let feedItems = contents.slice(start, start + parseInt(pageSize));
    
    const adPositions = [2, 6, 10, 14];
    const activeCampaigns = db.data.campaigns.filter(c => c.status === 'active');
    
    for (const position of adPositions) {
      if (position < feedItems.length && activeCampaigns.length > 0) {
        const campaign = activeCampaigns[Math.floor(Math.random() * activeCampaigns.length)];
        const materials = db.data.adMaterials.filter(m => m.campaignId === campaign.id);
        
        if (materials.length > 0) {
          const material = materials[Math.floor(Math.random() * materials.length)];
          const adItem = {
            id: uuidv4(),
            type: 'ad',
            campaignId: campaign.id,
            campaignName: campaign.name,
            materialId: material.id,
            title: material.title,
            description: material.description,
            imageUrl: material.imageUrl,
            linkUrl: material.linkUrl,
            isAd: true
          };
          feedItems.splice(position, 0, adItem);
        }
      }
    }
    
    const recommendationId = uuidv4();
    
    for (const item of feedItems) {
      if (!item.isAd) {
        const record = {
          id: uuidv4(),
          recommendationId,
          userId: req.user.id,
          contentId: item.id,
          score: item.recommendationScore,
          position: feedItems.indexOf(item),
          sessionId: req.headers['x-session-id'] || uuidv4(),
          isImpressed: false,
          isClicked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.data.recommendationRecords.push(record);
      }
    }
    
    await db.write();
    
    res.json({
      success: true,
      data: {
        recommendationId,
        feed: feedItems,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v1/recommendations/view/impression', verifyToken, async (req, res) => {
  try {
    const { recommendationId, contentId, position, sessionId } = req.body;
    const db = await getDb();
    
    const record = db.data.recommendationRecords.find(r => 
      r.recommendationId === recommendationId && 
      r.contentId === contentId
    );
    
    if (record) {
      record.isImpressed = true;
      record.updatedAt = new Date().toISOString();
    }
    
    const contentIndex = db.data.contents.findIndex(c => c.id === contentId);
    if (contentIndex !== -1) {
      db.data.contents[contentIndex].viewCount = (db.data.contents[contentIndex].viewCount || 0) + 1;
      db.data.contents[contentIndex].updatedAt = new Date().toISOString();
    }
    
    const interaction = {
      id: uuidv4(),
      userId: req.user.id,
      contentId,
      type: 'view',
      sessionId: sessionId || req.headers['x-session-id'] || uuidv4(),
      recommendationId,
      viewDuration: 0,
      source: 'feed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.data.interactions.push(interaction);
    
    await db.write();
    
    res.json({
      success: true,
      message: '曝光记录已创建'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v1/recommendations/click', verifyToken, async (req, res) => {
  try {
    const { recommendationId, contentId, position, sessionId } = req.body;
    const db = await getDb();
    
    const record = db.data.recommendationRecords.find(r => 
      r.recommendationId === recommendationId && 
      r.contentId === contentId
    );
    
    if (record) {
      record.isClicked = true;
      record.updatedAt = new Date().toISOString();
    }
    
    const userProfile = db.data.userProfiles.find(p => p.userId === req.user.id);
    if (userProfile) {
      const content = db.data.contents.find(c => c.id === contentId);
      if (content) {
        if (!userProfile.categoryPreferences[content.categoryCode]) {
          userProfile.categoryPreferences[content.categoryCode] = 0;
        }
        userProfile.categoryPreferences[content.categoryCode] = 
          Math.min(2, (userProfile.categoryPreferences[content.categoryCode] || 0) + 0.1);
        
        for (const tag of content.semanticTags || []) {
          if (!userProfile.interestTags) userProfile.interestTags = [];
          if (!userProfile.interestTags.includes(tag)) {
            userProfile.interestTags.push(tag);
          }
        }
        
        if (!userProfile.readHistory) userProfile.readHistory = [];
        userProfile.readHistory.push({
          contentId,
          title: content.title,
          categoryCode: content.categoryCode,
          clickedAt: new Date().toISOString()
        });
        if (userProfile.readHistory.length > 100) {
          userProfile.readHistory = userProfile.readHistory.slice(-100);
        }
        
        userProfile.updatedAt = new Date().toISOString();
      }
    }
    
    await db.write();
    
    res.json({
      success: true,
      message: '点击记录已创建'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v1/interactions/like', verifyToken, async (req, res) => {
  try {
    const { contentId } = req.body;
    const db = await getDb();
    
    const existingLike = db.data.contentLikes.find(l => 
      l.userId === req.user.id && 
      l.contentId === contentId && 
      l.status === 'active'
    );
    
    let isLiked;
    
    if (existingLike) {
      existingLike.status = 'cancelled';
      existingLike.updatedAt = new Date().toISOString();
      isLiked = false;
      
      const contentIndex = db.data.contents.findIndex(c => c.id === contentId);
      if (contentIndex !== -1) {
        db.data.contents[contentIndex].likeCount = Math.max(0, (db.data.contents[contentIndex].likeCount || 0) - 1);
        db.data.contents[contentIndex].updatedAt = new Date().toISOString();
      }
    } else {
      const like = {
        id: uuidv4(),
        userId: req.user.id,
        contentId,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.data.contentLikes.push(like);
      isLiked = true;
      
      const contentIndex = db.data.contents.findIndex(c => c.id === contentId);
      if (contentIndex !== -1) {
        db.data.contents[contentIndex].likeCount = (db.data.contents[contentIndex].likeCount || 0) + 1;
        const likes = db.data.contents[contentIndex].likeCount || 0;
        const views = db.data.contents[contentIndex].viewCount || 0;
        const comments = db.data.contents[contentIndex].commentCount || 0;
        db.data.contents[contentIndex].hotScore = likes * 3 + comments * 5 + views * 0.1;
        db.data.contents[contentIndex].updatedAt = new Date().toISOString();
      }
      
      const userProfile = db.data.userProfiles.find(p => p.userId === req.user.id);
      if (userProfile) {
        const content = db.data.contents.find(c => c.id === contentId);
        if (content) {
          if (!userProfile.categoryPreferences[content.categoryCode]) {
            userProfile.categoryPreferences[content.categoryCode] = 0;
          }
          userProfile.categoryPreferences[content.categoryCode] = 
            Math.min(2, (userProfile.categoryPreferences[content.categoryCode] || 0) + 0.2);
          userProfile.updatedAt = new Date().toISOString();
        }
      }
    }
    
    await db.write();
    
    res.json({
      success: true,
      data: { isLiked }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v1/interactions/collect', verifyToken, async (req, res) => {
  try {
    const { contentId } = req.body;
    const db = await getDb();
    
    const existingCollect = db.data.contentCollects.find(c => 
      c.userId === req.user.id && 
      c.contentId === contentId && 
      c.status === 'active'
    );
    
    let isCollected;
    
    if (existingCollect) {
      existingCollect.status = 'cancelled';
      existingCollect.updatedAt = new Date().toISOString();
      isCollected = false;
      
      const contentIndex = db.data.contents.findIndex(c => c.id === contentId);
      if (contentIndex !== -1) {
        db.data.contents[contentIndex].collectCount = Math.max(0, (db.data.contents[contentIndex].collectCount || 0) - 1);
        db.data.contents[contentIndex].updatedAt = new Date().toISOString();
      }
    } else {
      const collect = {
        id: uuidv4(),
        userId: req.user.id,
        contentId,
        status: 'active',
        folderId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.data.contentCollects.push(collect);
      isCollected = true;
      
      const contentIndex = db.data.contents.findIndex(c => c.id === contentId);
      if (contentIndex !== -1) {
        db.data.contents[contentIndex].collectCount = (db.data.contents[contentIndex].collectCount || 0) + 1;
        db.data.contents[contentIndex].updatedAt = new Date().toISOString();
      }
    }
    
    await db.write();
    
    res.json({
      success: true,
      data: { isCollected }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v1/interactions/comments', verifyToken, async (req, res) => {
  try {
    const { contentId, page = 1, pageSize = 20 } = req.query;
    const db = await getDb();
    
    let comments = [...db.data.comments].filter(c => 
      c.contentId === contentId && 
      c.status === 'published'
    );
    
    comments.sort((a, b) => {
      if (a.isTop && !b.isTop) return -1;
      if (!a.isTop && b.isTop) return 1;
      return (b.hotScore || 0) - (a.hotScore || 0);
    });
    
    const total = comments.length;
    const start = (page - 1) * pageSize;
    const paginatedComments = comments.slice(start, start + parseInt(pageSize));
    
    const userIds = [...new Set(paginatedComments.map(c => c.userId))];
    const users = db.data.users.filter(u => userIds.includes(u.id));
    const userMap = {};
    for (const user of users) {
      userMap[user.id] = { id: user.id, nickname: user.nickname, avatar: user.avatar };
    }
    
    const commentsWithUsers = paginatedComments.map(c => ({
      ...c,
      user: userMap[c.userId] || { nickname: '匿名' }
    }));
    
    res.json({
      success: true,
      data: {
        comments: commentsWithUsers,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v1/interactions/comments', verifyToken, async (req, res) => {
  try {
    const { contentId, parentId, replyToUserId, content } = req.body;
    const db = await getDb();
    
    const filterResult = filterComment(content);
    
    const now = new Date().toISOString();
    const comment = {
      id: uuidv4(),
      userId: req.user.id,
      contentId,
      parentId: parentId || null,
      replyToUserId: replyToUserId || null,
      content,
      status: filterResult.passed ? 'published' : 'pending',
      filterResult,
      likeCount: 0,
      replyCount: 0,
      isTop: false,
      isHot: false,
      hotScore: 0,
      reviewedBy: null,
      reviewedAt: null,
      reviewReason: null,
      createdAt: now,
      updatedAt: now
    };
    
    db.data.comments.push(comment);
    
    const contentIndex = db.data.contents.findIndex(c => c.id === contentId);
    if (contentIndex !== -1) {
      db.data.contents[contentIndex].commentCount = (db.data.contents[contentIndex].commentCount || 0) + 1;
      db.data.contents[contentIndex].updatedAt = now;
    }
    
    if (parentId) {
      const parentIndex = db.data.comments.findIndex(c => c.id === parentId);
      if (parentIndex !== -1) {
        db.data.comments[parentIndex].replyCount = (db.data.comments[parentIndex].replyCount || 0) + 1;
        db.data.comments[parentIndex].updatedAt = now;
      }
    }
    
    await db.write();
    
    res.status(201).json({
      success: true,
      data: {
        comment,
        filterResult
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v1/interactions/comments/:id/like', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    
    const index = db.data.comments.findIndex(c => c.id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    db.data.comments[index].likeCount = (db.data.comments[index].likeCount || 0) + 1;
    db.data.comments[index].hotScore = (db.data.comments[index].likeCount || 0) + (db.data.comments[index].replyCount || 0) * 2;
    db.data.comments[index].updatedAt = new Date().toISOString();
    
    await db.write();
    
    res.json({
      success: true,
      data: {
        likeCount: db.data.comments[index].likeCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v1/negative-feedbacks', verifyToken, async (req, res) => {
  try {
    const { contentId, reason, tags } = req.body;
    const db = await getDb();
    
    const content = db.data.contents.find(c => c.id === contentId);
    
    const now = new Date().toISOString();
    const feedback = {
      id: uuidv4(),
      userId: req.user.id,
      contentId,
      reason: reason || '不感兴趣',
      tags: tags || content?.semanticTags || [],
      impact: 0.3,
      createdAt: now,
      updatedAt: now
    };
    
    db.data.negativeFeedbacks.push(feedback);
    
    const userProfile = db.data.userProfiles.find(p => p.userId === req.user.id);
    if (userProfile) {
      if (!userProfile.negativeFeedbackTags) userProfile.negativeFeedbackTags = [];
      
      for (const tag of feedback.tags) {
        const existingIndex = userProfile.negativeFeedbackTags.findIndex(t => t.tag === tag);
        if (existingIndex !== -1) {
          userProfile.negativeFeedbackTags[existingIndex].impact = Math.min(1, userProfile.negativeFeedbackTags[existingIndex].impact + 0.2);
          userProfile.negativeFeedbackTags[existingIndex].updatedAt = now;
        } else {
          userProfile.negativeFeedbackTags.push({
            tag,
            impact: 0.3,
            createdAt: now,
            updatedAt: now
          });
        }
      }
      
      if (content) {
        if (userProfile.categoryPreferences[content.categoryCode]) {
          userProfile.categoryPreferences[content.categoryCode] = Math.max(0, userProfile.categoryPreferences[content.categoryCode] - 0.3);
        }
      }
      
      userProfile.updatedAt = now;
    }
    
    await db.write();
    
    res.status(201).json({
      success: true,
      message: '负反馈已记录',
      data: { feedback }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v1/categories', async (req, res) => {
  try {
    const db = await getDb();
    
    let categories = db.data.categories;
    
    if (categories.length === 0) {
      categories = Object.entries(CATEGORY_NAMES).map(([code, name], index) => ({
        id: uuidv4(),
        name,
        code,
        sortOrder: index + 1,
        status: 'active',
        keywords: CATEGORY_KEYWORDS[code]?.join(',') || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    }
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v1/weight-tags', verifyToken, async (req, res) => {
  try {
    const db = await getDb();
    
    let weightTags = db.data.weightTags;
    
    if (weightTags.length === 0) {
      weightTags = [
        { id: uuidv4(), name: '头条推荐', code: 'headline', weightValue: 3.0, category: 'quality', description: '头条推荐内容', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: uuidv4(), name: '独家原创', code: 'original', weightValue: 2.5, category: 'quality', description: '独家原创内容', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: uuidv4(), name: '权威来源', code: 'authoritative', weightValue: 2.0, category: 'quality', description: '权威媒体来源', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: uuidv4(), name: '实时热点', code: 'hot', weightValue: 2.0, category: 'hot', description: '实时热点内容', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: uuidv4(), name: '突发新闻', code: 'breaking', weightValue: 2.5, category: 'timeliness', description: '突发新闻', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: uuidv4(), name: '深度报道', code: 'depth', weightValue: 1.8, category: 'quality', description: '深度分析报道', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: uuidv4(), name: '推荐置顶', code: 'top', weightValue: 3.5, category: 'custom', description: '运营置顶推荐', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ];
    }
    
    res.json({
      success: true,
      data: { weightTags }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v1/ads/campaigns', verifyToken, async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const db = await getDb();
    
    let campaigns = [...db.data.campaigns];
    
    if (status) {
      campaigns = campaigns.filter(c => c.status === status);
    }
    
    campaigns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const total = campaigns.length;
    const start = (page - 1) * pageSize;
    const paginatedCampaigns = campaigns.slice(start, start + parseInt(pageSize));
    
    res.json({
      success: true,
      data: {
        campaigns: paginatedCampaigns,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v1/ads/campaigns', verifyToken, requireRoles(['admin', 'operator', 'advertiser']), async (req, res) => {
  try {
    const { name, description, startDate, endDate, budget, cpcBid, targeting, placementPositions } = req.body;
    const db = await getDb();
    
    const now = new Date().toISOString();
    const campaign = {
      id: uuidv4(),
      advertiserId: req.user.id,
      name,
      description: description || '',
      startDate: startDate || now,
      endDate: endDate || null,
      budget: parseFloat(budget) || 0,
      spentAmount: 0,
      cpcBid: parseFloat(cpcBid) || 0.5,
      targeting: targeting || {
        categories: [],
        minAge: null,
        maxAge: null,
        gender: null,
        regions: [],
        interestTags: []
      },
      placementPositions: placementPositions || [3, 7, 11, 15],
      status: 'draft',
      createdAt: now,
      updatedAt: now
    };
    
    db.data.campaigns.push(campaign);
    await db.write();
    
    res.status(201).json({
      success: true,
      message: '推广活动创建成功',
      data: { campaign }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v1/ads/campaigns/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    
    const campaign = db.data.campaigns.find(c => c.id === id);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: '推广活动不存在'
      });
    }
    
    const materials = db.data.adMaterials.filter(m => m.campaignId === id);
    
    res.json({
      success: true,
      data: { campaign, materials }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.put('/api/v1/ads/campaigns/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, budget, cpcBid, targeting } = req.body;
    const db = await getDb();
    
    const index = db.data.campaigns.findIndex(c => c.id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '推广活动不存在'
      });
    }
    
    if (name) db.data.campaigns[index].name = name;
    if (description !== undefined) db.data.campaigns[index].description = description;
    if (status) db.data.campaigns[index].status = status;
    if (budget !== undefined) db.data.campaigns[index].budget = parseFloat(budget);
    if (cpcBid !== undefined) db.data.campaigns[index].cpcBid = parseFloat(cpcBid);
    if (targeting) db.data.campaigns[index].targeting = targeting;
    
    db.data.campaigns[index].updatedAt = new Date().toISOString();
    await db.write();
    
    res.json({
      success: true,
      message: '推广活动更新成功',
      data: { campaign: db.data.campaigns[index] }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v1/ads/materials', verifyToken, requireRoles(['admin', 'operator', 'advertiser']), async (req, res) => {
  try {
    const { campaignId, title, description, imageUrl, linkUrl, ctaText } = req.body;
    const db = await getDb();
    
    const material = {
      id: uuidv4(),
      campaignId,
      title,
      description: description || '',
      imageUrl: imageUrl || '',
      linkUrl: linkUrl || '',
      ctaText: ctaText || '查看详情',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.data.adMaterials.push(material);
    await db.write();
    
    res.status(201).json({
      success: true,
      message: '广告素材创建成功',
      data: { material }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v1/ads/deliveries/:id/impression', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { materialId, campaignId, position, sessionId } = req.body;
    const db = await getDb();
    
    const delivery = {
      id: uuidv4(),
      campaignId: campaignId || id,
      materialId,
      userId: req.user.id,
      position: position || 0,
      sessionId: sessionId || req.headers['x-session-id'] || uuidv4(),
      isImpressed: true,
      isClicked: false,
      impressedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.data.adDeliveries.push(delivery);
    await db.write();
    
    res.json({
      success: true,
      message: '广告曝光已记录'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v1/ads/deliveries/:id/click', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { materialId, campaignId } = req.body;
    const db = await getDb();
    
    const deliveryIndex = db.data.adDeliveries.findIndex(d => d.id === id);
    
    if (deliveryIndex !== -1) {
      db.data.adDeliveries[deliveryIndex].isClicked = true;
      db.data.adDeliveries[deliveryIndex].clickedAt = new Date().toISOString();
      db.data.adDeliveries[deliveryIndex].updatedAt = new Date().toISOString();
    }
    
    if (campaignId) {
      const campaignIndex = db.data.campaigns.findIndex(c => c.id === campaignId);
      if (campaignIndex !== -1) {
        const cpcBid = db.data.campaigns[campaignIndex].cpcBid || 0.5;
        db.data.campaigns[campaignIndex].spentAmount = (db.data.campaigns[campaignIndex].spentAmount || 0) + cpcBid;
        db.data.campaigns[campaignIndex].updatedAt = new Date().toISOString();
      }
    }
    
    await db.write();
    
    res.json({
      success: true,
      message: '广告点击已记录'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v1/ads/stats', verifyToken, async (req, res) => {
  try {
    const { campaignId, startDate, endDate } = req.query;
    const db = await getDb();
    
    let deliveries = [...db.data.adDeliveries];
    
    if (campaignId) {
      deliveries = deliveries.filter(d => d.campaignId === campaignId);
    }
    
    const impressions = deliveries.filter(d => d.isImpressed).length;
    const clicks = deliveries.filter(d => d.isClicked).length;
    const ctr = impressions > 0 ? (clicks / impressions) : 0;
    
    let totalCost = 0;
    for (const delivery of deliveries.filter(d => d.isClicked)) {
      const campaign = db.data.campaigns.find(c => c.id === delivery.campaignId);
      if (campaign) {
        totalCost += campaign.cpcBid || 0.5;
      }
    }
    
    res.json({
      success: true,
      data: {
        stats: {
          totalImpressions: impressions,
          totalClicks: clicks,
          ctr,
          totalCost: Math.round(totalCost * 100) / 100
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v1/analytics/dashboard', verifyToken, requireRoles(['admin', 'operator', 'algorithm']), async (req, res) => {
  try {
    const db = await getDb();
    
    const totalUsers = db.data.users.length;
    const totalContents = db.data.contents.length;
    const totalInteractions = db.data.interactions.length;
    
    const today = moment().format('YYYY-MM-DD');
    const todayStart = moment().startOf('day').toISOString();
    const todayEnd = moment().endOf('day').toISOString();
    
    const todayActiveUsers = new Set(
      db.data.interactions
        .filter(i => i.createdAt >= todayStart && i.createdAt <= todayEnd)
        .map(i => i.userId)
    ).size;
    
    const todayViews = db.data.interactions.filter(i => 
      i.type === 'view' && 
      i.createdAt >= todayStart && 
      i.createdAt <= todayEnd
    ).length;
    
    const publishedContents = db.data.contents.filter(c => c.status === 'published').length;
    const pendingContents = db.data.contents.filter(c => c.status === 'pending_recommendation').length;
    
    const activeCampaigns = db.data.campaigns.filter(c => c.status === 'active').length;
    const totalAdImpressions = db.data.adDeliveries.filter(d => d.isImpressed).length;
    const totalAdClicks = db.data.adDeliveries.filter(d => d.isClicked).length;
    
    res.json({
      success: true,
      data: {
        dashboard: {
          overview: {
            totalUsers,
            totalContents,
            totalInteractions,
            publishedContents,
            pendingContents
          },
          today: {
            date: today,
            activeUsers: todayActiveUsers,
            views: todayViews
          },
          ads: {
            activeCampaigns,
            totalImpressions: totalAdImpressions,
            totalClicks: totalAdClicks
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v1/analytics/dau', verifyToken, requireRoles(['admin', 'operator', 'algorithm']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const db = await getDb();
    
    const start = startDate ? moment(startDate) : moment().subtract(7, 'days');
    const end = endDate ? moment(endDate) : moment();
    
    const dauData = [];
    let current = moment(start);
    
    while (current.isSameOrBefore(end, 'day')) {
      const dayStart = current.startOf('day').toISOString();
      const dayEnd = current.endOf('day').toISOString();
      
      const activeUsers = new Set(
        db.data.interactions
          .filter(i => i.createdAt >= dayStart && i.createdAt <= dayEnd)
          .map(i => i.userId)
      ).size;
      
      const views = db.data.interactions.filter(i => 
        i.type === 'view' && 
        i.createdAt >= dayStart && 
        i.createdAt <= dayEnd
      ).length;
      
      dauData.push({
        date: current.format('YYYY-MM-DD'),
        dau: activeUsers,
        views
      });
      
      current = current.add(1, 'day');
    }
    
    res.json({
      success: true,
      data: { dauData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v1/analytics/audit-logs', verifyToken, requireRoles(['admin', 'operator', 'algorithm']), async (req, res) => {
  try {
    const { operation, operatorId, page = 1, pageSize = 20 } = req.query;
    const db = await getDb();
    
    let logs = [...db.data.auditLogs];
    
    if (operation) {
      logs = logs.filter(l => l.operation === operation);
    }
    
    if (operatorId) {
      logs = logs.filter(l => l.operatorId === operatorId);
    }
    
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const total = logs.length;
    const start = (page - 1) * pageSize;
    const paginatedLogs = logs.slice(start, start + parseInt(pageSize));
    
    res.json({
      success: true,
      data: {
        auditLogs: paginatedLogs,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '服务器内部错误'
  });
});

async function startServer() {
  try {
    console.log('正在初始化数据库...');
    const db = await initDatabase();
    
    console.log('正在初始化种子数据...');
    
    const now = new Date().toISOString();
    
    if (db.data.users.length === 0) {
      const users = [
        {
          id: uuidv4(),
          username: 'admin',
          password: await bcrypt.hash('admin123456', 10),
          nickname: '超级管理员',
          role: 'admin',
          status: 'active',
          email: 'admin@newsapp.com',
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          username: 'operator',
          password: await bcrypt.hash('operator123', 10),
          nickname: '内容运营',
          role: 'operator',
          status: 'active',
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          username: 'algorithm',
          password: await bcrypt.hash('algorithm123', 10),
          nickname: '算法工程师',
          role: 'algorithm',
          status: 'active',
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          username: 'advertiser',
          password: await bcrypt.hash('advertiser123', 10),
          nickname: '广告主',
          role: 'advertiser',
          status: 'active',
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          username: 'reader',
          password: await bcrypt.hash('reader123', 10),
          nickname: '测试读者',
          role: 'reader',
          status: 'active',
          createdAt: now,
          updatedAt: now
        }
      ];
      
      db.data.users = users;
      console.log('默认用户已创建');
      
      for (const user of users) {
        db.data.userProfiles.push({
          id: uuidv4(),
          userId: user.id,
          interestTags: [],
          categoryPreferences: {},
          readHistory: [],
          negativeFeedbackTags: [],
          createdAt: now,
          updatedAt: now
        });
      }
    }
    
    if (db.data.categories.length === 0) {
      const categories = Object.entries(CATEGORY_NAMES).map(([code, name], index) => ({
        id: uuidv4(),
        name,
        code,
        keywords: CATEGORY_KEYWORDS[code]?.join(',') || '',
        sortOrder: index + 1,
        status: 'active',
        createdAt: now,
        updatedAt: now
      }));
      
      db.data.categories = categories;
      console.log('默认分类已创建');
    }
    
    if (db.data.weightTags.length === 0) {
      const weightTags = [
        { id: uuidv4(), name: '头条推荐', code: 'headline', weightValue: 3.0, category: 'quality', description: '头条推荐内容', status: 'active', createdAt: now, updatedAt: now },
        { id: uuidv4(), name: '独家原创', code: 'original', weightValue: 2.5, category: 'quality', description: '独家原创内容', status: 'active', createdAt: now, updatedAt: now },
        { id: uuidv4(), name: '权威来源', code: 'authoritative', weightValue: 2.0, category: 'quality', description: '权威媒体来源', status: 'active', createdAt: now, updatedAt: now },
        { id: uuidv4(), name: '实时热点', code: 'hot', weightValue: 2.0, category: 'hot', description: '实时热点内容', status: 'active', createdAt: now, updatedAt: now },
        { id: uuidv4(), name: '突发新闻', code: 'breaking', weightValue: 2.5, category: 'timeliness', description: '突发新闻', status: 'active', createdAt: now, updatedAt: now },
        { id: uuidv4(), name: '深度报道', code: 'depth', weightValue: 1.8, category: 'quality', description: '深度分析报道', status: 'active', createdAt: now, updatedAt: now },
        { id: uuidv4(), name: '推荐置顶', code: 'top', weightValue: 3.5, category: 'custom', description: '运营置顶推荐', status: 'active', createdAt: now, updatedAt: now }
      ];
      
      db.data.weightTags = weightTags;
      console.log('默认权重标签已创建');
    }
    
    if (db.data.contents.length === 0) {
      const sampleContents = [
        {
          id: uuidv4(),
          title: '人工智能技术突破：新一代大语言模型发布',
          content: '近日，科技巨头发布了新一代大语言模型，在多项基准测试中取得了突破性进展。该模型在理解能力、推理能力和生成能力方面都有显著提升，预计将广泛应用于智能客服、内容生成、代码辅助等领域。',
          summary: '新一代大语言模型发布，多项技术指标突破',
          author: '科技日报',
          source: '官方发布',
          categoryCode: 'tech',
          categoryName: '科技',
          status: 'published',
          semanticTags: ['人工智能', 'AI', '科技'],
          weightTags: ['hot'],
          weightScore: 2.0,
          hotScore: 85,
          viewCount: 1250,
          likeCount: 89,
          commentCount: 23,
          shareCount: 15,
          collectCount: 56,
          readCount: 890,
          createdBy: db.data.users.find(u => u.username === 'admin')?.id,
          publishedAt: now,
          deduplicationHash: generateContentHash('人工智能技术突破：新一代大语言模型发布', '近日，科技巨头发布了新一代大语言模型'),
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          title: '股票市场分析：科技股引领大盘上涨',
          content: '今日股市迎来开门红，科技板块表现强势。分析人士认为，随着人工智能技术的快速发展，相关产业链将持续受益。投资者应关注具有核心技术优势的企业。',
          summary: '科技股领涨，市场情绪回暖',
          author: '财经周刊',
          source: '市场分析',
          categoryCode: 'finance',
          categoryName: '财经',
          status: 'published',
          semanticTags: ['股票', '财经', '投资'],
          weightTags: [],
          weightScore: 1.0,
          hotScore: 42,
          viewCount: 890,
          likeCount: 45,
          commentCount: 12,
          shareCount: 8,
          collectCount: 34,
          readCount: 620,
          createdBy: db.data.users.find(u => u.username === 'admin')?.id,
          publishedAt: now,
          deduplicationHash: generateContentHash('股票市场分析：科技股引领大盘上涨', '今日股市迎来开门红'),
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          title: '世界杯预选赛：国足客场逼平对手',
          content: '在昨晚进行的世界杯预选赛中，中国国家男子足球队客场挑战强敌。虽然场面被动，但球员们顽强拼搏，最终凭借一次反击机会扳平比分，取得宝贵的一分。',
          summary: '国足客场逼平，保持出线希望',
          author: '体育时报',
          source: '赛事报道',
          categoryCode: 'sports',
          categoryName: '体育',
          status: 'published',
          semanticTags: ['体育', '足球', '世界杯'],
          weightTags: [],
          weightScore: 1.0,
          hotScore: 67,
          viewCount: 2100,
          likeCount: 156,
          commentCount: 89,
          shareCount: 34,
          collectCount: 12,
          readCount: 1580,
          createdBy: db.data.users.find(u => u.username === 'admin')?.id,
          publishedAt: now,
          deduplicationHash: generateContentHash('世界杯预选赛：国足客场逼平对手', '在昨晚进行的世界杯预选赛中'),
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          title: '健康生活指南：如何科学减肥',
          content: '随着生活水平的提高，越来越多的人关注健康管理。科学减肥需要均衡饮食和适量运动的结合。专家建议，每周至少进行150分钟中等强度有氧运动，同时控制热量摄入。',
          summary: '均衡饮食+适量运动是健康减肥的关键',
          author: '健康生活',
          source: '专家解读',
          categoryCode: 'health',
          categoryName: '健康',
          status: 'published',
          semanticTags: ['健康', '减肥', '运动', '饮食'],
          weightTags: [],
          weightScore: 1.0,
          hotScore: 35,
          viewCount: 680,
          likeCount: 67,
          commentCount: 8,
          shareCount: 23,
          collectCount: 145,
          readCount: 520,
          createdBy: db.data.users.find(u => u.username === 'admin')?.id,
          publishedAt: now,
          deduplicationHash: generateContentHash('健康生活指南：如何科学减肥', '随着生活水平的提高'),
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          title: '娱乐圈动态：某知名导演新作首映',
          content: '备受期待的某知名导演新作今日在京举行首映礼。影片讲述了一个关于成长与救赎的故事，画面精美，情感真挚。业内人士预测，该片有望成为年度票房黑马。',
          summary: '知名导演新作首映，口碑爆棚',
          author: '娱乐头条',
          source: '现场报道',
          categoryCode: 'entertainment',
          categoryName: '娱乐',
          status: 'published',
          semanticTags: ['娱乐', '电影', '明星'],
          weightTags: [],
          weightScore: 1.0,
          hotScore: 55,
          viewCount: 1890,
          likeCount: 234,
          commentCount: 67,
          shareCount: 89,
          collectCount: 23,
          readCount: 1450,
          createdBy: db.data.users.find(u => u.username === 'admin')?.id,
          publishedAt: now,
          deduplicationHash: generateContentHash('娱乐圈动态：某知名导演新作首映', '备受期待的某知名导演新作今日'),
          createdAt: now,
          updatedAt: now
        }
      ];
      
      db.data.contents = sampleContents;
      console.log('示例内容已创建:', sampleContents.length, '篇');
    }
    
    if (db.data.campaigns.length === 0) {
      const sampleCampaigns = [
        {
          id: uuidv4(),
          advertiserId: db.data.users.find(u => u.username === 'advertiser')?.id,
          name: '新品上市推广',
          description: '2024年春季新品上市推广活动',
          startDate: now,
          endDate: null,
          budget: 10000,
          spentAmount: 1580,
          cpcBid: 0.5,
          targeting: {
            categories: ['tech', 'entertainment'],
            minAge: null,
            maxAge: null,
            gender: null,
            regions: [],
            interestTags: ['科技', '手机', '数码']
          },
          placementPositions: [3, 7, 11, 15],
          status: 'active',
          createdAt: now,
          updatedAt: now
        }
      ];
      
      db.data.campaigns = sampleCampaigns;
      
      const campaignId = sampleCampaigns[0].id;
      db.data.adMaterials = [
        {
          id: uuidv4(),
          campaignId,
          title: '全新旗舰手机震撼发布',
          description: '搭载最新处理器，超强续航，卓越拍照体验',
          imageUrl: '',
          linkUrl: 'https://example.com/product',
          ctaText: '立即了解',
          status: 'active',
          createdAt: now,
          updatedAt: now
        }
      ];
      
      console.log('示例广告活动已创建');
    }
    
    await db.write();
    console.log('种子数据初始化完成');
    
    app.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log('  News App Backend Server');
      console.log('  Version: 1.0.0 (SQLite版)');
      console.log('  Port: ' + PORT);
      console.log('========================================');
      console.log('  API 地址: http://localhost:' + PORT);
      console.log('  健康检查: http://localhost:' + PORT + '/api/v1/health');
      console.log('');
      console.log('  默认账户:');
      console.log('    admin / admin123456 (管理员)');
      console.log('    operator / operator123 (运营)');
      console.log('    algorithm / algorithm123 (算法)');
      console.log('    advertiser / advertiser123 (广告主)');
      console.log('    reader / reader123 (读者)');
      console.log('');
      console.log('  关联前端:');
      console.log('    运营管理: http://localhost:8763');
      console.log('    读者端: http://localhost:8764');
      console.log('    广告主看板: http://localhost:8765');
      console.log('========================================');
    });
    
  } catch (error) {
    console.error('服务启动失败:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;