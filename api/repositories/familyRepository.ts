import BaseRepository from './base.js'
import type { FamilyMutualAid } from '../../shared/types/index.js'
import type { PaginationParams, PaginationResult } from './base.js'

interface FamilyCreateData {
  userId: number
  relativeIdCard: string
  relativeName: string
  relationship: 'parent' | 'child' | 'spouse'
  authAmount?: number
  usedAmount?: number
  status?: 'pending_verify' | 'active' | 'rejected' | 'terminated'
}

interface FamilyUpdateData {
  authAmount?: number
  usedAmount?: number
  status?: 'pending_verify' | 'active' | 'rejected' | 'terminated'
}

class FamilyRepository extends BaseRepository<FamilyMutualAid> {
  constructor() {
    super('family_mutual_aid')
  }

  findByUserId(userId: number, pagination: PaginationParams = {}): PaginationResult<FamilyMutualAid> {
    return this.findPaginated(
      pagination,
      [{ field: 'user_id', value: userId }],
      'created_at',
      'DESC',
    )
  }

  findByUserIdAndRelative(userId: number, relativeIdCard: string): FamilyMutualAid | undefined {
    return this.findOne([
      { field: 'user_id', value: userId },
      { field: 'relative_id_card', value: relativeIdCard },
    ])
  }

  findByRelativeIdCard(relativeIdCard: string): FamilyMutualAid | undefined {
    return this.findOne([{ field: 'relative_id_card', value: relativeIdCard }])
  }

  create(data: FamilyCreateData): { id: number; changes: number } {
    const familyData = {
      user_id: data.userId,
      relative_id_card: data.relativeIdCard,
      relative_name: data.relativeName,
      relationship: data.relationship,
      auth_amount: data.authAmount || 0,
      used_amount: data.usedAmount || 0,
      status: data.status || 'pending_verify',
    }
    return super.create(familyData as Partial<FamilyMutualAid>)
  }

  updateAuthAmount(id: number, authAmount: number): { changes: number } {
    return this.update(id, { auth_amount: authAmount } as Partial<FamilyMutualAid>)
  }

  updateStatus(id: number, status: FamilyMutualAid['status']): { changes: number } {
    const updateData: Partial<FamilyMutualAid> = {}
    ;(updateData as Record<string, unknown>).status = status
    if (status === 'active') {
      ;(updateData as Record<string, unknown>).verified_at = new Date().toISOString()
    }
    return super.update(id, updateData)
  }

  verify(id: number): { changes: number } {
    return this.updateStatus(id, 'active')
  }
}

const familyRepository = new FamilyRepository()

export default familyRepository
export { FamilyRepository, type FamilyCreateData, type FamilyUpdateData }
