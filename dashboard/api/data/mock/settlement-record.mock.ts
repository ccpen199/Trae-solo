import { SettlementRecord } from '../../entities/SettlementRecord.js'
import { generateUUID, generateBatchNo } from '../../utils/id.js'
import type { Merchant } from '../../entities/Merchant.js'
import type { VerificationRecord } from '../../entities/VerificationRecord.js'
import type { SettlementStatus } from '../../../../shared/types/index.js'

const statuses: SettlementStatus[] = ['pending', 'approved', 'rejected', 'transferred']

export function generateSettlementRecords(
  merchants: Merchant[],
  verificationRecords: VerificationRecord[],
  count: number = 25,
): Partial<SettlementRecord>[] {
  const records: Partial<SettlementRecord>[] = []
  
  for (let i = 0; i < count; i++) {
    const merchant = merchants[Math.floor(Math.random() * merchants.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    const periodStart = new Date(Date.now() - (i * 30 + 30) * 24 * 60 * 60 * 1000)
    const periodEnd = new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    const merchantRecords = verificationRecords.filter(r => r.merchantId === merchant.id && r.status === 'success')
    const recordCount = Math.min(merchantRecords.length, Math.floor(Math.random() * 10) + 1)
    
    let totalAmount = 0
    let subsidyAmount = 0
    
    for (let j = 0; j < recordCount; j++) {
      totalAmount += merchantRecords[j]?.originalAmount || 0
      subsidyAmount += merchantRecords[j]?.discountAmount || 0
    }
    
    const settlement: Partial<SettlementRecord> = {
      id: generateUUID(),
      merchantId: merchant.id,
      periodStart,
      periodEnd,
      totalAmount,
      subsidyAmount,
      actualAmount: totalAmount - subsidyAmount,
      totalVerifications: recordCount,
      status,
      provincialBatchId: status === 'transferred' ? `LN-SY-${Date.now().toString().slice(-6)}${i}` : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    if (status === 'approved' || status === 'transferred') {
      settlement.transferTime = new Date(periodEnd.getTime() + 15 * 24 * 60 * 60 * 1000)
    }
    
    records.push(settlement)
  }
  
  return records
}
