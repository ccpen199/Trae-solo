import { defineStore } from 'pinia'
import router from '@/router'

export type AdminRole = 'admin' | 'platform' | 'ops'

export interface UserInfo {
  id: string
  username: string
  realName: string
  avatar: string
  role: AdminRole
  roleName: string
  department: string
  permissions: string[]
  allowedRoutes: string[]
  loginAt: string
  loginIp: string
}

export interface AuditRecord {
  id: string
  timestamp: string
  username: string
  clientIp: string
  userAgent: string
  success: boolean
  failReason?: 'user_not_found' | 'wrong_password' | 'wrong_captcha' | 'account_locked' | 'role_unauthorized'
  roleAfterLogin?: AdminRole
  remainAttempts?: number
}

interface RoleAccount {
  username: string
  password: string
  role: AdminRole
  roleName: string
  realName: string
  department: string
  allowedRoutes: string[]
}

const ROLE_ACCOUNTS: RoleAccount[] = [
  {
    username: 'admin',
    password: '123456',
    role: 'admin',
    roleName: '超级管理员',
    realName: '政务系统超级管理员',
    department: '郑州市大数据管理局 · 平台管理处',
    allowedRoutes: [
      'dashboard', 'citizens', 'services', 'knowledge',
      'feedback', 'offline', 'system'
    ]
  },
  {
    username: 'platform',
    password: '123456',
    role: 'platform',
    roleName: '运营专员',
    realName: '政务平台运营人员',
    department: '郑州市大数据管理局 · 运营中心',
    allowedRoutes: [
      'dashboard', 'citizens', 'services', 'knowledge', 'feedback'
    ]
  },
  {
    username: 'ops',
    password: '123456',
    role: 'ops',
    roleName: '运维工程师',
    realName: '系统运维工程师',
    department: '郑州市大数据管理局 · 技术运维部',
    allowedRoutes: [
      'dashboard', 'services', 'offline', 'system'
    ]
  }
]

const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000
const AUDIT_LOG_KEY = 'zz_gov_admin_audit_log'
const LOCK_KEY_PREFIX = 'zz_gov_admin_lock_'

function getClientIpMock(): string {
  const random = () => Math.floor(Math.random() * 255)
  return `10.${random()}.${random()}.${random()}`
}

function readAuditLogs(): AuditRecord[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAuditLog(record: AuditRecord) {
  const logs = readAuditLogs()
  logs.unshift(record)
  const trimmed = logs.slice(0, 200)
  localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(trimmed))
}

function getLockInfo(username: string): { locked: boolean; lockedUntil: number; attempts: number } {
  const attemptsKey = `${LOCK_KEY_PREFIX}attempts_${username}`
  const lockKey = `${LOCK_KEY_PREFIX}until_${username}`
  const attempts = parseInt(localStorage.getItem(attemptsKey) || '0', 10)
  const lockedUntil = parseInt(localStorage.getItem(lockKey) || '0', 10)
  return {
    locked: lockedUntil > Date.now(),
    lockedUntil,
    attempts
  }
}

function incAttempts(username: string): number {
  const key = `${LOCK_KEY_PREFIX}attempts_${username}`
  const attempts = parseInt(localStorage.getItem(key) || '0', 10) + 1
  localStorage.setItem(key, String(attempts))
  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    localStorage.setItem(`${LOCK_KEY_PREFIX}until_${username}`, String(Date.now() + LOCK_DURATION_MS))
  }
  return attempts
}

function resetAttempts(username: string) {
  localStorage.removeItem(`${LOCK_KEY_PREFIX}attempts_${username}`)
  localStorage.removeItem(`${LOCK_KEY_PREFIX}until_${username}`)
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('admin_token') || '',
    userInfo: null as UserInfo | null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token && !!state.userInfo,
    currentRole: (state) => state.userInfo?.role,
    canAccessRoute: (state) => (routeName: string) => {
      if (!state.userInfo) return false
      return state.userInfo.allowedRoutes.includes(routeName) || state.userInfo.role === 'admin'
    }
  },

  actions: {
    async login(username: string, password: string, captchaInput?: string, captchaExpected?: string) {
      const clientIp = getClientIpMock()
      const userAgent = navigator.userAgent.substring(0, 80)
      const timestamp = new Date().toISOString()
      const baseRecord = {
        id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp,
        username,
        clientIp,
        userAgent
      }

      await new Promise(r => setTimeout(r, 800))

      if (captchaExpected && captchaInput && captchaInput.toUpperCase() !== captchaExpected.toUpperCase()) {
        const record: AuditRecord = { ...baseRecord, success: false, failReason: 'wrong_captcha' }
        writeAuditLog(record)
        const err = new Error('验证码错误，请点击刷新后重新输入')
        ;(err as any).errorCode = 'wrong_captcha'
        ;(err as any).auditId = record.id
        throw err
      }

      const lockInfo = getLockInfo(username)
      if (lockInfo.locked) {
        const remainSec = Math.ceil((lockInfo.lockedUntil - Date.now()) / 1000)
        const minutes = Math.floor(remainSec / 60)
        const seconds = remainSec % 60
        const record: AuditRecord = {
          ...baseRecord,
          success: false,
          failReason: 'account_locked',
          remainAttempts: 0
        }
        writeAuditLog(record)
        const err = new Error(`账号已被临时锁定，请 ${minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`} 后再试`)
        ;(err as any).errorCode = 'account_locked'
        ;(err as any).auditId = record.id
        ;(err as any).lockInfo = { locked: true, remainSeconds: remainSec }
        throw err
      }

      if (!username || !password) {
        const record: AuditRecord = { ...baseRecord, success: false, failReason: 'user_not_found' }
        writeAuditLog(record)
        const err = new Error('请输入用户名和密码')
        ;(err as any).errorCode = 'user_not_found'
        ;(err as any).auditId = record.id
        throw err
      }

      const account = ROLE_ACCOUNTS.find(a => a.username.toLowerCase() === username.toLowerCase())
      if (!account) {
        incAttempts(username)
        const record: AuditRecord = {
          ...baseRecord,
          success: false,
          failReason: 'user_not_found',
          remainAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - getLockInfo(username).attempts)
        }
        writeAuditLog(record)
        const err = new Error(`账号不存在或角色未授权（演示账号：admin / platform / ops）`)
        ;(err as any).errorCode = 'user_not_found'
        ;(err as any).auditId = record.id
        ;(err as any).remainAttempts = record.remainAttempts
        throw err
      }

      if (account.password !== password) {
        const attempts = incAttempts(username)
        const remain = Math.max(0, MAX_LOGIN_ATTEMPTS - attempts)
        const record: AuditRecord = {
          ...baseRecord,
          success: false,
          failReason: 'wrong_password',
          remainAttempts: remain
        }
        writeAuditLog(record)
        const err = new Error(
          remain > 0
            ? `密码错误，您还剩 ${remain} 次尝试机会（连续 ${MAX_LOGIN_ATTEMPTS} 次失败将被锁定 15 分钟）`
            : `密码错误次数过多，账号已被锁定 15 分钟`
        )
        ;(err as any).errorCode = 'wrong_password'
        ;(err as any).auditId = record.id
        ;(err as any).remainAttempts = remain
        throw err
      }

      resetAttempts(username)

      this.token = `zz-gov-${account.role}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem('admin_token', this.token)

      this.userInfo = {
        id: `${account.role.toUpperCase()}-${Date.now().toString().slice(-6)}`,
        username: account.username,
        realName: account.realName,
        avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
        role: account.role,
        roleName: account.roleName,
        department: account.department,
        permissions: account.role === 'admin' ? ['*'] : [`${account.role}:*`],
        allowedRoutes: account.allowedRoutes,
        loginAt: timestamp,
        loginIp: clientIp
      }

      const successRecord: AuditRecord = {
        ...baseRecord,
        success: true,
        roleAfterLogin: account.role
      }
      writeAuditLog(successRecord)

      return { user: this.userInfo, auditId: successRecord.id }
    },

    async fetchUserInfo() {
      await new Promise(r => setTimeout(r, 200))
      if (!this.userInfo && this.token) {
        this.userInfo = {
          id: 'ADMIN-RESTORED',
          username: 'admin',
          realName: '超级管理员（会话恢复）',
          avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
          role: 'admin',
          roleName: '超级管理员',
          department: '郑州市大数据管理局 · 平台管理处',
          permissions: ['*'],
          allowedRoutes: ['dashboard', 'citizens', 'services', 'knowledge', 'feedback', 'offline', 'system'],
          loginAt: new Date().toISOString(),
          loginIp: '127.0.0.1'
        }
      }
      return this.userInfo
    },

    getAuditLogs(): AuditRecord[] {
      return readAuditLogs()
    },

    getAccountStatus(username: string) {
      return getLockInfo(username)
    },

    async logout(auditNote?: string) {
      if (this.userInfo) {
        writeAuditLog({
          id: `AUD-LOGOUT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          username: this.userInfo.username,
          clientIp: this.userInfo.loginIp,
          userAgent: navigator.userAgent.substring(0, 80),
          success: true,
          failReason: undefined
        })
      }
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('admin_token')
      await router.push('/login')
    }
  }
})
