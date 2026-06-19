import { PrismaClient, Role, TicketType, TicketStatus, TicketPriority, AccessDeviceType, AccessAuthType, ServiceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPwd = await bcrypt.hash('123456', 10);

  const superAdmin = await prisma.user.upsert({
    where: { phone: '13800000001' },
    update: {},
    create: {
      phone: '13800000001',
      password: hashedPwd,
      nickname: '超级管理员',
      role: Role.SUPER_ADMIN,
      realName: '系统管理员',
    },
  });

  const propertyAdmin = await prisma.user.upsert({
    where: { phone: '13800000002' },
    update: {},
    create: {
      phone: '13800000002',
      password: hashedPwd,
      nickname: '物业经理',
      role: Role.PROPERTY_ADMIN,
      realName: '王经理',
    },
  });

  const propertyStaff = await prisma.user.upsert({
    where: { phone: '13800000003' },
    update: {},
    create: {
      phone: '13800000003',
      password: hashedPwd,
      nickname: '物业客服',
      role: Role.PROPERTY_STAFF,
      realName: '李客服',
    },
  });

  const committeeChair = await prisma.user.upsert({
    where: { phone: '13800000004' },
    update: {},
    create: {
      phone: '13800000004',
      password: hashedPwd,
      nickname: '业委会主任',
      role: Role.COMMITTEE_CHAIR,
      realName: '张主任',
    },
  });

  const resident = await prisma.user.upsert({
    where: { phone: '13800000005' },
    update: {},
    create: {
      phone: '13800000005',
      password: hashedPwd,
      nickname: '小区居民',
      role: Role.RESIDENT,
      realName: '陈居民',
    },
  });

  const provider = await prisma.user.upsert({
    where: { phone: '13800000006' },
    update: {},
    create: {
      phone: '13800000006',
      password: hashedPwd,
      nickname: '家政服务商',
      role: Role.SERVICE_PROVIDER,
      realName: '刘家政',
    },
  });

  const community = await prisma.community.upsert({
    where: { id: 'seed-community-1' },
    update: {},
    create: {
      id: 'seed-community-1',
      name: '阳光花园小区',
      address: '浙江省杭州市西湖区文一西路1008号',
      description: '大型现代化住宅小区，共有12栋住宅楼',
    },
  });

  await prisma.userCommunity.createMany({
    skipDuplicates: true,
    data: [
      { userId: propertyAdmin.id, communityId: community.id, roleInCommunity: Role.PROPERTY_ADMIN },
      { userId: propertyStaff.id, communityId: community.id, roleInCommunity: Role.PROPERTY_STAFF },
      { userId: committeeChair.id, communityId: community.id, roleInCommunity: Role.COMMITTEE_CHAIR },
      { userId: resident.id, communityId: community.id, roleInCommunity: Role.RESIDENT },
    ],
  });

  const buildings: any[] = [];
  for (let i = 1; i <= 3; i++) {
    const building = await prisma.building.create({
      data: {
        communityId: community.id,
        name: `${i}号楼`,
        floorCount: 18,
        unitCount: 2,
      },
    });
    buildings.push(building);

    for (let u = 1; u <= 2; u++) {
      const unit = await prisma.unit.create({
        data: {
          buildingId: building.id,
          name: `${u}单元`,
          floor: 18,
        },
      });

      for (let h = 1; h <= 5; h++) {
        const house = await prisma.house.create({
          data: {
            unitId: unit.id,
            roomNumber: `${String(h).padStart(2, '0')}01`,
            area: 89.5,
          },
        });

        if (i === 1 && u === 1 && h === 1) {
          await prisma.userHouse.create({
            data: {
              userId: resident.id,
              houseId: house.id,
              relationship: 'OWNER',
              isVerified: true,
              verifiedAt: new Date(),
            },
          });
        }
      }
    }
  }

  const devices = [];
  for (let i = 0; i < 4; i++) {
    const device = await prisma.accessDevice.create({
      data: {
        name: `小区${['东门', '西门', '南门', '北门'][i]}门禁`,
        type: i === 0 ? AccessDeviceType.BLUETOOTH : i === 1 ? AccessDeviceType.NFC : i === 2 ? AccessDeviceType.QRCODE : AccessDeviceType.FACE,
        communityId: community.id,
        buildingId: i < 2 ? buildings[0].id : buildings[1].id,
        location: `${['东门', '西门', '南门', '北门'][i]}入口`,
        isOnline: i < 3,
        lastHeartbeat: i < 3 ? new Date() : new Date(Date.now() - 3600000 * 24),
      },
    });
    devices.push(device);
  }

  await prisma.accessAuth.create({
    data: {
      userId: resident.id,
      deviceId: devices[0].id,
      authType: AccessAuthType.PERMANENT,
    },
  });

  const ticket1 = await prisma.ticket.create({
    data: {
      type: TicketType.REPAIR,
      title: '客厅灯不亮了',
      content: '客厅的主灯开关按了没反应，可能是灯泡坏了或者线路问题，请安排电工师傅来看看。',
      status: TicketStatus.PROCESSING,
      priority: TicketPriority.MEDIUM,
      creatorId: resident.id,
      handlerId: propertyStaff.id,
      communityId: community.id,
      contactName: '陈先生',
      contactPhone: '13800000005',
      assignedAt: new Date(),
      startedAt: new Date(),
      tags: { create: [{ tag: '水电' }] },
    },
  });

  await prisma.ticket.create({
    data: {
      type: TicketType.COMPLAINT,
      title: '楼下广场舞噪音太大',
      content: '每天晚上7点到9点，楼下广场跳广场舞的音乐声音太大，严重影响休息。',
      status: TicketStatus.PENDING,
      priority: TicketPriority.HIGH,
      creatorId: resident.id,
      communityId: community.id,
      contactName: '陈先生',
      contactPhone: '13800000005',
    },
  });

  await prisma.ticketComment.create({
    data: {
      ticketId: ticket1.id,
      userId: propertyStaff.id,
      content: '您好，我已经安排了王师傅，今天下午3点上门维修。',
      isInternal: false,
    },
  });

  const category1 = await prisma.serviceCategory.create({
    data: { name: '家政服务', icon: '🧹', sort: 1 },
  });
  const category2 = await prisma.serviceCategory.create({
    data: { name: '快递收发', icon: '📦', sort: 2 },
  });
  const category3 = await prisma.serviceCategory.create({
    data: { name: '社区团购', icon: '🛒', sort: 3 },
  });
  await prisma.serviceCategory.create({
    data: { name: '在线商城', icon: '🏪', sort: 4 },
  });

  const serviceProvider = await prisma.serviceProvider.create({
    data: {
      userId: provider.id,
      name: '好阿姨家政服务',
      description: '专业家政服务10年，提供保洁、月嫂、育儿嫂等服务',
      contactName: '刘经理',
      contactPhone: '13800000006',
      status: ServiceStatus.APPROVED,
      commissionRate: 10,
      reviewedBy: superAdmin.id,
      reviewedAt: new Date(),
    },
  });

  const services = [
    { name: '日常保洁', price: 120, description: '包含客厅、卧室、厨房、卫生间清洁', unit: '次' },
    { name: '深度保洁', price: 380, description: '全面深度清洁，含油烟机、空调清洗', unit: '次' },
    { name: '钟点工服务', price: 50, description: '按小时计费，可做饭、保洁、照顾老人', unit: '小时' },
  ];

  for (const s of services) {
    await prisma.serviceItem.create({
      data: {
        providerId: serviceProvider.id,
        categoryId: category1.id,
        name: s.name,
        description: s.description,
        price: s.price as any,
        unit: s.unit,
        status: ServiceStatus.APPROVED,
        sales: Math.floor(Math.random() * 200),
      },
    });
  }

  await prisma.alert.createMany({
    data: [
      {
        type: 'DEVICE_OFFLINE',
        level: 'WARNING',
        title: '北门门禁设备离线',
        content: '北门人脸识别门禁已超过24小时未上报心跳，请检查设备网络。',
        deviceId: devices[3].id,
      },
      {
        type: 'HIGH_PRIORITY_TICKET',
        level: 'INFO',
        title: '新增高优先级工单',
        content: '收到一条高优先级投诉工单，请及时处理。',
      },
    ],
  });

  console.log('✅ Seeding completed!');
  console.log('📱 Test accounts:');
  console.log('  Super Admin: 13800000001 / 123456');
  console.log('  Property Admin: 13800000002 / 123456');
  console.log('  Property Staff: 13800000003 / 123456');
  console.log('  Committee Chair: 13800000004 / 123456');
  console.log('  Resident: 13800000005 / 123456');
  console.log('  Service Provider: 13800000006 / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
