import { Company, Job, JobSeeker, ReviewItem, HeatmapData, ActivityData } from '../types';

export const companies: Company[] = [
  {
    id: 'c1',
    name: '星辰咖啡',
    logo: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=100&h=100&fit=crop',
    description: '一家专注精品咖啡的连锁品牌，致力于为城市年轻人提供高品质的第三空间。我们相信，一杯好咖啡可以改变一天的心情。',
    industry: '餐饮咖啡',
    size: '100-500人',
    location: '上海市静安区',
    address: '南京西路1788号',
    lat: 31.2304,
    lng: 121.4737,
    verified: true,
    videos: [
      {
        id: 'v1',
        title: '咖啡师的一天：从拉花到服务',
        thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=600&fit=crop',
        videoUrl: '',
        duration: 125,
        type: 'job',
        tags: ['咖啡师', '拉花', '服务', '精品咖啡'],
        views: 12580,
        likes: 3420,
        aiKeywords: ['咖啡制作', '拉花艺术', '客户服务', '意式咖啡', '手冲咖啡']
      },
      {
        id: 'v2',
        title: '我们的团队文化',
        thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=600&fit=crop',
        videoUrl: '',
        duration: 89,
        type: 'team',
        tags: ['团队', '文化', '团建'],
        views: 8920,
        likes: 2150
      },
      {
        id: 'v3',
        title: '门店环境实拍',
        thumbnail: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=600&fit=crop',
        videoUrl: '',
        duration: 67,
        type: 'office',
        tags: ['环境', '门店', '装修'],
        views: 15600,
        likes: 4200
      }
    ],
    jobs: [
      {
        id: 'j1',
        title: '资深咖啡师',
        salary: '8k-12k',
        salaryMin: 8000,
        salaryMax: 12000,
        location: '上海静安区',
        address: '南京西路1788号',
        lat: 31.2304,
        lng: 121.4737,
        type: '全职',
        experience: '1-3年',
        education: '不限',
        description: '负责门店咖啡制作与客户服务，维护咖啡品质与门店环境。',
        requirements: ['1年以上咖啡师经验', '熟练掌握意式咖啡制作', '具备拉花技能优先', '良好的沟通能力'],
        benefits: ['五险一金', '绩效奖金', '年度旅游', '员工折扣', '培训晋升'],
        companyId: 'c1',
        companyName: '星辰咖啡',
        companyLogo: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=100&h=100&fit=crop',
        videoId: 'v1',
        videoThumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=600&fit=crop',
        tags: ['咖啡师', '餐饮', '服务'],
        postedDate: '2024-01-15',
        applications: 56,
        verified: true
      },
      {
        id: 'j2',
        title: '店长助理',
        salary: '10k-15k',
        salaryMin: 10000,
        salaryMax: 15000,
        location: '上海静安区',
        address: '南京西路1788号',
        lat: 31.2304,
        lng: 121.4737,
        type: '全职',
        experience: '3-5年',
        education: '大专',
        description: '协助店长管理门店日常运营，带教新员工，达成业绩目标。',
        requirements: ['3年以上餐饮行业经验', '1年以上管理经验', '良好的沟通协调能力'],
        benefits: ['五险一金', '绩效奖金', '年度旅游', '员工折扣', '培训晋升', '股权激励'],
        companyId: 'c1',
        companyName: '星辰咖啡',
        companyLogo: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=100&h=100&fit=crop',
        tags: ['管理', '餐饮', '运营'],
        postedDate: '2024-01-10',
        applications: 32,
        verified: true
      }
    ],
    teamMembers: [
      {
        id: 't1',
        name: '李明',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        position: '门店经理',
        department: '运营部'
      },
      {
        id: 't2',
        name: '王芳',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
        position: '资深咖啡师',
        department: '产品部'
      },
      {
        id: 't3',
        name: '张伟',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
        position: '区域主管',
        department: '运营部'
      }
    ],
    stats: {
      views: 58200,
      followers: 2340,
      jobApplications: 156
    }
  },
  {
    id: 'c2',
    name: '悦动健身',
    logo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop',
    description: '高端连锁健身品牌，提供专业的健身指导和舒适的健身环境。让运动成为一种生活方式。',
    industry: '健身运动',
    size: '50-100人',
    location: '上海市浦东新区',
    address: '陆家嘴环路1000号',
    lat: 31.2397,
    lng: 121.4998,
    verified: true,
    videos: [
      {
        id: 'v4',
        title: '私人教练的日常工作',
        thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=600&fit=crop',
        videoUrl: '',
        duration: 156,
        type: 'job',
        tags: ['健身教练', '私教', '训练'],
        views: 9800,
        likes: 2800,
        aiKeywords: ['力量训练', '有氧运动', '体能评估', '训练计划', '营养指导']
      },
      {
        id: 'v5',
        title: '健身房环境展示',
        thumbnail: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&h=600&fit=crop',
        videoUrl: '',
        duration: 98,
        type: 'office',
        tags: ['环境', '设施', '健身房'],
        views: 12300,
        likes: 3500
      }
    ],
    jobs: [
      {
        id: 'j3',
        title: '私人健身教练',
        salary: '12k-25k',
        salaryMin: 12000,
        salaryMax: 25000,
        location: '上海浦东新区',
        address: '陆家嘴环路1000号',
        lat: 31.2397,
        lng: 121.4998,
        type: '全职',
        experience: '1-3年',
        education: '高中',
        description: '为会员提供专业的一对一健身指导，制定个性化训练计划。',
        requirements: ['持有健身教练资格证', '1年以上私教经验', '良好的沟通能力', '形象气质佳'],
        benefits: ['高提成', '五险一金', '免费健身', '专业培训', '晋升空间大'],
        companyId: 'c2',
        companyName: '悦动健身',
        companyLogo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop',
        videoId: 'v4',
        videoThumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=600&fit=crop',
        tags: ['健身', '教练', '销售'],
        postedDate: '2024-01-12',
        applications: 78,
        verified: true
      }
    ],
    teamMembers: [
      {
        id: 't4',
        name: '陈强',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        position: '健身总监',
        department: '教练部'
      }
    ],
    stats: {
      views: 42000,
      followers: 1820,
      jobApplications: 98
    }
  },
  {
    id: 'c3',
    name: '科技创想',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
    description: '专注于人工智能和大数据的创新科技公司，用技术改变世界。我们是一群充满激情的技术极客。',
    industry: '互联网科技',
    size: '50-100人',
    location: '上海市徐汇区',
    address: '漕河泾开发区桂平路333号',
    lat: 31.1823,
    lng: 121.3997,
    verified: true,
    videos: [
      {
        id: 'v6',
        title: '我们的办公环境',
        thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=600&fit=crop',
        videoUrl: '',
        duration: 112,
        type: 'office',
        tags: ['办公环境', '科技公司', '开放办公'],
        views: 18500,
        likes: 5200
      },
      {
        id: 'v7',
        title: '前端开发工程师的一天',
        thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=600&fit=crop',
        videoUrl: '',
        duration: 178,
        type: 'job',
        tags: ['程序员', '前端', '开发'],
        views: 25600,
        likes: 6800,
        aiKeywords: ['React', 'TypeScript', '前端开发', '代码评审', '敏捷开发']
      },
      {
        id: 'v8',
        title: '团队团建活动',
        thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=600&fit=crop',
        videoUrl: '',
        duration: 95,
        type: 'team',
        tags: ['团建', '团队', '活动'],
        views: 11200,
        likes: 3100
      }
    ],
    jobs: [
      {
        id: 'j4',
        title: '高级前端工程师',
        salary: '25k-45k',
        salaryMin: 25000,
        salaryMax: 45000,
        location: '上海徐汇区',
        address: '漕河泾开发区桂平路333号',
        lat: 31.1823,
        lng: 121.3997,
        type: '全职',
        experience: '3-5年',
        education: '本科',
        description: '负责公司核心产品的前端架构设计与开发，优化用户体验。',
        requirements: ['3年以上前端开发经验', '精通React/Vue框架', '熟悉TypeScript', '有大型项目经验优先'],
        benefits: ['五险一金', '年终奖金', '股票期权', '弹性工作', '免费零食', '年度体检'],
        companyId: 'c3',
        companyName: '科技创想',
        companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
        videoId: 'v7',
        videoThumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=600&fit=crop',
        tags: ['前端', 'React', 'TypeScript'],
        postedDate: '2024-01-08',
        applications: 124,
        verified: true
      },
      {
        id: 'j5',
        title: 'AI算法工程师',
        salary: '30k-60k',
        salaryMin: 30000,
        salaryMax: 60000,
        location: '上海徐汇区',
        address: '漕河泾开发区桂平路333号',
        lat: 31.1823,
        lng: 121.3997,
        type: '全职',
        experience: '3-5年',
        education: '硕士',
        description: '参与公司AI产品的算法研发，包括NLP、计算机视觉等方向。',
        requirements: ['硕士及以上学历', '3年以上算法经验', '熟悉TensorFlow/PyTorch', '有CV或NLP项目经验'],
        benefits: ['五险一金', '年终奖金', '股票期权', '弹性工作', '免费零食', '年度体检', '技术分享'],
        companyId: 'c3',
        companyName: '科技创想',
        companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
        tags: ['AI', '算法', '机器学习'],
        postedDate: '2024-01-05',
        applications: 67,
        verified: true
      }
    ],
    teamMembers: [
      {
        id: 't5',
        name: '刘洋',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
        position: '技术总监',
        department: '技术部'
      },
      {
        id: 't6',
        name: '赵雪',
        avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
        position: '产品经理',
        department: '产品部'
      }
    ],
    stats: {
      views: 78500,
      followers: 3560,
      jobApplications: 234
    }
  },
  {
    id: 'c4',
    name: '花时间花艺',
    logo: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=100&h=100&fit=crop',
    description: '一家有温度的花艺工作室，提供专业的花艺设计和培训课程。用鲜花装点美好生活。',
    industry: '生活服务',
    size: '10-50人',
    location: '上海市长宁区',
    address: '愚园路1234号',
    lat: 31.2215,
    lng: 121.4365,
    verified: true,
    videos: [
      {
        id: 'v9',
        title: '花艺师的创作过程',
        thumbnail: 'https://images.unsplash.com/photo-1457089328109-e5d9bd499191?w=400&h=600&fit=crop',
        videoUrl: '',
        duration: 134,
        type: 'job',
        tags: ['花艺师', '插花', '设计'],
        views: 8500,
        likes: 2600,
        aiKeywords: ['花束设计', '色彩搭配', '鲜花养护', '婚礼花艺', '空间花艺']
      },
      {
        id: 'v10',
        title: '工作室环境展示',
        thumbnail: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=600&fit=crop',
        videoUrl: '',
        duration: 78,
        type: 'office',
        tags: ['工作室', '环境', '鲜花'],
        views: 10200,
        likes: 3200
      }
    ],
    jobs: [
      {
        id: 'j6',
        title: '花艺师助理',
        salary: '6k-9k',
        salaryMin: 6000,
        salaryMax: 9000,
        location: '上海长宁区',
        address: '愚园路1234号',
        lat: 31.2215,
        lng: 121.4365,
        type: '全职',
        experience: '不限',
        education: '不限',
        description: '协助花艺师完成日常工作，学习花艺设计技巧。',
        requirements: ['对花艺有浓厚兴趣', '动手能力强', '有耐心和细心', '有无经验均可'],
        benefits: ['五险', '花艺培训', '员工折扣', '节日福利', '优美环境'],
        companyId: 'c4',
        companyName: '花时间花艺',
        companyLogo: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=100&h=100&fit=crop',
        videoId: 'v9',
        videoThumbnail: 'https://images.unsplash.com/photo-1457089328109-e5d9bd499191?w=400&h=600&fit=crop',
        tags: ['花艺', '设计', '学徒'],
        postedDate: '2024-01-14',
        applications: 45,
        verified: true
      }
    ],
    teamMembers: [
      {
        id: 't7',
        name: '林小燕',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
        position: '首席花艺师',
        department: '设计部'
      }
    ],
    stats: {
      views: 32000,
      followers: 1450,
      jobApplications: 67
    }
  },
  {
    id: 'c5',
    name: '书香书店',
    logo: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=100&h=100&fit=crop',
    description: '独立人文书店，精选好书，举办各类文化活动。在喧嚣城市中为你留一片宁静。',
    industry: '零售',
    size: '10-50人',
    location: '上海市黄浦区',
    address: '福州路567号',
    lat: 31.2325,
    lng: 121.4801,
    verified: false,
    videos: [
      {
        id: 'v11',
        title: '书店店员的日常',
        thumbnail: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
        videoUrl: '',
        duration: 145,
        type: 'job',
        tags: ['书店', '店员', '文化'],
        views: 6700,
        likes: 1900,
        aiKeywords: ['图书整理', '客户咨询', '活动策划', '库存管理', '阅读推荐']
      }
    ],
    jobs: [
      {
        id: 'j7',
        title: '书店店员',
        salary: '5k-8k',
        salaryMin: 5000,
        salaryMax: 8000,
        location: '上海黄浦区',
        address: '福州路567号',
        lat: 31.2325,
        lng: 121.4801,
        type: '全职',
        experience: '不限',
        education: '高中',
        description: '负责书店日常运营，图书整理，顾客服务，活动协助。',
        requirements: ['热爱阅读', '良好的沟通能力', '工作认真细心', '有书店经验优先'],
        benefits: ['五险', '员工购书折扣', '免费阅读', '文化活动', '温馨环境'],
        companyId: 'c5',
        companyName: '书香书店',
        companyLogo: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=100&h=100&fit=crop',
        videoId: 'v11',
        videoThumbnail: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
        tags: ['书店', '零售', '服务'],
        postedDate: '2024-01-13',
        applications: 34,
        verified: false
      }
    ],
    teamMembers: [
      {
        id: 't8',
        name: '周文',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
        position: '店长',
        department: '运营部'
      }
    ],
    stats: {
      views: 21000,
      followers: 890,
      jobApplications: 45
    }
  }
];

export const jobs: Job[] = companies.flatMap(c => c.jobs);

export const jobSeekers: JobSeeker[] = [
  {
    id: 's1',
    name: '王小明',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    title: '咖啡师 / 调酒师',
    experience: '3年经验',
    education: '大专',
    location: '上海市',
    skills: ['咖啡制作', '拉花', '调酒', '客户服务', '团队协作'],
    expectedSalary: '8k-12k',
    bio: '热爱咖啡文化，有3年精品咖啡店工作经验。擅长意式咖啡制作与艺术拉花，曾获上海咖啡师大赛三等奖。',
    views: 1250,
    connections: 56,
    resumeVideo: {
      id: 'sv1',
      title: '我的咖啡师之路',
      thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=600&fit=crop',
      videoUrl: '',
      duration: 95,
      type: 'introduction',
      tags: ['咖啡师', '自我介绍', '技能展示'],
      views: 1250,
      likes: 230,
      subtitles: [
        { startTime: 0, endTime: 5, text: '大家好，我是王小明' },
        { startTime: 5, endTime: 12, text: '一名有三年经验的咖啡师' },
        { startTime: 12, endTime: 20, text: '我热爱咖啡文化，享受制作每一杯咖啡的过程' },
        { startTime: 20, endTime: 30, text: '我擅长意式咖啡和艺术拉花' },
        { startTime: 30, endTime: 40, text: '曾在多家精品咖啡店工作' },
        { startTime: 40, endTime: 50, text: '获得过上海咖啡师大赛三等奖' },
        { startTime: 50, endTime: 65, text: '我相信好的咖啡不仅要好喝，更要有温度' },
        { startTime: 65, endTime: 80, text: '期待能加入一个有情怀的团队' },
        { startTime: 80, endTime: 95, text: '谢谢大家，期待与您共事' }
      ],
      aiKeywords: ['咖啡师', '意式咖啡', '拉花艺术', '三年经验', '咖啡大赛']
    }
  },
  {
    id: 's2',
    name: '李雨婷',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    title: '前端开发工程师',
    experience: '4年经验',
    education: '本科',
    location: '上海市',
    skills: ['React', 'TypeScript', 'Vue', 'Node.js', 'Webpack', 'UI设计'],
    expectedSalary: '25k-35k',
    bio: '4年前端开发经验，精通React生态，有大型项目架构经验。热爱技术，持续学习中。',
    views: 2340,
    connections: 128,
    resumeVideo: {
      id: 'sv2',
      title: '前端工程师自我介绍',
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=600&fit=crop',
      videoUrl: '',
      duration: 120,
      type: 'introduction',
      tags: ['前端', '程序员', '自我介绍'],
      views: 2340,
      likes: 450,
      aiKeywords: ['React', 'TypeScript', '前端开发', '四年经验', '大型项目']
    }
  },
  {
    id: 's3',
    name: '张健身',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    title: '健身教练 / 营养师',
    experience: '5年经验',
    education: '本科',
    location: '上海市',
    skills: ['私教', '体能训练', '营养指导', '运动康复', '团课教练'],
    expectedSalary: '15k-25k',
    bio: '5年健身教练经验，持有ACE和NSCA认证。擅长增肌、减脂、体态矫正。帮助100+学员达成健身目标。',
    views: 1890,
    connections: 89,
    resumeVideo: {
      id: 'sv3',
      title: '健身教练展示',
      thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=600&fit=crop',
      videoUrl: '',
      duration: 88,
      type: 'introduction',
      tags: ['健身', '教练', '展示'],
      views: 1890,
      likes: 520,
      aiKeywords: ['健身教练', '私教', '体能训练', '营养指导', '五年经验']
    }
  }
];

export const reviewItems: ReviewItem[] = [
  {
    id: 'r1',
    type: 'video',
    title: '咖啡师的一天：从拉花到服务',
    thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=300&fit=crop',
    submitter: '星辰咖啡',
    submitTime: '2024-01-15 10:30',
    status: 'ai_reviewed',
    aiScore: 92,
    aiIssues: []
  },
  {
    id: 'r2',
    type: 'video',
    title: '私人教练的日常工作',
    thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=300&fit=crop',
    submitter: '悦动健身',
    submitTime: '2024-01-14 15:20',
    status: 'approved'
  },
  {
    id: 'r3',
    type: 'job',
    title: '资深咖啡师',
    submitter: '星辰咖啡',
    submitTime: '2024-01-15 09:00',
    status: 'pending'
  },
  {
    id: 'r4',
    type: 'company',
    title: '书香书店 企业认证',
    thumbnail: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=200&h=200&fit=crop',
    submitter: '书香书店',
    submitTime: '2024-01-13 14:00',
    status: 'ai_reviewed',
    aiScore: 65,
    aiIssues: ['工商信息待核验', '办公地址街景不清晰']
  },
  {
    id: 'r5',
    type: 'video',
    title: '花艺师的创作过程',
    thumbnail: 'https://images.unsplash.com/photo-1457089328109-e5d9bd499191?w=200&h=300&fit=crop',
    submitter: '花时间花艺',
    submitTime: '2024-01-12 11:30',
    status: 'rejected',
    notes: '视频中出现竞品logo，需要重新剪辑'
  },
  {
    id: 'r6',
    type: 'job',
    title: 'AI算法工程师',
    submitter: '科技创想',
    submitTime: '2024-01-08 16:45',
    status: 'approved'
  }
];

export const heatmapData: HeatmapData[] = [
  { lat: 31.2304, lng: 121.4737, intensity: 0.95, jobCount: 156, seekerCount: 2340 },
  { lat: 31.2397, lng: 121.4998, intensity: 0.82, jobCount: 124, seekerCount: 1890 },
  { lat: 31.1823, lng: 121.3997, intensity: 0.88, jobCount: 178, seekerCount: 2560 },
  { lat: 31.2215, lng: 121.4365, intensity: 0.72, jobCount: 89, seekerCount: 1450 },
  { lat: 31.2325, lng: 121.4801, intensity: 0.65, jobCount: 67, seekerCount: 1120 },
  { lat: 31.2500, lng: 121.4800, intensity: 0.55, jobCount: 45, seekerCount: 890 },
  { lat: 31.2200, lng: 121.5200, intensity: 0.48, jobCount: 38, seekerCount: 720 },
  { lat: 31.2000, lng: 121.4400, intensity: 0.62, jobCount: 78, seekerCount: 1230 },
  { lat: 31.2600, lng: 121.4600, intensity: 0.42, jobCount: 32, seekerCount: 560 },
  { lat: 31.1700, lng: 121.4200, intensity: 0.58, jobCount: 56, seekerCount: 980 },
];

export const activityData: ActivityData[] = [
  { region: '静安区', date: '2024-01-15', jobPosts: 45, applications: 234, videoViews: 12500, activeUsers: 1890 },
  { region: '浦东新区', date: '2024-01-15', jobPosts: 67, applications: 345, videoViews: 18900, activeUsers: 2560 },
  { region: '徐汇区', date: '2024-01-15', jobPosts: 56, applications: 289, videoViews: 15600, activeUsers: 2100 },
  { region: '长宁区', date: '2024-01-15', jobPosts: 34, applications: 178, videoViews: 9800, activeUsers: 1450 },
  { region: '黄浦区', date: '2024-01-15', jobPosts: 28, applications: 145, videoViews: 7800, activeUsers: 1120 },
  { region: '普陀区', date: '2024-01-15', jobPosts: 23, applications: 123, videoViews: 6500, activeUsers: 890 },
  { region: '虹口区', date: '2024-01-15', jobPosts: 19, applications: 98, videoViews: 5200, activeUsers: 720 },
  { region: '杨浦区', date: '2024-01-15', jobPosts: 25, applications: 134, videoViews: 7200, activeUsers: 980 },
];

export const interestTags = [
  '咖啡师', '健身教练', '程序员', '设计师', '运营', '销售',
  '餐饮', '零售', '教育', '医疗', '金融', '互联网',
  '短期兼职', '周末工', '实习', '全职', '远程办公'
];

export const industryTags = [
  '互联网/科技', '餐饮/咖啡', '健身/运动', '零售/快消',
  '教育/培训', '医疗/健康', '金融/银行', '文化传媒',
  '生活服务', '建筑/地产'
];
