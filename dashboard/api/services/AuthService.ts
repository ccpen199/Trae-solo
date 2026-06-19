import { Repository } from 'typeorm'
import { AppDataSource } from '../data-source.js'
import { AuthAccount } from '../entities/AuthAccount.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { generateToken, createSession, invalidateSession, blacklistToken, decodeToken } from '../utils/jwt.js'
import type { LoginRequest, AuthUser, UserRole } from '../../../shared/types/index.js'

export class AuthService {
  private authAccountRepository: Repository<AuthAccount>

  constructor() {
    this.authAccountRepository = AppDataSource.getRepository(AuthAccount)
  }

  async login(request: LoginRequest): Promise<AuthUser | null> {
    const account = await this.authAccountRepository.findOne({
      where: { username: request.username, active: true },
    })

    if (!account) {
      return null
    }

    const isValid = await comparePassword(request.password, account.password)
    if (!isValid) {
      return null
    }

    const payload = {
      id: account.id,
      username: account.username,
      role: account.role,
      merchantId: account.merchantId || undefined,
      name: account.name,
    }

    const token = generateToken(payload)
    await createSession(payload, token)

    return {
      ...payload,
      token,
    }
  }

  async logout(userId: string, token: string): Promise<void> {
    await invalidateSession(userId)
    
    const decoded = decodeToken(token)
    if (decoded && 'exp' in decoded) {
      const exp = (decoded as unknown as { exp: number }).exp
      const ttl = Math.max(0, exp - Math.floor(Date.now() / 1000))
      await blacklistToken(token, ttl)
    }
  }

  async createAccount(
    username: string,
    password: string,
    name: string,
    role: UserRole,
    merchantId?: string,
  ): Promise<AuthAccount> {
    const existing = await this.authAccountRepository.findOne({ where: { username } })
    if (existing) {
      throw new Error('Username already exists')
    }

    const hashedPassword = await hashPassword(password)
    
    const account = this.authAccountRepository.create({
      username,
      password: hashedPassword,
      name,
      role,
      merchantId: merchantId || null,
      active: true,
    })

    return this.authAccountRepository.save(account)
  }

  async getAccountById(id: string): Promise<AuthAccount | null> {
    return this.authAccountRepository.findOne({ where: { id } })
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const account = await this.authAccountRepository.findOne({ where: { id: userId } })
    if (!account) {
      return false
    }

    const isValid = await comparePassword(oldPassword, account.password)
    if (!isValid) {
      return false
    }

    account.password = await hashPassword(newPassword)
    await this.authAccountRepository.save(account)
    return true
  }

  async listAccounts(page: number = 1, pageSize: number = 20): Promise<{ accounts: AuthAccount[]; total: number }> {
    const [accounts, total] = await this.authAccountRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    })
    return { accounts, total }
  }

  async toggleAccountActive(id: string, active: boolean): Promise<AuthAccount | null> {
    const account = await this.authAccountRepository.findOne({ where: { id } })
    if (!account) {
      return null
    }
    account.active = active
    return this.authAccountRepository.save(account)
  }
}

export const authService = new AuthService()
