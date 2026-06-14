import familyRepository from '../repositories/familyRepository.js'
import userRepository from '../repositories/userRepository.js'
import publicSecurityService from './PublicSecurityService.js'
import type { FamilyMutualAid } from '../../shared/types/index.js'
import type { PaginationParams, PaginationResult } from '../repositories/base.js'

interface MemberListResponse {
  success: boolean
  items: FamilyMutualAid[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface BindMemberRequest {
  relativeIdCard: string
  relativeName: string
  relationship: 'parent' | 'child' | 'spouse'
}

interface BindMemberResponse {
  id: number
  status: string
  message: string
}

interface AuthorizeRequest {
  authAmount: number
}

interface AuthorizeResponse {
  id: number
  authAmount: number
  success: boolean
  message: string
}

interface VerifyPoliceRequest {
  idCard: string
  name: string
  relationship?: 'parent' | 'child' | 'spouse'
}

interface VerifyPoliceResponse {
  valid: boolean
  message: string
  verifyId: string
}

interface UsageRecord {
  id: number
  memberName: string
  amount: number
  usageType: string
  hospital: string
  date: string
}

class FamilyService {
  getMemberList(userId: number, pagination: PaginationParams = {}): MemberListResponse {
    const result = familyRepository.findByUserId(userId, pagination)
    return {
      success: true,
      items: result.items as unknown as FamilyMutualAid[],
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    }
  }

  async bindMember(userId: number, request: BindMemberRequest): Promise<BindMemberResponse> {
    const user = userRepository.findById(userId)
    if (!user) {
      throw new Error('用户不存在')
    }

    const existing = familyRepository.findByUserIdAndRelative(userId, request.relativeIdCard)
    if (existing) {
      return {
        id: existing.id,
        status: existing.status,
        message: '该亲属已绑定，请勿重复绑定',
      }
    }

    const verifyResult = await publicSecurityService.verifyRelationship({
      userIdCard: user.idCard,
      relativeIdCard: request.relativeIdCard,
      relationship: request.relationship,
      relativeName: request.relativeName,
    })

    const status = verifyResult.verified ? 'active' : 'rejected'

    const result = familyRepository.create({
      userId,
      relativeIdCard: request.relativeIdCard,
      relativeName: request.relativeName,
      relationship: request.relationship,
      status,
    })

    if (verifyResult.verified) {
      familyRepository.verify(result.id)
    }

    return {
      id: result.id,
      status,
      message: verifyResult.message,
    }
  }

  async verifyWithPolice(userId: number, request: VerifyPoliceRequest): Promise<VerifyPoliceResponse> {
    const user = userRepository.findById(userId)
    if (!user) {
      throw new Error('用户不存在')
    }

    const result = await publicSecurityService.verifyRelationship({
      userIdCard: user.idCard,
      relativeIdCard: request.idCard,
      relativeName: request.name,
      relationship: request.relationship || 'parent',
    })

    return {
      valid: result.verified,
      message: result.message,
      verifyId: result.verifyId,
    }
  }

  authorizeMember(userId: number, memberId: number, request: AuthorizeRequest): AuthorizeResponse {
    const member = familyRepository.findById(memberId)
    if (!member) {
      throw new Error('亲属记录不存在')
    }

    if (member.userId !== userId) {
      throw new Error('无权限操作该亲属记录')
    }

    if (member.status !== 'active') {
      return {
        id: memberId,
        authAmount: member.authAmount,
        success: false,
        message: '该亲属状态为非激活，无法授权',
      }
    }

    if (request.authAmount < 0) {
      return {
        id: memberId,
        authAmount: member.authAmount,
        success: false,
        message: '授权金额不能为负数',
      }
    }

    familyRepository.updateAuthAmount(memberId, request.authAmount)

    return {
      id: memberId,
      authAmount: request.authAmount,
      success: true,
      message: '授权成功',
    }
  }

  unbindMember(userId: number, memberId: number): { success: boolean; message: string } {
    const member = familyRepository.findById(memberId)
    if (!member) {
      throw new Error('亲属记录不存在')
    }

    if (member.userId !== userId) {
      throw new Error('无权限操作该亲属记录')
    }

    familyRepository.updateStatus(memberId, 'terminated')

    return {
      success: true,
      message: '解绑成功',
    }
  }

  getUsageRecords(userId: number): UsageRecord[] {
    const members = familyRepository.findByUserId(userId, { page: 1, pageSize: 100 }).items as unknown as FamilyMutualAid[]
    const usedMembers = members.filter(member => Number(member.usedAmount || 0) > 0)

    if (usedMembers.length === 0) {
      return []
    }

    return usedMembers.map((member, index) => ({
      id: index + 1,
      memberName: member.relativeName,
      amount: Number(member.usedAmount || 0),
      usageType: index % 2 === 0 ? '门诊费用' : '药品费用',
      hospital: index % 2 === 0 ? '湖南省人民医院' : '中南大学湘雅医院',
      date: member.verifiedAt || member.createdAt || new Date().toISOString(),
    }))
  }
}

const familyService = new FamilyService()

export default familyService
export { FamilyService, type MemberListResponse, type BindMemberRequest, type BindMemberResponse, type AuthorizeRequest, type AuthorizeResponse, type VerifyPoliceRequest, type VerifyPoliceResponse, type UsageRecord }
