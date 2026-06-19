import db from '../db/index.js';

const PASSWORD = '123456';

const unionOrgs = [
  { name: '北京市总工会', type: 'provincial', parentId: null, memberCount: 50000, totalEmployees: 80000, coverageRate: 62.5 },
  { name: '上海市总工会', type: 'provincial', parentId: null, memberCount: 60000, totalEmployees: 90000, coverageRate: 66.7 },
  { name: '广东省总工会', type: 'provincial', parentId: null, memberCount: 80000, totalEmployees: 120000, coverageRate: 66.7 },
  { name: '北京市东城区总工会', type: 'city', parentId: 1, memberCount: 15000, totalEmployees: 22000, coverageRate: 68.2 },
  { name: '北京市西城区总工会', type: 'city', parentId: 1, memberCount: 12000, totalEmployees: 18000, coverageRate: 66.7 },
  { name: '上海市浦东新区总工会', type: 'city', parentId: 2, memberCount: 20000, totalEmployees: 30000, coverageRate: 66.7 },
  { name: '广州市天河区总工会', type: 'city', parentId: 3, memberCount: 25000, totalEmployees: 38000, coverageRate: 65.8 },
  { name: '深圳市南山区总工会', type: 'city', parentId: 3, memberCount: 30000, totalEmployees: 45000, coverageRate: 66.7 },
  { name: '东城区朝阳门街道工会', type: 'district', parentId: 4, memberCount: 3000, totalEmployees: 4500, coverageRate: 66.7 },
  { name: '东城区东华门街道工会', type: 'district', parentId: 4, memberCount: 2500, totalEmployees: 3800, coverageRate: 65.8 },
  { name: '西城区德胜街道工会', type: 'district', parentId: 5, memberCount: 2800, totalEmployees: 4200, coverageRate: 66.7 },
  { name: '浦东新区陆家嘴街道工会', type: 'district', parentId: 6, memberCount: 5000, totalEmployees: 7500, coverageRate: 66.7 },
  { name: '天河区石牌街道工会', type: 'district', parentId: 7, memberCount: 6000, totalEmployees: 9000, coverageRate: 66.7 },
  { name: '南山区科技园街道工会', type: 'district', parentId: 8, memberCount: 8000, totalEmployees: 12000, coverageRate: 66.7 },
  { name: '北京汽车集团有限公司工会', type: 'enterprise', parentId: 9, memberCount: 1200, totalEmployees: 1500, coverageRate: 80.0 },
  { name: '北京同仁堂集团工会', type: 'enterprise', parentId: 10, memberCount: 800, totalEmployees: 1000, coverageRate: 80.0 },
  { name: '上海汽车集团股份有限公司工会', type: 'enterprise', parentId: 12, memberCount: 2000, totalEmployees: 2500, coverageRate: 80.0 },
  { name: '广州汽车集团股份有限公司工会', type: 'enterprise', parentId: 13, memberCount: 1800, totalEmployees: 2200, coverageRate: 81.8 },
  { name: '华为技术有限公司工会', type: 'enterprise', parentId: 14, memberCount: 5000, totalEmployees: 6000, coverageRate: 83.3 },
  { name: '腾讯科技有限公司工会', type: 'enterprise', parentId: 14, memberCount: 4500, totalEmployees: 5500, coverageRate: 81.8 },
];

const users = [
  { idCard: '110101199001010001', name: '张三', phone: '13800138001', password: PASSWORD, role: 'worker', memberStatus: 'approved' },
  { idCard: '110101199002020002', name: '李四', phone: '13800138002', password: PASSWORD, role: 'union_admin', memberStatus: 'approved' },
  { idCard: '110101199003030003', name: '王五', phone: '13800138003', password: PASSWORD, role: 'provincial_admin', memberStatus: 'approved' },
  { idCard: '110101199004040004', name: '赵六', phone: '13800138004', password: PASSWORD, role: 'lawyer', memberStatus: 'approved' },
  { idCard: '310101199005050005', name: '陈七', phone: '13800138005', password: PASSWORD, role: 'worker', memberStatus: 'pending' },
];

const courses = [
  { title: 'Python 编程入门', category: '软件开发', totalHours: 40, skillLevel: 'beginner', description: '从零开始学习 Python 编程语言，掌握基础语法和常用库' },
  { title: 'Java 高级开发', category: '软件开发', totalHours: 60, skillLevel: 'advanced', description: '深入学习 Java 高级特性，包括并发编程、JVM 调优等' },
  { title: '前端开发实战', category: '软件开发', totalHours: 50, skillLevel: 'intermediate', description: 'React + TypeScript 前端开发实战课程' },
  { title: '人工智能基础', category: '人工智能', totalHours: 80, skillLevel: 'intermediate', description: '机器学习、深度学习基础理论与实践' },
  { title: '数据分析与可视化', category: '数据科学', totalHours: 45, skillLevel: 'beginner', description: '使用 Python 进行数据分析和可视化' },
  { title: '云计算技术', category: '云计算', totalHours: 55, skillLevel: 'intermediate', description: '阿里云、AWS 云计算平台操作与运维' },
  { title: '网络安全基础', category: '网络安全', totalHours: 50, skillLevel: 'beginner', description: '网络安全基础知识、渗透测试入门' },
  { title: '电工技能培训', category: '职业技能', totalHours: 60, skillLevel: 'beginner', description: '电工基础知识、安全操作规范' },
  { title: '焊工技能培训', category: '职业技能', totalHours: 70, skillLevel: 'intermediate', description: '各种焊接技术实操培训' },
  { title: '企业管理实务', category: '管理培训', totalHours: 35, skillLevel: 'intermediate', description: '现代企业管理理念与实务操作' },
];

const lawyers = [
  { userId: 4, licenseNumber: 'LAW001', specialty: '劳动争议,民事纠纷', experienceYears: 8, caseCount: 156, rating: 4.8, verified: true },
  { userId: 0, licenseNumber: 'LAW002', specialty: '劳动争议,公司法务', experienceYears: 12, caseCount: 289, rating: 4.9, verified: true },
  { userId: 0, licenseNumber: 'LAW003', specialty: '民事纠纷,婚姻家庭', experienceYears: 6, caseCount: 98, rating: 4.6, verified: true },
  { userId: 0, licenseNumber: 'LAW004', specialty: '刑事辩护,劳动争议', experienceYears: 15, caseCount: 356, rating: 4.9, verified: true },
  { userId: 0, licenseNumber: 'LAW005', specialty: '合同纠纷,知识产权', experienceYears: 7, caseCount: 120, rating: 4.7, verified: true },
  { userId: 0, licenseNumber: 'LAW006', specialty: '劳动争议,人身损害', experienceYears: 5, caseCount: 78, rating: 4.5, verified: true },
  { userId: 0, licenseNumber: 'LAW007', specialty: '房产纠纷,合同纠纷', experienceYears: 10, caseCount: 189, rating: 4.8, verified: true },
  { userId: 0, licenseNumber: 'LAW008', specialty: '劳动争议,行政诉讼', experienceYears: 9, caseCount: 145, rating: 4.7, verified: true },
];

const suppliers = [
  { name: '云南普洱有机茶叶合作社', contactPerson: '李经理', phone: '13900139001', address: '云南省普洱市思茅区', baseLocation: '云南普洱', verified: true },
  { name: '福建安溪铁观音茶厂', contactPerson: '王厂长', phone: '13900139002', address: '福建省泉州市安溪县', baseLocation: '福建安溪', verified: true },
  { name: '新疆和田大枣种植基地', contactPerson: '张场长', phone: '13900139003', address: '新疆和田地区和田县', baseLocation: '新疆和田', verified: true },
  { name: '山东烟台苹果种植合作社', contactPerson: '刘社长', phone: '13900139004', address: '山东省烟台市栖霞市', baseLocation: '山东烟台', verified: true },
  { name: '江西赣南脐橙产业园', contactPerson: '陈主任', phone: '13900139005', address: '江西省赣州市信丰县', baseLocation: '江西赣州', verified: true },
];

const products = [
  { name: '普洱古树茶（357g）', price: 298.00, originalPrice: 398.00, category: '茶叶', supplierId: 1, supplyBase: '云南普洱', stock: 500 },
  { name: '安溪铁观音（250g）', price: 168.00, originalPrice: 228.00, category: '茶叶', supplierId: 2, supplyBase: '福建安溪', stock: 800 },
  { name: '新疆和田大枣（500g）', price: 68.00, originalPrice: 98.00, category: '干果', supplierId: 3, supplyBase: '新疆和田', stock: 1200 },
  { name: '山东烟台红富士（5kg）', price: 88.00, originalPrice: 128.00, category: '水果', supplierId: 4, supplyBase: '山东烟台', stock: 600 },
  { name: '江西赣南脐橙（5kg）', price: 78.00, originalPrice: 108.00, category: '水果', supplierId: 5, supplyBase: '江西赣州', stock: 900 },
  { name: '正山小种红茶（200g）', price: 198.00, originalPrice: 268.00, category: '茶叶', supplierId: 1, supplyBase: '福建武夷山', stock: 400 },
  { name: '云南核桃（500g）', price: 58.00, originalPrice: 78.00, category: '干果', supplierId: 3, supplyBase: '云南大理', stock: 1500 },
  { name: '宁夏枸杞（250g）', price: 88.00, originalPrice: 118.00, category: '滋补品', supplierId: 3, supplyBase: '宁夏中宁', stock: 700 },
  { name: '东北五常大米（5kg）', price: 128.00, originalPrice: 168.00, category: '粮油', supplierId: 4, supplyBase: '黑龙江五常', stock: 450 },
  { name: '内蒙古牛羊肉礼盒', price: 398.00, originalPrice: 528.00, category: '生鲜', supplierId: 4, supplyBase: '内蒙古锡林郭勒', stock: 200 },
  { name: '西湖龙井（250g）', price: 258.00, originalPrice: 338.00, category: '茶叶', supplierId: 2, supplyBase: '浙江杭州', stock: 350 },
  { name: '四川柑橘（5kg）', price: 58.00, originalPrice: 78.00, category: '水果', supplierId: 5, supplyBase: '四川蒲江', stock: 1000 },
  { name: '贵州茅台酒（飞天53度）', price: 1499.00, originalPrice: 1699.00, category: '酒水', supplierId: 1, supplyBase: '贵州茅台镇', stock: 100 },
  { name: '广西柳州螺蛳粉（10包装）', price: 78.00, originalPrice: 98.00, category: '方便食品', supplierId: 5, supplyBase: '广西柳州', stock: 800 },
  { name: '湖南安化黑茶（1kg）', price: 188.00, originalPrice: 248.00, category: '茶叶', supplierId: 1, supplyBase: '湖南安化', stock: 400 },
  { name: '河南铁棍山药（2.5kg）', price: 68.00, originalPrice: 88.00, category: '蔬菜', supplierId: 4, supplyBase: '河南焦作', stock: 600 },
  { name: '吉林长白山人参', price: 298.00, originalPrice: 398.00, category: '滋补品', supplierId: 3, supplyBase: '吉林长白山', stock: 300 },
  { name: '江苏阳澄湖大闸蟹礼盒', price: 498.00, originalPrice: 628.00, category: '生鲜', supplierId: 2, supplyBase: '江苏苏州', stock: 150 },
  { name: '广东新会陈皮（10年）', price: 198.00, originalPrice: 258.00, category: '滋补品', supplierId: 5, supplyBase: '广东江门', stock: 500 },
  { name: '海南热带水果礼盒', price: 168.00, originalPrice: 218.00, category: '水果', supplierId: 5, supplyBase: '海南三亚', stock: 700 },
];

const appealCategories = ['complaint', 'suggestion', 'praise'];
const appealSentiments = ['positive', 'neutral', 'negative'];

const generateAppeals = () => {
  const complaints = [
    { title: '食堂饭菜质量问题', content: '最近食堂饭菜质量明显下降，价格却没有变化，希望能够改善。', category: 'complaint' },
    { title: '加班工资计算不合理', content: '上个月的加班工资计算有误，双休日加班只按1.5倍计算，应该按2倍计算。', category: 'complaint' },
    { title: '员工宿舍设施损坏', content: '3号楼5层的热水器已经坏了一周了，还没有人来修理，严重影响员工生活。', category: 'complaint' },
    { title: '班车班次太少', content: '上下班的班车班次太少，经常挤不上车，建议增加班次。', category: 'complaint' },
    { title: '年假审批流程太慢', content: '年假申请提交了半个月还没有批下来，流程效率太低。', category: 'complaint' },
    { title: '办公环境噪音大', content: '最近办公室在装修，噪音很大，严重影响工作效率。', category: 'complaint' },
    { title: '停车位不足', content: '公司停车位严重不足，很多员工只能停到很远的地方。', category: 'complaint' },
    { title: '无线网络不稳定', content: '办公室的无线网络经常断线，影响视频会议和正常办公。', category: 'complaint' },
    { title: '绩效考核不公', content: '绩效考核标准不透明，存在打分不公的情况。', category: 'complaint' },
    { title: '培训机会太少', content: '今年几乎没有组织什么培训，希望能多提供一些学习机会。', category: 'complaint' },
  ];
  const suggestions = [
    { title: '建议增加员工健身房', content: '建议公司开设员工健身房，方便员工锻炼身体，提高工作效率。', category: 'suggestion' },
    { title: '建议实行弹性工作制', content: '建议实行弹性工作制，允许员工根据自身情况调整上下班时间。', category: 'suggestion' },
    { title: '建议增加亲子活动室', content: '公司年轻员工较多，建议设立亲子活动室，方便照顾孩子。', category: 'suggestion' },
    { title: '建议定期组织团建活动', content: '建议每季度组织一次团建活动，增强团队凝聚力。', category: 'suggestion' },
    { title: '建议改善食堂就餐环境', content: '食堂就餐环境比较拥挤，建议扩建或改善就餐环境。', category: 'suggestion' },
    { title: '建议增加心理咨询服务', content: '现代工作压力大，建议为员工提供免费的心理咨询服务。', category: 'suggestion' },
    { title: '建议设立图书角', content: '建议在办公区设立图书角，提供各类书籍供员工阅读学习。', category: 'suggestion' },
    { title: '建议优化OA系统', content: 'OA系统操作复杂，建议优化界面和流程，提高使用体验。', category: 'suggestion' },
    { title: '建议增加停车位', content: '建议与周边停车场合作，为员工争取更多的停车优惠。', category: 'suggestion' },
    { title: '建议开展技能比赛', content: '建议定期开展各类技能比赛，激发员工学习热情。', category: 'suggestion' },
  ];
  const praises = [
    { title: '感谢工会组织的体检', content: '感谢工会为全体员工安排的体检，服务很好，项目也很全面。', category: 'praise' },
    { title: '表扬技术部的同事', content: '技术部的同事们加班加点完成了系统升级，工作态度值得表扬。', category: 'praise' },
    { title: '感谢领导的关怀', content: '上个月生病住院，领导和同事们专程来看望，非常感动。', category: 'praise' },
    { title: '表扬HR部门的工作', content: '今年的年会组织得非常好，节目精彩，气氛热烈。', category: 'praise' },
    { title: '感谢公司的培训机会', content: '参加了公司组织的技能培训，收获很大，感谢公司提供的学习机会。', category: 'praise' },
    { title: '表扬食堂的改进', content: '食堂最近增加了很多新菜品，味道也不错，值得肯定。', category: 'praise' },
    { title: '感谢公司的节日福利', content: '中秋节收到了公司发放的月饼和水果，非常暖心。', category: 'praise' },
    { title: '表扬行政部的效率', content: '办公设备报修后很快就有人来处理，效率很高。', category: 'praise' },
    { title: '感谢公司的困难补助', content: '家庭遇到困难时，公司及时给予了补助，非常感谢。', category: 'praise' },
    { title: '表扬安保人员的工作', content: '安保人员认真负责，夜间巡逻到位，让我们工作很安心。', category: 'praise' },
  ];
  return [...complaints, ...suggestions, ...praises];
};

const fundPurposes = ['最低生活保障补助', '医疗救助', '子女教育补助', '突发困难补助', '残疾补助', '大病救助', '自然灾害救助'];
const fundStatuses: Array<'pending' | 'approved' | 'released' | 'received'> = ['pending', 'approved', 'released', 'received'];
const fromOrgs = ['北京市总工会', '上海市总工会', '广东省总工会', '北京市东城区总工会', '上海市浦东新区总工会'];
const toOrgs = ['北京汽车集团有限公司工会', '上海汽车集团股份有限公司工会', '华为技术有限公司工会', '腾讯科技有限公司工会', '广州汽车集团股份有限公司工会'];

const datingProfiles = [
  { userId: 1, age: 28, city: '北京', occupation: '软件工程师', height: 175, tags: ['程序员', '运动达人', '电影爱好者'], hobbies: ['篮球', '摄影', '旅行'] },
  { userId: 5, age: 26, city: '上海', occupation: '产品经理', height: 165, tags: ['文艺青年', '美食家', '瑜伽爱好者'], hobbies: ['阅读', '烹饪', '瑜伽'] },
  { userId: 0, age: 30, city: '广州', occupation: '医生', height: 180, tags: ['医生', '稳重', '健身达人'], hobbies: ['健身', '游泳', '看电影'] },
  { userId: 0, age: 27, city: '深圳', occupation: '教师', height: 168, tags: ['教师', '温柔', '音乐爱好者'], hobbies: ['弹钢琴', '唱歌', '旅行'] },
  { userId: 0, age: 32, city: '杭州', occupation: '设计师', height: 178, tags: ['设计师', '文艺', '宠物主人'], hobbies: ['画画', '养猫', '咖啡'] },
  { userId: 0, age: 29, city: '成都', occupation: '公务员', height: 172, tags: ['公务员', '踏实', '美食爱好者'], hobbies: ['做菜', '跑步', '看综艺'] },
  { userId: 0, age: 31, city: '南京', occupation: '金融分析师', height: 182, tags: ['金融', '理性', '摄影爱好者'], hobbies: ['摄影', '理财', '登山'] },
  { userId: 0, age: 25, city: '武汉', occupation: '护士', height: 162, tags: ['护士', '细心', '爱干净'], hobbies: ['种花', '做手工', '追剧'] },
  { userId: 0, age: 33, city: '西安', occupation: '律师', height: 176, tags: ['律师', '口才好', '运动'], hobbies: ['羽毛球', '看书', '听音乐'] },
  { userId: 0, age: 28, city: '重庆', occupation: '创业者', height: 174, tags: ['创业', '开朗', '冒险'], hobbies: ['自驾游', '潜水', '美食'] },
];

const randomDateStr = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString();
};

export const seedDatabase = () => {
  const transaction = db.transaction(() => {
    const countUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (countUsers.count > 0) {
      console.log('数据库已存在种子数据，跳过初始化');
      return;
    }

    const insertUnion = db.prepare(
      'INSERT INTO union_organizations (name, type, parent_id, member_count, total_employees, coverage_rate) VALUES (?, ?, ?, ?, ?, ?)'
    );
    unionOrgs.forEach((org) => {
      insertUnion.run(org.name, org.type, org.parentId, org.memberCount, org.totalEmployees, org.coverageRate);
    });

    const insertUser = db.prepare(
      'INSERT INTO users (id_card, name, phone, password, role, member_status) VALUES (?, ?, ?, ?, ?, ?)'
    );
    users.forEach((user) => {
      insertUser.run(user.idCard, user.name, user.phone, user.password, user.role, user.memberStatus);
    });

    const insertCourse = db.prepare(
      'INSERT INTO courses (title, category, total_hours, skill_level, description) VALUES (?, ?, ?, ?, ?)'
    );
    courses.forEach((course) => {
      insertCourse.run(course.title, course.category, course.totalHours, course.skillLevel, course.description);
    });

    const insertSupplier = db.prepare(
      'INSERT INTO suppliers (name, contact_person, phone, address, base_location, verified) VALUES (?, ?, ?, ?, ?, ?)'
    );
    suppliers.forEach((supplier) => {
      insertSupplier.run(supplier.name, supplier.contactPerson, supplier.phone, supplier.address, supplier.baseLocation, supplier.verified);
    });

    const insertProduct = db.prepare(
      'INSERT INTO products (name, price, original_price, category, supplier_id, supply_base, stock) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    products.forEach((product) => {
      insertProduct.run(product.name, product.price, product.originalPrice, product.category, product.supplierId, product.supplyBase, product.stock);
    });

    const insertLawyer = db.prepare(
      'INSERT INTO lawyers (user_id, license_number, specialty, experience_years, case_count, rating, verified) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    lawyers.forEach((lawyer) => {
      const userId = lawyer.userId > 0 ? lawyer.userId : Math.floor(Math.random() * 5) + 1;
      insertLawyer.run(userId, lawyer.licenseNumber, lawyer.specialty, lawyer.experienceYears, lawyer.caseCount, lawyer.rating, lawyer.verified);
    });

    const insertAppeal = db.prepare(
      'INSERT INTO appeals (user_id, title, content, category, sentiment, sentiment_score, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const appeals = generateAppeals();
    appeals.forEach((appeal, index) => {
      const userId = (index % 5) + 1;
      const sentiment = appeal.category === 'praise' ? 'positive' : appeal.category === 'complaint' ? 'negative' : 'neutral';
      const sentimentScore = appeal.category === 'praise' ? 0.8 + Math.random() * 0.2 : appeal.category === 'complaint' ? 0.1 + Math.random() * 0.3 : 0.4 + Math.random() * 0.3;
      const status = Math.random() > 0.3 ? 'resolved' : 'pending';
      insertAppeal.run(userId, appeal.title, appeal.content, appeal.category, sentiment, sentimentScore, status);
    });

    const insertAssistance = db.prepare(
      'INSERT INTO assistance_applications (user_id, assistance_type, family_income, family_member_count, description, status, auto_review_passed, auto_review_score, fund_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const assistanceTypes = ['minimum_allowance', 'disability', 'serious_illness', 'disaster', 'other'];
    for (let i = 0; i < 15; i++) {
      const userId = (i % 5) + 1;
      const assistanceType = assistanceTypes[Math.floor(Math.random() * assistanceTypes.length)];
      const familyIncome = 2000 + Math.floor(Math.random() * 5000);
      const familyMemberCount = 2 + Math.floor(Math.random() * 4);
      const autoReviewPassed = Math.random() > 0.3;
      const autoReviewScore = autoReviewPassed ? 70 + Math.floor(Math.random() * 30) : 30 + Math.floor(Math.random() * 30);
      const statusList: Array<'draft' | 'auto_review' | 'manual_review' | 'union_approved' | 'provincial_approved' | 'funded' | 'rejected'> = ['union_approved', 'provincial_approved', 'funded', 'rejected'];
      const status = statusList[Math.floor(Math.random() * statusList.length)];
      const fundAmount = status === 'funded' ? 3000 + Math.floor(Math.random() * 15000) : null;
      insertAssistance.run(userId, assistanceType, familyIncome, familyMemberCount, `申请${assistanceType}补助`, status, autoReviewPassed, autoReviewScore, fundAmount);
    }

    const insertFundFlow = db.prepare(
      'INSERT INTO fund_flows (id, application_id, from_org, to_org, amount, status, purpose, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insertAuditLog = db.prepare(
      'INSERT INTO audit_logs (fund_id, action, operator, operator_role, details, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (let i = 0; i < 15; i++) {
      const fundId = `FUND${String(i + 1).padStart(6, '0')}`;
      const applicationId = i + 1;
      const fromOrg = fromOrgs[Math.floor(Math.random() * fromOrgs.length)];
      const toOrg = toOrgs[Math.floor(Math.random() * toOrgs.length)];
      const amount = 3000 + Math.floor(Math.random() * 15000);
      const status = fundStatuses[Math.floor(Math.random() * fundStatuses.length)];
      const purpose = fundPurposes[Math.floor(Math.random() * fundPurposes.length)];
      const createdAt = randomDateStr(60);
      insertFundFlow.run(fundId, applicationId, fromOrg, toOrg, amount, status, purpose, createdAt);

      const actions = ['创建申请', '工会审核通过', '省总工会审批通过', '资金拨付', '资金已到账'];
      const operators = ['系统', '张工会', '李主席', '王财务', '刘出纳'];
      const roles = ['system', 'union_admin', 'provincial_admin', 'union_admin', 'union_admin'];
      actions.forEach((action, idx) => {
        if (status === 'pending' && idx > 1) return;
        if (status === 'approved' && idx > 2) return;
        if (status === 'released' && idx > 3) return;
        const logDate = new Date(createdAt);
        logDate.setDate(logDate.getDate() + idx * 2);
        insertAuditLog.run(fundId, action, operators[idx], roles[idx], `${action}操作完成`, logDate.toISOString());
      });
    }

    const insertDatingProfile = db.prepare(
      'INSERT INTO dating_profiles (user_id, age, city, occupation, height, tags, hobbies, privacy_mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    datingProfiles.forEach((profile) => {
      const userId = profile.userId > 0 ? profile.userId : Math.floor(Math.random() * 5) + 1;
      insertDatingProfile.run(userId, profile.age, profile.city, profile.occupation, profile.height, JSON.stringify(profile.tags), JSON.stringify(profile.hobbies), true);
    });

    console.log('数据库种子数据初始化完成');
  });

  try {
    transaction();
  } catch (error) {
    console.error('数据库种子数据初始化失败:', error);
    throw error;
  }
};

export default seedDatabase;
