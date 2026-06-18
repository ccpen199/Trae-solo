import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.comment.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.chargingFault.deleteMany();
  await prisma.settlementRecord.deleteMany();
  await prisma.chargingOrder.deleteMany();
  await prisma.routePlan.deleteMany();
  await prisma.v2GStrategy.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.chargingPile.deleteMany();
  await prisma.chargingStation.deleteMany();
  await prisma.operator.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('123456', 10);

  const user = await prisma.user.create({
    data: {
      id: 'user-demo',
      phone: '13888888888',
      password,
      nickname: '新能源车主',
      vin: 'LFPH3ACC4N1DEMO88',
      plateNumber: '京A·EV888',
      realName: '张三',
      balance: 128.5,
      vipLevel: 2,
      tags: JSON.stringify(['高频快充', 'V2G体验用户']),
      profile: {
        create: {
          totalCharges: 38,
          totalKwh: 1286.5,
          totalAmount: 1892.3,
          avgChargingTime: 42,
          favoriteStations: JSON.stringify(['station-chaoyang', 'station-sanlitun']),
          chargingHabits: JSON.stringify({ peak: 'evening', avgSoc: 64 }),
          tags: JSON.stringify(['通勤', '快充偏好']),
          v2gEnabled: true,
        },
      },
    },
  });

  const operators = await Promise.all([
    prisma.operator.create({
      data: {
        id: 'operator-state-grid',
        name: '国网电动',
        contact: '王经理',
        phone: '13800000001',
        apiKey: 'sgcc-demo-key',
        protocolType: 'gbt27930',
        settlementRatio: 0.88,
        status: 'active',
      },
    }),
    prisma.operator.create({
      data: {
        id: 'operator-teld',
        name: '特来电',
        contact: '李经理',
        phone: '13900000002',
        apiKey: 'teld-demo-key',
        protocolType: 'third_party_api',
        settlementRatio: 0.84,
        status: 'active',
      },
    }),
    prisma.operator.create({
      data: {
        id: 'operator-star',
        name: '星星充电',
        contact: '张经理',
        phone: '13700000003',
        apiKey: 'star-demo-key',
        protocolType: 'sdk',
        settlementRatio: 0.86,
        status: 'active',
      },
    }),
  ]);

  const stationChaoyang = await prisma.chargingStation.create({
    data: {
      id: 'station-chaoyang',
      name: '国家电网充电站(朝阳公园)',
      address: '北京市朝阳区朝阳公园南路1号',
      longitude: 116.478,
      latitude: 39.934,
      operatorId: operators[0].id,
      type: 'public',
      totalPiles: 12,
      availablePiles: 8,
      pricePerKwh: 1.25,
      serviceFee: 0.28,
      openTime: '00:00-24:00',
      tags: JSON.stringify(['高速快充', '即插即充', 'V2G']),
      status: 'active',
    },
  });

  const stationSanlitun = await prisma.chargingStation.create({
    data: {
      id: 'station-sanlitun',
      name: '特来电充电站(三里屯)',
      address: '北京市朝阳区工体北路8号',
      longitude: 116.455,
      latitude: 39.935,
      operatorId: operators[1].id,
      type: 'public',
      totalPiles: 10,
      availablePiles: 3,
      pricePerKwh: 1.35,
      serviceFee: 0.32,
      openTime: '06:00-23:00',
      tags: JSON.stringify(['商圈', '地下停车场']),
      status: 'active',
    },
  });

  const stationWangjing = await prisma.chargingStation.create({
    data: {
      id: 'station-wangjing',
      name: '星星充电(望京SOHO)',
      address: '北京市朝阳区望京街10号',
      longitude: 116.481,
      latitude: 40.002,
      operatorId: operators[2].id,
      type: 'public',
      totalPiles: 20,
      availablePiles: 15,
      pricePerKwh: 1.18,
      serviceFee: 0.25,
      openTime: '00:00-24:00',
      tags: JSON.stringify(['低价', '办公区']),
      status: 'active',
    },
  });

  const piles = await Promise.all([
    prisma.chargingPile.create({
      data: {
        id: 'pile-chaoyang-a01',
        stationId: stationChaoyang.id,
        pileNo: 'A-01',
        type: 'dc',
        power: 120,
        status: 'idle',
        connectorType: 'CCS2',
        protocol: 'GB/T 27930',
        lastHeartbeat: new Date(),
        currentPower: 0,
        currentSoc: 68,
      },
    }),
    prisma.chargingPile.create({
      data: {
        id: 'pile-chaoyang-a03',
        stationId: stationChaoyang.id,
        pileNo: 'A-03',
        type: 'dc',
        power: 160,
        status: 'charging',
        connectorType: 'GB/T',
        protocol: 'GB/T 27930',
        lastHeartbeat: new Date(),
        currentPower: 45.6,
        currentSoc: 68,
      },
    }),
    prisma.chargingPile.create({
      data: {
        id: 'pile-sanlitun-b02',
        stationId: stationSanlitun.id,
        pileNo: 'B-02',
        type: 'dc',
        power: 120,
        status: 'idle',
        connectorType: 'GB/T',
        protocol: 'third_party_api',
        lastHeartbeat: new Date(),
        currentPower: 0,
        currentSoc: 0,
      },
    }),
    prisma.chargingPile.create({
      data: {
        id: 'pile-wangjing-c01',
        stationId: stationWangjing.id,
        pileNo: 'C-01',
        type: 'ac',
        power: 7,
        status: 'fault',
        connectorType: 'GB/T',
        protocol: 'sdk',
        lastHeartbeat: new Date(),
        currentPower: 0,
        currentSoc: 0,
      },
    }),
  ]);

  const completedOrder = await prisma.chargingOrder.create({
    data: {
      id: 'order-demo-completed',
      userId: user.id,
      pileId: piles[0].id,
      stationId: stationChaoyang.id,
      startTime: new Date('2026-06-18T08:30:00.000Z'),
      endTime: new Date('2026-06-18T09:15:00.000Z'),
      startSoc: 28,
      endSoc: 82,
      chargedKwh: 45.5,
      totalAmount: 69.62,
      serviceFee: 12.74,
      electricFee: 56.88,
      status: 'completed',
      paymentMethod: 'wallet',
      vin: 'LFPH3ACC4N1DEMO88',
      plateNumber: '京A·EV888',
    },
  });

  await prisma.chargingOrder.create({
    data: {
      id: 'order-demo-charging',
      userId: user.id,
      pileId: piles[1].id,
      stationId: stationChaoyang.id,
      startTime: new Date('2026-06-18T14:30:00.000Z'),
      startSoc: 36,
      chargedKwh: 32.5,
      totalAmount: 49.72,
      serviceFee: 9.1,
      electricFee: 40.62,
      status: 'charging',
      paymentMethod: 'wallet',
      vin: 'LFPH3ACC4N1DEMO88',
      plateNumber: '京A·EV888',
    },
  });

  await prisma.settlementRecord.create({
    data: {
      id: 'settlement-demo-001',
      operatorId: operators[0].id,
      orderId: completedOrder.id,
      amount: 69.62,
      serviceFee: 12.74,
      platformFee: 8.35,
      settlementDate: new Date('2026-06-18T10:00:00.000Z'),
      status: 'completed',
    },
  });

  const post = await prisma.communityPost.create({
    data: {
      id: 'post-demo-001',
      userId: user.id,
      title: '朝阳公园站即插即充体验',
      content: 'VIN 与车牌双因子认证很快，120kW 快充桩从 30% 到 80% 用时约 35 分钟。',
      images: JSON.stringify([]),
      likes: 18,
      comments: 1,
      status: 'published',
    },
  });

  await prisma.comment.create({
    data: {
      id: 'comment-demo-001',
      postId: post.id,
      userId: user.id,
      content: '晚高峰排队情况也比以前稳定。',
      likes: 3,
      status: 'published',
    },
  });

  await prisma.v2GStrategy.create({
    data: {
      id: 'v2g-demo-001',
      userId: user.id,
      name: '峰谷套利模式',
      type: 'price_arbitrage',
      chargeStartTime: '00:30',
      chargeEndTime: '06:00',
      dischargeStartTime: '18:00',
      dischargeEndTime: '21:00',
      targetSoc: 85,
      minSoc: 30,
      maxPower: 25,
      enabled: true,
    },
  });

  await prisma.chargingFault.create({
    data: {
      id: 'fault-demo-001',
      pileId: piles[3].id,
      userId: user.id,
      faultCode: 'E-LOCK-01',
      faultDesc: '电子锁未回位，已派单巡检',
      status: 'reported',
      reportTime: new Date('2026-06-18T11:20:00.000Z'),
    },
  });

  await prisma.routePlan.create({
    data: {
      id: 'route-demo-001',
      userId: user.id,
      origin: '北京市朝阳区',
      destination: '天津市滨海新区',
      waypoints: JSON.stringify(['廊坊服务区']),
      totalDistance: 168.5,
      estimatedTime: 132,
      chargingStops: JSON.stringify([
        {
          stationId: stationChaoyang.id,
          stationName: stationChaoyang.name,
          chargeTime: 25,
          cost: 45.5,
        },
      ]),
      totalCost: 45.5,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
