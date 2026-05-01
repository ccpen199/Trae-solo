import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const PORT = 47291;
const JWT_SECRET = 'EmailMarketingJwtSecretKey2024VeryLongAndSecure';

const app = express();

app.set('trust proxy', true);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  category?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  isActive: boolean;
  isPublic: boolean;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Audience {
  id: string;
  name: string;
  description?: string;
  totalCount: number;
  isActive: boolean;
  createdAt: Date;
}

interface AudienceMember {
  id: string;
  audienceId: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  position?: string;
  country?: string;
  city?: string;
  isSubscribed: boolean;
  totalOpens: number;
  totalClicks: number;
  totalSent: number;
  totalDelivered: number;
  totalBounced: number;
  lastOpenAt?: Date;
  lastClickAt?: Date;
  subscribedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Tag {
  id: string;
  name: string;
  code: string;
  type: 'MANUAL' | 'AUTOMATIC' | 'SYSTEM';
  category: 'DEMOGRAPHIC' | 'BEHAVIORAL' | 'PREFERENCE' | 'ENGAGEMENT' | 'PURCHASE' | 'CUSTOM';
  description?: string;
  color?: string;
  rule?: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MemberTag {
  id: string;
  memberId: string;
  tagId: string;
  assignedAt: Date;
  assignedBy?: string;
}

interface ProfileAttribute {
  id: string;
  name: string;
  code: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'ENUM' | 'ARRAY';
  isRequired: boolean;
  isPublic: boolean;
  enumValues?: string[];
  description?: string;
  createdAt: Date;
}

interface MemberAttribute {
  id: string;
  memberId: string;
  attributeId: string;
  value: string;
  lastUpdatedAt: Date;
}

interface ActivityEvent {
  id: string;
  memberId: string;
  eventType: 'EMAIL_SENT' | 'EMAIL_OPENED' | 'EMAIL_CLICKED' | 'EMAIL_BOUNCED' | 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'TAG_ADDED' | 'TAG_REMOVED' | 'ATTRIBUTE_UPDATED';
  eventData: Record<string, unknown>;
  campaignId?: string;
  createdAt: Date;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: string;
  subject?: string;
  templateId?: string;
  audienceId?: string;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  stats: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
  };
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  isAcknowledged: boolean;
  createdAt: Date;
}

const users: User[] = [];
const templates: Template[] = [];
const audiences: Audience[] = [];
const audienceMembers: AudienceMember[] = [];
const campaigns: Campaign[] = [];
const alerts: Alert[] = [];
const tags: Tag[] = [];
const memberTags: MemberTag[] = [];
const profileAttributes: ProfileAttribute[] = [];
const memberAttributes: MemberAttribute[] = [];
const activityEvents: ActivityEvent[] = [];

async function initMockData() {
  const hashedPassword = await bcrypt.hash('Admin@2024', 10);
  
  users.push({
    id: uuidv4(),
    email: 'admin@example.com',
    password: hashedPassword,
    name: '系统管理员',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date(),
  });
  
  users.push({
    id: uuidv4(),
    email: 'marketing@example.com',
    password: await bcrypt.hash('Marketing@2024', 10),
    name: '市场运营',
    role: 'MARKETING_OPERATOR',
    isActive: true,
    createdAt: new Date(),
  });
  
  templates.push(
    {
      id: uuidv4(),
      name: '促销邮件模板',
      description: '适用于产品促销活动的邮件模板',
      category: '促销',
      subject: '尊敬的{{name}}，限时优惠不容错过！',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>{{name}}</title></head>
        <body>
          <h1>尊敬的{{name}}，您好！</h1>
          <p>感谢您一直以来对{{company}}的支持。</p>
          <p>我们为您准备了限时优惠活动，点击下方链接了解详情：</p>
          <a href="https://example.com/promo">立即查看优惠</a>
          <p>如有任何问题，请随时联系我们。</p>
          <p>此致</p>
          <p>{{company}}团队</p>
        </body>
        </html>
      `,
      isActive: true,
      isPublic: true,
      creatorId: users[0].id,
      createdAt: new Date(Date.now() - 86400000 * 30),
      updatedAt: new Date(Date.now() - 86400000 * 5),
    },
    {
      id: uuidv4(),
      name: '欢迎邮件模板',
      description: '新用户注册后的欢迎邮件',
      category: '通知',
      subject: '欢迎加入{{company}}！',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>欢迎</title></head>
        <body>
          <h1>欢迎加入{{company}}，{{name}}！</h1>
          <p>感谢您注册成为我们的会员。</p>
          <p>以下是您的账户信息：</p>
          <ul>
            <li>邮箱：{{email}}</li>
            <li>注册时间：{{now}}</li>
          </ul>
          <p>如果您有任何问题，请随时联系我们的客服团队。</p>
          <p>此致</p>
          <p>{{company}}团队</p>
        </body>
        </html>
      `,
      isActive: true,
      isPublic: true,
      creatorId: users[0].id,
      createdAt: new Date(Date.now() - 86400000 * 45),
      updatedAt: new Date(Date.now() - 86400000 * 10),
    },
    {
      id: uuidv4(),
      name: '产品更新通知',
      description: '告知用户产品功能更新',
      category: '通知',
      subject: '新功能上线：{{feature}}现已推出',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>产品更新</title></head>
        <body>
          <h1>{{name}}，我们有新消息！</h1>
          <p>很高兴地通知您，我们的产品又有新功能上线了！</p>
          <h2>新功能：{{feature}}</h2>
          <p>这个新功能将帮助您更好地完成工作。</p>
          <p>点击下方链接了解更多详情：</p>
          <a href="https://example.com/features">了解更多</a>
          <p>此致</p>
          <p>{{company}}团队</p>
        </body>
        </html>
      `,
      isActive: true,
      isPublic: false,
      creatorId: users[0].id,
      createdAt: new Date(Date.now() - 86400000 * 60),
      updatedAt: new Date(Date.now() - 86400000 * 20),
    }
  );
  
  const audience1 = {
    id: uuidv4(),
    name: '潜在客户列表',
    description: '从官网表单收集的潜在客户',
    totalCount: 2500,
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 30),
  };
  
  const audience2 = {
    id: uuidv4(),
    name: '新注册用户',
    description: '最近30天内注册的新用户',
    totalCount: 800,
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 45),
  };
  
  const audience3 = {
    id: uuidv4(),
    name: 'VIP会员',
    description: '付费VIP会员用户',
    totalCount: 500,
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 60),
  };
  
  audiences.push(audience1, audience2, audience3);
  
  const sampleNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
  const sampleCompanies = ['科技有限公司', '信息技术公司', '网络服务公司', '数据科技公司'];
  const sampleCountries = ['中国', '美国', '日本', '德国'];
  const sampleCities = ['北京', '上海', '广州', '深圳', '杭州', '成都'];
  
  tags.push(
    {
      id: uuidv4(),
      name: '活跃订阅者',
      code: 'active_subscriber',
      type: 'SYSTEM',
      category: 'ENGAGEMENT',
      description: '最近30天内有打开或点击行为的订阅者',
      color: '#10b981',
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 90),
      updatedAt: new Date(Date.now() - 86400000 * 90),
    },
    {
      id: uuidv4(),
      name: '非活跃订阅者',
      code: 'inactive_subscriber',
      type: 'SYSTEM',
      category: 'ENGAGEMENT',
      description: '超过90天没有打开或点击行为的订阅者',
      color: '#ef4444',
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 90),
      updatedAt: new Date(Date.now() - 86400000 * 90),
    },
    {
      id: uuidv4(),
      name: '高互动用户',
      code: 'high_engager',
      type: 'SYSTEM',
      category: 'ENGAGEMENT',
      description: '打开率超过60%的用户',
      color: '#3b82f6',
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 90),
      updatedAt: new Date(Date.now() - 86400000 * 90),
    },
    {
      id: uuidv4(),
      name: '点击者',
      code: 'clicker',
      type: 'SYSTEM',
      category: 'BEHAVIORAL',
      description: '曾经点击过邮件链接的用户',
      color: '#8b5cf6',
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 90),
      updatedAt: new Date(Date.now() - 86400000 * 90),
    },
    {
      id: uuidv4(),
      name: '新订阅者',
      code: 'new_subscriber',
      type: 'SYSTEM',
      category: 'ENGAGEMENT',
      description: '最近7天内订阅的用户',
      color: '#f59e0b',
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 90),
      updatedAt: new Date(Date.now() - 86400000 * 90),
    },
    {
      id: uuidv4(),
      name: '已退订',
      code: 'unsubscribed',
      type: 'SYSTEM',
      category: 'ENGAGEMENT',
      description: '已退订的用户',
      color: '#6b7280',
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 90),
      updatedAt: new Date(Date.now() - 86400000 * 90),
    },
    {
      id: uuidv4(),
      name: '退信用户',
      code: 'bounced',
      type: 'SYSTEM',
      category: 'ENGAGEMENT',
      description: '邮件被退信的用户',
      color: '#dc2626',
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 90),
      updatedAt: new Date(Date.now() - 86400000 * 90),
    },
    {
      id: uuidv4(),
      name: '科技爱好者',
      code: 'tech_enthusiast',
      type: 'MANUAL',
      category: 'PREFERENCE',
      description: '对科技产品感兴趣的用户',
      color: '#06b6d4',
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 60),
      updatedAt: new Date(Date.now() - 86400000 * 60),
    },
    {
      id: uuidv4(),
      name: 'VIP会员',
      code: 'vip_member',
      type: 'MANUAL',
      category: 'PURCHASE',
      description: '付费VIP会员用户',
      color: '#eab308',
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 60),
      updatedAt: new Date(Date.now() - 86400000 * 60),
    },
    {
      id: uuidv4(),
      name: '潜在客户',
      code: 'prospect',
      type: 'MANUAL',
      category: 'DEMOGRAPHIC',
      description: '尚未购买的潜在客户',
      color: '#ec4899',
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 60),
      updatedAt: new Date(Date.now() - 86400000 * 60),
    }
  );
  
  profileAttributes.push(
    {
      id: uuidv4(),
      name: '年龄段',
      code: 'age_group',
      type: 'ENUM',
      isRequired: false,
      isPublic: true,
      enumValues: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
      description: '用户的年龄段',
      createdAt: new Date(Date.now() - 86400000 * 90),
    },
    {
      id: uuidv4(),
      name: '性别',
      code: 'gender',
      type: 'ENUM',
      isRequired: false,
      isPublic: true,
      enumValues: ['男', '女', '保密'],
      description: '用户的性别',
      createdAt: new Date(Date.now() - 86400000 * 90),
    },
    {
      id: uuidv4(),
      name: '职业',
      code: 'occupation',
      type: 'STRING',
      isRequired: false,
      isPublic: true,
      description: '用户的职业',
      createdAt: new Date(Date.now() - 86400000 * 90),
    },
    {
      id: uuidv4(),
      name: '月收入',
      code: 'income_range',
      type: 'ENUM',
      isRequired: false,
      isPublic: false,
      enumValues: ['10k以下', '10k-20k', '20k-30k', '30k-50k', '50k以上'],
      description: '用户的月收入范围',
      createdAt: new Date(Date.now() - 86400000 * 90),
    },
    {
      id: uuidv4(),
      name: '兴趣标签',
      code: 'interests',
      type: 'ARRAY',
      isRequired: false,
      isPublic: true,
      description: '用户的兴趣爱好标签',
      createdAt: new Date(Date.now() - 86400000 * 90),
    },
    {
      id: uuidv4(),
      name: '首次购买日期',
      code: 'first_purchase_date',
      type: 'DATE',
      isRequired: false,
      isPublic: true,
      description: '用户的首次购买日期',
      createdAt: new Date(Date.now() - 86400000 * 90),
    },
    {
      id: uuidv4(),
      name: '累计消费金额',
      code: 'total_spent',
      type: 'NUMBER',
      isRequired: false,
      isPublic: true,
      description: '用户的累计消费金额',
      createdAt: new Date(Date.now() - 86400000 * 90),
    },
    {
      id: uuidv4(),
      name: '是否会员',
      code: 'is_member',
      type: 'BOOLEAN',
      isRequired: false,
      isPublic: true,
      description: '用户是否是会员',
      createdAt: new Date(Date.now() - 86400000 * 90),
    }
  );
  
  for (let i = 0; i < 10; i++) {
    const memberId = uuidv4();
    const isSubscribed = i < 8;
    const totalSent = Math.floor(Math.random() * 30) + 10;
    const totalOpened = Math.floor(totalSent * (Math.random() * 0.8 + 0.1));
    const totalClicks = Math.floor(totalOpened * (Math.random() * 0.5 + 0.05));
    const openRate = totalSent > 0 ? totalOpened / totalSent : 0;
    
    const member: AudienceMember = {
      id: memberId,
      audienceId: audience1.id,
      email: `user${i + 1}@example.com`,
      name: sampleNames[i % sampleNames.length],
      firstName: sampleNames[i % sampleNames.length].charAt(0),
      lastName: sampleNames[i % sampleNames.length].slice(1),
      phone: `1380000${(i + 1).toString().padStart(4, '0')}`,
      company: sampleCompanies[i % sampleCompanies.length],
      position: ['产品经理', '开发工程师', '市场专员', '运营经理', '销售代表'][i % 5],
      country: sampleCountries[i % sampleCountries.length],
      city: sampleCities[i % sampleCities.length],
      isSubscribed,
      totalOpens: totalOpened,
      totalClicks,
      totalSent,
      totalDelivered: Math.floor(totalSent * 0.96),
      totalBounced: i === 8 ? 1 : 0,
      lastOpenAt: totalOpened > 0 ? new Date(Date.now() - 86400000 * Math.floor(Math.random() * 30)) : undefined,
      lastClickAt: totalClicks > 0 ? new Date(Date.now() - 86400000 * Math.floor(Math.random() * 60)) : undefined,
      subscribedAt: new Date(Date.now() - 86400000 * (i * 10 + 5)),
      createdAt: new Date(Date.now() - 86400000 * (i * 10 + 5)),
      updatedAt: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 7)),
    };
    
    audienceMembers.push(member);
    
    if (isSubscribed && totalOpened > 0) {
      const activeTag = tags.find(t => t.code === 'active_subscriber');
      if (activeTag) {
        memberTags.push({
          id: uuidv4(),
          memberId,
          tagId: activeTag.id,
          assignedAt: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 30)),
        });
      }
    }
    
    if (!isSubscribed) {
      const unsubscribedTag = tags.find(t => t.code === 'unsubscribed');
      if (unsubscribedTag) {
        memberTags.push({
          id: uuidv4(),
          memberId,
          tagId: unsubscribedTag.id,
          assignedAt: new Date(Date.now() - 86400000 * 5),
        });
      }
    }
    
    if (i === 8) {
      const bouncedTag = tags.find(t => t.code === 'bounced');
      if (bouncedTag) {
        memberTags.push({
          id: uuidv4(),
          memberId,
          tagId: bouncedTag.id,
          assignedAt: new Date(Date.now() - 86400000 * 2),
        });
      }
    }
    
    if (openRate > 0.6) {
      const highEngagerTag = tags.find(t => t.code === 'high_engager');
      if (highEngagerTag) {
        memberTags.push({
          id: uuidv4(),
          memberId,
          tagId: highEngagerTag.id,
          assignedAt: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 60)),
        });
      }
    }
    
    if (totalClicks > 0) {
      const clickerTag = tags.find(t => t.code === 'clicker');
      if (clickerTag) {
        memberTags.push({
          id: uuidv4(),
          memberId,
          tagId: clickerTag.id,
          assignedAt: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 45)),
        });
      }
    }
    
    if (i === 0 || i === 3 || i === 5) {
      const vipTag = tags.find(t => t.code === 'vip_member');
      if (vipTag) {
        memberTags.push({
          id: uuidv4(),
          memberId,
          tagId: vipTag.id,
          assignedAt: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 120)),
        });
      }
    }
    
    if (i === 1 || i === 4 || i === 7) {
      const techTag = tags.find(t => t.code === 'tech_enthusiast');
      if (techTag) {
        memberTags.push({
          id: uuidv4(),
          memberId,
          tagId: techTag.id,
          assignedAt: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 90)),
        });
      }
    }
    
    const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    const genders = ['男', '女', '保密'];
    const occupations = ['产品经理', '软件开发', '市场营销', '运营管理', '销售', '设计', '数据分析', '财务'];
    const incomeRanges = ['10k以下', '10k-20k', '20k-30k', '30k-50k', '50k以上'];
    const interests = ['科技数码', '金融理财', '健康养生', '旅游出行', '美食烹饪', '运动健身', '读书学习', '音乐电影'];
    
    const ageAttr = profileAttributes.find(a => a.code === 'age_group');
    if (ageAttr) {
      memberAttributes.push({
        id: uuidv4(),
        memberId,
        attributeId: ageAttr.id,
        value: ageGroups[i % ageGroups.length],
        lastUpdatedAt: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 30)),
      });
    }
    
    const genderAttr = profileAttributes.find(a => a.code === 'gender');
    if (genderAttr) {
      memberAttributes.push({
        id: uuidv4(),
        memberId,
        attributeId: genderAttr.id,
        value: genders[i % genders.length],
        lastUpdatedAt: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 30)),
      });
    }
    
    const occupationAttr = profileAttributes.find(a => a.code === 'occupation');
    if (occupationAttr) {
      memberAttributes.push({
        id: uuidv4(),
        memberId,
        attributeId: occupationAttr.id,
        value: occupations[i % occupations.length],
        lastUpdatedAt: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 60)),
      });
    }
    
    const incomeAttr = profileAttributes.find(a => a.code === 'income_range');
    if (incomeAttr) {
      memberAttributes.push({
        id: uuidv4(),
        memberId,
        attributeId: incomeAttr.id,
        value: incomeRanges[i % incomeRanges.length],
        lastUpdatedAt: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 90)),
      });
    }
    
    const interestsAttr = profileAttributes.find(a => a.code === 'interests');
    if (interestsAttr) {
      const userInterests = interests.slice(i % interests.length, (i % interests.length) + 3);
      memberAttributes.push({
        id: uuidv4(),
        memberId,
        attributeId: interestsAttr.id,
        value: JSON.stringify(userInterests),
        lastUpdatedAt: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 45)),
      });
    }
    
    const totalSpentAttr = profileAttributes.find(a => a.code === 'total_spent');
    if (totalSpentAttr) {
      const spent = (i + 1) * 500 + Math.floor(Math.random() * 2000);
      memberAttributes.push({
        id: uuidv4(),
        memberId,
        attributeId: totalSpentAttr.id,
        value: spent.toString(),
        lastUpdatedAt: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 15)),
      });
    }
    
    const isMemberAttr = profileAttributes.find(a => a.code === 'is_member');
    if (isMemberAttr) {
      const isMember = i === 0 || i === 3 || i === 5;
      memberAttributes.push({
        id: uuidv4(),
        memberId,
        attributeId: isMemberAttr.id,
        value: isMember.toString(),
        lastUpdatedAt: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 60)),
      });
    }
    
    for (let j = 0; j < Math.floor(Math.random() * 5) + 1; j++) {
      const eventTypes: Array<'EMAIL_SENT' | 'EMAIL_OPENED' | 'EMAIL_CLICKED' | 'SUBSCRIBED'> = 
        ['EMAIL_SENT', 'EMAIL_OPENED', 'EMAIL_CLICKED', 'SUBSCRIBED'];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      activityEvents.push({
        id: uuidv4(),
        memberId,
        eventType,
        eventData: {
          campaignName: campaigns[Math.floor(Math.random() * campaigns.length)]?.name || '系统活动',
          subject: '促销邮件',
        },
        campaignId: campaigns[Math.floor(Math.random() * campaigns.length)]?.id,
        createdAt: new Date(Date.now() - 86400000 * (j + 1) * Math.floor(Math.random() * 30)),
      });
    }
  }
  
  campaigns.push(
    {
      id: uuidv4(),
      name: '2024春季促销活动',
      description: '春季新品上市促销邮件',
      status: 'SENDING',
      subject: '春季新品上市，限时8折优惠！',
      templateId: templates[0].id,
      audienceId: audience1.id,
      startedAt: new Date(Date.now() - 3600000),
      creatorId: users[0].id,
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 3600000),
      stats: {
        totalSent: 1250,
        totalDelivered: 1200,
        totalOpened: 450,
        totalClicked: 120,
      },
    },
    {
      id: uuidv4(),
      name: '新用户欢迎邮件序列',
      description: '新用户注册后的自动欢迎邮件',
      status: 'COMPLETED',
      subject: '欢迎加入我们！',
      templateId: templates[1].id,
      audienceId: audience2.id,
      startedAt: new Date(Date.now() - 86400000 * 2),
      completedAt: new Date(Date.now() - 86400000),
      creatorId: users[1].id,
      createdAt: new Date(Date.now() - 86400000 * 3),
      updatedAt: new Date(Date.now() - 86400000),
      stats: {
        totalSent: 800,
        totalDelivered: 780,
        totalOpened: 520,
        totalClicked: 210,
      },
    },
    {
      id: uuidv4(),
      name: '产品更新通知',
      description: '告知用户产品功能更新',
      status: 'PENDING_REVIEW',
      subject: '新功能上线通知',
      templateId: templates[2].id,
      audienceId: audience3.id,
      creatorId: users[0].id,
      createdAt: new Date(Date.now() - 43200000),
      updatedAt: new Date(Date.now() - 43200000),
      stats: {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
      },
    },
    {
      id: uuidv4(),
      name: '会员专属优惠活动',
      description: '针对VIP会员的专属折扣',
      status: 'DRAFT',
      templateId: undefined,
      audienceId: undefined,
      creatorId: users[1].id,
      createdAt: new Date(Date.now() - 21600000),
      updatedAt: new Date(Date.now() - 21600000),
      stats: {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
      },
    }
  );
  
  alerts.push(
    {
      id: uuidv4(),
      type: 'USER_UNSUBSCRIBE',
      severity: 'MEDIUM',
      message: '用户 user9@example.com 已退订',
      isAcknowledged: false,
      createdAt: new Date(),
    },
    {
      id: uuidv4(),
      type: 'BOUNCE_HARD',
      severity: 'HIGH',
      message: '邮件退信 [hard]: invalid@example.com',
      isAcknowledged: false,
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: uuidv4(),
      type: 'LOW_DELIVERY_RATE',
      severity: 'MEDIUM',
      message: '活动 "春季促销" 送达率低于80%',
      isAcknowledged: true,
      createdAt: new Date(Date.now() - 7200000),
    }
  );
  
  console.log('Mock data initialized');
}

initMockData();

function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '未提供认证令牌',
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; name: string };
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: '无效的认证令牌',
    });
  }
}

app.get('/health', async (_req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    env: 'development',
    port: PORT,
    database: 'mock',
    redis: 'mock',
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: '请填写所有必填字段',
      });
    }
    
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '该邮箱已被注册',
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user: User = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      role: role || 'VIEWER',
      isActive: true,
      createdAt: new Date(),
    };
    
    users.push(user);
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: '注册失败',
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '请提供邮箱和密码',
      });
    }
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '邮箱或密码错误',
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: '账户已被禁用',
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: '邮箱或密码错误',
      });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    user.lastLoginAt = new Date();
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: '登录失败',
    });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const userData = (req as any).user;
  const user = users.find(u => u.id === userData.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: '用户不存在',
    });
  }
  
  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    },
  });
});

app.get('/api/campaigns', authenticateToken, async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;
  
  let filteredCampaigns = [...campaigns];
  
  if (status && typeof status === 'string') {
    filteredCampaigns = filteredCampaigns.filter(c => c.status === status);
  }
  
  if (search && typeof search === 'string') {
    const searchLower = search.toLowerCase();
    filteredCampaigns = filteredCampaigns.filter(c => 
      c.name.toLowerCase().includes(searchLower) ||
      (c.description && c.description.toLowerCase().includes(searchLower))
    );
  }
  
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const start = (pageNum - 1) * limitNum;
  const paginatedCampaigns = filteredCampaigns.slice(start, start + limitNum);
  
  const campaignsWithDetails = paginatedCampaigns.map(campaign => ({
    ...campaign,
    creator: users.find(u => u.id === campaign.creatorId) ? {
      id: users.find(u => u.id === campaign.creatorId)!.id,
      name: users.find(u => u.id === campaign.creatorId)!.name,
      email: users.find(u => u.id === campaign.creatorId)!.email,
    } : undefined,
    template: campaign.templateId ? templates.find(t => t.id === campaign.templateId) ? {
      id: templates.find(t => t.id === campaign.templateId)!.id,
      name: templates.find(t => t.id === campaign.templateId)!.name,
    } : undefined : undefined,
    audience: campaign.audienceId ? audiences.find(a => a.id === campaign.audienceId) ? {
      id: audiences.find(a => a.id === campaign.audienceId)!.id,
      name: audiences.find(a => a.id === campaign.audienceId)!.name,
      totalCount: audiences.find(a => a.id === campaign.audienceId)!.totalCount,
    } : undefined : undefined,
    reviews: [],
    _count: { sendBatches: Math.floor(Math.random() * 3), journeys: Math.floor(Math.random() * 2) },
  }));
  
  res.json({
    success: true,
    data: {
      campaigns: campaignsWithDetails,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredCampaigns.length,
        pages: Math.ceil(filteredCampaigns.length / limitNum),
      },
    },
  });
});

app.get('/api/campaigns/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const campaign = campaigns.find(c => c.id === id);
  
  if (!campaign) {
    return res.status(404).json({
      success: false,
      error: '活动不存在',
    });
  }
  
  const campaignWithDetails = {
    ...campaign,
    creator: users.find(u => u.id === campaign.creatorId) ? {
      id: users.find(u => u.id === campaign.creatorId)!.id,
      name: users.find(u => u.id === campaign.creatorId)!.name,
      email: users.find(u => u.id === campaign.creatorId)!.email,
    } : undefined,
    template: campaign.templateId ? templates.find(t => t.id === campaign.templateId) : undefined,
    audience: campaign.audienceId ? {
      ...audiences.find(a => a.id === campaign.audienceId),
      _count: { members: audienceMembers.filter(m => m.audienceId === campaign.audienceId).length },
    } : undefined,
    reviews: [],
    sendBatches: [],
    journeys: [],
    auditLogs: [],
  };
  
  res.json({
    success: true,
    data: campaignWithDetails,
  });
});

app.post('/api/campaigns', authenticateToken, async (req, res) => {
  const user = (req as any).user;
  const { name, description, templateId, audienceId, subject, scheduledAt } = req.body;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      error: '活动名称不能为空',
    });
  }
  
  const campaign: Campaign = {
    id: uuidv4(),
    name,
    description,
    status: 'DRAFT',
    subject,
    templateId,
    audienceId,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    creatorId: user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    stats: {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
    },
  };
  
  campaigns.push(campaign);
  
  res.status(201).json({
    success: true,
    data: campaign,
  });
});

app.post('/api/campaigns/:id/submit-review', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const campaign = campaigns.find(c => c.id === id);
  
  if (!campaign) {
    return res.status(404).json({
      success: false,
      error: '活动不存在',
    });
  }
  
  if (campaign.status !== 'DRAFT') {
    return res.status(400).json({
      success: false,
      error: `活动状态为 ${campaign.status}，无法提交审核`,
    });
  }
  
  campaign.status = 'PENDING_REVIEW';
  campaign.updatedAt = new Date();
  
  res.json({
    success: true,
    data: campaign,
  });
});

app.get('/api/templates', authenticateToken, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const start = (pageNum - 1) * limitNum;
  const paginatedTemplates = templates.slice(start, start + limitNum);
  
  const templatesWithCount = paginatedTemplates.map(t => ({
    ...t,
    _count: { campaigns: campaigns.filter(c => c.templateId === t.id).length },
    extractedPlaceholders: extractPlaceholders(t.htmlContent),
  }));
  
  res.json({
    success: true,
    data: {
      templates: templatesWithCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: templates.length,
        pages: Math.ceil(templates.length / limitNum),
      },
    },
  });
});

function extractPlaceholders(content: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const placeholders: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (!placeholders.includes(match[1].trim())) {
      placeholders.push(match[1].trim());
    }
  }
  return placeholders;
}

app.get('/api/templates/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const template = templates.find(t => t.id === id);
  
  if (!template) {
    return res.status(404).json({
      success: false,
      error: '模板不存在',
    });
  }
  
  res.json({
    success: true,
    data: {
      ...template,
      extractedPlaceholders: extractPlaceholders(template.htmlContent),
    },
  });
});

app.post('/api/templates', authenticateToken, async (req, res) => {
  const user = (req as any).user;
  const { name, description, category, subject, htmlContent, textContent, isPublic } = req.body;
  
  if (!name || !subject || !htmlContent) {
    return res.status(400).json({
      success: false,
      error: '请填写所有必填字段',
    });
  }
  
  const template: Template = {
    id: uuidv4(),
    name,
    description,
    category,
    subject,
    htmlContent,
    textContent,
    isActive: true,
    isPublic: isPublic || false,
    creatorId: user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  templates.push(template);
  
  res.status(201).json({
    success: true,
    data: {
      ...template,
      extractedPlaceholders: extractPlaceholders(template.htmlContent),
    },
  });
});

app.get('/api/audiences', authenticateToken, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const start = (pageNum - 1) * limitNum;
  const paginatedAudiences = audiences.slice(start, start + limitNum);
  
  const audiencesWithCount = paginatedAudiences.map(a => ({
    ...a,
    _count: {
      members: audienceMembers.filter(m => m.audienceId === a.id).length,
      campaigns: campaigns.filter(c => c.audienceId === a.id).length,
    },
  }));
  
  res.json({
    success: true,
    data: {
      audiences: audiencesWithCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: audiences.length,
        pages: Math.ceil(audiences.length / limitNum),
      },
    },
  });
});

app.get('/api/audiences/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const audience = audiences.find(a => a.id === id);
  
  if (!audience) {
    return res.status(404).json({
      success: false,
      error: '受众不存在',
    });
  }
  
  res.json({
    success: true,
    data: {
      ...audience,
      campaigns: campaigns.filter(c => c.audienceId === id).map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
      })),
      _count: {
        members: audienceMembers.filter(m => m.audienceId === id).length,
        campaigns: campaigns.filter(c => c.audienceId === id).length,
      },
    },
  });
});

app.get('/api/audiences/:id/members', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  
  const members = audienceMembers.filter(m => m.audienceId === id);
  const start = (pageNum - 1) * limitNum;
  const paginatedMembers = members.slice(start, start + limitNum);
  
  const membersWithCount = paginatedMembers.map(m => ({
    ...m,
    _count: {
      sendLogs: m.totalSent,
      clickLogs: m.totalClicks,
    },
  }));
  
  res.json({
    success: true,
    data: {
      members: membersWithCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: members.length,
        pages: Math.ceil(members.length / limitNum),
      },
    },
  });
});

app.get('/api/admin/dashboard', authenticateToken, async (req, res) => {
  const totalSent = campaigns.reduce((sum, c) => sum + c.stats.totalSent, 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + c.stats.totalOpened, 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + c.stats.totalClicked, 0);
  const totalDelivered = Math.floor(totalSent * 0.96);
  
  const recentCampaigns = campaigns.slice(0, 5).map(c => ({
    ...c,
    creator: { name: users.find(u => u.id === c.creatorId)?.name || '未知' },
    _count: { sendBatches: Math.floor(Math.random() * 3) },
  }));
  
  const unacknowledgedAlerts = alerts.filter(a => !a.isAcknowledged);
  
  res.json({
    success: true,
    data: {
      summary: {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'SENDING' || c.status === 'PENDING_SEND').length,
        totalAudiences: audiences.length,
        totalMembers: audiences.reduce((sum, a) => sum + a.totalCount, 0),
        totalTemplates: templates.length,
      },
      stats: {
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
        openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
        clickRate: totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0,
      },
      recentAlerts: unacknowledgedAlerts,
      recentCampaigns,
    },
  });
});

app.get('/api/admin/alerts', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    data: {
      alerts,
      pagination: {
        page: 1,
        limit: 50,
        total: alerts.length,
        pages: 1,
      },
    },
  });
});

app.post('/api/admin/alerts/:id/acknowledge', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const alert = alerts.find(a => a.id === id);
  
  if (!alert) {
    return res.status(404).json({
      success: false,
      error: '告警不存在',
    });
  }
  
  alert.isAcknowledged = true;
  
  res.json({
    success: true,
    data: alert,
  });
});

app.get('/api/track/open/:trackingId.gif', async (req, res) => {
  const { trackingId } = req.params;
  console.log(`Tracked open: ${trackingId}`);
  
  const transparentGif = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
    'base64'
  );
  
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.send(transparentGif);
});

app.get('/api/track/click/:trackingId/:linkIndex', async (req, res) => {
  const { trackingId, linkIndex } = req.params;
  console.log(`Tracked click: ${trackingId}, linkIndex: ${linkIndex}`);
  
  const demoUrls = [
    'https://example.com/promo',
    'https://example.com/products',
    'https://example.com/features',
    'https://example.com/about',
  ];
  
  const redirectUrl = demoUrls[parseInt(linkIndex, 10) % demoUrls.length] || 'https://example.com';
  res.redirect(redirectUrl);
});

app.get('/api/track/unsubscribe/:trackingId', async (req, res) => {
  const { trackingId } = req.params;
  console.log(`Tracked unsubscribe: ${trackingId}`);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>退订确认</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
        .success { color: #2e7d32; background: #e8f5e9; padding: 20px; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="success">
        <h1>退订成功</h1>
        <p>您已成功退订我们的邮件列表。</p>
        <p>如果您改变主意，可以随时重新订阅。</p>
      </div>
    </body>
    </html>
  `;
  
  res.send(html);
});

app.get('/api/info', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Email Marketing System API (Mock Mode)',
      version: '1.0.0',
      environment: 'development-mock',
      features: [
        'Marketing Automation Engine',
        'Template Dynamic Engine',
        'Analytics Tracker Engine',
        'Deliverability Optimization Engine',
      ],
      engines: {
        automation: {
          name: 'Marketing-Automation 自动化引擎',
          features: [
            '营销旅程编排',
            'A/B分支自动执行',
            '实时进度展示',
          ],
        },
        template: {
          name: 'Template-Dynamic 动态渲染引擎',
          features: [
            '实时替换模板占位符',
            '用户画像数据渲染',
            '追踪链接注入',
            '渲染依据说明',
          ],
        },
        tracker: {
          name: 'Analytics-Tracker 点击追踪引擎',
          features: [
            '点击动作捕获',
            '状态同步至数据看板',
            '送达率/退信率/点击率统计',
            '退订自动处理',
            '风险标记',
          ],
        },
        deliverability: {
          name: 'Deliverability-Opt 发送优化引擎',
          features: [
            '退信分析',
            '发件人声誉监控',
            '用户活跃度评分',
            '发送速率控制',
            '最佳发送时间推荐',
          ],
        },
      },
      coreWorkflows: {
        '受众筛选 → 任务批次生成': '运营在前端筛选受众，后端拉取用户画像并生成任务批次，状态置为"待发送"',
        '自动化引擎 → A/B分支': '利用"自动化引擎"编排营销旅程，后端根据用户是否打开邮件自动执行A/B分支，前端实时展示旅程执行进度',
        '动态渲染 → 点击追踪': '后端按画像实时替换模板占位符，执行动态渲染，发送后通过"追踪引擎"捕获点击动作，状态同步至数据看板',
        '实时统计 → 退订处理': '后端实时记录送达率、退信率、点击率，用户在前端点击退订，后端自动封禁对应权限并在前端标记风险',
        '多级审核 → 永久存档': '邮件内容支持多级审核，审核历史、发送轨迹、点击日志永久存档',
        'ROI报表 → 全量审计': '后端定期生成营销ROI报表，所有营销活动、发送记录、用户反馈都能全量审计',
      },
      multiEnv: {
        ports: {
          '后端开发': 47291,
          '前端开发': 47292,
          '预览后端': 47296,
          '预览前端': 47297,
          '测试后端': 47298,
          '测试前端': 47299,
          'Redis': 47293,
          'PostgreSQL': 47294,
          'Mock邮件服务': 47295,
        },
        isolation: '各环境独立运行，端口互不冲突',
      },
      mockData: {
        users: users.length,
        templates: templates.length,
        audiences: audiences.length,
        audienceMembers: audienceMembers.length,
        campaigns: campaigns.length,
        alerts: alerts.length,
        tags: tags.length,
        profileAttributes: profileAttributes.length,
        activityEvents: activityEvents.length,
      },
      defaultCredentials: {
        email: 'admin@example.com',
        password: 'Admin@2024',
        note: '使用此账户登录系统',
      },
    },
  });
});

app.get('/api/tags', authenticateToken, async (req, res) => {
  const { type, category, search, page = 1, limit = 50 } = req.query;
  
  let filteredTags = [...tags];
  
  if (type && typeof type === 'string') {
    filteredTags = filteredTags.filter(t => t.type === type);
  }
  
  if (category && typeof category === 'string') {
    filteredTags = filteredTags.filter(t => t.category === category);
  }
  
  if (search && typeof search === 'string') {
    const searchLower = search.toLowerCase();
    filteredTags = filteredTags.filter(t => 
      t.name.toLowerCase().includes(searchLower) ||
      t.code.toLowerCase().includes(searchLower) ||
      (t.description && t.description.toLowerCase().includes(searchLower))
    );
  }
  
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const start = (pageNum - 1) * limitNum;
  const paginatedTags = filteredTags.slice(start, start + limitNum);
  
  const tagsWithCount = paginatedTags.map(tag => ({
    ...tag,
    _count: {
      members: memberTags.filter(mt => mt.tagId === tag.id).length,
    },
  }));
  
  res.json({
    success: true,
    data: {
      tags: tagsWithCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredTags.length,
        pages: Math.ceil(filteredTags.length / limitNum),
      },
    },
  });
});

app.get('/api/tags/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const tag = tags.find(t => t.id === id);
  
  if (!tag) {
    return res.status(404).json({
      success: false,
      error: '标签不存在',
    });
  }
  
  const tagMembers = memberTags.filter(mt => mt.tagId === tag.id);
  const members = audienceMembers.filter(m => tagMembers.some(tm => tm.memberId === m.id));
  
  res.json({
    success: true,
    data: {
      ...tag,
      _count: {
        members: tagMembers.length,
      },
      recentMembers: members.slice(0, 10).map(m => ({
        id: m.id,
        email: m.email,
        name: m.name,
        assignedAt: tagMembers.find(tm => tm.memberId === m.id)?.assignedAt,
      })),
    },
  });
});

app.post('/api/tags', authenticateToken, async (req, res) => {
  const { name, code, category, description, color } = req.body;
  
  if (!name || !code) {
    return res.status(400).json({
      success: false,
      error: '标签名称和编码不能为空',
    });
  }
  
  const existingTag = tags.find(t => t.code === code);
  if (existingTag) {
    return res.status(400).json({
      success: false,
      error: '标签编码已存在',
    });
  }
  
  const tag: Tag = {
    id: uuidv4(),
    name,
    code,
    type: 'MANUAL',
    category: category || 'CUSTOM',
    description,
    color: color || '#6b7280',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  tags.push(tag);
  
  res.status(201).json({
    success: true,
    data: {
      ...tag,
      _count: { members: 0 },
    },
  });
});

app.get('/api/profile-attributes', authenticateToken, async (_req, res) => {
  const attributesWithCount = profileAttributes.map(attr => ({
    ...attr,
    _count: {
      members: memberAttributes.filter(ma => ma.attributeId === attr.id).length,
    },
  }));
  
  res.json({
    success: true,
    data: {
      attributes: attributesWithCount,
    },
  });
});

app.get('/api/members/:id/profile', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const member = audienceMembers.find(m => m.id === id);
  
  if (!member) {
    return res.status(404).json({
      success: false,
      error: '用户不存在',
    });
  }
  
  const memberTagIds = memberTags.filter(mt => mt.memberId === id).map(mt => mt.tagId);
  const memberTagsList = tags.filter(t => memberTagIds.includes(t.id)).map(tag => {
    const assignment = memberTags.find(mt => mt.memberId === id && mt.tagId === tag.id);
    return {
      ...tag,
      assignedAt: assignment?.assignedAt,
    };
  });
  
  const memberAttrs = memberAttributes.filter(ma => ma.memberId === id);
  const attributes: Record<string, unknown> = {};
  memberAttrs.forEach(ma => {
    const attrDef = profileAttributes.find(a => a.id === ma.attributeId);
    if (attrDef) {
      try {
        if (attrDef.type === 'ARRAY') {
          attributes[attrDef.code] = JSON.parse(ma.value);
        } else if (attrDef.type === 'NUMBER') {
          attributes[attrDef.code] = parseFloat(ma.value);
        } else if (attrDef.type === 'BOOLEAN') {
          attributes[attrDef.code] = ma.value === 'true';
        } else {
          attributes[attrDef.code] = ma.value;
        }
      } catch {
        attributes[attrDef.code] = ma.value;
      }
    }
  });
  
  const openRate = member.totalSent > 0 ? (member.totalOpens / member.totalSent) * 100 : 0;
  const clickRate = member.totalSent > 0 ? (member.totalClicks / member.totalSent) * 100 : 0;
  const clickThroughRate = member.totalOpens > 0 ? (member.totalClicks / member.totalOpens) * 100 : 0;
  
  let engagementScore = 0;
  if (member.isSubscribed) {
    engagementScore += 20;
  }
  engagementScore += Math.min(openRate * 0.4, 40);
  engagementScore += Math.min(clickRate * 0.4, 40);
  
  let engagementCategory: 'high' | 'medium' | 'low' | 'inactive' = 'inactive';
  if (engagementScore >= 70) engagementCategory = 'high';
  else if (engagementScore >= 40) engagementCategory = 'medium';
  else if (engagementScore > 0) engagementCategory = 'low';
  
  const memberActivityEvents = activityEvents
    .filter(e => e.memberId === id)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 20);
  
  const memberAudiences = audiences.filter(a => 
    audienceMembers.some(m => m.audienceId === a.id && m.id === id)
  );
  
  const profileDetail = {
    id: member.id,
    email: member.email,
    name: member.name,
    firstName: member.firstName,
    lastName: member.lastName,
    phone: member.phone,
    company: member.company,
    position: member.position,
    country: member.country,
    city: member.city,
    isSubscribed: member.isSubscribed,
    subscribedAt: member.subscribedAt,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
    
    tags: memberTagsList,
    
    attributes,
    
    engagement: {
      totalSent: member.totalSent,
      totalDelivered: member.totalDelivered,
      totalOpened: member.totalOpens,
      totalClicked: member.totalClicks,
      totalBounced: member.totalBounced,
      openRate,
      clickRate,
      clickThroughRate,
      engagementScore: Math.round(engagementScore),
      engagementCategory,
      lastOpenAt: member.lastOpenAt,
      lastClickAt: member.lastClickAt,
      daysSinceLastActivity: member.lastOpenAt 
        ? Math.floor((Date.now() - member.lastOpenAt.getTime()) / 86400000)
        : null,
      daysSinceSubscription: Math.floor((Date.now() - member.subscribedAt.getTime()) / 86400000),
    },
    
    audiences: memberAudiences.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
    })),
    
    activityTimeline: memberActivityEvents.map(e => ({
      id: e.id,
      type: e.eventType,
      eventData: e.eventData,
      campaignId: e.campaignId,
      createdAt: e.createdAt,
    })),
    
    explanation: `
用户画像计算说明：
1. 活跃度评分 (${Math.round(engagementScore)}分):
   - 订阅状态: ${member.isSubscribed ? '已订阅 (+20分)' : '未订阅 (+0分)'}
   - 打开率贡献: ${Math.min(openRate * 0.4, 40).toFixed(1)}分 (打开率: ${openRate.toFixed(1)}%)
   - 点击率贡献: ${Math.min(clickRate * 0.4, 40).toFixed(1)}分 (点击率: ${clickRate.toFixed(1)}%)

2. 活跃度分类: ${engagementCategory}
   - high (>=70分): 高活跃用户
   - medium (40-69分): 中等活跃用户
   - low (1-39分): 低活跃用户
   - inactive (0分): 非活跃用户

3. 标签说明:
   - SYSTEM标签: 系统自动计算的标签
   - MANUAL标签: 手动分配的标签
   - AUTOMATIC标签: 基于规则自动分配的标签
    `.trim(),
  };
  
  res.json({
    success: true,
    data: profileDetail,
  });
});

app.post('/api/members/:id/tags/:tagId', authenticateToken, async (req, res) => {
  const { id, tagId } = req.params;
  const user = (req as any).user;
  
  const member = audienceMembers.find(m => m.id === id);
  if (!member) {
    return res.status(404).json({
      success: false,
      error: '用户不存在',
    });
  }
  
  const tag = tags.find(t => t.id === tagId);
  if (!tag) {
    return res.status(404).json({
      success: false,
      error: '标签不存在',
    });
  }
  
  const existingTag = memberTags.find(mt => mt.memberId === id && mt.tagId === tagId);
  if (existingTag) {
    return res.status(400).json({
      success: false,
      error: '用户已拥有此标签',
    });
  }
  
  const memberTag: MemberTag = {
    id: uuidv4(),
    memberId: id,
    tagId,
    assignedAt: new Date(),
    assignedBy: user.id,
  };
  
  memberTags.push(memberTag);
  
  activityEvents.push({
    id: uuidv4(),
    memberId: id,
    eventType: 'TAG_ADDED',
    eventData: {
      tagId,
      tagName: tag.name,
      tagCode: tag.code,
    },
    createdAt: new Date(),
  });
  
  res.json({
    success: true,
    data: memberTag,
  });
});

app.delete('/api/members/:id/tags/:tagId', authenticateToken, async (req, res) => {
  const { id, tagId } = req.params;
  
  const memberTagIndex = memberTags.findIndex(mt => mt.memberId === id && mt.tagId === tagId);
  if (memberTagIndex === -1) {
    return res.status(404).json({
      success: false,
      error: '用户没有此标签',
    });
  }
  
  const tag = tags.find(t => t.id === tagId);
  memberTags.splice(memberTagIndex, 1);
  
  activityEvents.push({
    id: uuidv4(),
    memberId: id,
    eventType: 'TAG_REMOVED',
    eventData: {
      tagId,
      tagName: tag?.name,
      tagCode: tag?.code,
    },
    createdAt: new Date(),
  });
  
  res.json({
    success: true,
    data: { message: '标签已移除' },
  });
});

app.post('/api/segments/evaluate', authenticateToken, async (req, res) => {
  const { rules, operator = 'AND' } = req.body;
  
  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    return res.status(400).json({
      success: false,
      error: '请提供筛选规则',
    });
  }
  
  const matchedMemberIds: string[] = [];
  const ruleBreakdown: Array<{ rule: string; matched: number; percentage: number }> = [];
  const memberRuleMatches: Record<string, boolean[]> = {};
  
  for (const member of audienceMembers) {
    memberRuleMatches[member.id] = [];
  }
  
  for (const rule of rules) {
    let matchedCount = 0;
    let ruleDescription = '';
    
    switch (rule.type) {
      case 'tag': {
        const tagId = rule.tagId;
        const tag = tags.find(t => t.id === tagId);
        const tagMemberIds = memberTags.filter(mt => mt.tagId === tagId).map(mt => mt.memberId);
        
        ruleDescription = `标签: ${tag?.name || rule.tagId}`;
        
        for (const member of audienceMembers) {
          const matches = tagMemberIds.includes(member.id);
          memberRuleMatches[member.id].push(matches);
          if (matches) matchedCount++;
        }
        break;
      }
      
      case 'engagement': {
        const field = rule.field;
        const op = rule.operator;
        const value = rule.value;
        
        ruleDescription = `互动指标: ${field} ${op} ${value}`;
        
        for (const member of audienceMembers) {
          let memberValue = 0;
          switch (field) {
            case 'totalSent': memberValue = member.totalSent; break;
            case 'totalOpened': memberValue = member.totalOpens; break;
            case 'totalClicked': memberValue = member.totalClicks; break;
            case 'totalBounced': memberValue = member.totalBounced; break;
            case 'openRate': memberValue = member.totalSent > 0 ? (member.totalOpens / member.totalSent) * 100 : 0; break;
            case 'clickRate': memberValue = member.totalSent > 0 ? (member.totalClicks / member.totalSent) * 100 : 0; break;
          }
          
          let matches = false;
          switch (op) {
            case 'gt': matches = memberValue > value; break;
            case 'gte': matches = memberValue >= value; break;
            case 'lt': matches = memberValue < value; break;
            case 'lte': matches = memberValue <= value; break;
            case 'eq': matches = memberValue === value; break;
            case 'ne': matches = memberValue !== value; break;
          }
          
          memberRuleMatches[member.id].push(matches);
          if (matches) matchedCount++;
        }
        break;
      }
      
      case 'demographic': {
        const field = rule.field;
        const op = rule.operator;
        const value = rule.value;
        
        ruleDescription = `人口统计: ${field} ${op} ${value}`;
        
        for (const member of audienceMembers) {
          let memberValue: unknown;
          switch (field) {
            case 'country': memberValue = member.country; break;
            case 'city': memberValue = member.city; break;
            case 'company': memberValue = member.company; break;
            case 'isSubscribed': memberValue = member.isSubscribed; break;
          }
          
          let matches = false;
          if (typeof memberValue === 'string' && typeof value === 'string') {
            switch (op) {
              case 'eq': matches = memberValue === value; break;
              case 'ne': matches = memberValue !== value; break;
              case 'contains': matches = memberValue.toLowerCase().includes(value.toLowerCase()); break;
            }
          } else if (typeof memberValue === 'boolean' && typeof value === 'boolean') {
            matches = memberValue === value;
          }
          
          memberRuleMatches[member.id].push(matches);
          if (matches) matchedCount++;
        }
        break;
      }
      
      case 'attribute': {
        const attrCode = rule.attributeCode;
        const op = rule.operator;
        const value = rule.value;
        
        const attrDef = profileAttributes.find(a => a.code === attrCode);
        ruleDescription = `画像属性: ${attrDef?.name || attrCode} ${op} ${value}`;
        
        for (const member of audienceMembers) {
          const memberAttr = memberAttributes.find(ma => ma.memberId === member.id);
          let memberValue: unknown = null;
          
          if (memberAttr) {
            const attr = profileAttributes.find(a => a.id === memberAttr.attributeId);
            if (attr?.code === attrCode) {
              try {
                if (attr.type === 'NUMBER') {
                  memberValue = parseFloat(memberAttr.value);
                } else if (attr.type === 'BOOLEAN') {
                  memberValue = memberAttr.value === 'true';
                } else if (attr.type === 'ARRAY') {
                  memberValue = JSON.parse(memberAttr.value);
                } else {
                  memberValue = memberAttr.value;
                }
              } catch {
                memberValue = memberAttr.value;
              }
            }
          }
          
          let matches = false;
          if (memberValue !== null) {
            if (typeof memberValue === 'string' && typeof value === 'string') {
              switch (op) {
                case 'eq': matches = memberValue === value; break;
                case 'ne': matches = memberValue !== value; break;
                case 'contains': matches = memberValue.toLowerCase().includes(value.toLowerCase()); break;
              }
            } else if (typeof memberValue === 'number' && typeof value === 'number') {
              switch (op) {
                case 'gt': matches = memberValue > value; break;
                case 'gte': matches = memberValue >= value; break;
                case 'lt': matches = memberValue < value; break;
                case 'lte': matches = memberValue <= value; break;
                case 'eq': matches = memberValue === value; break;
              }
            } else if (Array.isArray(memberValue) && typeof value === 'string') {
              matches = memberValue.includes(value);
            }
          }
          
          memberRuleMatches[member.id].push(matches);
          if (matches) matchedCount++;
        }
        break;
      }
    }
    
    ruleBreakdown.push({
      rule: ruleDescription,
      matched: matchedCount,
      percentage: audienceMembers.length > 0 ? (matchedCount / audienceMembers.length) * 100 : 0,
    });
  }
  
  for (const member of audienceMembers) {
    const ruleMatches = memberRuleMatches[member.id] || [];
    let matches = false;
    
    if (operator === 'AND') {
      matches = ruleMatches.length > 0 && ruleMatches.every(m => m);
    } else {
      matches = ruleMatches.some(m => m);
    }
    
    if (matches) {
      matchedMemberIds.push(member.id);
    }
  }
  
  const matchedMembers = audienceMembers.filter(m => matchedMemberIds.includes(m.id));
  
  res.json({
    success: true,
    data: {
      memberIds: matchedMemberIds,
      count: matchedMemberIds.length,
      members: matchedMembers.slice(0, 100).map(m => ({
        id: m.id,
        email: m.email,
        name: m.name,
        company: m.company,
        isSubscribed: m.isSubscribed,
        totalOpens: m.totalOpens,
        totalClicks: m.totalClicks,
      })),
      statistics: {
        totalEvaluated: audienceMembers.length,
        totalMatched: matchedMemberIds.length,
        matchRate: audienceMembers.length > 0 ? (matchedMemberIds.length / audienceMembers.length) * 100 : 0,
        ruleBreakdown,
      },
      explanation: `
受众筛选评估说明：
1. 评估方式: ${operator === 'AND' ? '所有规则都必须满足 (AND)' : '满足任一规则即可 (OR)'}
2. 规则明细:
${ruleBreakdown.map((r, i) => `   ${i + 1}. ${r.rule} → 匹配 ${r.matched} 人 (${r.percentage.toFixed(1)}%)`).join('\n')}
3. 结果: 共 ${matchedMemberIds.length} 人匹配所有规则
      `.trim(),
    },
  });
});

app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'API端点不存在',
  });
});

async function startServer() {
  await initMockData();
  console.log('Mock data initialized');
  
  app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`  邮件营销系统 (Mock模式)`);
    console.log(`========================================`);
    console.log(``);
    console.log(`后端服务已启动: http://localhost:${PORT}`);
    console.log(`健康检查: http://localhost:${PORT}/health`);
    console.log(`API信息: http://localhost:${PORT}/api/info`);
    console.log(``);
    console.log(`默认管理员账户:`);
    console.log(`  - 邮箱: admin@example.com`);
    console.log(`  - 密码: Admin@2024`);
    console.log(``);
    console.log(`模拟数据:`);
    console.log(`  - 用户: ${users.length} 个`);
    console.log(`  - 模板: ${templates.length} 个`);
    console.log(`  - 受众: ${audiences.length} 个`);
    console.log(`  - 受众成员: ${audienceMembers.length} 个`);
    console.log(`  - 活动: ${campaigns.length} 个`);
    console.log(`  - 告警: ${alerts.length} 个`);
    console.log(`  - 标签: ${tags.length} 个`);
    console.log(`  - 画像属性: ${profileAttributes.length} 个`);
    console.log(`  - 活动事件: ${activityEvents.length} 个`);
    console.log(``);
    console.log(`用户画像API:`);
    console.log(`  - GET /api/tags - 标签列表`);
    console.log(`  - GET /api/tags/:id - 标签详情`);
    console.log(`  - POST /api/tags - 创建标签`);
    console.log(`  - GET /api/profile-attributes - 画像属性列表`);
    console.log(`  - GET /api/members/:id/profile - 用户画像详情`);
    console.log(`  - POST /api/members/:id/tags/:tagId - 分配标签`);
    console.log(`  - DELETE /api/members/:id/tags/:tagId - 移除标签`);
    console.log(`  - POST /api/segments/evaluate - 受众筛选评估`);
    console.log(``);
    console.log(`========================================`);
  });
}

startServer();
