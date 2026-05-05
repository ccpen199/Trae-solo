import { PrismaClient, OrderType, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: 'admin'
    }
  });

  const schedulerPassword = await bcrypt.hash('scheduler123', 10);

  const scheduler1 = await prisma.user.upsert({
    where: { username: 'scheduler1' },
    update: {},
    create: {
      username: 'scheduler1',
      password: schedulerPassword,
      name: '调度员张三',
      role: 'scheduler'
    }
  });

  const scheduler2 = await prisma.user.upsert({
    where: { username: 'scheduler2' },
    update: {},
    create: {
      username: 'scheduler2',
      password: schedulerPassword,
      name: '调度员李四',
      role: 'scheduler'
    }
  });

  const dc1 = await prisma.distributionCenter.upsert({
    where: { code: 'DC-BJ' },
    update: {},
    create: {
      code: 'DC-BJ',
      name: '北京配送中心'
    }
  });

  const dc2 = await prisma.distributionCenter.upsert({
    where: { code: 'DC-SH' },
    update: {},
    create: {
      code: 'DC-SH',
      name: '上海配送中心'
    }
  });

  const wh1 = await prisma.warehouse.upsert({
    where: { code: 'WH-BJ-01' },
    update: {},
    create: {
      code: 'WH-BJ-01',
      name: '北京朝阳库房',
      distributionCenterId: dc1.id
    }
  });

  const wh2 = await prisma.warehouse.upsert({
    where: { code: 'WH-BJ-02' },
    update: {},
    create: {
      code: 'WH-BJ-02',
      name: '北京海淀库房',
      distributionCenterId: dc1.id
    }
  });

  const wh3 = await prisma.warehouse.upsert({
    where: { code: 'WH-SH-01' },
    update: {},
    create: {
      code: 'WH-SH-01',
      name: '上海浦东库房',
      distributionCenterId: dc2.id
    }
  });

  const orders = [
    {
      orderNo: 'ORD-2026-00001',
      orderType: OrderType.SMALL_MEDIUM,
      orderStatus: OrderStatus.PENDING_ENTRY,
      distributionCenterId: dc1.id,
      warehouseId: wh1.id,
      pieceCount: 3,
      volume: 0.5,
      weight: 2.5,
      receiverName: '张三',
      receiverPhone: '13800138001',
      receiverFixedPhone: '010-88888881',
      appointmentCalendar: '2026-05-05',
      isSelfPickup: false,
      isSameDayDelivery: false,
      hasTimingCalculated: true,
      appointmentConsistent: true
    },
    {
      orderNo: 'ORD-2026-00002',
      orderType: OrderType.BULK,
      orderStatus: OrderStatus.PENDING_ENTRY,
      distributionCenterId: dc1.id,
      warehouseId: wh2.id,
      pieceCount: 15,
      volume: 5.2,
      weight: 150.0,
      receiverName: '李四',
      receiverPhone: '13800138002',
      appointmentCalendar: '2026-05-06',
      isSelfPickup: false,
      isSameDayDelivery: false,
      hasTimingCalculated: true,
      appointmentConsistent: true
    },
    {
      orderNo: 'ORD-2026-00003',
      orderType: OrderType.SMALL_MEDIUM,
      orderStatus: OrderStatus.PENDING_ENTRY,
      distributionCenterId: dc2.id,
      warehouseId: wh3.id,
      pieceCount: 2,
      volume: 0.3,
      weight: 1.5,
      receiverName: '王五',
      receiverPhone: '13800138003',
      appointmentCalendar: '2026-05-07',
      isSelfPickup: false,
      isSameDayDelivery: false,
      hasTimingCalculated: true,
      appointmentConsistent: true
    },
    {
      orderNo: 'ORD-2026-00004',
      orderType: OrderType.SMALL_MEDIUM,
      orderStatus: OrderStatus.PENDING_ENTRY,
      distributionCenterId: dc1.id,
      warehouseId: wh1.id,
      pieceCount: 5,
      volume: 1.2,
      weight: 8.5,
      receiverName: '赵六',
      receiverPhone: '13800138004',
      appointmentCalendar: '2026-05-05',
      isSelfPickup: true,
      isSameDayDelivery: false,
      hasTimingCalculated: true,
      appointmentConsistent: true
    },
    {
      orderNo: 'ORD-2026-00005',
      orderType: OrderType.SMALL_MEDIUM,
      orderStatus: OrderStatus.PENDING_ENTRY,
      distributionCenterId: dc1.id,
      warehouseId: wh1.id,
      pieceCount: 4,
      volume: 0.8,
      weight: 5.0,
      receiverName: '钱七',
      receiverPhone: '13800138005',
      appointmentCalendar: '2026-05-08',
      isSelfPickup: false,
      isSameDayDelivery: true,
      hasTimingCalculated: true,
      appointmentConsistent: true
    },
    {
      orderNo: 'ORD-2026-00006',
      orderType: OrderType.SMALL_MEDIUM,
      orderStatus: OrderStatus.PENDING_ENTRY,
      distributionCenterId: dc1.id,
      warehouseId: wh1.id,
      pieceCount: 1,
      volume: 0.1,
      weight: 0.5,
      receiverName: '孙八',
      receiverPhone: '13800138006',
      appointmentCalendar: '2026-05-05',
      isSelfPickup: false,
      isSameDayDelivery: false,
      hasTimingCalculated: false,
      appointmentConsistent: true
    },
    {
      orderNo: 'ORD-2026-00007',
      orderType: OrderType.SMALL_MEDIUM,
      orderStatus: OrderStatus.PENDING_ENTRY,
      distributionCenterId: dc1.id,
      warehouseId: wh1.id,
      pieceCount: 2,
      volume: 0.4,
      weight: 2.0,
      receiverName: '周九',
      receiverPhone: '13800138007',
      appointmentCalendar: '2026-05-05',
      isSelfPickup: false,
      isSameDayDelivery: false,
      hasTimingCalculated: true,
      appointmentConsistent: false
    },
    {
      orderNo: 'ORD-2026-00008',
      orderType: OrderType.BULK,
      orderStatus: OrderStatus.PENDING_ENTRY,
      distributionCenterId: dc1.id,
      warehouseId: wh1.id,
      pieceCount: 20,
      volume: 8.0,
      weight: 200.0,
      receiverName: '吴十',
      receiverPhone: '13800138008',
      appointmentCalendar: '2026-05-10',
      isSelfPickup: false,
      isSameDayDelivery: false,
      hasTimingCalculated: true,
      appointmentConsistent: true
    },
    {
      orderNo: 'ORD-2026-00009',
      orderType: OrderType.SMALL_MEDIUM,
      orderStatus: OrderStatus.PENDING_ENTRY,
      distributionCenterId: dc1.id,
      warehouseId: wh1.id,
      pieceCount: 6,
      volume: 1.5,
      weight: 10.0,
      receiverName: '郑十一',
      receiverPhone: '13800138009',
      appointmentCalendar: '2026-05-05',
      isSelfPickup: false,
      isSameDayDelivery: false,
      hasTimingCalculated: true,
      appointmentConsistent: true
    },
    {
      orderNo: 'ORD-2026-00010',
      orderType: OrderType.SMALL_MEDIUM,
      orderStatus: OrderStatus.PENDING_ENTRY,
      distributionCenterId: dc1.id,
      warehouseId: wh1.id,
      pieceCount: 8,
      volume: 2.0,
      weight: 15.0,
      receiverName: '王十二',
      receiverPhone: '13800138010',
      appointmentCalendar: '2026-05-06',
      isSelfPickup: false,
      isSameDayDelivery: false,
      hasTimingCalculated: true,
      appointmentConsistent: true
    },
    {
      orderNo: 'ORD-2026-00011',
      orderType: OrderType.SMALL_MEDIUM,
      orderStatus: OrderStatus.PENDING_ENTRY,
      distributionCenterId: dc1.id,
      warehouseId: wh1.id,
      pieceCount: 3,
      volume: 0.6,
      weight: 3.0,
      receiverName: '李十三',
      receiverPhone: '13800138011',
      appointmentCalendar: '2026-05-07',
      isSelfPickup: false,
      isSameDayDelivery: false,
      hasTimingCalculated: true,
      appointmentConsistent: true
    },
    {
      orderNo: 'ORD-2026-00012',
      orderType: OrderType.SMALL_MEDIUM,
      orderStatus: OrderStatus.PENDING_ENTRY,
      distributionCenterId: dc1.id,
      warehouseId: wh1.id,
      pieceCount: 4,
      volume: 0.9,
      weight: 4.5,
      receiverName: '张十四',
      receiverPhone: '13800138012',
      appointmentCalendar: '2026-05-08',
      isSelfPickup: false,
      isSameDayDelivery: false,
      hasTimingCalculated: true,
      appointmentConsistent: true
    }
  ];

  for (const order of orders) {
    await prisma.order.upsert({
      where: { orderNo: order.orderNo },
      update: {},
      create: order
    });
  }

  console.log('Database seeded successfully!');
  console.log('\nCreated users:');
  console.log('  - admin / admin123 (role: admin)');
  console.log('  - scheduler1 / scheduler123 (role: scheduler)');
  console.log('  - scheduler2 / scheduler123 (role: scheduler)');
  console.log('\nCreated distribution centers:');
  console.log('  - DC-BJ: 北京配送中心');
  console.log('  - DC-SH: 上海配送中心');
  console.log('\nCreated warehouses:');
  console.log('  - WH-BJ-01: 北京朝阳库房 (属于 DC-BJ)');
  console.log('  - WH-BJ-02: 北京海淀库房 (属于 DC-BJ)');
  console.log('  - WH-SH-01: 上海浦东库房 (属于 DC-SH)');
  console.log('\nCreated orders: 12 test orders');
  console.log('\nNote: Orders ORD-2026-00004 to ORD-2026-00007 will be rejected by entry check');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
