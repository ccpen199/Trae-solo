import { Router, type Response } from 'express'
import { success, fail, notFound } from '../utils/response.js'
import { signToken, genVerifyCode, type AuthRequest } from '../utils/auth.js'
import { db, type DriverAuthDocs, type ShipperAuthDocs, type Wallet, type AuthStatus } from '../mock/data.js'
import { v4 as uuidv4 } from '../utils/uuid.js'

const router = Router()

function getUserAuthStatus(user: { driverDocs?: { status?: AuthStatus }; shipperDocs?: { status?: AuthStatus } }): AuthStatus {
  if (user.driverDocs?.status) return user.driverDocs.status
  if (user.shipperDocs?.status) return user.shipperDocs.status
  return 'pending'
}

router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  const { phone, code, role } = req.body as { phone?: string; code?: string; role?: 'driver' | 'shipper' | 'admin' }

  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    fail(res, '请输入正确的手机号')
    return
  }
  if (!code) {
    fail(res, '请输入验证码')
    return
  }

  const isTestCode = code === '000000' || code === '123456'
  if (!isTestCode) {
    const verifyCode = db.verifyCodes.find(v => v.phone === phone && !v.used)
    if (!verifyCode || verifyCode.code !== code) {
      fail(res, '验证码错误')
      return
    }
    if (new Date() > new Date(verifyCode.expiredAt)) {
      fail(res, '验证码已过期')
      return
    }
    verifyCode.used = true
    verifyCode.usedAt = new Date().toISOString()
  }

  let user = db.users.find(u => u.phone === phone && (!role || u.role === role))

  if (!user) {
    const userRole = role || 'driver'
    const walletId = uuidv4()
    const userId = uuidv4()
    const nowIso = new Date().toISOString()

    user = {
      id: userId,
      role: userRole,
      phone,
      nickname: userRole === 'driver' ? '新注册司机' : userRole === 'shipper' ? '新注册货主' : '新用户',
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${userId}`,
      realName: '',
      creditScore: 650,
      createdAt: nowIso,
      lastLoginAt: nowIso,
      walletId,
    }
    db.users.push(user)

    const wallet: Wallet = {
      id: walletId,
      userId,
      balance: 0,
      frozenAmount: 0,
      availableCredit: userRole === 'driver' ? 10000 : userRole === 'shipper' ? 50000 : 0,
      usedCredit: 0,
      totalIncome: 0,
      totalExpense: 0,
      lastUpdatedAt: nowIso,
      bankCards: [],
    }
    db.wallets.push(wallet)
  } else {
    user.lastLoginAt = new Date().toISOString()
  }

  const token = signToken(user)
  const authStatus = getUserAuthStatus(user)

  success(res, {
    token,
    user: {
      id: user.id,
      role: user.role,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      realName: user.realName,
      creditScore: user.creditScore,
      authStatus,
      createdAt: user.createdAt,
    },
  }, '登录成功')
})

router.post('/driver-auth', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user
  if (!user) {
    fail(res, '请先登录', 401, 401)
    return
  }
  if (user.role !== 'driver') {
    fail(res, '仅司机可提交三证认证')
    return
  }

  const body = req.body as Partial<{
    idCardFront: string; idCardBack: string;
    driverLicense: string; qualificationLicense: string; vehicleLicense: string; roadTransportPermit: string;
    realName: string;
  }>
  if (!body.driverLicense || !body.vehicleLicense || !body.qualificationLicense) {
    fail(res, '请提交完整的三证资料(驾驶证/行驶证/从业资格证)')
    return
  }

  const nowIso = new Date().toISOString()
  const docs: DriverAuthDocs = {
    idCardFront: body.idCardFront || `/upload/driver-${user.id}-id-front.jpg`,
    idCardBack: body.idCardBack || `/upload/driver-${user.id}-id-back.jpg`,
    driverLicense: body.driverLicense,
    qualificationLicense: body.qualificationLicense,
    vehicleLicense: body.vehicleLicense,
    roadTransportPermit: body.roadTransportPermit || `/upload/driver-${user.id}-road-permit.jpg`,
    submittedAt: nowIso,
    status: 'pending',
  }

  user.driverDocs = docs
  if (body.realName && !user.realName) user.realName = body.realName

  success(res, {
    authId: `driver-auth-${user.id}`,
    status: 'pending',
    submittedAt: nowIso,
  }, '三证认证资料已提交，等待审核')
})

router.post('/shipper-auth', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user
  if (!user) {
    fail(res, '请先登录', 401, 401)
    return
  }
  if (user.role !== 'shipper') {
    fail(res, '仅货主可提交企业认证')
    return
  }

  const body = req.body as Partial<{
    businessLicense: string; legalPersonIdFront: string; legalPersonIdBack: string;
    companyName: string; unifiedSocialCreditCode: string; legalPersonName: string;
  }>
  if (!body.businessLicense || !body.companyName || !body.unifiedSocialCreditCode) {
    fail(res, '请提交完整的企业认证资料(营业执照+公司名+统一社会信用代码)')
    return
  }

  const nowIso = new Date().toISOString()
  const docs: ShipperAuthDocs = {
    businessLicense: body.businessLicense,
    legalPersonIdFront: body.legalPersonIdFront || `/upload/shipper-${user.id}-legal-front.jpg`,
    legalPersonIdBack: body.legalPersonIdBack || `/upload/shipper-${user.id}-legal-back.jpg`,
    companyName: body.companyName,
    unifiedSocialCreditCode: body.unifiedSocialCreditCode,
    submittedAt: nowIso,
    status: 'pending',
  }

  user.shipperDocs = docs
  if (body.legalPersonName && !user.realName) user.realName = body.legalPersonName
  if (body.companyName) user.nickname = body.companyName.substring(0, 10)

  success(res, {
    authId: `shipper-auth-${user.id}`,
    status: 'pending',
    submittedAt: nowIso,
  }, '企业认证资料已提交，等待审核')
})

router.get('/me', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user
  if (!user) {
    fail(res, '请先登录', 401, 401)
    return
  }

  const wallet = db.wallets.find(w => w.userId === user.id)
  const orderCount = user.role === 'shipper'
    ? db.orders.filter(o => o.shipperId === user.id).length
    : user.role === 'driver'
    ? db.orders.filter(o => o.driverId === user.id).length
    : db.orders.length
  const completedCount = user.role === 'shipper'
    ? db.orders.filter(o => o.shipperId === user.id && o.status === 'completed').length
    : user.role === 'driver'
    ? db.orders.filter(o => o.driverId === user.id && o.status === 'completed').length
    : db.orders.filter(o => o.status === 'completed').length

  const profile = user.role === 'driver'
    ? db.driverProfiles.find(p => p.userId === user.id)
    : user.role === 'shipper'
    ? db.shipperProfiles.find(p => p.userId === user.id)
    : undefined

  const authStatus = getUserAuthStatus(user)

  success(res, {
    user: {
      id: user.id,
      role: user.role,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      realName: user.realName,
      creditScore: user.creditScore,
      authStatus,
      driverDocs: user.driverDocs,
      shipperDocs: user.shipperDocs,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
    profile,
    wallet,
    stats: {
      orderCount,
      completedCount,
    },
  })
})

export default router
