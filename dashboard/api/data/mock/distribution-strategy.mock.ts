import { DistributionStrategy } from '../../entities/DistributionStrategy.js'
import { generateUUID } from '../../utils/id.js'
import type { CouponActivity } from '../../entities/CouponActivity.js'

const strategyNames = [
  '新用户定向发放', '高消费用户专属', '和平区用户专享', '沈河区地理围栏',
  '节假日自动发放', '生日祝福券', '沉睡用户唤醒', '会员升级奖励',
  '消费满额回馈', '邀请好友奖励', '节日特惠策略', '周末狂欢',
]

const strategyTypes: Array<'targeted' | 'geofencing' | 'auto'> = ['targeted', 'geofencing', 'auto']

export function generateDistributionStrategies(activities: CouponActivity[], count: number = 15): Partial<DistributionStrategy>[] {
  const strategies: Partial<DistributionStrategy>[] = []
  
  for (let i = 0; i < count; i++) {
    const type = strategyTypes[Math.floor(Math.random() * strategyTypes.length)]
    
    let targetedGroups: string[] | null = null
    let geofencingAreas: any[] | null = null
    let autoTriggerConditions: any | null = null
    
    if (type === 'targeted') {
      targetedGroups = ['high_value', 'new_user']
      autoTriggerConditions = {
        minConsumptionAmount: 5000,
        maxCouponsPerUser: 3,
      }
    } else if (type === 'geofencing') {
      geofencingAreas = [
        {
          id: generateUUID(),
          name: ['和平区', '沈河区', '铁西区'][Math.floor(Math.random() * 3)],
          type: 'district',
          districtCode: '21010' + Math.floor(Math.random() * 10),
        },
      ]
    } else {
      autoTriggerConditions = {
        minConsumptionAmount: 1000,
        maxCouponsPerUser: 1,
      }
    }
    
    strategies.push({
      id: generateUUID(),
      type,
      targetedGroups,
      geofencingAreas,
      autoTriggerConditions,
      createdAt: new Date(Date.now() - Math.random() * 150 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    })
  }
  
  return strategies
}
