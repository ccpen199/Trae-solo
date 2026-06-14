type RelationshipType = 'parent' | 'child' | 'spouse' | 'sibling'

interface VerifyRelationshipParams {
  userIdCard: string
  relativeIdCard: string
  relationship: RelationshipType
  relativeName: string
}

interface VerifyResult {
  success: boolean
  verified: boolean
  message: string
  verifiedAt?: string
}

class PublicSecurityService {
  private static instance: PublicSecurityService

  private constructor() {}

  static getInstance(): PublicSecurityService {
    if (!PublicSecurityService.instance) {
      PublicSecurityService.instance = new PublicSecurityService()
    }
    return PublicSecurityService.instance
  }

  verifyRelationship(params: VerifyRelationshipParams): Promise<VerifyResult>
  verifyRelationship(idCard1: string, idCard2: string, relationship: RelationshipType): Promise<VerifyResult>
  verifyRelationship(
    paramsOrIdCard1: string | VerifyRelationshipParams,
    idCard2?: string,
    relationship?: RelationshipType,
  ): Promise<VerifyResult> {
    let userIdCard: string
    let relativeIdCard: string
    let rel: RelationshipType

    if (typeof paramsOrIdCard1 === 'string') {
      userIdCard = paramsOrIdCard1
      relativeIdCard = idCard2!
      rel = relationship!
    } else {
      userIdCard = paramsOrIdCard1.userIdCard
      relativeIdCard = paramsOrIdCard1.relativeIdCard
      rel = paramsOrIdCard1.relationship
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.05
        const verified = Math.random() > 0.1

        if (!success) {
          resolve({
            success: false,
            verified: false,
            message: '公安人口库系统繁忙，请稍后重试',
          })
          return
        }

        if (verified) {
          resolve({
            success: true,
            verified: true,
            message: '亲属关系核验通过',
            verifiedAt: new Date().toISOString(),
          })
        } else {
          resolve({
            success: true,
            verified: false,
            message: `身份证 ${userIdCard} 与 ${relativeIdCard} 之间不存在 ${rel} 关系`,
          })
        }
      }, 600 + Math.random() * 1000)
    })
  }

  verifyIdentity(idCard: string, name: string): Promise<VerifyResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.03
        const verified = Math.random() > 0.05

        if (!success) {
          resolve({
            success: false,
            verified: false,
            message: '公安人口库系统繁忙，请稍后重试',
          })
          return
        }

        if (verified) {
          resolve({
            success: true,
            verified: true,
            message: '身份证实名认证通过',
            verifiedAt: new Date().toISOString(),
          })
        } else {
          resolve({
            success: true,
            verified: false,
            message: `身份证 ${idCard} 与姓名 ${name} 不匹配`,
          })
        }
      }, 500 + Math.random() * 800)
    })
  }
}

const publicSecurityService = PublicSecurityService.getInstance()

export default publicSecurityService
export { PublicSecurityService, type RelationshipType, type VerifyRelationshipParams, type VerifyResult }
