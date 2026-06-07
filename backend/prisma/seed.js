const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      phone: '13800000000',
      name: '系统管理员',
      passwordHash: hashedPassword,
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: { age: 30, city: '北京市' },
    create: {
      email: 'user@example.com',
      phone: '13800000001',
      name: '张三',
      passwordHash: hashedPassword,
      role: 'user',
      socialSecurityBase: 10000,
      resignationRisk: 'low',
      age: 30,
      city: '北京市',
    },
  });

  const enterprise = await prisma.enterprise.upsert({
    where: { id: 'ent-001' },
    update: {},
    create: {
      id: 'ent-001',
      name: '示例科技有限公司',
      socialSecurityAccountStatus: 'active',
      employeeCountThreshold: 100,
      complianceScore: 92.5,
    },
  });

  await prisma.user.upsert({
    where: { email: 'hr@example.com' },
    update: {},
    create: {
      email: 'hr@example.com',
      phone: '13800000002',
      name: 'HR经理',
      passwordHash: hashedPassword,
      role: 'enterprise',
      enterpriseId: enterprise.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'platform@example.com' },
    update: {},
    create: {
      email: 'platform@example.com',
      phone: '13800000003',
      name: '平台运营',
      passwordHash: hashedPassword,
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'ops@example.com' },
    update: {},
    create: {
      email: 'ops@example.com',
      phone: '13800000004',
      name: '运维管理员',
      passwordHash: hashedPassword,
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin' },
    update: {},
    create: {
      email: 'admin',
      phone: '13800000005',
      name: '超级管理员',
      passwordHash: hashedPassword,
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'platform' },
    update: {},
    create: {
      email: 'platform',
      phone: '13800000006',
      name: '平台管理员',
      passwordHash: hashedPassword,
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'ops' },
    update: {},
    create: {
      email: 'ops',
      phone: '13800000007',
      name: '运维专员',
      passwordHash: hashedPassword,
      role: 'admin',
    },
  });

  const cities = [
    {
      cityCode: '110000',
      cityName: '北京市',
      pensionRates: JSON.stringify({ personal: 0.08, company: 0.16 }),
      medicalRates: JSON.stringify({ personal: 0.02, company: 0.095 }),
      unemploymentRates: JSON.stringify({ personal: 0.002, company: 0.008 }),
      injuryRates: JSON.stringify({ company: 0.004 }),
      maternityRates: JSON.stringify({ company: 0.008 }),
      housingFundRates: JSON.stringify({ personal: 0.12, company: 0.12 }),
      minBase: 6326,
      maxBase: 33891,
      effectiveDate: new Date('2024-07-01'),
    },
    {
      cityCode: '310000',
      cityName: '上海市',
      pensionRates: JSON.stringify({ personal: 0.08, company: 0.16 }),
      medicalRates: JSON.stringify({ personal: 0.02, company: 0.095 }),
      unemploymentRates: JSON.stringify({ personal: 0.005, company: 0.005 }),
      injuryRates: JSON.stringify({ company: 0.0026 }),
      maternityRates: JSON.stringify({ company: 0.01 }),
      housingFundRates: JSON.stringify({ personal: 0.07, company: 0.07 }),
      minBase: 7310,
      maxBase: 36549,
      effectiveDate: new Date('2024-07-01'),
    },
    {
      cityCode: '440100',
      cityName: '广州市',
      pensionRates: JSON.stringify({ personal: 0.08, company: 0.14 }),
      medicalRates: JSON.stringify({ personal: 0.02, company: 0.055 }),
      unemploymentRates: JSON.stringify({ personal: 0.002, company: 0.008 }),
      injuryRates: JSON.stringify({ company: 0.002 }),
      maternityRates: JSON.stringify({ company: 0.0045 }),
      housingFundRates: JSON.stringify({ personal: 0.12, company: 0.12 }),
      minBase: 5284,
      maxBase: 26421,
      effectiveDate: new Date('2024-07-01'),
    },
    {
      cityCode: '440300',
      cityName: '深圳市',
      pensionRates: JSON.stringify({ personal: 0.08, company: 0.14 }),
      medicalRates: JSON.stringify({ personal: 0.02, company: 0.052 }),
      unemploymentRates: JSON.stringify({ personal: 0.003, company: 0.007 }),
      injuryRates: JSON.stringify({ company: 0.0018 }),
      maternityRates: JSON.stringify({ company: 0.0045 }),
      housingFundRates: JSON.stringify({ personal: 0.05, company: 0.05 }),
      minBase: 2360,
      maxBase: 27501,
      effectiveDate: new Date('2024-07-01'),
    },
    {
      cityCode: '330100',
      cityName: '杭州市',
      pensionRates: JSON.stringify({ personal: 0.08, company: 0.14 }),
      medicalRates: JSON.stringify({ personal: 0.02, company: 0.095 }),
      unemploymentRates: JSON.stringify({ personal: 0.005, company: 0.005 }),
      injuryRates: JSON.stringify({ company: 0.002 }),
      maternityRates: JSON.stringify({ company: 0.012 }),
      housingFundRates: JSON.stringify({ personal: 0.12, company: 0.12 }),
      minBase: 2490,
      maxBase: 24072,
      effectiveDate: new Date('2024-07-01'),
    },
  ];

  for (const city of cities) {
    await prisma.socialSecurityPolicy.upsert({
      where: { cityCode: city.cityCode },
      update: city,
      create: city,
    });
  }

  const lawArticles = [
    {
      id: 'law-001',
      title: '中华人民共和国劳动合同法 第一条',
      content: '为了完善劳动合同制度，明确劳动合同双方当事人的权利和义务，保护劳动者的合法权益，构建和发展和谐稳定的劳动关系，制定本法。',
      category: '劳动合同法',
    },
    {
      id: 'law-002',
      title: '中华人民共和国劳动合同法 第十条',
      content: '建立劳动关系，应当订立书面劳动合同。已建立劳动关系，未同时订立书面劳动合同的，应当自用工之日起一个月内订立书面劳动合同。用人单位与劳动者在用工前订立劳动合同的，劳动关系自用工之日起建立。',
      category: '劳动合同法',
    },
    {
      id: 'law-003',
      title: '中华人民共和国劳动合同法 第十九条',
      content: '劳动合同期限三个月以上不满一年的，试用期不得超过一个月；劳动合同期限一年以上不满三年的，试用期不得超过二个月；三年以上固定期限和无固定期限的劳动合同，试用期不得超过六个月。同一用人单位与同一劳动者只能约定一次试用期。',
      category: '劳动合同法',
    },
    {
      id: 'law-004',
      title: '中华人民共和国劳动合同法 第三十八条',
      content: '用人单位有下列情形之一的，劳动者可以解除劳动合同：（一）未按照劳动合同约定提供劳动保护或者劳动条件的；（二）未及时足额支付劳动报酬的；（三）未依法为劳动者缴纳社会保险费的；（四）用人单位的规章制度违反法律、法规的规定，损害劳动者权益的；（五）因本法第二十六条第一款规定的情形致使劳动合同无效的；（六）法律、行政法规规定劳动者可以解除劳动合同的其他情形。',
      category: '劳动合同法',
    },
    {
      id: 'law-005',
      title: '中华人民共和国社会保险法 第五十八条',
      content: '用人单位应当自用工之日起三十日内为其职工向社会保险经办机构申请办理社会保险登记。未办理社会保险登记的，由社会保险经办机构核定其应当缴纳的社会保险费。',
      category: '社会保险法',
    },
    {
      id: 'law-006',
      title: '住房公积金管理条例 第十五条',
      content: '单位录用职工的，应当自录用之日起30日内向住房公积金管理中心办理缴存登记，并办理职工住房公积金账户的设立或者转移手续。单位与职工终止劳动关系的，单位应当自劳动关系终止之日起30日内向住房公积金管理中心办理变更登记，并办理职工住房公积金账户转移或者封存手续。',
      category: '住房公积金',
    },
  ];

  for (const article of lawArticles) {
    await prisma.lawArticle.upsert({
      where: { id: article.id },
      update: article,
      create: article,
    });
  }

  const products = [
    {
      id: 'prod-001',
      name: '年度体检套餐',
      description: '包含常规体检、血液生化、影像学检查等全面体检项目',
      price: 599,
      category: '健康医疗',
      targetAudienceRules: JSON.stringify({ roles: ['user', 'enterprise'], estimatedCount: 1000 }),
      validityDays: 365,
      autoExpire: true,
      stock: 100,
      status: 'active',
    },
    {
      id: 'prod-002',
      name: '职场心理咨询服务',
      description: '专业心理咨询师一对一服务，缓解职场压力',
      price: 299,
      category: '心理健康',
      targetAudienceRules: JSON.stringify({ roles: ['user'], cities: ['北京市', '上海市', '广州市'], estimatedCount: 500 }),
      validityDays: 180,
      autoExpire: true,
      stock: 50,
      status: 'active',
    },
    {
      id: 'prod-003',
      name: '健身会员月卡',
      description: '全国连锁健身房通用月卡，含团体课程',
      price: 199,
      category: '运动健身',
      targetAudienceRules: JSON.stringify({ roles: ['user'], minAge: 18, maxAge: 45, estimatedCount: 2000 }),
      validityDays: 30,
      autoExpire: true,
      stock: 200,
      status: 'active',
    },
    {
      id: 'prod-004',
      name: '在线学习平台年卡',
      description: '海量职业技能课程免费学习，含编程、设计、管理等',
      price: 365,
      category: '教育培训',
      targetAudienceRules: JSON.stringify({ roles: ['user', 'enterprise', 'admin'], estimatedCount: 3000 }),
      validityDays: 365,
      autoExpire: true,
      stock: 150,
      status: 'active',
    },
    {
      id: 'prod-005',
      name: '节日福利礼包',
      description: '精选食品、生活用品组合礼包',
      price: 150,
      category: '节日福利',
      targetAudienceRules: JSON.stringify({ roles: ['enterprise'], enterpriseIds: ['ent-001'], estimatedCount: 100 }),
      validityDays: 90,
      autoExpire: true,
      stock: 300,
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'prod-006',
      name: '高端牙科护理套餐',
      description: '洗牙、抛光、口腔检查全套服务',
      price: 388,
      category: '健康医疗',
      targetAudienceRules: JSON.stringify({ roles: ['user', 'enterprise'], minAge: 18, maxAge: 65, estimatedCount: 800 }),
      validityDays: 180,
      autoExpire: true,
      stock: 80,
      status: 'active',
    },
  ];

  for (const product of products) {
    await prisma.welfareProduct.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }

  const employees = [
    {
      id: 'emp-001',
      enterpriseId: enterprise.id,
      name: '李四',
      idCard: '110101199001010001',
      position: '高级工程师',
      hireDate: new Date('2021-03-15'),
      contractExpiryDate: new Date('2026-03-14'),
      socialSecurityBase: 25000,
      socialSecurityStatus: 'normal',
      resignationRiskScore: 0.15,
    },
    {
      id: 'emp-002',
      enterpriseId: enterprise.id,
      name: '王五',
      idCard: '110101199202020002',
      position: '产品经理',
      hireDate: new Date('2022-01-10'),
      contractExpiryDate: new Date('2025-01-09'),
      socialSecurityBase: 22000,
      socialSecurityStatus: 'normal',
      resignationRiskScore: 0.65,
    },
    {
      id: 'emp-003',
      enterpriseId: enterprise.id,
      name: '赵六',
      idCard: '110101198803030003',
      position: '设计师',
      hireDate: new Date('2020-06-01'),
      contractExpiryDate: new Date('2025-05-31'),
      socialSecurityBase: 18000,
      socialSecurityStatus: 'normal',
      resignationRiskScore: 0.25,
    },
    {
      id: 'emp-004',
      enterpriseId: enterprise.id,
      name: '孙七',
      idCard: '110101199504040004',
      position: '前端开发工程师',
      hireDate: new Date('2023-07-01'),
      contractExpiryDate: new Date('2026-06-30'),
      socialSecurityBase: 20000,
      socialSecurityStatus: 'stopped',
      resignationRiskScore: 0.85,
    },
    {
      id: 'emp-005',
      enterpriseId: enterprise.id,
      name: '周八',
      idCard: '110101199105050005',
      position: '后端开发工程师',
      hireDate: new Date('2019-11-15'),
      contractExpiryDate: new Date('2024-11-14'),
      socialSecurityBase: 28000,
      socialSecurityStatus: 'normal',
      resignationRiskScore: 0.45,
    },
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { id: emp.id },
      update: emp,
      create: emp,
    });
  }

  const alerts = [
    {
      enterpriseId: enterprise.id,
      employeeId: 'emp-002',
      alertType: 'resignation_risk',
      severity: 'warning',
      message: '员工王五的离职风险较高（风险指数65%），建议关注。',
    },
    {
      enterpriseId: enterprise.id,
      employeeId: 'emp-004',
      alertType: 'social_security_stop',
      severity: 'danger',
      message: '员工孙七的社保已停缴，请及时处理。',
    },
    {
      enterpriseId: enterprise.id,
      employeeId: 'emp-005',
      alertType: 'contract_expiry',
      severity: 'warning',
      message: '员工周八的劳动合同将于2024-11-14到期，请及时续签。',
    },
    {
      enterpriseId: enterprise.id,
      employeeId: null,
      alertType: 'base_abnormal',
      severity: 'warning',
      message: '检测到员工周八的社保基数28000元，超过平均水平，建议核实。',
    },
  ];

  for (const alert of alerts) {
    await prisma.alert.upsert({
      where: { id: `alert-${alert.employeeId || 'ent'}-${alert.alertType}` },
      update: alert,
      create: {
        id: `alert-${alert.employeeId || 'ent'}-${alert.alertType}`,
        ...alert,
      },
    });
  }

  const testUser = await prisma.user.findUnique({ where: { email: 'user@example.com' } });
  const testProduct = await prisma.welfareProduct.findUnique({ where: { id: 'prod-001' } });
  
  if (testUser && testProduct) {
    const testOrder = await prisma.welfareOrder.upsert({
      where: { id: 'order-test-001' },
      update: {},
      create: {
        id: 'order-test-001',
        userId: testUser.id,
        productId: testProduct.id,
        quantity: 1,
        totalPrice: testProduct.price,
        status: 'completed',
      },
    });

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 15);

    await prisma.redemptionCode.upsert({
      where: { code: 'TEST2024' },
      update: {},
      create: {
        id: 'code-test-001',
        code: 'TEST2024',
        orderId: testOrder.id,
        productId: testProduct.id,
        userId: testUser.id,
        status: 'active',
        expiresAt: expiryDate,
      },
    });

    await prisma.redemptionCode.upsert({
      where: { code: 'TEST2025' },
      update: {},
      create: {
        id: 'code-test-002',
        code: 'TEST2025',
        orderId: testOrder.id,
        productId: testProduct.id,
        userId: testUser.id,
        status: 'used',
        expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        redeemedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    });

    const soonExpiry = new Date();
    soonExpiry.setDate(soonExpiry.getDate() + 5);
    await prisma.redemptionCode.upsert({
      where: { code: 'TEST2026' },
      update: {},
      create: {
        id: 'code-test-003',
        code: 'TEST2026',
        orderId: testOrder.id,
        productId: testProduct.id,
        userId: testUser.id,
        status: 'active',
        expiresAt: soonExpiry,
      },
    });
  }

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
