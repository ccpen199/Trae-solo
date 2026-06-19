import { User } from '../../entities/User.js'
import { UserProfile } from '../../entities/UserProfile.js'
import { generateUUID } from '../../utils/id.js'
import type { UserStatus, ConsumptionTier } from '../../../../shared/types/index.js'

const firstNames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴']
const lastNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋']

const cities = ['和平区', '沈河区', '皇姑区', '大东区', '铁西区', '浑南区']
const preferredCategories = ['retail', 'catering', 'automotive', 'home_appliance', 'clothing', 'electronics']
const consumptionTiers: ConsumptionTier[] = ['low', 'medium', 'high']
const userStatuses: UserStatus[] = ['normal', 'frozen', 'watch']

export function generateUsers(count: number = 50): { users: Partial<User>[]; profiles: Partial<UserProfile>[] } {
  const users: Partial<User>[] = []
  const profiles: Partial<UserProfile>[] = []
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const name = firstName + lastName
    const userId = generateUUID()
    
    users.push({
      id: userId,
      realName: name,
      phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      idCard: `21010${Math.floor(Math.random() * 10)}${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      deviceId: `device_${Math.random().toString(36).slice(2, 10)}`,
      riskScore: Math.floor(Math.random() * 30),
      status: userStatuses[Math.floor(Math.random() * userStatuses.length)],
      createdAt: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    })
    
    const preferredCats: string[] = []
    const catCount = Math.floor(Math.random() * 3) + 1
    for (let j = 0; j < catCount; j++) {
      const cat = preferredCategories[Math.floor(Math.random() * preferredCategories.length)]
      if (!preferredCats.includes(cat)) preferredCats.push(cat)
    }
    
    const preferredDistricts: string[] = []
    const distCount = Math.floor(Math.random() * 2) + 1
    for (let j = 0; j < distCount; j++) {
      const dist = cities[Math.floor(Math.random() * cities.length)]
      if (!preferredDistricts.includes(dist)) preferredDistricts.push(dist)
    }
    
    const historicalVerificationCount = Math.floor(Math.random() * 30) + 1
    const historicalVerificationAmount = Math.floor(Math.random() * 50000) + 1000
    
    profiles.push({
      id: generateUUID(),
      userId,
      consumptionTier: consumptionTiers[Math.floor(Math.random() * consumptionTiers.length)],
      preferredCategories: preferredCats,
      preferredDistricts,
      historicalVerificationCount,
      historicalVerificationAmount,
      lastActiveAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }
  
  return { users, profiles }
}
