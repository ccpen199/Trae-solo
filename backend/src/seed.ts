import prisma from './utils/prisma'
import { hashPassword } from './utils/bcrypt'

interface MenuData {
  name: string
  path: string
  icon: string
  sortOrder: number
  type: number
  permission?: string
  children?: MenuData[]
}

async function seed() {
  console.log('Seeding database...')

  // 1. 创建管理员角色
  const adminRole = await prisma.role.upsert({
    where: { name: '超级管理员' },
    update: {},
    create: {
      name: '超级管理员',
      description: '拥有系统全部权限',
    },
  })

  // 2. 创建菜单结构
  const menus: MenuData[] = [
    // 系统管理
    {
      name: '系统管理',
      path: '/system',
      icon: 'SettingOutlined',
      sortOrder: 100,
      type: 1,
      children: [
        {
          name: '用户管理',
          path: '/system/users',
          icon: 'UserOutlined',
          sortOrder: 1,
          type: 2,
          permission: 'system:user:list',
        },
        {
          name: '角色管理',
          path: '/system/roles',
          icon: 'TeamOutlined',
          sortOrder: 2,
          type: 2,
          permission: 'system:role:list',
        },
        {
          name: '菜单管理',
          path: '/system/menus',
          icon: 'MenuOutlined',
          sortOrder: 3,
          type: 2,
          permission: 'system:menu:list',
        },
        {
          name: '部门管理',
          path: '/system/departments',
          icon: 'ApartmentOutlined',
          sortOrder: 4,
          type: 2,
          permission: 'system:dept:list',
        },
      ],
    },
    // 基础设置
    {
      name: '基础设置',
      path: '/setting',
      icon: 'ToolOutlined',
      sortOrder: 90,
      type: 1,
      children: [
        {
          name: '城市管理',
          path: '/setting/cities',
          icon: 'EnvironmentOutlined',
          sortOrder: 1,
          type: 2,
          permission: 'setting:city:list',
        },
        {
          name: '节点管理',
          path: '/setting/nodes',
          icon: 'ClusterOutlined',
          sortOrder: 2,
          type: 2,
          permission: 'setting:node:list',
        },
        {
          name: '车型管理',
          path: '/setting/vehicle-types',
          icon: 'CarOutlined',
          sortOrder: 3,
          type: 2,
          permission: 'setting:vehicleType:list',
        },
        {
          name: '车辆管理',
          path: '/setting/vehicles',
          icon: 'TruckOutlined',
          sortOrder: 4,
          type: 2,
          permission: 'setting:vehicle:list',
        },
        {
          name: '司机管理',
          path: '/setting/drivers',
          icon: 'UserSwitchOutlined',
          sortOrder: 5,
          type: 2,
          permission: 'setting:driver:list',
        },
        {
          name: '货物类型',
          path: '/setting/cargo-types',
          icon: 'ShopOutlined',
          sortOrder: 6,
          type: 2,
          permission: 'setting:cargoType:list',
        },
        {
          name: '业务类型',
          path: '/setting/business-types',
          icon: 'BuildOutlined',
          sortOrder: 7,
          type: 2,
          permission: 'setting:businessType:list',
        },
        {
          name: 'GPS管理',
          path: '/setting/gps',
          icon: 'CarryOutOutlined',
          sortOrder: 8,
          type: 2,
          permission: 'setting:gps:list',
        },
      ],
    },
    // 运输网络
    {
      name: '运输网络',
      path: '/network',
      icon: 'GlobalOutlined',
      sortOrder: 80,
      type: 1,
      children: [
        {
          name: '承运商管理',
          path: '/network/carriers',
          icon: 'ReconciliationOutlined',
          sortOrder: 1,
          type: 2,
          permission: 'network:carrier:list',
        },
        {
          name: '运输类型',
          path: '/network/transport-types',
          icon: 'TransactionOutlined',
          sortOrder: 2,
          type: 2,
          permission: 'network:transportType:list',
        },
        {
          name: '运输线路',
          path: '/network/routes',
          icon: 'ShareAltOutlined',
          sortOrder: 3,
          type: 2,
          permission: 'network:route:list',
        },
        {
          name: '运价管理',
          path: '/network/rates',
          icon: 'DollarOutlined',
          sortOrder: 4,
          type: 2,
          permission: 'network:rate:list',
        },
      ],
    },
    // 发运管理
    {
      name: '发运管理',
      path: '/shipping',
      icon: 'SendOutlined',
      sortOrder: 70,
      type: 1,
      children: [
        {
          name: '运输计划',
          path: '/shipping/plans',
          icon: 'FileSearchOutlined',
          sortOrder: 1,
          type: 2,
          permission: 'shipping:plan:list',
        },
        {
          name: '运输委托',
          path: '/shipping/orders',
          icon: 'FileTextOutlined',
          sortOrder: 2,
          type: 2,
          permission: 'shipping:order:list',
        },
        {
          name: '在途监控',
          path: '/shipping/monitoring',
          icon: 'EyeOutlined',
          sortOrder: 3,
          type: 2,
          permission: 'shipping:monitor:list',
        },
        {
          name: '异常管理',
          path: '/shipping/exceptions',
          icon: 'WarningOutlined',
          sortOrder: 4,
          type: 2,
          permission: 'shipping:exception:list',
        },
      ],
    },
    // 到货管理
    {
      name: '到货管理',
      path: '/arrival',
      icon: 'InboxOutlined',
      sortOrder: 60,
      type: 1,
      children: [
        {
          name: '到货预报',
          path: '/arrival/forecasts',
          icon: 'BellOutlined',
          sortOrder: 1,
          type: 2,
          permission: 'arrival:forecast:list',
        },
        {
          name: '签收管理',
          path: '/arrival/signs',
          icon: 'FormOutlined',
          sortOrder: 2,
          type: 2,
          permission: 'arrival:sign:list',
        },
        {
          name: '索赔管理',
          path: '/arrival/claims',
          icon: 'AlertOutlined',
          sortOrder: 3,
          type: 2,
          permission: 'arrival:claim:list',
        },
      ],
    },
    // 对账管理
    {
      name: '对账管理',
      path: '/finance',
      icon: 'AccountBookOutlined',
      sortOrder: 50,
      type: 1,
      children: [
        {
          name: '运费核算',
          path: '/finance/calculations',
          icon: 'CalculatorOutlined',
          sortOrder: 1,
          type: 2,
          permission: 'finance:calculation:list',
        },
        {
          name: '对账管理',
          path: '/finance/reconciliations',
          icon: 'AuditOutlined',
          sortOrder: 2,
          type: 2,
          permission: 'finance:reconciliation:list',
        },
        {
          name: '操作日志',
          path: '/finance/logs',
          icon: 'HistoryOutlined',
          sortOrder: 3,
          type: 2,
          permission: 'finance:log:list',
        },
      ],
    },
  ]

  // 先清理旧菜单
  await prisma.roleMenu.deleteMany({})
  await prisma.menu.deleteMany({})

  const createMenu = async (menu: MenuData, parentId?: string) => {
    const created = await prisma.menu.create({
      data: {
        name: menu.name,
        path: menu.path,
        icon: menu.icon,
        sortOrder: menu.sortOrder,
        type: menu.type,
        permission: menu.permission,
        parentId,
      },
    })

    if (menu.children && menu.children.length > 0) {
      for (const child of menu.children) {
        await createMenu(child, created.id)
      }
    }

    return created
  }

  for (const menu of menus) {
    await createMenu(menu)
  }

  // 3. 将所有菜单分配给管理员角色
  const allMenus = await prisma.menu.findMany()
  for (const menu of allMenus) {
    await prisma.roleMenu.create({
      data: {
        roleId: adminRole.id,
        menuId: menu.id,
      },
    })
  }

  // 4. 创建默认管理员用户
  const hashedPassword = await hashPassword('admin123')
  
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' },
  })

  const adminUser = existingAdmin
    ? await prisma.user.update({
        where: { username: 'admin' },
        data: {
          password: hashedPassword,
          realName: '系统管理员',
          status: 1,
        },
      })
    : await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          realName: '系统管理员',
          status: 1,
        },
      })

  // 5. 给管理员用户分配管理员角色
  const existingUserRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
  })

  if (!existingUserRole) {
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    })
  }

  // 6. 创建一些基础数据
  // 运输类型
  const transportTypes = [
    { code: 'ROAD_FULL', name: '公路整车', type: 1, billingMode: 'weight' },
    { code: 'ROAD_LTL', name: '公路零担', type: 2, billingMode: 'combined' },
    { code: 'AIR', name: '航空运输', type: 3, billingMode: 'weight' },
    { code: 'RAIL', name: '铁路运输', type: 4, billingMode: 'weight' },
    { code: 'EXPRESS', name: '快递', type: 5, billingMode: 'weight' },
  ]

  for (const tt of transportTypes) {
    const existing = await prisma.transportType.findUnique({
      where: { code: tt.code },
    })
    if (!existing) {
      await prisma.transportType.create({ data: tt })
    }
  }

  // 业务类型
  const businessTypes = [
    { code: 'INBOUND', name: '入库运输', description: '从供应商到仓库' },
    { code: 'OUTBOUND', name: '出库运输', description: '从仓库到客户' },
    { code: 'TRANSFER', name: '调拨运输', description: '仓库间调拨' },
    { code: 'RETURN', name: '退货运输', description: '客户退货运输' },
  ]

  for (const bt of businessTypes) {
    const existing = await prisma.businessType.findUnique({
      where: { code: bt.code },
    })
    if (!existing) {
      await prisma.businessType.create({ data: bt })
    }
  }

  // 城市数据（部分示例）
  const cities = [
    { code: '110000', name: '北京市', province: '北京市', city: '北京市', level: 2 },
    { code: '310000', name: '上海市', province: '上海市', city: '上海市', level: 2 },
    { code: '440100', name: '广州市', province: '广东省', city: '广州市', level: 2 },
    { code: '440300', name: '深圳市', province: '广东省', city: '深圳市', level: 2 },
    { code: '330100', name: '杭州市', province: '浙江省', city: '杭州市', level: 2 },
    { code: '320100', name: '南京市', province: '江苏省', city: '南京市', level: 2 },
    { code: '510100', name: '成都市', province: '四川省', city: '成都市', level: 2 },
    { code: '420100', name: '武汉市', province: '湖北省', city: '武汉市', level: 2 },
  ]

  for (const city of cities) {
    const existing = await prisma.city.findUnique({
      where: { code: city.code },
    })
    if (!existing) {
      await prisma.city.create({ data: city })
    }
  }

  console.log('Seeding completed!')
  console.log('Default admin user: admin / admin123')
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
