export interface LicenseRecord {
  id: string
  holder: string
  type: string
  issuer: string
  issueDate: string
  expiryDate: string
  status: '有效' | '即将到期' | '已过期' | '已注销'
  metadata: Record<string, string>
}

export interface ShareRecord {
  id: string
  requester: string
  licenseType: string
  sharedFields: string[]
  desensitization: string
  authStatus: '已授权' | '待审批' | '已拒绝'
  requestTime: string
}
