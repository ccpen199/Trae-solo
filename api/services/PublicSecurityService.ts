interface VerifyRelationshipRequest {
  userIdCard: string
  relativeIdCard: string
  relationship: 'parent' | 'child' | 'spouse'
  relativeName: string
}

interface VerifyRelationshipResponse {
  verified: boolean
  message: string
  verifyId: string
}

class PublicSecurityService {
  async verifyRelationship(request: VerifyRelationshipRequest): Promise<VerifyRelationshipResponse> {
    await this.simulateApiCall()

    const isValidIdCard = this.validateIdCard(request.relativeIdCard)
    if (!isValidIdCard) {
      return {
        verified: false,
        message: '亲属身份证号码格式不正确',
        verifyId: '',
      }
    }

    if (request.userIdCard === request.relativeIdCard) {
      return {
        verified: false,
        message: '不能绑定本人',
        verifyId: '',
      }
    }

    const isVerified = this.simulateVerification(request)

    return {
      verified: isVerified,
      message: isVerified ? '关系核验通过' : '未查询到该亲属关系，请确认信息是否正确',
      verifyId: isVerified ? 'VERIFY' + Date.now() : '',
    }
  }

  private async simulateApiCall(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 500))
  }

  private validateIdCard(idCard: string): boolean {
    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
    return idCardRegex.test(idCard)
  }

  private simulateVerification(request: VerifyRelationshipRequest): boolean {
    const idCardSum = request.relativeIdCard.split('').reduce((sum, char) => sum + (char === 'X' ? 10 : parseInt(char)), 0)
    return idCardSum % 5 !== 0
  }
}

const publicSecurityService = new PublicSecurityService()

export default publicSecurityService
export { PublicSecurityService, type VerifyRelationshipRequest, type VerifyRelationshipResponse }
