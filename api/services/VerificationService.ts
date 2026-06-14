import type { Verification, Agent, Property, ApiResponse } from '../../shared/types.js'

export class VerificationService {
  private verifiedOwners: Map<string, { phone: string; verified: boolean; verifyTime: string }> = new Map()
  private verifiedAgents: Map<string, { licenseNumber: string; verified: boolean; verifyTime: string }> = new Map()

  async verifyOwnerPhone(
    ownerId: string,
    phone: string
  ): Promise<ApiResponse<{ verified: boolean; code?: string }>> {
    try {
      const phoneRegex = /^1[3-9]\d{9}$/
      if (!phoneRegex.test(phone)) {
        return {
          success: true,
          data: {
            verified: false,
            code: 'INVALID_PHONE'
          }
        }
      }

      const isMockVerify = this.simulateSmsVerification(phone)

      const existing = this.verifiedOwners.get(ownerId)
      if (existing && existing.verified) {
        return {
          success: true,
          data: {
            verified: true,
            code: 'ALREADY_VERIFIED'
          }
        }
      }

      this.verifiedOwners.set(ownerId, {
        phone,
        verified: isMockVerify,
        verifyTime: new Date().toISOString()
      })

      return {
        success: true,
        data: {
          verified: isMockVerify,
          code: isMockVerify ? 'VERIFICATION_SUCCESS' : 'VERIFICATION_FAILED'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '业主手机号验证失败'
      }
    }
  }

  async verifyAgentLicense(
    agentId: string,
    licenseNumber: string
  ): Promise<ApiResponse<{ verified: boolean; agent?: Agent }>> {
    try {
      const licenseRegex = /^[A-Z]\d{8}$/
      if (!licenseRegex.test(licenseNumber)) {
        return {
          success: true,
          data: {
            verified: false
          }
        }
      }

      const existing = this.verifiedAgents.get(agentId)
      if (existing && existing.verified) {
        return {
          success: true,
          data: {
            verified: true
          }
        }
      }

      const isMockVerify = this.simulateLicenseCheck(licenseNumber)

      this.verifiedAgents.set(agentId, {
        licenseNumber,
        verified: isMockVerify,
        verifyTime: new Date().toISOString()
      })

      return {
        success: true,
        data: {
          verified: isMockVerify
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '经纪人备案验证失败'
      }
    }
  }

  calculateDecayWeight(publishTime: string): { listingDays: number; decayWeight: number } {
    const now = new Date()
    const publishDate = new Date(publishTime)
    const listingDays = Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24))

    let decayWeight: number

    if (listingDays <= 7) {
      decayWeight = 1.0
    } else if (listingDays <= 30) {
      decayWeight = 0.9
    } else if (listingDays <= 60) {
      decayWeight = 0.8
    } else if (listingDays <= 90) {
      decayWeight = 0.7
    } else if (listingDays <= 180) {
      decayWeight = 0.6
    } else {
      decayWeight = Math.max(0.3, 0.6 - Math.floor((listingDays - 180) / 30) * 0.05)
    }

    return {
      listingDays,
      decayWeight: Math.round(decayWeight * 100) / 100
    }
  }

  async completeVerification(
    property: Property,
    ownerVerified: boolean,
    antiFraudPassed: boolean
  ): Promise<ApiResponse<Verification>> {
    try {
      const { listingDays, decayWeight } = this.calculateDecayWeight(property.publishTime)

      let agentVerified = false
      if (property.agent) {
        const agentRecord = this.verifiedAgents.get(property.agent.id)
        agentVerified = agentRecord?.verified || false
      }

      const verification: Verification = {
        ownerVerified,
        agentVerified,
        antiFraudPassed,
        verifyTime: new Date().toISOString(),
        listingDays,
        decayWeight
      }

      return {
        success: true,
        data: verification
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '核验完成失败'
      }
    }
  }

  async updateListingWeight(
    property: Property
  ): Promise<ApiResponse<{ listingWeight: number; decayWeight: number; listingDays: number }>> {
    try {
      const { listingDays, decayWeight } = this.calculateDecayWeight(property.publishTime)

      let baseWeight = 50

      if (property.verification.ownerVerified) {
        baseWeight += 15
      }

      if (property.verification.agentVerified) {
        baseWeight += 10
      }

      if (property.verification.antiFraudPassed) {
        baseWeight += 10
      }

      if (property.vrUrl) {
        baseWeight += 5
      }

      if (property.schoolDistrict) {
        baseWeight += 5
      }

      if (property.metroInfo && property.metroInfo.distance <= 500) {
        baseWeight += 5
      }

      const listingWeight = Math.round(baseWeight * decayWeight)

      return {
        success: true,
        data: {
          listingWeight: Math.min(100, listingWeight),
          decayWeight,
          listingDays
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新挂牌权重失败'
      }
    }
  }

  private simulateSmsVerification(phone: string): boolean {
    return phone.length === 11 && phone.startsWith('1')
  }

  private simulateLicenseCheck(licenseNumber: string): boolean {
    return licenseNumber.length === 9 && /^[A-Z]\d{8}$/.test(licenseNumber)
  }

  isOwnerVerified(ownerId: string): boolean {
    return this.verifiedOwners.get(ownerId)?.verified || false
  }

  isAgentVerified(agentId: string): boolean {
    return this.verifiedAgents.get(agentId)?.verified || false
  }
}

export const verificationService = new VerificationService()
