import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/database.js';
import { RiderEntity } from '../entities/Rider.entity.js';
import { RiderPreferenceEntity } from '../entities/RiderPreference.entity.js';
import { OrderEntity } from '../entities/Order.entity.js';
import { TaskPoolEntity } from '../entities/TaskPool.entity.js';
import { DispatchRuleEntity } from '../entities/DispatchRule.entity.js';
import { HotspotEntity } from '../entities/Hotspot.entity.js';
import { CreditHistoryEntity } from '../entities/CreditHistory.entity.js';

export async function seedDemoData() {
  const riderRepo = AppDataSource.getRepository(RiderEntity);
  const prefRepo = AppDataSource.getRepository(RiderPreferenceEntity);
  const orderRepo = AppDataSource.getRepository(OrderEntity);
  const taskRepo = AppDataSource.getRepository(TaskPoolEntity);
  const ruleRepo = AppDataSource.getRepository(DispatchRuleEntity);
  const hotspotRepo = AppDataSource.getRepository(HotspotEntity);
  const creditRepo = AppDataSource.getRepository(CreditHistoryEntity);

  let rider = await riderRepo.findOne({ where: { phone: '13900000001' } });
  if (!rider) {
    rider = riderRepo.create({
      phone: '13900000001',
      nickname: '演示骑手',
      realName: '演示骑手',
      vehicleType: 'electric_bike',
      realNameVerified: true,
      qualificationVerified: true,
      auditStatus: 'approved',
      creditScore: 96,
      isFrozen: false,
      isOnline: false,
      completedOrders: 128,
      totalDistance: 1864.5,
      totalEarnings: 24860,
      password: await bcrypt.hash('rider123', 10),
      currentLocation: {
        latitude: 39.9087,
        longitude: 116.3975,
      },
    });
    rider = await riderRepo.save(rider);
  }

  const preference = await prefRepo.findOne({ where: { riderId: rider.id } });
  if (!preference) {
    await prefRepo.save(
      prefRepo.create({
        riderId: rider.id,
        maxDistance: 8000,
        orderTypes: ['delivery', 'pickup', 'errands', 'shopping'],
        workingHours: [
          { start: '08:00', end: '12:00' },
          { start: '14:00', end: '22:00' },
        ],
        autoAccept: false,
        minOrderAmount: 5,
        preferredAreas: ['东城区', '朝阳区'],
      })
    );
  }

  const ruleCount = await ruleRepo.count();
  if (ruleCount === 0) {
    await ruleRepo.save(
      ruleRepo.create({
        name: '本地演示派单规则',
        description: '面向本地修复环境的默认派单规则',
        priority: 10,
        isEnabled: true,
        conditions: {
          orderTypes: ['delivery', 'pickup', 'errands', 'shopping'],
          minAmount: 0,
          maxDistance: 10000,
        },
        actions: {
          dispatchMode: 'hybrid',
          riderFilter: {
            minCreditScore: 60,
            vehicleTypes: ['bike', 'electric_bike', 'motorcycle', 'car'],
          },
          notification: {
            push: true,
            sms: false,
            inApp: true,
          },
        },
      })
    );
  }

  const orderCount = await orderRepo.count();
  if (orderCount === 0) {
    const now = new Date();
    const baseOrders = [
      {
        orderNo: 'D202606220001',
        type: 'delivery' as const,
        title: '同城文件急送',
        description: '将合同文件从国贸送到东直门',
        amount: 36,
        tip: 6,
        distance: 4200,
        estimatedTime: 32,
        pickupAddress: '北京市朝阳区国贸写字楼 A 座',
        pickupLocation: { latitude: 39.9084, longitude: 116.4612 },
        pickupName: '张经理',
        pickupPhone: '13900000011',
        deliveryAddress: '北京市东城区东直门商务中心',
        deliveryLocation: { latitude: 39.9413, longitude: 116.4357 },
        deliveryName: '李女士',
        deliveryPhone: '13900000012',
        deadline: new Date(now.getTime() + 70 * 60 * 1000),
        status: 'pending' as const,
        isUrgent: true,
        requireSignature: true,
        source: 'manual' as const,
      },
      {
        orderNo: 'D202606220002',
        type: 'shopping' as const,
        title: '药店代购',
        description: '代购常用药并送至社区',
        amount: 28,
        tip: 4,
        distance: 2500,
        estimatedTime: 25,
        pickupAddress: '北京市朝阳区建国路药店',
        pickupLocation: { latitude: 39.9102, longitude: 116.4588 },
        pickupName: '社区药房',
        pickupPhone: '13900000013',
        deliveryAddress: '北京市朝阳区双井社区 8 号楼',
        deliveryLocation: { latitude: 39.8937, longitude: 116.4665 },
        deliveryName: '王阿姨',
        deliveryPhone: '13900000014',
        deadline: new Date(now.getTime() + 90 * 60 * 1000),
        status: 'pending' as const,
        isUrgent: false,
        requireSignature: false,
        source: 'manual' as const,
      },
    ];

    const savedOrders = await orderRepo.save(baseOrders.map((item) => orderRepo.create(item)));

    await taskRepo.save(
      savedOrders.map((order, index) =>
        taskRepo.create({
          orderId: order.id,
          orderType: order.type,
          status: 'available',
          dispatchMode: index === 0 ? 'manual' : 'hybrid',
          priority: index === 0 ? 95 : 72,
          expireTime: new Date(now.getTime() + (index === 0 ? 25 : 35) * 60 * 1000),
          retryCount: 0,
          maxRetryCount: 3,
          matchedRiders: [],
          tags: [order.type, ...(order.isUrgent ? ['urgent'] : []), ...(order.tip ? ['has_tip'] : [])],
          isHot: Boolean(order.isUrgent || Number(order.amount) >= 30),
        })
      )
    );
  }

  const hotspotCount = await hotspotRepo.count();
  if (hotspotCount === 0) {
    await hotspotRepo.save(
      hotspotRepo.create({
        name: '国贸商圈',
        location: { latitude: 39.9085, longitude: 116.4611 },
        radius: 1800,
        orderCount: 24,
        riderCount: 6,
        heatLevel: 88,
        peakHours: ['09:00', '12:00', '18:00'],
      })
    );
  }

  const creditCount = await creditRepo.count({ where: { riderId: rider.id } });
  if (creditCount === 0) {
    await creditRepo.save(
      creditRepo.create({
        riderId: rider.id,
        change: 6,
        reason: '本地演示账号初始化奖励',
        operatorId: 'system',
      })
    );
  }
}
