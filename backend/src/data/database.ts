import { v4 as uuidv4 } from 'uuid';
import type {
  User,
  Activity,
  BubbleRoom,
  GuardianRelation,
  SafetySession,
  MatchHistory,
  MutualMatch,
  RiskEvent,
  RiskReport,
  HighFrequencyMonitor,
  Conversation,
  ChatMessage,
  ChatMemoryEntry,
  FriendRelationship,
  LocalServiceCoupon,
  CouponOrder,
  RedPacket,
  GuardianRequest
} from '../types';

class Database {
  private static instance: Database;

  users: Map<string, User> = new Map();
  activities: Map<string, Activity> = new Map();
  bubbleRooms: Map<string, BubbleRoom> = new Map();
  redPackets: Map<string, RedPacket> = new Map();
  guardianRelations: Map<string, GuardianRelation> = new Map();
  guardianRequests: Map<string, GuardianRequest> = new Map();
  safetySessions: Map<string, SafetySession> = new Map();
  matchHistories: Map<string, MatchHistory> = new Map();
  mutualMatches: Map<string, MutualMatch> = new Map();
  riskEvents: Map<string, RiskEvent> = new Map();
  riskReports: Map<string, RiskReport> = new Map();
  highFrequencyMonitors: Map<string, HighFrequencyMonitor> = new Map();
  conversations: Map<string, Conversation> = new Map();
  chatMessages: Map<string, ChatMessage> = new Map();
  chatMemories: Map<string, ChatMemoryEntry> = new Map();
  friendships: Map<string, FriendRelationship> = new Map();
  coupons: Map<string, LocalServiceCoupon> = new Map();
  couponOrders: Map<string, CouponOrder> = new Map();

  private constructor() {
    this.seedMockData();
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  generateId(): string {
    return uuidv4();
  }

  private seedMockData(): void {
    this.seedUsers();
    this.seedActivities();
    this.seedCoupons();
    this.seedGuardianRelations();
    this.seedBubbleRooms();
  }

  private seedUsers(): void {
    const cities = ['北京', '上海', '深圳', '杭州', '成都', '广州'];
    const schools = ['清华大学', '北京大学', '复旦大学', '上海交大', '浙江大学', '南京大学'];
    const industries = ['互联网', '金融', '教育', '医疗', '媒体', '制造业'];
    const interests = [
      ['篮球', '电影', '摄影', '旅行'],
      ['美食', '音乐', '读书', '健身'],
      ['游戏', '动漫', '编程', '咖啡'],
      ['爬山', '露营', '骑行', '滑雪'],
      ['绘画', '书法', '乐器', '戏剧']
    ];
    const names = ['小明', '小红', '阿飞', '甜甜', '阿杰', '莉莉', '小强', '美美', '阿凯', '思思', '大伟', '静静'];
    const genders: User['gender'][] = ['male', 'female', 'male', 'female', 'male', 'female', 'male', 'female', 'male', 'female', 'male', 'female'];

    for (let i = 0; i < 12; i++) {
      const latBase = 39.9;
      const lonBase = 116.4;
      const userId = this.generateId();
      const user: User = {
        id: userId,
        nickname: names[i] + (i + 1),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${names[i]}${i}`,
        gender: genders[i],
        age: 22 + (i % 12),
        bio: `热爱生活的${names[i]}，期待认识更多有趣的灵魂～`,
        phone: `138${String(10000000 + i).padStart(8, '0')}`,
        location: {
          city: cities[i % cities.length],
          district: ['朝阳区', '海淀区', '西城区'][i % 3],
          latitude: latBase + (Math.random() - 0.5) * 0.5,
          longitude: lonBase + (Math.random() - 0.5) * 0.5,
          lastUpdated: new Date()
        },
        verification: {
          realName: '***',
          idCardLast4: String(1000 + i).slice(-4),
          verifiedAt: new Date(Date.now() - i * 86400000),
          verified: i < 10,
          faceVerified: i < 8
        },
        education: {
          school: schools[i % schools.length],
          level: i % 3 === 0 ? 'master' : i % 3 === 1 ? 'bachelor' : 'phd',
          major: ['计算机', '金融', '设计', '英语', '化学', '物理'][i % 6],
          graduationYear: 2018 + (i % 5),
          verified: i < 9
        },
        career: {
          company: ['字节跳动', '阿里巴巴', '腾讯', '美团', '京东', '百度'][i % 6],
          position: ['工程师', '产品经理', '设计师', '运营', '分析师', '市场经理'][i % 6],
          industry: industries[i % industries.length],
          yearsOfExperience: 1 + (i % 8),
          verified: i < 8
        },
        interestTags: interests[i % interests.length],
        creditScore: 600 + Math.floor(Math.random() * 250),
        creditRecords: [{
          id: this.generateId(),
          type: 'initial_score',
          scoreChange: 700,
          reason: '初始信用分',
          createdAt: new Date(Date.now() - i * 86400000)
        }],
        emergencyContact: i % 2 === 0 ? {
          name: `紧急联系人${i}`,
          phone: `139${String(10000000 + i).padStart(8, '0')}`,
          relationship: ['朋友', '家人', '同事'][i % 3]
        } : undefined,
        privacySettings: {
          showRealName: false,
          showEducation: true,
          showCareer: true,
          showLocation: true,
          allowMatch: true
        },
        createdAt: new Date(Date.now() - i * 86400000 * 10),
        lastActiveAt: new Date(Date.now() - Math.random() * 3600000)
      };
      this.users.set(userId, user);
    }
  }

  private seedActivities(): void {
    const users = Array.from(this.users.values());
    const categories: Activity['category'][] = ['food', 'movie', 'sports', 'travel', 'study', 'party'];
    const titles = [
      '周末火锅局', '周六夜电影院', '朝阳公园羽毛球', '郊区一日徒步',
      '图书馆读书会', '桌游派对', 'KTV聚会', '博物馆导览'
    ];
    const locNames = [
      '海底捞火锅（三里屯店）', '万达影城（CBD店）', '朝阳公园羽毛球馆',
      '北京香山公园', '国家图书馆', '望京SOHO桌游吧', '乐圣KTV', '国家博物馆'
    ];
    const addresses = [
      '朝阳区三里屯太古里北区', '朝阳区建国路93号万达广场', '朝阳区朝阳公园南路1号',
      '海淀区香山路', '海淀区中关村南大街33号', '朝阳区望京街10号',
      '海淀区中关村大街', '东城区东长安街16号'
    ];

    for (let i = 0; i < 8; i++) {
      const creator = users[i % users.length];
      const now = Date.now();
      const startTime = new Date(now + (i + 1) * 86400000);
      const endTime = new Date(startTime.getTime() + 3 * 3600000);
      const meetingTime = new Date(startTime.getTime() - 30 * 60 * 1000);

      const activity: Activity = {
        id: this.generateId(),
        creatorId: creator.id,
        title: titles[i],
        description: `欢迎大家来参加${titles[i]}！要求信用分良好，实名认证优先～活动过程中请遵守规则，互相尊重，如有问题可随时呼叫平安哨。`,
        category: categories[i % categories.length],
        tags: ['高品质', '新人友好', '小聚'],
        location: {
          name: locNames[i],
          address: addresses[i],
          latitude: 39.9 + Math.random() * 0.3,
          longitude: 116.4 + Math.random() * 0.3,
          city: creator.location.city
        },
        startTime,
        endTime,
        meetingTime,
        maxParticipants: 4 + (i % 5),
        minParticipants: 2,
        feePerPerson: i % 3 === 0 ? 0 : (i % 2 === 0 ? 50 : 120),
        genderPreference: i % 4 === 0 ? 'balanced' : 'any',
        ageRange: { min: 20, max: 40 },
        minCreditScore: 650,
        status: i < 5 ? 'recruiting' : i < 7 ? 'confirmed' : 'ongoing',
        participants: [{
          userId: creator.id,
          status: 'approved',
          appliedAt: new Date(now - 86400000)
        }],
        images: [],
        riskFlags: { flagged: false },
        createdAt: new Date(now - 86400000 * 2),
        updatedAt: new Date(now - 86400000),
        confirmedAt: i >= 5 ? new Date(now - 3600000) : undefined
      };
      this.activities.set(activity.id, activity);
    }
  }

  private seedCoupons(): void {
    const merchants = ['小壶火锅', '小壶影院', '小壶健身', '小壶咖啡', '小壶美食汇'];
    const categories: LocalServiceCoupon['category'][] = ['food', 'entertainment', 'fitness', 'beauty', 'food'];
    for (let i = 0; i < 5; i++) {
      const original = 200 + i * 50;
      const discounted = Math.floor(original * (0.5 + i * 0.05));
      const coupon: LocalServiceCoupon = {
        id: this.generateId(),
        externalId: `XH${10000 + i}`,
        provider: 'xiaohu_preferred',
        merchantId: `M${200 + i}`,
        merchantName: merchants[i],
        category: categories[i],
        title: `${merchants[i]} 双人套餐优惠券`,
        description: `含招牌菜品+饮料，周末通用，节假日不加价。`,
        originalPrice: original,
        discountedPrice: discounted,
        discountPercentage: Math.round((1 - discounted / original) * 100),
        city: '北京',
        images: [],
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 86400000),
        stock: 100 - i * 10,
        soldCount: i * 20,
        averageRating: 4.5 + Math.random() * 0.5,
        reviewCount: 50 + i * 30,
        tags: ['周末可用', '免预约', '随时退'],
        termsAndConditions: '有效期30天，过期自动退，不支持退款核销后订单。'
      };
      this.coupons.set(coupon.id, coupon);
    }
  }

  private seedGuardianRelations(): void {
    const users = Array.from(this.users.values());
    for (let i = 0; i < 4; i++) {
      const rel: GuardianRelation = {
        id: this.generateId(),
        guarderId: users[i].id,
        guardianId: users[(i + 2) % users.length].id,
        relationName: i % 2 === 0 ? '闺蜜' : '兄弟',
        status: 'active',
        mutual: true,
        permissionLevel: 'full',
        createdAt: new Date(Date.now() - 15 * 86400000),
        activatedAt: new Date(Date.now() - 14 * 86400000),
        lastCheckInAt: new Date(Date.now() - 3600000)
      };
      this.guardianRelations.set(rel.id, rel);
    }
  }

  private seedBubbleRooms(): void {
    const users = Array.from(this.users.values());
    const roomTitles = [
      { title: '北京单身夜聊', type: 'single' as const },
      { title: '青春校园回忆录', type: 'youth' as const },
      { title: '缘分红包抢抢抢', type: 'fate_redpacket' as const }
    ];
    for (let i = 0; i < roomTitles.length; i++) {
      const room: BubbleRoom = {
        id: this.generateId(),
        hostId: users[i * 3].id,
        roomType: roomTitles[i].type,
        title: roomTitles[i].title,
        description: `欢迎来到${roomTitles[i].title}～请文明聊天，禁止广告和违规内容`,
        theme: i === 0 ? '脱单' : i === 1 ? '怀旧' : '互动',
        maxMembers: 8,
        status: 'active',
        city: '北京',
        ageRange: { min: 18, max: 35 },
        genderPreference: 'balanced',
        minCreditScore: 600,
        tags: ['活跃', '有话题'],
        members: [
          {
            userId: users[i * 3].id,
            joinedAt: new Date(Date.now() - 1800000),
            isHost: true,
            isReady: true,
            lastHeartbeat: new Date(),
            micEnabled: true,
            cameraEnabled: false
          },
          {
            userId: users[i * 3 + 1].id,
            joinedAt: new Date(Date.now() - 1200000),
            isHost: false,
            isReady: true,
            lastHeartbeat: new Date(),
            micEnabled: true,
            cameraEnabled: false
          }
        ],
        createdBy: users[i * 3].id,
        createdAt: new Date(Date.now() - 7200000),
        startedAt: new Date(Date.now() - 3600000),
        autoCloseAt: new Date(Date.now() + 4 * 3600000),
        messages: [{
          id: this.generateId(),
          roomId: '',
          senderId: users[i * 3].id,
          type: 'system',
          content: `${users[i * 3].nickname}创建了房间`,
          riskFlagged: false,
          createdAt: new Date(Date.now() - 7200000)
        }]
      };
      room.messages[0].roomId = room.id;
      this.bubbleRooms.set(room.id, room);
    }
  }
}

export const db = Database.getInstance();
