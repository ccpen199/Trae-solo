import 'reflect-metadata'
import { AppDataSource, initializeDatabase } from '../data-source.js'
import { generateMerchants } from './mock/merchant.mock.js'
import { generateStores } from './mock/store.mock.js'
import { generatePOSTerminals } from './mock/pos-terminal.mock.js'
import { generateUsers } from './mock/user.mock.js'
import { generateCouponActivities } from './mock/coupon-activity.mock.js'
import { generateInventories } from './mock/inventory.mock.js'
import { generateDistributionStrategies } from './mock/distribution-strategy.mock.js'
import { generateCouponInstances } from './mock/coupon-instance.mock.js'
import { generateVerificationRecords } from './mock/verification-record.mock.js'
import { generateSettlementRecords } from './mock/settlement-record.mock.js'
import { generateRiskEvents } from './mock/risk-event.mock.js'
import { generateAlerts } from './mock/alert.mock.js'
import { AuthAccount } from '../entities/AuthAccount.js'
import { hashPassword } from '../utils/password.js'
import { generateUUID } from '../utils/id.js'
import type { Merchant } from '../entities/Merchant.js'
import type { Store } from '../entities/Store.js'
import type { POSTerminal } from '../entities/POSTerminal.js'
import type { User } from '../entities/User.js'
import type { CouponActivity } from '../entities/CouponActivity.js'
import type { CouponInstance } from '../entities/CouponInstance.js'
import type { VerificationRecord } from '../entities/VerificationRecord.js'
import type { UserRole } from '../../../shared/types/index.js'

async function seed() {
  console.log('🚀 开始初始化数据库...')
  
  await initializeDatabase()
  console.log('✅ 数据库连接成功')

  const queryRunner = AppDataSource.createQueryRunner()
  
  try {
    await queryRunner.startTransaction()
    console.log('🔄 开始事务...')

    console.log('\n📊 生成Mock数据...')

    const merchantData = generateMerchants(20)
    const merchants = await queryRunner.manager.save(
      queryRunner.manager.create('Merchant', merchantData) as unknown as Merchant[],
    )
    console.log(`✅ 商户数据: ${merchants.length} 条`)

    const storeData = generateStores(merchants, 30)
    const stores = await queryRunner.manager.save(
      queryRunner.manager.create('Store', storeData) as unknown as Store[],
    )
    console.log(`✅ 门店数据: ${stores.length} 条`)

    const terminalData = generatePOSTerminals(stores, 40)
    const terminals = await queryRunner.manager.save(
      queryRunner.manager.create('POSTerminal', terminalData) as unknown as POSTerminal[],
    )
    console.log(`✅ POS终端数据: ${terminals.length} 条`)

    const { users: userData, profiles: profileData } = generateUsers(50)
    const users = await queryRunner.manager.save(
      queryRunner.manager.create('User', userData) as unknown as User[],
    )
    console.log(`✅ 用户数据: ${users.length} 条`)

    const profiles = await queryRunner.manager.save(
      queryRunner.manager.create('UserProfile', profileData),
    )
    const profilesArray = Array.isArray(profiles) ? profiles : [profiles]
    console.log(`✅ 用户画像数据: ${profilesArray.length} 条`)

    const activityData = generateCouponActivities(merchants, 15)
    const activities = await queryRunner.manager.save(
      queryRunner.manager.create('CouponActivity', activityData) as unknown as CouponActivity[],
    )
    console.log(`✅ 券活动数据: ${activities.length} 条`)

    for (const activity of activities) {
      const activityMerchants: Merchant[] = []
      for (let i = 0; i < Math.min(5, merchants.length); i++) {
        const merchant = merchants[Math.floor(Math.random() * merchants.length)]
        if (!activityMerchants.find(m => m.id === merchant.id)) {
          activityMerchants.push(merchant)
        }
      }
      activity.applicableMerchants = activityMerchants
      await queryRunner.manager.save(activity)
    }
    console.log('✅ 活动商户关联完成')

    const inventoryData = generateInventories(activities, 20)
    const inventories = await queryRunner.manager.save(
      queryRunner.manager.create('Inventory', inventoryData),
    )
    const inventoriesArray = Array.isArray(inventories) ? inventories : [inventories]
    console.log(`✅ 库存数据: ${inventoriesArray.length} 条`)

    const strategyData = generateDistributionStrategies(activities, 15)
    const strategies = await queryRunner.manager.save(
      queryRunner.manager.create('DistributionStrategy', strategyData),
    )
    const strategiesArray = Array.isArray(strategies) ? strategies : [strategies]
    console.log(`✅ 发放策略数据: ${strategiesArray.length} 条`)

    const instanceData = generateCouponInstances(activities, users, 100)
    const instances = await queryRunner.manager.save(
      queryRunner.manager.create('CouponInstance', instanceData) as unknown as CouponInstance[],
    )
    console.log(`✅ 券实例数据: ${instances.length} 条`)

    const recordData = generateVerificationRecords(instances, merchants, stores, terminals, 80)
    const records = await queryRunner.manager.save(
      queryRunner.manager.create('VerificationRecord', recordData) as unknown as VerificationRecord[],
    )
    console.log(`✅ 核销记录数据: ${records.length} 条`)

    const settlementData = generateSettlementRecords(merchants, records, 25)
    const settlements = await queryRunner.manager.save(
      queryRunner.manager.create('SettlementRecord', settlementData),
    )
    const settlementsArray = Array.isArray(settlements) ? settlements : [settlements]
    console.log(`✅ 结算记录数据: ${settlementsArray.length} 条`)

    const riskData = generateRiskEvents(users, 20)
    const riskEvents = await queryRunner.manager.save(
      queryRunner.manager.create('RiskEvent', riskData),
    )
    const riskEventsArray = Array.isArray(riskEvents) ? riskEvents : [riskEvents]
    console.log(`✅ 风险事件数据: ${riskEventsArray.length} 条`)

    const alertData = generateAlerts(merchants, 25)
    const alerts = await queryRunner.manager.save(
      queryRunner.manager.create('Alert', alertData),
    )
    const alertsArray = Array.isArray(alerts) ? alerts : [alerts]
    console.log(`✅ 预警数据: ${alertsArray.length} 条`)

    const adminAccount = queryRunner.manager.create(AuthAccount, {
      id: generateUUID(),
      username: 'admin',
      password: await hashPassword('admin123'),
      name: '系统管理员',
      role: 'admin' as UserRole,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await queryRunner.manager.save(adminAccount)

    const merchantAccount = queryRunner.manager.create(AuthAccount, {
      id: generateUUID(),
      username: 'merchant',
      password: await hashPassword('merchant123'),
      name: '商户管理员',
      role: 'merchant' as UserRole,
      merchantId: merchants[0]?.id || null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await queryRunner.manager.save(merchantAccount)

    const cashierAccount = queryRunner.manager.create(AuthAccount, {
      id: generateUUID(),
      username: 'cashier',
      password: await hashPassword('cashier123'),
      name: '收银员',
      role: 'cashier' as UserRole,
      merchantId: merchants[0]?.id || null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await queryRunner.manager.save(cashierAccount)

    const riskOfficerAccount = queryRunner.manager.create(AuthAccount, {
      id: generateUUID(),
      username: 'risk',
      password: await hashPassword('risk123'),
      name: '风控专员',
      role: 'risk_officer' as UserRole,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await queryRunner.manager.save(riskOfficerAccount)

    console.log('\n✅ 管理员账户已创建:')
    console.log('   - admin / admin123 (系统管理员)')
    console.log('   - merchant / merchant123 (商户管理员)')
    console.log('   - cashier / cashier123 (收银员)')
    console.log('   - risk / risk123 (风控专员)')

    await queryRunner.commitTransaction()
    console.log('\n🎉 事务提交成功！')

    console.log('\n📈 数据统计:')
    console.log(`   商户: ${merchants.length}`)
    console.log(`   门店: ${stores.length}`)
    console.log(`   POS终端: ${terminals.length}`)
    console.log(`   用户: ${users.length}`)
    console.log(`   用户画像: ${profilesArray.length}`)
    console.log(`   券活动: ${activities.length}`)
    console.log(`   库存: ${inventoriesArray.length}`)
    console.log(`   发放策略: ${strategiesArray.length}`)
    console.log(`   券实例: ${instances.length}`)
    console.log(`   核销记录: ${records.length}`)
    console.log(`   结算记录: ${settlementsArray.length}`)
    console.log(`   风险事件: ${riskEventsArray.length}`)
    console.log(`   预警: ${alertsArray.length}`)

  } catch (error) {
    console.error('❌ 种子数据生成失败:', error)
    await queryRunner.rollbackTransaction()
    throw error
  } finally {
    await queryRunner.release()
  }

  console.log('\n✅ 种子数据生成完成！')
  process.exit(0)
}

seed().catch((error) => {
  console.error('❌ 致命错误:', error)
  process.exit(1)
})
