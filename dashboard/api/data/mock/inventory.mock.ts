import { Inventory } from '../../entities/Inventory.js'
import { generateUUID, generateBatchNo } from '../../utils/id.js'
import { daysFromNow } from '../../utils/date.js'
import type { CouponActivity } from '../../entities/CouponActivity.js'

export function generateInventories(activities: CouponActivity[], count: number = 20): Partial<Inventory>[] {
  const inventories: Partial<Inventory>[] = []
  
  for (let i = 0; i < count; i++) {
    const activity = activities[Math.floor(Math.random() * activities.length)]
    const quantity = Math.floor(Math.random() * 20000) + 5000
    const availableQuantity = Math.floor(quantity * (0.2 + Math.random() * 0.5))
    
    inventories.push({
      id: generateUUID(),
      activityId: activity.id,
      batchNo: generateBatchNo(),
      quantity,
      availableQuantity,
      unitCost: Math.random() * 50 + 5,
      expiryDate: daysFromNow(Math.floor(Math.random() * 180) + 30),
      createdAt: new Date(Date.now() - Math.random() * 120 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    })
  }
  
  return inventories
}
