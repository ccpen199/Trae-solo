import { CouponInstance } from '../../entities/CouponInstance.js'
import { generateUUID, generateCouponCode } from '../../utils/id.js'
import { addDays } from '../../utils/date.js'
import type { CouponActivity } from '../../entities/CouponActivity.js'
import type { User } from '../../entities/User.js'
import type { CouponInstanceStatus } from '../../../../shared/types/index.js'

export function generateCouponInstances(
  activities: CouponActivity[],
  users: User[],
  count: number = 100,
): Partial<CouponInstance>[] {
  const instances: Partial<CouponInstance>[] = []
  const statuses: CouponInstanceStatus[] = ['available', 'used', 'expired', 'frozen']
  
  for (let i = 0; i < count; i++) {
    const activity = activities[Math.floor(Math.random() * activities.length)]
    const user = users[Math.floor(Math.random() * users.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    const distributeDaysAgo = Math.floor(Math.random() * 60)
    const issuedAt = new Date(Date.now() - distributeDaysAgo * 24 * 60 * 60 * 1000)
    const expiresAt = addDays(issuedAt, 30)
    
    let usedAt: Date | null = null
    if (status === 'used') {
      const usedDaysAgo = Math.floor(Math.random() * (distributeDaysAgo - 1)) + 1
      usedAt = new Date(Date.now() - usedDaysAgo * 24 * 60 * 60 * 1000)
    }
    
    instances.push({
      id: generateUUID(),
      code: generateCouponCode(),
      activityId: activity.id,
      userId: user.id,
      status,
      issuedAt,
      expiresAt,
      usedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }
  
  return instances
}
