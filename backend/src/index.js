require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');
require('./models');

const PORT = parseInt(process.env.PORT) || 11093;

async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    await sequelize.sync({ alter: true });
    console.log('数据库同步完成');
    
    const { User, Project, Registration, Bid } = require('./models');
    
    let adminUser = await User.findOne({ where: { username: 'admin' } });
    
    if (!adminUser) {
      adminUser = await User.create({
        username: 'admin',
        password: 'Admin123!',
        role: 'supervisor',
        realName: '系统管理员',
        phone: '13800138000',
        email: 'admin@gov-procurement.com',
        organization: '公共资源交易中心',
        status: 'active'
      });
      console.log('默认管理员账户已创建: admin / Admin123!');
    }
    
    let tendererUser = await User.findOne({ where: { username: 'tenderer' } });
    if (!tendererUser) {
      tendererUser = await User.create({
        username: 'tenderer',
        password: 'Tenderer123!',
        role: 'tenderer',
        realName: '招标方测试',
        phone: '13800138001',
        email: 'tenderer@example.com',
        organization: '测试招标单位',
        status: 'active'
      });
      console.log('默认招标方账户已创建: tenderer / Tenderer123!');
    }
    
    let bidderUser = await User.findOne({ where: { username: 'bidder' } });
    if (!bidderUser) {
      bidderUser = await User.create({
        username: 'bidder',
        password: 'Bidder123!',
        role: 'bidder',
        realName: '竞买人测试',
        phone: '13800138002',
        email: 'bidder@example.com',
        organization: '测试竞买单位',
        status: 'active'
      });
      console.log('默认竞买人账户已创建: bidder / Bidder123!');
    }
    
    let bidderUser2 = await User.findOne({ where: { username: 'bidder2' } });
    if (!bidderUser2) {
      bidderUser2 = await User.create({
        username: 'bidder2',
        password: 'Bidder123!',
        role: 'bidder',
        realName: '竞买人测试2',
        phone: '13800138022',
        email: 'bidder2@example.com',
        organization: '测试竞买单位二',
        status: 'active'
      });
      console.log('默认竞买人账户2已创建: bidder2 / Bidder123!');
    }
    
    let auditorUser = await User.findOne({ where: { username: 'auditor' } });
    if (!auditorUser) {
      auditorUser = await User.create({
        username: 'auditor',
        password: 'Auditor123!',
        role: 'auditor',
        realName: '审计员测试',
        phone: '13800138003',
        email: 'auditor@example.com',
        organization: '审计部门',
        status: 'active'
      });
      console.log('默认审计员账户已创建: auditor / Auditor123!');
    }
    
    const now = new Date();
    const existingProjects = await Project.count();
    if (existingProjects === 0) {
      console.log('正在初始化测试项目数据...');
      
      const project1 = await Project.create({
        projectNumber: 'XM-20260430-0001',
        name: '办公电脑及外设采购项目',
        description: '采购办公台式电脑20台，打印机5台，扫描仪2台，预算15万元',
        budget: 150000.00,
        depositAmount: 5000.00,
        status: 'announcing',
        announcementTime: now,
        registrationDeadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        biddingStartTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        biddingEndTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        tendererId: tendererUser.id,
        branchCenter: '北京市分中心',
        category: '货物类'
      });
      console.log('测试项目1已创建: ' + project1.name + ' [公告中]');
      
      const project2 = await Project.create({
        projectNumber: 'XM-20260430-0002',
        name: '会议室装修改造工程',
        description: '对办公楼3层会议室进行装修改造，包括墙面、地板、吊顶、照明等',
        budget: 280000.00,
        depositAmount: 10000.00,
        status: 'bidding',
        announcementTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        registrationDeadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        biddingStartTime: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        biddingEndTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        tendererId: tendererUser.id,
        branchCenter: '北京市分中心',
        category: '工程类'
      });
      console.log('测试项目2已创建: ' + project2.name + ' [竞价中]');
      
      const project3 = await Project.create({
        projectNumber: 'XM-20260430-0003',
        name: '网络安全服务采购',
        description: '采购网络安全检测、漏洞扫描、安全加固等服务',
        budget: 80000.00,
        depositAmount: 3000.00,
        status: 'draft',
        registrationDeadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        biddingStartTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
        biddingEndTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        tendererId: tendererUser.id,
        branchCenter: '上海市分中心',
        category: '服务类'
      });
      console.log('测试项目3已创建: ' + project3.name + ' [草稿]');
      
      console.log('');
      console.log('========================================');
      console.log('  测试数据初始化完成');
      console.log('========================================');
      console.log('');
    }
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

async function startServer() {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log('');
    console.log('========================================');
    console.log('  政府采购管理业务系统 - 后端服务');
    console.log('========================================');
    console.log('');
    console.log(`  服务端口: ${PORT}`);
    console.log(`  健康检查: http://localhost:${PORT}/api/health`);
    console.log('');
    console.log('  四大核心引擎:');
    console.log('  ✓ Escrow-Control  托管引擎 - 保证金管理');
    console.log('  ✓ Auction-Bid     竞价引擎 - 实时排名');
    console.log('  ✓ Bid-Security    加密引擎 - 签名验证');
    console.log('  ✓ Integrity-Verify 审计引擎 - 风控审计');
    console.log('');
    console.log('  默认测试账户:');
    console.log('  管理员   : admin / Admin123!');
    console.log('  招标方   : tenderer / Tenderer123!');
    console.log('  竞买人   : bidder / Bidder123!');
    console.log('  审计员   : auditor / Auditor123!');
    console.log('');
    console.log('  前端地址 : http://localhost:21093');
    console.log('');
    console.log('========================================');
    console.log(`  服务启动时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log('========================================');
    console.log('');
  });
}

startServer();
