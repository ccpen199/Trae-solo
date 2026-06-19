import { RiskEvent } from '../../entities/RiskEvent.js'
import { generateUUID } from '../../utils/id.js'
import type { User } from '../../entities/User.js'
import type { RiskEventType, RiskLevel, RiskStatus } from '../../../../shared/types/index.js'

const eventTypes: RiskEventType[] = ['multi_account', 'bulk_hoarding', 'abnormal_path']
const levels: RiskLevel[] = ['low', 'medium', 'high']
const statuses: RiskStatus[] = ['pending', 'reviewing', 'resolved', 'ignored']

export function generateRiskEvents(users: User[], count: number = 20): Partial<RiskEvent>[] {
  const events: Partial<RiskEvent>[] = []
  
  for (let i = 0; i < count; i++) {
    const user = users[Math.floor(Math.random() * users.length)]
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const level = levels[Math.floor(Math.random() * levels.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    const relatedAccounts: string[] = []
    if (type === 'multi_account') {
      const relatedCount = Math.floor(Math.random() * 3) + 2
      for (let j = 0; j < relatedCount; j++) {
        const relatedUser = users[Math.floor(Math.random() * users.length)]
        if (relatedUser.id !== user.id && !relatedAccounts.includes(relatedUser.id)) {
          relatedAccounts.push(relatedUser.id)
        }
      }
    }
    
    const evidence: any = {
      anomalyScore: Math.floor(Math.random() * 50) + 50,
      timestamps: [new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)],
    }
    
    if (type === 'multi_account') {
      evidence.deviceId = `device_${Math.random().toString(36).slice(2, 10)}`
      evidence.accountCount = relatedAccounts.length + 1
      evidence.ipAddresses = [`192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`]
    } else if (type === 'bulk_hoarding') {
      evidence.couponCount = Math.floor(Math.random() * 20) + 5
      evidence.timeWindow = `${Math.floor(Math.random() * 60) + 5}分钟`
    } else if (type === 'abnormal_path') {
      evidence.pathNodes = ['和平区', '沈河区', '铁西区'].slice(0, Math.floor(Math.random() * 2) + 2)
    }
    
    const detectedAt = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)
    
    events.push({
      id: generateUUID(),
      type,
      level,
      status,
      userId: user.id,
      deviceId: `device_${Math.random().toString(36).slice(2, 10)}`,
      relatedAccounts,
      evidence,
      handlerNotes: status === 'resolved' ? '已核实处理完毕' : '',
      detectedAt,
      handledAt: status === 'resolved' || status === 'ignored' ? new Date(detectedAt.getTime() + Math.random() * 48 * 60 * 60 * 1000) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }
  
  return events
}
