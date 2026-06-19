import { VerificationRecord } from '../../entities/VerificationRecord.js'
import { generateUUID, generateOrderNo } from '../../utils/id.js'
import type { CouponInstance } from '../../entities/CouponInstance.js'
import type { Merchant } from '../../entities/Merchant.js'
import type { Store } from '../../entities/Store.js'
import type { POSTerminal } from '../../entities/POSTerminal.js'
import type { TerminalType, VerificationStatus, GeoLocation } from '../../../../shared/types/index.js'

const terminalTypes: TerminalType[] = ['pos', 'miniapp', 'citycode']
const statuses: VerificationStatus[] = ['success', 'failed', 'reversed']

export function generateVerificationRecords(
  instances: CouponInstance[],
  merchants: Merchant[],
  stores: Store[],
  terminals: POSTerminal[],
  count: number = 80,
): Partial<VerificationRecord>[] {
  const records: Partial<VerificationRecord>[] = []
  const usedCouponInstanceIds = new Set<string>()
  
  const allInstances = [...instances]
  allInstances.sort(() => Math.random() - 0.5)
  
  const actualCount = Math.min(count, allInstances.length)
  
  for (let i = 0; i < actualCount; i++) {
    const instance = allInstances[i]
    const merchant = merchants[Math.floor(Math.random() * merchants.length)]
    const store = stores[Math.floor(Math.random() * stores.length)]
    const terminal = terminals[Math.floor(Math.random() * terminals.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    const originalAmount = Math.floor(Math.random() * 500) + 50
    const discountAmount = Math.floor(Math.random() * 100) + 10
    const amount = originalAmount - discountAmount
    
    const verifyTime = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
    
    const location: GeoLocation = {
      latitude: 41.8 + Math.random() * 0.3,
      longitude: 123.4 + Math.random() * 0.3,
    }
    
    if (usedCouponInstanceIds.has(instance.id)) {
      continue
    }
    usedCouponInstanceIds.add(instance.id)
    
    const record: Partial<VerificationRecord> = {
      id: generateUUID(),
      couponInstanceId: instance.id,
      activityId: instance.activityId,
      userId: instance.userId,
      merchantId: merchant.id,
      storeId: store.id,
      terminalId: terminal.id,
      terminalType: terminalTypes[Math.floor(Math.random() * terminalTypes.length)],
      originalAmount,
      discountAmount,
      amount,
      status,
      orderNo: generateOrderNo(),
      location,
      verifiedAt: verifyTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    records.push(record)
  }
  
  return records
}
