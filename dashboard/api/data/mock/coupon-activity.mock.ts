import { CouponActivity } from '../../entities/CouponActivity.js'
import { generateUUID } from '../../utils/id.js'
import { generateRandomDateRange } from '../../utils/date.js'
import type { Merchant } from '../../entities/Merchant.js'
import type { CouponType, CouponStatus } from '../../../../shared/types/index.js'

const activityNames = [
  '春季惠民消费券', '劳动节特别活动', '端午佳节特惠', '618购物节', '夏日清凉补贴',
  '开学季福利', '中秋团圆券', '国庆黄金周', '双十一狂欢', '双十二盛典',
  '年终大促', '年货节', '元宵节特惠', '情人节浪漫券', '母亲节感恩',
]

const couponTypes: CouponType[] = ['fixed', 'discount', 'threshold']
const categories = ['retail', 'catering', 'automotive', 'home_appliance', 'clothing', 'electronics', 'general']

export function generateCouponActivities(merchants: Merchant[], count: number = 15): Partial<CouponActivity>[] {
  const activities: Partial<CouponActivity>[] = []
  
  for (let i = 0; i < count; i++) {
    const type = couponTypes[Math.floor(Math.random() * couponTypes.length)]
    const value = type === 'discount' ? Math.floor(Math.random() * 30) + 10 : Math.floor(Math.random() * 100) + 10
    const threshold = Math.floor(Math.random() * 100) + 50
    const { startDate, endDate } = generateRandomDateRange(60, 90)
    const statuses: CouponStatus[] = ['draft', 'active', 'paused', 'expired']
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    const activityMerchants: Merchant[] = []
    const merchantCount = Math.floor(Math.random() * 5) + 3
    for (let j = 0; j < merchantCount; j++) {
      const merchant = merchants[Math.floor(Math.random() * merchants.length)]
      if (!activityMerchants.find(m => m.id === merchant.id)) {
        activityMerchants.push(merchant)
      }
    }
    
    activities.push({
      id: generateUUID(),
      name: activityNames[i % activityNames.length],
      type,
      value,
      threshold,
      totalQuantity: Math.floor(Math.random() * 50000) + 10000,
      usedQuantity: 0,
      status,
      startTime: startDate,
      endTime: endDate,
      description: `${activityNames[i % activityNames.length]}活动说明`,
      applicableMerchantIds: activityMerchants.map(m => m.id),
      createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    })
  }
  
  return activities
}
