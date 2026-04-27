import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const UserRole = {
  PLANNER: 'PLANNER',
  TEAM_LEADER: 'TEAM_LEADER',
  OPERATOR: 'OPERATOR',
  QUALITY_INSPECTOR: 'QUALITY_INSPECTOR',
  MANAGER: 'MANAGER',
};

const EquipmentStatus = {
  AVAILABLE: 'AVAILABLE',
  IN_USE: 'IN_USE',
  MAINTENANCE: 'MAINTENANCE',
  BROKEN: 'BROKEN',
};

async function main() {
  console.log('开始初始化数据库...');

  const passwordHash = await bcrypt.hash('123456', 10);

  const users = [
    {
      id: 'user-planner-001',
      username: 'planner',
      password: passwordHash,
      name: '张计划员',
      role: UserRole.PLANNER,
      email: 'planner@mes.com',
      phone: '13800000001',
      department: '计划部',
    },
    {
      id: 'user-leader-001',
      username: 'leader',
      password: passwordHash,
      name: '李组长',
      role: UserRole.TEAM_LEADER,
      email: 'leader@mes.com',
      phone: '13800000002',
      department: '生产部',
    },
    {
      id: 'user-operator-001',
      username: 'operator',
      password: passwordHash,
      name: '王操作工',
      role: UserRole.OPERATOR,
      email: 'operator@mes.com',
      phone: '13800000003',
      department: '生产部',
    },
    {
      id: 'user-inspector-001',
      username: 'inspector',
      password: passwordHash,
      name: '赵质检员',
      role: UserRole.QUALITY_INSPECTOR,
      email: 'inspector@mes.com',
      phone: '13800000004',
      department: '质量部',
    },
    {
      id: 'user-manager-001',
      username: 'manager',
      password: passwordHash,
      name: '刘经理',
      role: UserRole.MANAGER,
      email: 'manager@mes.com',
      phone: '13800000005',
      department: '管理层',
    },
  ];

  for (const user of users) {
    const existing = await prisma.user.findUnique({
      where: { username: user.username },
    });
    if (!existing) {
      await prisma.user.create({ data: user });
      console.log(`创建用户: ${user.username}`);
    }
  }

  const materials = [
    {
      id: 'mat-001',
      code: 'MAT001',
      name: '钢材A',
      type: '原材料',
      unit: 'kg',
      specification: 'Φ10mm',
      stock: 1000,
      minStock: 100,
      maxStock: 5000,
    },
    {
      id: 'mat-002',
      code: 'MAT002',
      name: '塑料颗粒',
      type: '原材料',
      unit: 'kg',
      specification: 'ABS',
      stock: 500,
      minStock: 50,
      maxStock: 2000,
    },
    {
      id: 'mat-003',
      code: 'MAT003',
      name: '螺丝M5',
      type: '辅料',
      unit: '个',
      specification: 'M5*10',
      stock: 10000,
      minStock: 1000,
      maxStock: 50000,
    },
  ];

  for (const material of materials) {
    const existing = await prisma.material.findUnique({
      where: { code: material.code },
    });
    if (!existing) {
      await prisma.material.create({ data: material });
      console.log(`创建物料: ${material.code}`);
    }
  }

  const equipments = [
    {
      id: 'eq-001',
      code: 'EQ001',
      name: '数控车床A1',
      type: '车床',
      model: 'CNC-2000',
      status: EquipmentStatus.AVAILABLE,
      location: '车间1区',
      description: '高精度数控车床',
    },
    {
      id: 'eq-002',
      code: 'EQ002',
      name: '铣床B2',
      type: '铣床',
      model: 'MIL-500',
      status: EquipmentStatus.AVAILABLE,
      location: '车间1区',
      description: '立式铣床',
    },
    {
      id: 'eq-003',
      code: 'EQ003',
      name: '质检台Q1',
      type: '检测设备',
      model: 'QC-100',
      status: EquipmentStatus.AVAILABLE,
      location: '质检区',
      description: '三坐标测量仪',
    },
  ];

  for (const equipment of equipments) {
    const existing = await prisma.equipment.findUnique({
      where: { code: equipment.code },
    });
    if (!existing) {
      await prisma.equipment.create({ data: equipment });
      console.log(`创建设备: ${equipment.code}`);
    }
  }

  let bom = await prisma.bom.findUnique({
    where: { code: 'BOM001' },
  });
  if (!bom) {
    bom = await prisma.bom.create({
      data: {
        id: 'bom-001',
        code: 'BOM001',
        name: '产品A BOM',
        description: '标准产品A物料清单',
        isActive: true,
      },
    });
    console.log('创建BOM: BOM001');
  }

  const createdMaterials = await prisma.material.findMany();
  const existingBomItems = await prisma.bomItem.findMany({
    where: { bomId: bom.id },
  });
  
  if (existingBomItems.length === 0) {
    for (let i = 0; i < createdMaterials.length; i++) {
      await prisma.bomItem.create({
        data: {
          id: `bom-item-${i + 1}`,
          bomId: bom.id,
          materialId: createdMaterials[i].id,
          quantity: (i + 1) * 2,
          unit: createdMaterials[i].unit,
          sequence: i + 1,
        },
      });
      console.log(`创建BOM项: ${createdMaterials[i].name}`);
    }
  }

  let processRoute = await prisma.processRoute.findUnique({
    where: { code: 'ROUTE001' },
  });
  if (!processRoute) {
    processRoute = await prisma.processRoute.create({
      data: {
        id: 'route-001',
        code: 'ROUTE001',
        name: '标准加工路线',
        description: '产品A标准工艺路线',
        bomId: bom.id,
        isActive: true,
      },
    });
    console.log('创建工艺路线: ROUTE001');
  }

  const processes = [
    { sequence: 1, name: '下料', description: '原材料切割', standardTime: 30, isQualityCheck: false },
    { sequence: 2, name: '车床加工', description: '数控车削', standardTime: 60, isQualityCheck: false },
    { sequence: 3, name: '铣削加工', description: '铣床加工', standardTime: 45, isQualityCheck: false },
    { sequence: 4, name: '尺寸检验', description: '关键尺寸检测', standardTime: 20, isQualityCheck: true },
    { sequence: 5, name: '表面处理', description: '表面抛光', standardTime: 15, isQualityCheck: false },
  ];

  const existingRouteProcs = await prisma.routeProcess.findMany({
    where: { processRouteId: processRoute.id },
  });

  if (existingRouteProcs.length === 0) {
    for (const proc of processes) {
      await prisma.routeProcess.create({
        data: {
          id: `route-proc-${proc.sequence}`,
          processRouteId: processRoute.id,
          ...proc,
        },
      });
      console.log(`创建工艺步骤: ${proc.name}`);
    }
  }

  console.log('');
  console.log('数据库初始化完成！');
  console.log('');
  console.log('默认用户账号（密码: 123456）:');
  console.log('  planner   - 计划员');
  console.log('  leader    - 班组长');
  console.log('  operator  - 操作工');
  console.log('  inspector - 质检人员');
  console.log('  manager   - 管理层');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
