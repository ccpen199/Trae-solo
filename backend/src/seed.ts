import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Diary from '../models/Diary';

dotenv.config();

const CON_STYLES = ['北欧', '新中式', '现代简约', '日式', '轻奢', '美式', '工业风', '地中海', '法式', '意式', '混搭'];
const MATERIALS = ['岩板', '木饰面', '乳胶漆', '大理石', '瓷砖', '地板', '不锈钢', '玻璃', '硅藻泥', '墙纸', '硅藻泥'];

const seed = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/deco-community';
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ DB 已连接');
  } catch (e) {
    console.warn('⚠️  无法连接 MongoDB，跳过 seed');
    console.warn((e as Error).message);
    process.exit(0);
  }

  const demoUsers = [
    {
      username: 'admin',
      email: 'admin@deco.com',
      phone: '13800000000',
      password: '123456',
      role: 'admin',
      nickname: '平台管理员',
      avatar: '',
      bio: '平台官方管理员账号',
      designerStatus: 'approved'
    },
    {
      username: 'homeowner1',
      email: 'owner1@deco.com',
      phone: '13800000001',
      password: '123456',
      role: 'homeowner',
      nickname: '阳光暖暖',
      avatar: '',
      bio: '新房装修中，坐标上海浦东，120平三房两厅，预算30万',
      preferences: {
        styleTags: ['北欧', '现代简约'],
        budgetRange: { min: 200000, max: 400000 },
        materials: ['木饰面', '乳胶漆', '岩板']
      }
    },
    {
      username: 'homeowner2',
      email: 'owner2@deco.com',
      phone: '13800000002',
      password: '123456',
      role: 'homeowner',
      nickname: '山间清风',
      avatar: '',
      bio: '二手房翻新爱好者',
      preferences: {
        styleTags: ['新中式', '日式'],
        budgetRange: { min: 150000, max: 250000 },
        materials: ['木饰面', '大理石']
      }
    },
    {
      username: 'designer1',
      email: 'designer1@deco.com',
      phone: '13900000001',
      password: '123456',
      role: 'designer',
      nickname: '李 · 空间美学',
      avatar: '',
      bio: '10年室内设计经验，擅长北欧/日式风格',
      designerStatus: 'approved',
      serviceAreas: ['上海市', '杭州市', '苏州市'],
      qualifications: {
        licenseNumber: 'CN-ID-2015-88372',
        certificationImages: [],
        verifiedAt: new Date('2023-06-01')
      },
      portfolio: [
        {
          title: '浦东 120㎡ 北欧风三居室',
          description: '全屋定制北欧风设计，温馨舒适，浅色系',
          images: [],
          style: '北欧',
          budgetRange: { min: 250000, max: 400000 }
        },
        {
          title: '静安 89㎡ 日式小户型',
          description: '收纳最大化，多功能空间',
          images: [],
          style: '日式',
          budgetRange: { min: 150000, max: 250000 }
        }
      ],
      statistics: {
        completedProjects: 58,
        rating: 4.8,
        reviewCount: 42
      }
    },
    {
      username: 'designer2',
      email: 'designer2@deco.com',
      phone: '13900000002',
      password: '123456',
      role: 'designer',
      nickname: '王工工作室',
      avatar: '',
      bio: '8年设计，中式设计',
      designerStatus: 'approved',
      serviceAreas: ['北京市', '上海市', '南京市'],
      qualifications: {
        licenseNumber: 'CN-ID-2016-33291',
        certificationImages: [],
        verifiedAt: new Date('2023-06-01')
      },
      portfolio: [
        {
          title: '北京朝阳 156㎡ 新中式四房',
          description: '典雅大气新中式',
          images: [],
          style: '新中式',
          budgetRange: { min: 400000, max: 800000 }
        }
      ],
      statistics: {
        completedProjects: 37,
        rating: 4.7,
        reviewCount: 31
      }
    },
    {
      username: 'designer3',
      email: 'designer3@deco.com',
      phone: '13900000003',
      password: '123456',
      role: 'designer',
      nickname: 'Zhang · 北欧研究所',
      avatar: '',
      bio: '海归设计师，专注北欧/轻奢',
      designerStatus: 'approved',
      serviceAreas: ['上海市', '深圳市', '广州市'],
      qualifications: {
        licenseNumber: 'CN-ID-2017-55621',
        certificationImages: [],
        verifiedAt: new Date('2023-06-01')
      },
      portfolio: [
        {
          title: '深圳南山 96㎡ 轻奢三居',
          description: '精致生活品质感',
          images: [],
          style: '轻奢',
          budgetRange: { min: 300000, max: 600000 }
        }
      ],
      statistics: {
        completedProjects: 29,
        rating: 4.9,
        reviewCount: 26
      }
    }
  ];

  for (const u of demoUsers) {
    try {
      const exists = await User.findOne({ username: u.username });
      if (exists) {
        console.log(`  ↺ 用户 ${u.username} 已存在，跳过`);
        continue;
      }
      const user = await User.create(u);
      console.log(`  ✓ 用户 ${u.username} 已创建 (${u.role})`);
    } catch (e) {
      console.error(`  ✗ 用户 ${u.username} 创建失败:`, (e as Error).message);
    }
  }

  const owner1 = await User.findOne({ username: 'homeowner1' });
  if (owner1) {
    const demoDiaries = [
      {
        userId: owner1._id,
      title: '【浦东120平三房 | 北欧风装修日记',
      description: '记录120平三房的完整装修过程，从拆旧到验收全流程',
      content: '开工大吉，今天终于开工啦～～～希望一切顺利！',
      stage: 'plumbing_electrical' as const,
      stageHistory: [
        { stage: 'planning', startedAt: new Date('2026-03-01'), completedAt: new Date('2026-03-10'), description: '方案设计与报价确认' },
        { stage: 'demolition', startedAt: new Date('2026-03-11'), completedAt: new Date('2026-03-20'), description: '拆旧完成，格局改造' },
        { stage: 'plumbing_electrical', startedAt: new Date('2026-03-21'), description: '水电施工中' }
      ],
      address: {
        city: '上海市',
        district: '浦东新区',
        street: '张江路888弄',
        houseType: 'apartment',
        area: 120,
        rooms: 3,
        bathrooms: 2,
        floors: 18
      },
      totalBudget: 350000,
      budget: [
        { category: '水电改造', description: '全屋水电重新排布', estimatedAmount: 35000, actualAmount: 32000 },
        { category: '瓷砖地板', description: '客厅卧室厨卫墙地砖', estimatedAmount: 45000 },
        { category: '木作定制', description: '衣柜鞋柜', estimatedAmount: 60000 },
        { category: '乳胶漆', description: '全屋墙面', estimatedAmount: 18000 },
        { category: '厨卫吊顶', description: '集成吊顶+浴霸', estimatedAmount: 12000 },
        { category: '卫浴洁具', description: '马桶台盆龙头', estimatedAmount: 25000 }
      ],
      tags: ['北欧', '三房', '120平'],
      aiAnalysis: {
        style: { primary: '北欧', confidence: 0.92, secondary: ['日式', '现代简约'] },
        materials: [
          { name: '木饰面', confidence: 0.95, locations: ['客厅', '卧室'] }
        ],
        brands: [{ name: '宜家', confidence: 0.8, category: '家具' }],
        colorPalette: [{ hex: '#F5F5DC', weight: 0.3 }]
      },
      images: [],
      floorPlan: { metadata: { area: 120, rooms: 3, bathrooms: 2, floors: 1 }
    },
    {
      userId: owner1._id,
      title: '【静安区89㎡日式风格小户型',
      description: '二手房翻新，收纳为主',
      content: '翻新前的户型比较小，收纳是最大需求',
      stage: 'painting' as const,
      stageHistory: [
        { stage: 'planning', startedAt: new Date('2026-04-01'), completedAt: new Date('2026-04-08') },
        { stage: 'demolition', startedAt: new Date('2026-04-09'), completedAt: new Date('2026-04-15') },
        { stage: 'plumbing_electrical', startedAt: new Date('2026-04-16'), completedAt: new Date('2026-04-30') },
        { stage: 'masonry_carpentry', startedAt: new Date('2026-05-01'), completedAt: new Date('2026-05-20') },
        { stage: 'painting', startedAt: new Date('2026-05-21'), description: '油漆阶段' }
      ],
      address: { city: '上海市', district: '静安区', street: '南京西路', houseType: 'apartment', area: 89, rooms: 2, bathrooms: 1 },
      totalBudget: 220000,
      budget: [
        { category: '水电', description: '局部改造', estimatedAmount: 22000, actualAmount: 21000 },
        { category: '定制柜', description: '全屋收纳柜', estimatedAmount: 50000 }
      ],
      tags: ['日式', '两房'],
      aiAnalysis: {
        style: { primary: '日式', confidence: 0.88, secondary: ['北欧'] },
        materials: [
          { name: '木饰面', confidence: 0.96, locations: ['全屋'] }
        ],
        brands: [{ name: '无印良品', confidence: 0.7, category: '家具' }],
        colorPalette: [{ hex: '#E8E4DF', weight: 0.4 }]
      },
      images: [],
      floorPlan: { metadata: { area: 89, rooms: 2, bathrooms: 1 }
    }
  ];

    for (const d of demoDiaries) {
      try {
        const exists = await Diary.findOne({ title: d.title });
        if (exists) {
          console.log(`  ↺ 日记「${d.title.slice(0, 18)}...已存在，跳过`);
          continue;
        }
        await Diary.create(d);
        console.log(`  ✓ 日记「${d.title.slice(0, 18)}...已创建`);
      } catch (e) {
        console.error(`  ✗ 日记创建失败:`, (e as Error).message);
      }
    }
  }

  console.log('\n🎉 Seed 完成');
  await mongoose.connection.close();
  process.exit(0);
};

seed();
