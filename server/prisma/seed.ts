import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始播种数据...')
  
  const hashedPassword = await bcrypt.hash('123456', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: '平台管理员',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  })
  console.log('✅ 管理员账号创建成功:', admin.email)
  
  const employer1 = await prisma.user.upsert({
    where: { email: 'employer1@example.com' },
    update: {},
    create: {
      email: 'employer1@example.com',
      username: '创意创业者',
      passwordHash: hashedPassword,
      role: 'EMPLOYER',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=employer1',
      balance: 50000,
      bio: '专注互联网产品创业，需要大量设计开发服务',
    },
  })
  console.log('✅ 雇主账号创建成功:', employer1.email)
  
  const provider1 = await prisma.user.upsert({
    where: { email: 'provider1@example.com' },
    update: {},
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
    },
  })
  console.log('✅ 服务商账号1创建成功:', provider1.email)
  
  const provider2 = await prisma.user.upsert({
    where: { email: 'provider2@example.com' },
    update: {},
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
    },
  })
  console.log('✅ 服务商账号2创建成功:', provider2.email)
  
  const skills = [
    { name: 'UI设计', category: '设计', description: '用户界面设计' },
    { name: 'Logo设计', category: '设计', description: '品牌Logo设计' },
    { name: '海报设计', category: '设计', description: '海报/宣传图设计' },
    { name: '网页设计', category: '设计', description: '网站页面设计' },
    { name: '微信小程序开发', category: '开发', description: '微信小程序开发' },
    { name: 'APP开发', category: '开发', description: '移动应用开发' },
    { name: '网站开发', category: '开发', description: '企业网站开发' },
    { name: '短视频脚本', category: '文案', description: '短视频脚本撰写' },
    { name: '公众号文案', category: '文案', description: '微信公众号文章撰写' },
    { name: '品牌文案', category: '文案', description: '品牌宣传文案' },
    { name: 'SEO优化', category: '营销', description: '搜索引擎优化' },
    { name: '新媒体运营', category: '营销', description: '新媒体账号运营' },
    { name: '室内装修设计', category: '装修', description: '室内空间设计' },
    { name: '店面装修', category: '装修', description: '商铺店面装修设计' },
  ]
  
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    })
  }
  console.log('✅ 技能数据创建成功:', skills.length, '个技能')
  
  await prisma.user.update({
    where: { id: provider1.id },
    data: {
      skills: { connect: [{ name: 'UI设计' }, { name: 'Logo设计' }, { name: '网页设计' }] },
    },
  })
  
  await prisma.user.update({
    where: { id: provider2.id },
    data: {
      skills: { connect: [{ name: '微信小程序开发' }, { name: 'APP开发' }, { name: '网站开发' }] },
    },
  })
  console.log('✅ 服务商技能关联成功')
  
  const deadlineDate = new Date()
  deadlineDate.setDate(deadlineDate.getDate() + 15)
  
  const task1 = await prisma.task.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: '电商APP UI界面设计',
      description: '需要设计一套完整的电商APP界面，包括首页、分类、购物车、个人中心等主要页面，共约20个页面。要求风格简洁现代，配色以橙色为主色调。',
      category: 'DESIGN',
      status: 'BIDDING',
      budgetMin: 8000,
      budgetMax: 15000,
      deadline: deadlineDate,
      employerId: employer1.id,
      publishedAt: new Date(),
      skills: { connect: [{ name: 'UI设计' }, { name: 'APP开发' }] },
    },
  })
  console.log('✅ 任务1创建成功:', task1.title)
  
  const deadlineDate2 = new Date()
  deadlineDate2.setDate(deadlineDate2.getDate() + 30)
  
  const task2 = await prisma.task.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: '微信小程序开发 - 预约服务系统',
      description: '开发一款预约服务类微信小程序，包含用户端和商家端，功能包括服务展示、在线预约、订单管理、支付等。需要前后端完整开发。',
      category: 'DEVELOPMENT',
      status: 'BIDDING',
      budgetMin: 20000,
      budgetMax: 35000,
      deadline: deadlineDate2,
      employerId: employer1.id,
      publishedAt: new Date(),
      skills: { connect: [{ name: '微信小程序开发' }] },
    },
  })
  console.log('✅ 任务2创建成功:', task2.title)
  
  const deadlineDate3 = new Date()
  deadlineDate3.setDate(deadlineDate3.getDate() + 7)
  
  const task3 = await prisma.task.upsert({
    where: { id: 3 },
    update: {},
    create: {
      title: '公司品牌Logo设计',
      description: '科技公司品牌Logo设计，需要提供3个初稿方案，选中后提供源文件和品牌规范。要求简洁大气，有科技感。',
      category: 'DESIGN',
      status: 'BIDDING',
      budgetMin: 2000,
      budgetMax: 5000,
      deadline: deadlineDate3,
      employerId: employer1.id,
      publishedAt: new Date(),
      skills: { connect: [{ name: 'Logo设计' }] },
    },
  })
  console.log('✅ 任务3创建成功:', task3.title)
  
  await prisma.bid.create({
    data: {
      taskId: task1.id,
      providerId: provider1.id,
      price: 12000,
      deliveryDays: 12,
      proposal: '您好！我有5年电商APP设计经验，曾服务过多家知名电商平台。我会为您提供：1）3套首页设计方案 2）20+个页面设计 3）不限次数修改 4）全套源文件交付。期待与您合作！',
      status: 'PENDING',
      portfolioUrls: 'https://example.com/portfolio1,https://example.com/portfolio2',
    },
  })
  
  await prisma.bid.create({
    data: {
      taskId: task2.id,
      providerId: provider2.id,
      price: 28000,
      deliveryDays: 25,
      proposal: '全栈开发团队，8年小程序开发经验。我们将提供：1）需求梳理与原型设计 2）前后端完整开发 3）3个月免费维护 4）代码文档齐全。保证按期高质量交付！',
      status: 'PENDING',
    },
  })
  
  console.log('✅ 投标数据创建成功')
  
  console.log('\n🎉 种子数据播种完成！')
  console.log('📧 测试账号：')
  console.log('   管理员: admin@example.com / 123456')
  console.log('   雇主: employer1@example.com / 123456')
  console.log('   服务商1: provider1@example.com / 123456')
  console.log('   服务商2: provider2@example.com / 123456')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
