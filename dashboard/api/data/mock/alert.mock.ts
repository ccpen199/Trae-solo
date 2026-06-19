import { Alert } from '../../entities/Alert.js'
import { generateUUID } from '../../utils/id.js'
import type { Merchant } from '../../entities/Merchant.js'

const types: Array<'inventory' | 'verification_rate' | 'risk' | 'system'> = ['inventory', 'verification_rate', 'risk', 'system']
const levels: Array<'info' | 'warning' | 'critical'> = ['info', 'warning', 'critical']

const alertMessages: Record<string, string[]> = {
  inventory: [
    '库存不足，请及时补货',
    '某活动库存即将耗尽',
    '库存预警：剩余数量低于阈值',
  ],
  verification_rate: [
    '核销率异常偏低',
    '某商户核销率低于50%',
    '核销速度异常，需要关注',
  ],
  risk: [
    '检测到高风险事件',
    '多账号关联风险预警',
    '批量囤券行为预警',
  ],
  system: [
    '系统负载过高',
    'Redis连接异常',
    '数据库查询慢',
  ],
}

export function generateAlerts(merchants: Merchant[], count: number = 25): Partial<Alert>[] {
  const alerts: Partial<Alert>[] = []
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const level = levels[Math.floor(Math.random() * levels.length)]
    const merchant = Math.random() > 0.5 ? merchants[Math.floor(Math.random() * merchants.length)] : null
    const messages = alertMessages[type]
    const read = Math.random() > 0.6
    
    alerts.push({
      id: generateUUID(),
      type,
      level,
      title: `${type === 'inventory' ? '库存' : type === 'verification_rate' ? '核销' : type === 'risk' ? '风险' : '系统'}预警`,
      message: messages[Math.floor(Math.random() * messages.length)],
      merchantId: merchant ? merchant.id : null,
      relatedId: generateUUID(),
      read,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    })
  }
  
  return alerts
}
