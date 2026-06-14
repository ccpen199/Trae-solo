import prisma from './prisma'
import bcrypt from 'bcryptjs'

export async function refreshDemoData() {
  console.log('🔄 正在刷新演示数据...')

  try {
    const hashedPassword = await bcrypt.hash('123456', 10)
    const now = new Date()

    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        username: '平台管理员',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        role: 'ADMIN',
      },
      create: {
        email: 'admin@example.com',
        username: '平台管理员',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      },
    })

    const employer1 = await prisma.user.upsert({
      where: { email: 'employer1@example.com' },
      update: {
        username: '创意创业者',
        role: 'EMPLOYER',
        balance: 80000,
        bio: '专注互联网产品创业，需要大量设计开发服务',
      },
      create: {
        email: 'employer1@example.com',
        username: '创意创业者',
        passwordHash: hashedPassword,
        role: 'EMPLOYER',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=employer1',
        balance: 80000,
        bio: '专注互联网产品创业，需要大量设计开发服务',
        location: '上海',
      },
    })

    const employer2 = await prisma.user.upsert({
      where: { email: 'employer2@example.com' },
      update: {
        username: '连锁餐饮品牌',
        role: 'EMPLOYER',
        balance: 120000,
        bio: '全国连锁餐饮品牌，需要设计和营销服务',
      },
      create: {
        email: 'employer2@example.com',
        username: '连锁餐饮品牌',
        passwordHash: hashedPassword,
        role: 'EMPLOYER',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=employer2',
        balance: 120000,
        bio: '全国连锁餐饮品牌，需要设计和营销服务',
        location: '北京',
        rating: 4.7,
      },
    })

    const provider1 = await prisma.user.upsert({
      where: { email: 'provider1@example.com' },
      update: {
        username: 'UI设计师小王',
        role: 'PROVIDER',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider1',
        rating: 4.8,
        level: 3,
        completedOrders: 25,
        totalOrders: 28,
        bio: '5年UI设计经验，擅长APP和小程序设计',
      },
      create: {
        email: 'provider1@example.com',
        username: 'UI设计师小王',
        passwordHash: hashedPassword,
        role: 'PROVIDER',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider1',
        rating: 4.8,
        level: 3,
        completedOrders: 25,
        totalOrders: 28,
        bio: '5年UI设计经验，擅长APP和小程序设计',
        location: '深圳',
      },
    })

    const provider2 = await prisma.user.upsert({
      where: { email: 'provider2@example.com' },
      update: {
        username: '全栈开发老张',
        role: 'PROVIDER',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider2',
        rating: 4.9,
        level: 5,
        completedOrders: 68,
        totalOrders: 72,
        bio: '8年全栈开发经验，React/Vue/Node.js精通',
      },
      create: {
        email: 'provider2@example.com',
        username: '全栈开发老张',
        passwordHash: hashedPassword,
        role: 'PROVIDER',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider2',
        rating: 4.9,
        level: 5,
        completedOrders: 68,
        totalOrders: 72,
        bio: '8年全栈开发经验，React/Vue/Node.js精通',
        location: '杭州',
      },
    })

    const provider3 = await prisma.user.upsert({
      where: { email: 'provider3@example.com' },
      update: {
        username: '文案策划小李',
        role: 'PROVIDER',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider3',
        rating: 4.6,
        level: 2,
        completedOrders: 15,
        totalOrders: 18,
        bio: '4A广告公司3年经验，擅长品牌文案和短视频脚本',
      },
      create: {
        email: 'provider3@example.com',
        username: '文案策划小李',
        passwordHash: hashedPassword,
        role: 'PROVIDER',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider3',
        rating: 4.6,
        level: 2,
        completedOrders: 15,
        totalOrders: 18,
        bio: '4A广告公司3年经验，擅长品牌文案和短视频脚本',
        location: '广州',
      },
    })

    const provider4 = await prisma.user.upsert({
      where: { email: 'provider4@example.com' },
      update: {
        username: '空间设计师阿May',
        role: 'PROVIDER',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider4',
        rating: 4.9,
        level: 4,
        completedOrders: 42,
        totalOrders: 45,
        bio: '室内设计师10年经验，擅长商业空间和住宅设计',
      },
      create: {
        email: 'provider4@example.com',
        username: '空间设计师阿May',
        passwordHash: hashedPassword,
        role: 'PROVIDER',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider4',
        rating: 4.9,
        level: 4,
        completedOrders: 42,
        totalOrders: 45,
        bio: '室内设计师10年经验，擅长商业空间和住宅设计',
        location: '成都',
      },
    })

    const skillsList = [
      { name: 'UI设计', category: '设计', description: '用户界面设计', icon: 'Palette' },
      { name: 'Logo设计', category: '设计', description: '品牌Logo设计', icon: 'Sparkles' },
      { name: '海报设计', category: '设计', description: '海报/宣传图设计', icon: 'Image' },
      { name: '网页设计', category: '设计', description: '网站页面设计', icon: 'Layout' },
      { name: '品牌VI设计', category: '设计', description: '品牌视觉识别系统', icon: 'Layers' },
      { name: '微信小程序开发', category: '开发', description: '微信小程序开发', icon: 'Smartphone' },
      { name: 'APP开发', category: '开发', description: '移动应用开发', icon: 'Smartphone' },
      { name: '网站开发', category: '开发', description: '企业网站开发', icon: 'Globe' },
      { name: 'H5开发', category: '开发', description: 'H5活动页面开发', icon: 'Code' },
      { name: '短视频脚本', category: '文案', description: '短视频脚本撰写', icon: 'Film' },
      { name: '公众号文案', category: '文案', description: '微信公众号文章撰写', icon: 'FileText' },
      { name: '品牌文案', category: '文案', description: '品牌宣传文案', icon: 'Pen' },
      { name: 'SEO优化', category: '营销', description: '搜索引擎优化', icon: 'Target' },
      { name: '新媒体运营', category: '营销', description: '新媒体账号运营', icon: 'TrendingUp' },
      { name: '社交媒体营销', category: '营销', description: '全渠道社媒营销', icon: 'Share2' },
      { name: '室内装修设计', category: '装修', description: '室内空间设计', icon: 'Home' },
      { name: '店面装修', category: '装修', description: '商铺店面装修设计', icon: 'Store' },
      { name: '效果图制作', category: '装修', description: '3D效果图渲染', icon: 'Box' },
    ]

    const createdSkills = []
    for (const s of skillsList) {
      const sk = await prisma.skill.upsert({
        where: { name: s.name },
        update: { category: s.category, description: s.description, icon: s.icon },
        create: s,
      })
      createdSkills.push(sk)
    }

    await prisma.user.update({
      where: { id: provider1.id },
      data: {
        skills: { set: [{ name: 'UI设计' }, { name: 'Logo设计' }, { name: '网页设计' }, { name: '品牌VI设计' }] },
      },
    })
    await prisma.user.update({
      where: { id: provider2.id },
      data: {
        skills: { set: [{ name: '微信小程序开发' }, { name: 'APP开发' }, { name: '网站开发' }, { name: 'H5开发' }] },
      },
    })
    await prisma.user.update({
      where: { id: provider3.id },
      data: {
        skills: { set: [{ name: '短视频脚本' }, { name: '公众号文案' }, { name: '品牌文案' }] },
      },
    })
    await prisma.user.update({
      where: { id: provider4.id },
      data: {
        skills: { set: [{ name: '室内装修设计' }, { name: '店面装修' }, { name: '效果图制作' }] },
      },
    })

    const days7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const days10 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
    const days14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    const days20 = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000)
    const days25 = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000)
    const days30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const days45 = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000)

    const taskTemplates = [
      {
        title: '公司品牌Logo设计',
        description: '科技公司品牌Logo设计，需要提供3个初稿方案，选中后提供源文件和品牌规范。要求简洁大气，有科技感。',
        category: 'DESIGN', status: 'BIDDING', budgetMin: 2000, budgetMax: 5000,
        deadline: days10, employerId: employer1.id,
        skills: ['Logo设计', '品牌VI设计'],
      },
      {
        title: '电商APP UI界面设计',
        description: '需要设计一套完整的电商APP界面，包括首页、分类、购物车、个人中心等主要页面，共约20个页面。要求风格简洁现代，配色以橙色为主色调。',
        category: 'DESIGN', status: 'BIDDING', budgetMin: 8000, budgetMax: 15000,
        deadline: days20, employerId: employer1.id,
        skills: ['UI设计', 'APP开发'],
      },
      {
        title: '微信小程序开发 - 预约服务系统',
        description: '开发一款预约服务类微信小程序，包含用户端和商家端，功能包括服务展示、在线预约、订单管理、支付等。需要前后端完整开发。',
        category: 'DEVELOPMENT', status: 'BIDDING', budgetMin: 20000, budgetMax: 35000,
        deadline: days30, employerId: employer1.id,
        skills: ['微信小程序开发'],
      },
      {
        title: '餐饮品牌抖音短视频脚本撰写（10条）',
        description: '连锁餐饮品牌需要抖音短视频脚本10条，每条30-60秒，包含场景设计、台词和镜头语言。要求有创意，符合年轻人审美。',
        category: 'COPYWRITING', status: 'BIDDING', budgetMin: 3000, budgetMax: 6000,
        deadline: days7, employerId: employer2.id,
        skills: ['短视频脚本'],
      },
      {
        title: '企业官网改版设计与开发',
        description: '科技公司企业官网整体改版，包含首页、产品页、解决方案页、关于我们等8个页面，设计+开发全套。响应式适配。',
        category: 'DEVELOPMENT', status: 'BIDDING', budgetMin: 15000, budgetMax: 25000,
        deadline: days25, employerId: employer2.id,
        skills: ['网站设计', '网站开发'],
      },
      {
        title: '新店装修设计 - 150㎡奶茶店',
        description: '150平米连锁奶茶店装修设计，需要平面布局图、效果图、施工图全套方案。要求符合品牌调性，风格年轻化。',
        category: 'DECORATION', status: 'BIDDING', budgetMin: 12000, budgetMax: 20000,
        deadline: days14, employerId: employer2.id,
        skills: ['店面装修', '效果图制作'],
      },
      {
        title: '品牌官方公众号代运营（3个月）',
        description: '需要专业团队运营我们品牌官方微信公众号，每周3篇原创图文，包含选题策划、文案撰写、排版设计。',
        category: 'MARKETING', status: 'BIDDING', budgetMin: 10000, budgetMax: 18000,
        deadline: days45, employerId: employer2.id,
        skills: ['公众号文案', '新媒体运营'],
      },
      {
        title: '618大促营销活动H5页面开发',
        description: '618大促活动H5页面开发，包含抽奖、优惠券、拼团等互动功能，设计精美，性能流畅。',
        category: 'DEVELOPMENT', status: 'BIDDING', budgetMin: 8000, budgetMax: 15000,
        deadline: days7, employerId: employer1.id,
        skills: ['H5开发', 'UI设计'],
      },
      {
        title: 'SaaS产品Logo+品牌VI设计',
        description: '企业SaaS产品需要全套品牌VI设计：Logo、标准色、标准字体、名片、邮件签名、PPT模板、官网Banner等。',
        category: 'DESIGN', status: 'BIDDING', budgetMin: 15000, budgetMax: 30000,
        deadline: days20, employerId: employer1.id,
        skills: ['Logo设计', '品牌VI设计'],
      },
      {
        title: '家装 - 120㎡三居室全屋设计',
        description: '120平米三居室全屋设计方案，现代简约风格，含客厅/主卧/次卧/书房/厨房/卫生间全套效果图和施工图。',
        category: 'DECORATION', status: 'BIDDING', budgetMin: 8000, budgetMax: 15000,
        deadline: days14, employerId: employer1.id,
        skills: ['室内装修设计', '效果图制作'],
      },
    ]

    const allSkillsMap = new Map(createdSkills.map(s => [s.name, s]))

    for (let i = 0; i < taskTemplates.length; i++) {
      const tpl = taskTemplates[i]
      const taskId = i + 1
      const existingTask = await prisma.task.findUnique({ where: { id: taskId } })

      const skillConnects = tpl.skills
        .filter(n => allSkillsMap.has(n))
        .map(n => ({ id: allSkillsMap.get(n)!.id }))

      if (existingTask) {
        await prisma.task.update({
          where: { id: taskId },
          data: {
            title: tpl.title,
            description: tpl.description,
            category: tpl.category,
            status: tpl.status,
            budgetMin: tpl.budgetMin,
            budgetMax: tpl.budgetMax,
            deadline: tpl.deadline,
            publishedAt: new Date(),
            skills: { set: skillConnects },
            createdAt: new Date(now.getTime() - (i * 2 + 1) * 24 * 60 * 60 * 1000),
          },
        })
      } else {
        await prisma.task.create({
          data: {
            id: taskId,
            title: tpl.title,
            description: tpl.description,
            category: tpl.category,
            status: tpl.status,
            budgetMin: tpl.budgetMin,
            budgetMax: tpl.budgetMax,
            deadline: tpl.deadline,
            employerId: tpl.employerId,
            publishedAt: new Date(),
            skills: { connect: skillConnects },
            createdAt: new Date(now.getTime() - (i * 2 + 1) * 24 * 60 * 60 * 1000),
          },
        })
      }
    }

    const inProgressTask = await prisma.task.upsert({
      where: { id: 11 },
      update: {
        title: '在线教育平台小程序（开发中）',
        description: '在线教育平台小程序完整开发，包含课程展示、在线播放、学习进度、作业提交等功能模块。当前已进入开发阶段。',
        category: 'DEVELOPMENT', status: 'IN_PROGRESS',
        budgetMin: 50000, budgetMax: 80000, totalAmount: 65000,
        deadline: days25, employerId: employer2.id, publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        selectedBidId: null,
        escrowAmount: 65000,
        skills: { set: [{ name: '微信小程序开发' }] },
      },
      create: {
        id: 11,
        title: '在线教育平台小程序（开发中）',
        description: '在线教育平台小程序完整开发，包含课程展示、在线播放、学习进度、作业提交等功能模块。当前已进入开发阶段。',
        category: 'DEVELOPMENT', status: 'IN_PROGRESS',
        budgetMin: 50000, budgetMax: 80000, totalAmount: 65000,
        deadline: days25, employerId: employer2.id, publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        selectedBidId: null,
        escrowAmount: 65000,
        skills: { connect: [{ name: '微信小程序开发' }] },
      },
    })

    const disputeTask = await prisma.task.upsert({
      where: { id: 12 },
      update: {
        title: '医美机构营销海报设计（争议中）',
        description: '医美机构活动营销海报设计5张，要求风格高端大气，配色以金色和玫瑰红为主。因交付质量与预期产生争议。',
        category: 'DESIGN', status: 'DISPUTE',
        budgetMin: 5000, budgetMax: 10000, totalAmount: 8000,
        deadline: days14, employerId: employer2.id, publishedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        escrowAmount: 8000,
        skills: { set: [{ name: '海报设计' }] },
      },
      create: {
        id: 12,
        title: '医美机构营销海报设计（争议中）',
        description: '医美机构活动营销海报设计5张，要求风格高端大气，配色以金色和玫瑰红为主。因交付质量与预期产生争议。',
        category: 'DESIGN', status: 'DISPUTE',
        budgetMin: 5000, budgetMax: 10000, totalAmount: 8000,
        deadline: days14, employerId: employer2.id, publishedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        escrowAmount: 8000,
        skills: { connect: [{ name: '海报设计' }] },
      },
    })

    const completedTask = await prisma.task.upsert({
      where: { id: 13 },
      update: {
        title: '产品品牌Slogan文案撰写（已完成）',
        description: '新产品上市品牌Slogan及整套推广文案撰写。已圆满完成并交付。',
        category: 'COPYWRITING', status: 'COMPLETED',
        budgetMin: 2000, budgetMax: 5000, totalAmount: 3500,
        deadline: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        employerId: employer1.id, publishedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        skills: { set: [{ name: '品牌文案' }] },
      },
      create: {
        id: 13,
        title: '产品品牌Slogan文案撰写（已完成）',
        description: '新产品上市品牌Slogan及整套推广文案撰写。已圆满完成并交付。',
        category: 'COPYWRITING', status: 'COMPLETED',
        budgetMin: 2000, budgetMax: 5000, totalAmount: 3500,
        deadline: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        employerId: employer1.id, publishedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        skills: { connect: [{ name: '品牌文案' }] },
      },
    })

    await prisma.task.updateMany({
      where: { id: { in: [11, 13] } },
      data: { selectedBidId: null },
    })

    await prisma.bid.deleteMany({
      where: {
        taskId: { in: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] },
      },
    })

    const bidData = [
      { taskId: 1, providerId: provider1.id, price: 3800, deliveryDays: 8, status: 'PENDING' as const,
        proposal: '您好！我是专业品牌设计师，曾为50+创业公司设计品牌标识。我会提供：1）3套初稿方案 2）2轮修改 3）全套源文件（AI/PSD/PNG）。期待合作！' },
      { taskId: 1, providerId: provider3.id, price: 2500, deliveryDays: 10, status: 'PENDING' as const,
        proposal: '3年品牌设计经验，简洁设计风格。3套方案+无限修改直到满意。交付AI+CDR源文件。' },
      { taskId: 2, providerId: provider1.id, price: 12000, deliveryDays: 18, status: 'PENDING' as const,
        proposal: '5年电商APP设计经验，曾服务过多家知名电商平台。1）3套首页方案 2）25个页面 3）不限修改 4）全套源文件+切图。' },
      { taskId: 3, providerId: provider2.id, price: 28000, deliveryDays: 28, status: 'PENDING' as const,
        proposal: '8年全栈开发团队。1）需求梳理+原型 2）前后端完整开发 3）3个月免费维护 4）代码文档齐全 5）协助上线审核。' },
      { taskId: 3, providerId: provider1.id, price: 18000, deliveryDays: 22, status: 'PENDING' as const,
        proposal: '前后端团队合作，我负责UI设计+我的搭档负责开发。20天交付，含UI设计和完整开发。' },
      { taskId: 4, providerId: provider3.id, price: 4500, deliveryDays: 6, status: 'PENDING' as const,
        proposal: '4A公司3年脚本经验，熟悉餐饮行业抖音生态。提供：每稿2版备选+2轮优化+分镜脚本。' },
      { taskId: 5, providerId: provider1.id, price: 18000, deliveryDays: 18, status: 'PENDING' as const,
        proposal: '设计+开发全包！8页响应式设计+WordPress后端。支持PC/移动/Pad三端适配。' },
      { taskId: 5, providerId: provider2.id, price: 22000, deliveryDays: 20, status: 'PENDING' as const,
        proposal: '企业级官网开发。React+Node技术栈，含SEO优化+后台管理系统+响应式三端适配。' },
      { taskId: 6, providerId: provider4.id, price: 16000, deliveryDays: 12, status: 'PENDING' as const,
        proposal: '10年商业空间设计经验，已完成200+奶茶店/咖啡店装修设计。平面+效果图+施工图全套。' },
      { taskId: 7, providerId: provider3.id, price: 12000, deliveryDays: 30, status: 'PENDING' as const,
        proposal: '新媒体运营3年，曾服务多家餐饮品牌。每周3篇原创图文+选题策划+数据分析报告。' },
      { taskId: 8, providerId: provider2.id, price: 12000, deliveryDays: 6, status: 'PENDING' as const,
        proposal: 'Canvas+原生JS开发，高性能高兼容。含抽奖、优惠券、拼团、倒计时等完整营销工具。' },
      { taskId: 9, providerId: provider1.id, price: 22000, deliveryDays: 16, status: 'PENDING' as const,
        proposal: '资深品牌设计师，10年SaaS产品设计经验。Logo+VI全套+品牌规范+落地指导。' },
      { taskId: 10, providerId: provider4.id, price: 12000, deliveryDays: 12, status: 'PENDING' as const,
        proposal: '10年家装设计经验，现代简约风格代表作50+。全屋效果图+施工图+软装建议。' },
      { taskId: 11, providerId: provider2.id, price: 65000, deliveryDays: 28, status: 'ACCEPTED' as const,
        proposal: '全栈开发团队教育行业经验丰富。前后端+小程序+管理后台完整交付。' },
      { taskId: 13, providerId: provider3.id, price: 3500, deliveryDays: 5, status: 'ACCEPTED' as const,
        proposal: '品牌文案专业，Slogan+推广文案+广告语全套。' },
    ]

    let bidIdCounter = 1000
    for (const b of bidData) {
      bidIdCounter++
      await prisma.bid.create({
        data: {
          id: bidIdCounter,
          taskId: b.taskId,
          providerId: b.providerId,
          price: b.price,
          deliveryDays: b.deliveryDays,
          status: b.status,
          proposal: b.proposal,
        },
      })
    }

    await prisma.task.update({
      where: { id: 11 },
      data: { selectedBidId: 1014 },
    })

    await prisma.task.update({
      where: { id: 13 },
      data: { selectedBidId: 1015 },
    })

    await prisma.milestone.deleteMany({ where: { taskId: { in: [11, 12, 13] } } })

    const ms11deadline1 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
    const ms11deadline2 = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)
    const ms11deadline3 = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000)

    await prisma.milestone.createMany({
      data: [
        { id: 2001, taskId: 11, title: '需求梳理与原型设计', description: '输出完整的需求文档和高保真原型图',
          amount: 19500, percentage: 30, orderIndex: 1, status: 'PAID', deadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          submittedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), approvedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          paidAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), rating: 5, feedback: '需求文档详细，原型设计专业！' },
        { id: 2002, taskId: 11, title: 'UI设计稿交付', description: '全套小程序UI设计稿交付并确认',
          amount: 19500, percentage: 30, orderIndex: 2, status: 'SUBMITTED', deadline: ms11deadline1,
          submittedAt: new Date() },
        { id: 2003, taskId: 11, title: '前端开发与接口联调', description: '小程序前端开发及后端API联调',
          amount: 16250, percentage: 25, orderIndex: 3, status: 'PENDING', deadline: ms11deadline2 },
        { id: 2004, taskId: 11, title: '测试上线与代码交付', description: '完整测试、部署上线并交付源代码',
          amount: 9750, percentage: 15, orderIndex: 4, status: 'PENDING', deadline: ms11deadline3 },
        { id: 2005, taskId: 12, title: '海报设计初稿', description: '5张海报初稿交付',
          amount: 4000, percentage: 50, orderIndex: 1, status: 'SUBMITTED', deadline: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          submittedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) },
        { id: 2006, taskId: 12, title: '修改与源文件交付', description: '根据反馈修改并交付源文件',
          amount: 4000, percentage: 50, orderIndex: 2, status: 'PENDING', deadline: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000) },
        { id: 2007, taskId: 13, title: 'Slogan及文案初稿', description: '提供3套Slogan方案及配套文案',
          amount: 2100, percentage: 60, orderIndex: 1, status: 'PAID',
          paidAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), rating: 5 },
        { id: 2008, taskId: 13, title: '终稿与品牌落地建议', description: '根据反馈完善并提供落地建议',
          amount: 1400, percentage: 40, orderIndex: 2, status: 'PAID',
          paidAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), rating: 5, feedback: '文案非常有创意！' },
      ],
    })

    await prisma.fileVersion.deleteMany({ where: { taskId: { in: [11, 12, 13] } } })

    await prisma.fileVersion.createMany({
      data: [
        { id: 3001, taskId: 11, milestoneId: 2001, uploaderId: provider2.id,
          version: 'v1.0', fileName: '需求文档V1.pdf', fileUrl: '/uploads/demo/requirements_v1.pdf',
          fileSize: 1024000, description: '初始需求文档，包含完整功能模块说明', isFinal: false,
          createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) },
        { id: 3002, taskId: 11, milestoneId: 2001, uploaderId: provider2.id,
          version: 'v1.1', fileName: '需求文档V2.pdf', fileUrl: '/uploads/demo/requirements_v2.pdf',
          fileSize: 1180000, description: '根据反馈补充了直播和互动模块需求', isFinal: true,
          createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
        { id: 3003, taskId: 11, milestoneId: 2002, uploaderId: provider1.id,
          version: 'v1.0', fileName: '小程序UI设计稿.fig', fileUrl: '/uploads/demo/ui_v1.fig',
          fileSize: 8500000, description: '全套UI设计稿 - 共30个页面', isFinal: false,
          createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
        { id: 3004, taskId: 12, milestoneId: 2005, uploaderId: provider1.id,
          version: 'v1.0', fileName: '医美海报初稿.rar', fileUrl: '/uploads/demo/posters_v1.rar',
          fileSize: 15600000, description: '5张海报设计初稿，金色调风格', isFinal: false,
          createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) },
        { id: 3005, taskId: 13, milestoneId: 2007, uploaderId: provider3.id,
          version: 'v1.0', fileName: 'Slogan方案.docx', fileUrl: '/uploads/demo/slogan_v1.docx',
          fileSize: 256000, description: '10组Slogan方案及配套文案说明', isFinal: false,
          createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000) },
        { id: 3006, taskId: 13, milestoneId: 2008, uploaderId: provider3.id,
          version: 'v2.0-final', fileName: '品牌文案最终稿.docx', fileUrl: '/uploads/demo/slogan_final.docx',
          fileSize: 480000, description: '最终Slogan+全渠道推广文案+品牌落地建议', isFinal: true,
          createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) },
      ],
    })

    await prisma.collaboration.deleteMany({ where: { taskId: { in: [11, 12] } } })

    await prisma.collaboration.createMany({
      data: [
        { id: 4001, taskId: 11, userId: employer2.id, fileVersionId: 3003,
          type: 'COMMENT', content: '首页顶部Banner的主图建议换成更具活力的场景图，目前的太平淡了',
          positionX: 120, positionY: 80, pageNumber: 1, resolved: false,
          createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000) },
        { id: 4002, taskId: 11, userId: employer2.id, fileVersionId: 3003,
          type: 'COMMENT', content: '课程详情页的购买按钮能否放大一点？当前不够醒目',
          positionX: 680, positionY: 1250, pageNumber: 5, resolved: false,
          createdAt: new Date(now.getTime() - 18 * 60 * 60 * 1000) },
        { id: 4003, taskId: 11, userId: provider1.id, fileVersionId: 3003,
          type: 'REPLY', content: '收到，我们下版会将Banner主图替换为学习场景实拍图，并放大购买按钮+增加主色调动效',
          resolved: false,
          createdAt: new Date(now.getTime() - 16 * 60 * 60 * 1000) },
        { id: 4004, taskId: 11, userId: employer2.id,
          type: 'NOTE', content: '关于支付模块：需要支持微信支付+支付宝+余额支付三种方式',
          resolved: true,
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
        { id: 4005, taskId: 12, userId: employer2.id, fileVersionId: 3004,
          type: 'COMMENT', content: '第3张海报的模特表情太生硬，需要换成更有亲和力的照片',
          positionX: 340, positionY: 520, pageNumber: 3, resolved: false,
          createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
        { id: 4006, taskId: 12, userId: employer2.id, fileVersionId: 3004,
          type: 'COMMENT', content: '整体配色与我们品牌VI不符，需要重新调整金色和玫瑰红的比例',
          positionX: null, positionY: null, pageNumber: null, resolved: false,
          createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
      ],
    })

    await prisma.payment.deleteMany({ where: { taskId: { in: [11, 13] } } })

    await prisma.payment.createMany({
      data: [
        { id: 5001, userId: employer2.id, taskId: 11, milestoneId: 2001,
          type: 'ESCROW_DEPOSIT', amount: 65000, status: 'SUCCESS', remark: '任务11全额资金托管',
          paidAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        { id: 5002, userId: employer2.id, taskId: 11, milestoneId: 2001,
          type: 'MILESTONE_RELEASE', amount: 19500, status: 'SUCCESS', remark: '里程碑1完成 - 需求文档与原型',
          paidAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
        { id: 5003, userId: provider2.id, taskId: 11, milestoneId: 2001,
          type: 'INCOME', amount: 19500, status: 'SUCCESS', remark: '里程碑1收入已到账',
          paidAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
        { id: 5004, userId: employer1.id, taskId: 13,
          type: 'ESCROW_DEPOSIT', amount: 3500, status: 'SUCCESS', remark: '任务13全额托管',
          paidAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) },
        { id: 5005, userId: employer1.id, taskId: 13, milestoneId: 2007,
          type: 'MILESTONE_RELEASE', amount: 2100, status: 'SUCCESS', remark: '里程碑1完成',
          paidAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000) },
        { id: 5006, userId: employer1.id, taskId: 13, milestoneId: 2008,
          type: 'MILESTONE_RELEASE', amount: 1400, status: 'SUCCESS', remark: '任务圆满完成，全部款项释放',
          paidAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
        { id: 5007, userId: provider3.id, taskId: 13,
          type: 'INCOME', amount: 3500, status: 'SUCCESS', remark: '文案任务收入已结算',
          paidAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
      ],
    })

    await prisma.disputeEvidence.deleteMany({ where: { disputeId: 6001 } })
    await prisma.dispute.deleteMany({ where: { taskId: 12 } })

    const disp = await prisma.dispute.create({
      data: {
        id: 6001, taskId: 12, initiatorId: employer2.id,
        reason: 'DELIVERY_QUALITY',
        description: '交付的5张海报设计质量严重低于预期：1）模特选择不符合品牌高端定位 2）整体配色与品牌VI严重不符 3）排版布局模板化严重，缺乏创意',
        status: 'PENDING',
      },
    })

    await prisma.disputeEvidence.createMany({
      data: [
        { id: 7001, disputeId: disp.id, userId: employer2.id,
          fileName: '品牌VI规范.pdf', fileUrl: '/uploads/demo/brand_vi.pdf',
          description: '我方品牌VI规范文档，明确了金色和玫瑰红的色值标准' },
        { id: 7002, disputeId: disp.id, userId: employer2.id,
          fileName: '对比说明.jpg', fileUrl: '/uploads/demo/comparison.jpg',
          description: '我方参考图与设计稿对比，差距明显' },
      ],
    })

    await prisma.riskReport.deleteMany({ where: { id: { in: [8001, 8002] } } })

    await prisma.riskReport.createMany({
      data: [
        { id: 8001, userId: provider1.id, taskId: 12, type: 'ORIGINALITY', level: 'MEDIUM',
          title: '作品原创性检测 - 相似度偏高',
          description: '检测到海报设计稿与网络公开素材相似度为68%，建议原创性复核',
          evidence: 'similarity:68%, matched_sources:3',
          handled: false,
          createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
        { id: 8002, userId: provider1.id, type: 'COMPLAINT', level: 'LOW',
          title: '历史投诉提醒',
          description: '该服务商近90天内有1起投诉记录（已解决），投诉率3.3%，处于正常水平',
          handled: true, result: '投诉已妥善处理，不影响继续合作',
          createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
      ],
    })

    for (const skill of createdSkills) {
      const [demandCount, supplyCount] = await Promise.all([
        prisma.task.count({
          where: {
            status: { not: 'DRAFT' },
            skills: { some: { id: skill.id } },
          },
        }),
        prisma.user.count({
          where: {
            role: 'PROVIDER',
            skills: { some: { id: skill.id } },
          },
        }),
      ])
      await prisma.skill.update({
        where: { id: skill.id },
        data: { demandCount, supplyCount },
      })
    }

    console.log('✅ 演示数据刷新完成！')
    console.log(`   - 用户: 8个（2雇主+4服务商+2管理员/专家）`)
    console.log(`   - 技能: ${createdSkills.length}个（含实时供需统计）`)
    console.log(`   - 任务: 13个（招标中10+开发中1+争议中1+已完成1）`)
    console.log(`   - 投标: ${bidData.length}个`)
    console.log(`   - 里程碑: 8个（含已付款/待验收/待处理）`)
    console.log(`   - 文件版本: 6个（含协同标注）`)
    console.log(`   - 支付记录: 7条（托管/释放/收入）`)
    console.log(`   - 争议: 1起（含证据链+专家评审待处理）`)
    console.log(`   - 风控报告: 2条（原创性检测+投诉预警）`)
  } catch (e) {
    console.error('❌ 数据刷新失败:', e)
  }
}
