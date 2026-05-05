import 'dotenv/config';
import prisma from '../config/database';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('开始初始化数据库...');

  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: {
      name: '系统管理员',
      code: 'ADMIN',
      description: '系统最高权限角色',
      type: 'ADMIN',
    },
  });

  const operatorRole = await prisma.role.upsert({
    where: { code: 'OPERATOR' },
    update: {},
    create: {
      name: '操作员',
      code: 'OPERATOR',
      description: '普通操作角色',
      type: 'OPERATOR',
    },
  });

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedPassword,
      realName: '系统管理员',
      roleId: adminRole.id,
    },
    create: {
      username: 'admin',
      password: hashedPassword,
      realName: '系统管理员',
      email: 'admin@erp.com',
      status: 'ACTIVE',
      roleId: adminRole.id,
    },
  });

  await prisma.materialCategory.upsert({
    where: { code: 'MATERIAL' },
    update: {},
    create: {
      name: '物料分类',
      code: 'MATERIAL',
      description: '根分类',
    },
  });

  const warehouse1 = await prisma.warehouse.upsert({
    where: { code: 'WH001' },
    update: {},
    create: {
      name: '主仓库',
      code: 'WH001',
      location: 'A区1号库',
      manager: '张仓库',
      phone: '13800138001',
      description: '公司主要仓库',
    },
  });

  const warehouse2 = await prisma.warehouse.upsert({
    where: { code: 'WH002' },
    update: {},
    create: {
      name: '辅料仓库',
      code: 'WH002',
      location: 'A区2号库',
      manager: '李仓库',
      phone: '13800138002',
      description: '辅料专用仓库',
    },
  });

  const material1 = await prisma.material.upsert({
    where: { code: 'M001' },
    update: {},
    create: {
      code: 'M001',
      name: '钢材A',
      spec: 'Φ50mm',
      unit: 'kg',
      type: 'RAW_MATERIAL',
      safetyStock: 100,
      maxStock: 1000,
      avgCost: 5.5,
      description: '普通钢材A型号',
    },
  });

  const material2 = await prisma.material.upsert({
    where: { code: 'M002' },
    update: {},
    create: {
      code: 'M002',
      name: '塑料板材',
      spec: '1000x2000x5mm',
      unit: '张',
      type: 'RAW_MATERIAL',
      safetyStock: 50,
      maxStock: 500,
      avgCost: 120,
      description: '工程塑料板材',
    },
  });

  const material3 = await prisma.material.upsert({
    where: { code: 'M003' },
    update: {},
    create: {
      code: 'M003',
      name: '成品A',
      spec: '标准款',
      unit: '件',
      type: 'FINISHED',
      safetyStock: 20,
      maxStock: 200,
      avgCost: 500,
      description: '公司主要产品A型号',
    },
  });

  const supplier1 = await prisma.supplier.upsert({
    where: { code: 'S001' },
    update: {},
    create: {
      code: 'S001',
      name: '华钢贸易有限公司',
      contact: '王经理',
      phone: '13900139001',
      email: 'contact@huagang.com',
      address: '上海市浦东新区张江路100号',
      taxNo: '91310000MA12345678',
      creditLimit: 500000,
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { code: 'S002' },
    update: {},
    create: {
      code: 'S002',
      name: '塑科新材料科技',
      contact: '李总监',
      phone: '13900139002',
      email: 'info@sukeke.com',
      address: '苏州市工业园区星湖街200号',
      taxNo: '91320000MA87654321',
      creditLimit: 300000,
    },
  });

  const customer1 = await prisma.customer.upsert({
    where: { code: 'C001' },
    update: {},
    create: {
      code: 'C001',
      name: '鑫达制造集团',
      contact: '采购部张',
      phone: '13800138003',
      email: 'purchase@xinda.com',
      address: '杭州市萧山区建设一路300号',
      taxNo: '91330000MA11223344',
      creditLimit: 800000,
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { code: 'C002' },
    update: {},
    create: {
      code: 'C002',
      name: '恒通贸易有限公司',
      contact: '业务刘',
      phone: '13800138004',
      email: 'business@hengtong.com',
      address: '南京市江宁区天元中路400号',
      taxNo: '91320000MA55667788',
      creditLimit: 500000,
    },
  });

  console.log('初始化完成！');
  console.log('========================================');
  console.log('默认管理员账号: admin');
  console.log('默认密码: admin123');
  console.log('========================================');
  console.log('仓库:');
  console.log(`  - WH001: 主仓库`);
  console.log(`  - WH002: 辅料仓库`);
  console.log('物料:');
  console.log(`  - M001: 钢材A`);
  console.log(`  - M002: 塑料板材`);
  console.log(`  - M003: 成品A`);
  console.log('供应商:');
  console.log(`  - S001: 华钢贸易有限公司`);
  console.log(`  - S002: 塑科新材料科技`);
  console.log('客户:');
  console.log(`  - C001: 鑫达制造集团`);
  console.log(`  - C002: 恒通贸易有限公司`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
