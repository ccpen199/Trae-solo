const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据库...')

  const passwordHash = await bcrypt.hash('123456', 10)

  const stations = [
    {
      name: '国家电网朝阳充电站',
      address: '北京市朝阳区建国路88号',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      latitude: 39.9042,
      longitude: 116.4074,
      operatorId: 'op-001',
      operatorName: '国家电网北京市电力公司',
      totalPiles: 12,
      availablePiles: 8,
      chargingPower: 180,
      serviceHours: '24小时',
      supportServices: '卫生间,便利店,WiFi,休息区',
      rating: 4.8,
      reviewCount: 256,
    },
    {
      name: '特来电浦东充电站',
      address: '上海市浦东新区张江高科技园区博云路2号',
      province: '上海市',
      city: '上海市',
      district: '浦东新区',
      latitude: 31.2304,
      longitude: 121.4737,
      operatorId: 'op-002',
      operatorName: '特来电新能源股份有限公司',
      totalPiles: 20,
      availablePiles: 15,
      chargingPower: 240,
      serviceHours: '24小时',
      supportServices: '卫生间,便利店,洗车服务,WiFi,休息区',
      rating: 4.6,
      reviewCount: 512,
    },
    {
      name: '星星充电南山充电站',
      address: '广东省深圳市南山区科技园科苑路15号',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      latitude: 22.5431,
      longitude: 113.9415,
      operatorId: 'op-003',
      operatorName: '星星充电',
      totalPiles: 16,
      availablePiles: 10,
      chargingPower: 200,
      serviceHours: '06:00-24:00',
      supportServices: '卫生间,餐饮,WiFi,休息区',
      rating: 4.7,
      reviewCount: 389,
    },
    {
      name: '蔚来换电站奥体中心',
      address: '江苏省南京市建邺区奥体大街188号',
      province: '江苏省',
      city: '南京市',
      district: '建邺区',
      latitude: 32.0603,
      longitude: 118.7969,
      operatorId: 'op-004',
      operatorName: '蔚来汽车',
      totalPiles: 8,
      availablePiles: 6,
      chargingPower: 120,
      serviceHours: '24小时',
      supportServices: '卫生间,便利店,WiFi,换电服务',
      rating: 4.9,
      reviewCount: 128,
    },
    {
      name: '小鹏超级充电站西湖店',
      address: '浙江省杭州市西湖区文三路478号',
      province: '浙江省',
      city: '杭州市',
      district: '西湖区',
      latitude: 30.2741,
      longitude: 120.1551,
      operatorId: 'op-005',
      operatorName: '小鹏汽车',
      totalPiles: 10,
      availablePiles: 7,
      chargingPower: 150,
      serviceHours: '24小时',
      supportServices: '卫生间,WiFi,休息区',
      rating: 4.5,
      reviewCount: 201,
    },
  ]

  const createdStations = []
  for (const station of stations) {
    const s = await prisma.station.create({ data: station })
    createdStations.push(s)
    console.log(`创建充电站: ${s.name}`)
  }

  const chargerTypes = ['DC_FAST', 'AC_SLOW', 'AC_FAST', 'DC_FAST']
  const chargerStatuses = ['AVAILABLE', 'OCCUPIED', 'AVAILABLE', 'AVAILABLE', 'FAULT', 'AVAILABLE', 'RESERVED', 'AVAILABLE']

  for (const station of createdStations) {
    for (let i = 1; i <= station.totalPiles; i++) {
      const type = chargerTypes[i % chargerTypes.length]
      const status = chargerStatuses[i % chargerStatuses.length]
      const isPrivate = false

      const maxPower = type === 'DC_FAST' ? 120 : type === 'AC_FAST' ? 40 : 7

      const charger = await prisma.charger.create({
        data: {
          stationId: station.id,
          name: `${station.name.slice(0, 10)}-${i.toString().padStart(2, '0')}号桩`,
          serialNumber: `CHG${Date.now()}${i.toString().padStart(4, '0')}`,
          type,
          status: i <= station.availablePiles ? 'AVAILABLE' : status,
          maxPower,
          currentPower: status === 'OCCUPIED' ? maxPower * 0.6 : 0,
          protocol: i % 2 === 0 ? 'OCPP1.6' : 'Modbus',
          ipAddress: `192.168.1.${100 + i}`,
          firmwareVersion: 'v2.3.' + (i % 5),
          lastHeartbeat: new Date(),
          totalKw: Math.floor(Math.random() * 50000),
          totalOrders: Math.floor(Math.random() * 1000),
          isPrivate,
        },
      })
    }
    console.log(`  为 ${station.name} 创建 ${station.totalPiles} 个充电桩`)
  }

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      phone: '13800000000',
      email: 'admin@charging.com',
      realName: '系统管理员',
      passwordHash,
      role: 'ADMIN',
      balance: 1000,
      totalChargingKw: 0,
      totalCost: 0,
    },
  })
  console.log(`创建管理员: ${admin.username}`)

  const stationOp = await prisma.user.create({
    data: {
      username: 'station1',
      phone: '13800000001',
      email: 'station1@charging.com',
      realName: '张站长',
      passwordHash,
      role: 'STATION_OPERATOR',
      stationId: createdStations[0].id,
    },
  })
  console.log(`创建场站管理员: ${stationOp.username} - ${createdStations[0].name}`)

  const stationOp2 = await prisma.user.create({
    data: {
      username: 'station2',
      phone: '13800000002',
      email: 'station2@charging.com',
      realName: '李站长',
      passwordHash,
      role: 'STATION_OPERATOR',
      stationId: createdStations[1].id,
    },
  })
  console.log(`创建场站管理员: ${stationOp2.username} - ${createdStations[1].name}`)

  const gridOp = await prisma.user.create({
    data: {
      username: 'grid1',
      phone: '13800000003',
      email: 'grid1@charging.com',
      realName: '王工',
      passwordHash,
      role: 'GRID_COMPANY',
    },
  })
  console.log(`创建电网公司用户: ${gridOp.username}`)

  const pileOp = await prisma.user.create({
    data: {
      username: 'pile1',
      phone: '13800000004',
      email: 'pile1@charging.com',
      realName: '刘经理',
      passwordHash,
      role: 'PILE_ENTERPRISE',
    },
  })
  console.log(`创建桩企用户: ${pileOp.username}`)

  const carOwners = []
  const ownerNames = [
    { username: 'owner1', phone: '13900000001', realName: '陈车主', plate: '京A12345' },
    { username: 'owner2', phone: '13900000002', realName: '李车主', plate: '京B67890' },
    { username: 'owner3', phone: '13900000003', realName: '王车主', plate: '沪A11111' },
    { username: 'owner4', phone: '13900000004', realName: '赵车主', plate: '粤B22222' },
    { username: 'owner5', phone: '13900000005', realName: '孙车主', plate: '苏A33333' },
  ]

  for (const owner of ownerNames) {
    const user = await prisma.user.create({
      data: {
        username: owner.username,
        phone: owner.phone,
        realName: owner.realName,
        passwordHash,
        role: 'CAR_OWNER',
        balance: Math.floor(Math.random() * 2000),
        totalChargingKw: Math.floor(Math.random() * 3000),
        totalCost: Math.floor(Math.random() * 5000),
        carbonReduction: Math.floor(Math.random() * 2000),
      },
    })

    await prisma.vehicle.create({
      data: {
        userId: user.id,
        plateNumber: owner.plate,
        brand: ['比亚迪', '特斯拉', '蔚来', '小鹏', '理想'][Math.floor(Math.random() * 5)],
        model: ['汉EV', 'Model 3', 'ES6', 'P7', 'L9'][Math.floor(Math.random() * 5)],
        batteryCapacity: [60, 70, 75, 85, 100][Math.floor(Math.random() * 5)],
        currentSoc: 20 + Math.floor(Math.random() * 60),
      },
    })

    carOwners.push(user)
    console.log(`创建车主用户: ${user.username} - ${owner.realName}`)
  }

  const pricePeriods = [
    { periodType: 'peak', startTime: '10:00', endTime: '12:00', pricePerKw: 1.8, isPeak: true, isValley: false },
    { periodType: 'peak', startTime: '18:00', endTime: '22:00', pricePerKw: 1.8, isPeak: true, isValley: false },
    { periodType: 'flat', startTime: '07:00', endTime: '10:00', pricePerKw: 1.5, isPeak: false, isValley: false },
    { periodType: 'flat', startTime: '12:00', endTime: '18:00', pricePerKw: 1.5, isPeak: false, isValley: false },
    { periodType: 'flat', startTime: '22:00', endTime: '23:59', pricePerKw: 1.5, isPeak: false, isValley: false },
    { periodType: 'valley', startTime: '00:00', endTime: '07:00', pricePerKw: 0.8, isPeak: false, isValley: true },
  ]

  const cities = ['北京市', '上海市', '深圳市', '南京市', '杭州市']
  for (const city of cities) {
    for (const period of pricePeriods) {
      await prisma.electricityPrice.create({
        data: {
          province: city.includes('北京') ? '北京市' : city.includes('上海') ? '上海市' : city.includes('深圳') ? '广东省' : city.includes('南京') ? '江苏省' : '浙江省',
          city,
          ...period,
          effectiveDate: new Date('2026-01-01'),
        },
      })
    }
  }
  console.log(`创建电价数据: ${cities.length} 个城市, ${pricePeriods.length} 个时段`)

  for (let i = 0; i < 7; i++) {
    const statsDate = new Date()
    statsDate.setDate(statsDate.getDate() - i)

    for (const station of createdStations) {
      const totalOrders = 50 + Math.floor(Math.random() * 100)
      const totalChargingKw = 800 + Math.random() * 2000
      const totalRevenue = totalChargingKw * 1.5

      await prisma.stationStats.create({
        data: {
          stationId: station.id,
          statsDate,
          totalOrders,
          totalChargingKw,
          totalRevenue,
          avgStayMinutes: 30 + Math.random() * 60,
          avgOrderAmount: totalRevenue / totalOrders,
          trafficDensity: 0.3 + Math.random() * 0.6,
          utilizationRate: 0.2 + Math.random() * 0.5,
        },
      })
    }

    await prisma.gridStats.create({
      data: {
        statsDate,
        totalLoadMw: 5000 + Math.random() * 3000,
        peakLoadMw: 8000 + Math.random() * 2000,
        valleyLoadMw: 3000 + Math.random() * 1500,
        newEnergyRatio: 0.15 + Math.random() * 0.25,
        totalChargingKw: 50000 + Math.random() * 30000,
        chargingPeakKw: 8000 + Math.random() * 5000,
      },
    })
  }
  console.log('创建统计数据完成')

  const alarmTypes = ['OVER_TEMPERATURE', 'COMMUNICATION_ERROR', 'OFFLINE', 'OVER_VOLTAGE', 'LEAKAGE']
  const alarmLevels = ['WARNING', 'ERROR', 'WARNING', 'WARNING', 'CRITICAL']
  const alarmTitles = [
    '设备过温告警',
    '通信中断告警',
    '设备离线告警',
    '过压告警',
    '漏电告警',
  ]

  for (let i = 0; i < 15; i++) {
    const typeIndex = i % alarmTypes.length
    const station = createdStations[i % createdStations.length]
    const chargers = await prisma.charger.findMany({ where: { stationId: station.id } })
    const charger = chargers[i % chargers.length]

    await prisma.alarm.create({
      data: {
        alarmNo: `ALM2026060${i}`,
        stationId: station.id,
        chargerId: charger.id,
        type: alarmTypes[typeIndex],
        level: alarmLevels[typeIndex],
        title: alarmTitles[typeIndex],
        description: `${charger.name} 发生 ${alarmTitles[typeIndex]}`,
        status: i < 8 ? 'UNHANDLED' : 'HANDLED',
        handledAt: i >= 8 ? new Date() : null,
        handledBy: i >= 8 ? stationOp.username : null,
      },
    })
  }
  console.log('创建告警数据完成')

  console.log('数据库初始化完成!')
  console.log('')
  console.log('测试账号:')
  console.log('  管理员: admin / 123456')
  console.log('  场站管理员: station1 / 123456')
  console.log('  电网公司: grid1 / 123456')
  console.log('  桩企: pile1 / 123456')
  console.log('  车主: owner1 / 123456')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
