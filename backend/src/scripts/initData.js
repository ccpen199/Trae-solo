const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config');
const User = require('../models/User');
const Equipment = require('../models/Equipment');
const SparePart = require('../models/SparePart');
const MaintenancePlan = require('../models/MaintenancePlan');
const RepairOrder = require('../models/RepairOrder');

const initData = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log('MongoDB connected successfully');

    // 创建初始用户
    const users = [
      {
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: '系统管理员',
        email: 'admin@example.com',
        phone: '13800000001'
      },
      {
        username: 'technician1',
        password: 'tech123',
        role: 'technician',
        name: '维修工张师傅',
        email: 'tech1@example.com',
        phone: '13800000002'
      },
      {
        username: 'technician2',
        password: 'tech123',
        role: 'technician',
        name: '维修工李师傅',
        email: 'tech2@example.com',
        phone: '13800000003'
      },
      {
        username: 'user1',
        password: 'user123',
        role: 'user',
        name: '操作员小王',
        email: 'user1@example.com',
        phone: '13800000004'
      },
      {
        username: 'sparepart',
        password: 'spare123',
        role: 'sparePartManager',
        name: '备件管理员小李',
        email: 'spare@example.com',
        phone: '13800000005'
      }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ username: userData.username });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`User ${userData.username} created`);
      } else {
        console.log(`User ${userData.username} already exists`);
      }
    }

    // 创建初始设备
    const adminUser = await User.findOne({ username: 'admin' });
    const technician1 = await User.findOne({ username: 'technician1' });

    const equipments = [
      {
        name: '数控车床',
        code: 'EQ-001',
        type: '加工设备',
        model: 'CJK-6136',
        manufacturer: '沈阳机床厂',
        purchaseDate: new Date('2023-01-15'),
        installDate: new Date('2023-02-01'),
        location: '生产车间A区',
        status: 'normal',
        maintenanceCycle: 30,
        nextMaintenanceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id
      },
      {
        name: '激光切割机',
        code: 'EQ-002',
        type: '切割设备',
        model: 'LCT-3000',
        manufacturer: '大族激光',
        purchaseDate: new Date('2023-03-20'),
        installDate: new Date('2023-04-01'),
        location: '生产车间B区',
        status: 'normal',
        maintenanceCycle: 45,
        nextMaintenanceDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id
      },
      {
        name: '空压机',
        code: 'EQ-003',
        type: '动力设备',
        model: 'KA-200',
        manufacturer: '阿特拉斯',
        purchaseDate: new Date('2022-11-10'),
        installDate: new Date('2022-12-01'),
        location: '动力站房',
        status: 'repair',
        maintenanceCycle: 60,
        nextMaintenanceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id
      }
    ];

    const createdEquipments = [];
    for (const equipmentData of equipments) {
      const existingEquipment = await Equipment.findOne({ code: equipmentData.code });
      if (!existingEquipment) {
        const equipment = new Equipment(equipmentData);
        await equipment.save();
        createdEquipments.push(equipment);
        console.log(`Equipment ${equipmentData.name} created`);

        // 为每个设备创建初始保养计划
        const maintenancePlan = new MaintenancePlan({
          equipmentId: equipment._id,
          planDate: equipment.nextMaintenanceDate,
          status: 'pending',
          createdBy: adminUser._id
        });
        await maintenancePlan.save();
        console.log(`Maintenance plan for ${equipmentData.name} created`);
      } else {
        console.log(`Equipment ${equipmentData.name} already exists`);
        createdEquipments.push(existingEquipment);
      }
    }

    // 创建初始备件
    const spareParts = [
      {
        name: '车刀刀片',
        code: 'SP-001',
        type: '刀具',
        model: 'DCGT11T308',
        manufacturer: '山特维克',
        stockQuantity: 100,
        minimumStock: 20,
        unit: '片',
        price: 85,
        createdBy: adminUser._id
      },
      {
        name: '轴承',
        code: 'SP-002',
        type: '标准件',
        model: '6205-2Z',
        manufacturer: 'SKF',
        stockQuantity: 50,
        minimumStock: 10,
        unit: '个',
        price: 120,
        createdBy: adminUser._id
      },
      {
        name: '液压油',
        code: 'SP-003',
        type: '润滑油',
        model: 'HM-46',
        manufacturer: '壳牌',
        stockQuantity: 200,
        minimumStock: 50,
        unit: '升',
        price: 35,
        createdBy: adminUser._id
      },
      {
        name: '激光发生器',
        code: 'SP-004',
        type: '核心部件',
        model: 'Fiber-1000',
        manufacturer: '大族激光',
        stockQuantity: 5,
        minimumStock: 2,
        unit: '个',
        price: 15000,
        createdBy: adminUser._id
      }
    ];

    const createdSpareParts = [];
    for (const sparePartData of spareParts) {
      const existingSparePart = await SparePart.findOne({ code: sparePartData.code });
      if (!existingSparePart) {
        const sparePart = new SparePart(sparePartData);
        await sparePart.save();
        createdSpareParts.push(sparePart);
        console.log(`Spare part ${sparePartData.name} created`);
      } else {
        console.log(`Spare part ${sparePartData.name} already exists`);
        createdSpareParts.push(existingSparePart);
      }
    }

    // 为设备关联备件
    if (createdEquipments.length > 0 && createdSpareParts.length > 0) {
      const equipment1 = await Equipment.findOne({ code: 'EQ-001' });
      if (equipment1 && equipment1.associatedSpareParts.length === 0) {
        equipment1.associatedSpareParts = [
          { sparePartId: createdSpareParts[0]._id, quantity: 5 },
          { sparePartId: createdSpareParts[1]._id, quantity: 10 }
        ];
        await equipment1.save();
        console.log('Associated spare parts for EQ-001 updated');
      }

      const equipment2 = await Equipment.findOne({ code: 'EQ-002' });
      if (equipment2 && equipment2.associatedSpareParts.length === 0) {
        equipment2.associatedSpareParts = [
          { sparePartId: createdSpareParts[3]._id, quantity: 1 }
        ];
        await equipment2.save();
        console.log('Associated spare parts for EQ-002 updated');
      }
    }

    // 创建示例维修工单
    const user1 = await User.findOne({ username: 'user1' });
    const equipment3 = await Equipment.findOne({ code: 'EQ-003' });

    if (equipment3 && user1) {
      const existingRepairOrder = await RepairOrder.findOne({
        equipmentId: equipment3._id,
        faultDescription: '空压机运行异响'
      });

      if (!existingRepairOrder) {
        const repairOrder = new RepairOrder({
          equipmentId: equipment3._id,
          requester: user1._id,
          technician: technician1._id,
          status: 'inProgress',
          faultDescription: '空压机运行异响',
          faultReason: '轴承磨损',
          solution: '更换轴承',
          repairTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          usedSpareParts: [
            { sparePartId: createdSpareParts[1]._id, quantity: 2 }
          ],
          acceptanceStatus: 'pending'
        });
        await repairOrder.save();
        console.log('Repair order for EQ-003 created');
      } else {
        console.log('Repair order for EQ-003 already exists');
      }
    }

    console.log('Initial data initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing data:', error);
    process.exit(1);
  }
};

initData();