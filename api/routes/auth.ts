import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'
import { authMiddleware, generateToken } from '../middleware/auth.js'
import { verifyPassword, hashData, encryptAES256 } from '../utils/encryption.js'
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  User,
  JwtPayload,
} from '../../shared/types.js'

const router = Router()

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as LoginRequest

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: '用户名和密码不能为空',
      } as ApiResponse)
      return
    }

    const user = db
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(username) as User | undefined

    if (!user) {
      db.prepare(
        'INSERT INTO login_logs (id, username, status, ip, fail_reason) VALUES (?, ?, ?, ?, ?)'
      ).run(generateId(), username, 'failed', req.ip, '用户不存在')

      res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      } as ApiResponse)
      return
    }

    if (user.status === 'disabled') {
      db.prepare(
        'INSERT INTO login_logs (id, user_id, username, status, ip, fail_reason) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(generateId(), user.id, username, 'failed', req.ip, '账号已被禁用')

      res.status(403).json({
        success: false,
        error: '账号已被禁用，请联系管理员',
      } as ApiResponse)
      return
    }

    if (!verifyPassword(password, user.password_hash || '')) {
      db.prepare(
        'INSERT INTO login_logs (id, user_id, username, status, ip, fail_reason) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(generateId(), user.id, username, 'failed', req.ip, '密码错误')

      res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      } as ApiResponse)
      return
    }

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId: user.id,
      username: user.username,
      role: user.role,
      outletId: user.outlet_id,
      regionId: user.region_id,
    }
    const token = generateToken(payload)

    db.prepare(
      'INSERT INTO login_logs (id, user_id, username, status, ip, device) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(generateId(), user.id, username, 'success', req.ip, req.headers['user-agent'])

    db.prepare(
      'INSERT INTO audit_logs (id, user_id, operation_type, operation_desc, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(generateId(), user.id, 'login', '用户登录', req.ip, req.headers['user-agent'])

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          realName: user.real_name,
          role: user.role,
          outletId: user.outlet_id,
          regionId: user.region_id,
        },
      },
      message: '登录成功',
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('[Auth Login Error]', error)
    res.status(500).json({
      success: false,
      error: '登录失败，服务器内部错误',
    } as ApiResponse)
  }
})

router.post('/logout', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user) {
      db.prepare(
        'INSERT INTO audit_logs (id, user_id, operation_type, operation_desc, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(generateId(), req.user.userId, 'logout', '用户登出', req.ip, req.headers['user-agent'])
    }

    res.status(200).json({
      success: true,
      message: '登出成功',
    } as ApiResponse)
  } catch (error) {
    console.error('[Auth Logout Error]', error)
    res.status(500).json({
      success: false,
      error: '登出失败，服务器内部错误',
    } as ApiResponse)
  }
})

router.post('/idcard/ocr', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const mockResult = {
      name: '张三',
      idNumber: '110101199001011234',
      gender: '男',
      ethnicity: '汉',
      birthDate: '1990-01-01',
      address: '北京市朝阳区建国路88号SOHO现代城',
      authority: '北京市公安局朝阳分局',
      validPeriod: '2020.01.01-2040.01.01',
      confidence: 0.9876,
      ocrTime: new Date().toISOString(),
    }

    if (req.user) {
      db.prepare(
        'INSERT INTO audit_logs (id, user_id, operation_type, operation_desc, detail_json, ip) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(
        generateId(),
        req.user.userId,
        'idcard_ocr',
        '身份证OCR识别',
        JSON.stringify({ confidence: mockResult.confidence }),
        req.ip
      )
    }

    res.status(200).json({
      success: true,
      data: mockResult,
      message: '身份证识别成功',
    } as ApiResponse)
  } catch (error) {
    console.error('[IDCard OCR Error]', error)
    res.status(500).json({
      success: false,
      error: '身份证识别失败，服务器内部错误',
    } as ApiResponse)
  }
})

router.post('/liveness', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const mockResult = {
      passed: true,
      score: 0.9523,
      threshold: 0.7,
      livenessType: 'face_swap_detection',
      detectTime: new Date().toISOString(),
      antiSpoofingChecks: {
        photoReplay: true,
        maskDetection: true,
        deepfakeDetection: true,
        blinkDetection: true,
      },
    }

    if (req.user) {
      db.prepare(
        'INSERT INTO audit_logs (id, user_id, operation_type, operation_desc, detail_json, ip) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(
        generateId(),
        req.user.userId,
        'liveness_detection',
        '活体检测',
        JSON.stringify({ passed: mockResult.passed, score: mockResult.score }),
        req.ip
      )
    }

    res.status(200).json({
      success: true,
      data: mockResult,
      message: '活体检测通过',
    } as ApiResponse)
  } catch (error) {
    console.error('[Liveness Detection Error]', error)
    res.status(500).json({
      success: false,
      error: '活体检测失败，服务器内部错误',
    } as ApiResponse)
  }
})

router.post('/verify', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, idNumber } = req.body as { name?: string; idNumber?: string }

    if (!name || !idNumber) {
      res.status(400).json({
        success: false,
        error: '姓名和身份证号不能为空',
      } as ApiResponse)
      return
    }

    const nameHash = hashData(name)
    const idNumberHash = hashData(idNumber)
    const encryptedRealNameId = encryptAES256(
      'RN' + Date.now() + Math.random().toString(36).substr(2, 6)
    )

    const realNameId = generateId()
    db.prepare(
      `INSERT INTO real_name_records (
        id, encrypted_real_name_id, name_hash, id_number_hash, verified_source, user_id
      ) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      realNameId,
      encryptedRealNameId,
      nameHash,
      idNumberHash,
      'mock_verification_service',
      req.user?.userId
    )

    if (req.user) {
      db.prepare(
        'INSERT INTO audit_logs (id, user_id, operation_type, operation_desc, detail_json, ip) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(
        generateId(),
        req.user.userId,
        'realname_verify',
        '实名核验',
        JSON.stringify({ verified: true }),
        req.ip
      )
    }

    const mockResult = {
      verified: true,
      encryptedRealNameId,
      verifyTime: new Date().toISOString(),
      source: 'mock_verification_service',
      confidence: 0.99,
    }

    res.status(200).json({
      success: true,
      data: mockResult,
      message: '实名核验通过',
    } as ApiResponse)
  } catch (error) {
    console.error('[RealName Verify Error]', error)
    res.status(500).json({
      success: false,
      error: '实名核验失败，服务器内部错误',
    } as ApiResponse)
  }
})

export default router
