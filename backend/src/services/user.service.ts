import { AppDataSource } from '../config/database'
import { User, UserRole, Member, PointsAccount } from '../entities'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export interface LoginResult {
  success: boolean
  token?: string
  user?: {
    id: string
    username: string
    role: UserRole
    name?: string
    phone?: string
    email?: string
  }
  message?: string
}

export interface RegisterResult {
  success: boolean
  user?: User
  message?: string
}

export class UserService {
  private static instance: UserService

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService()
    }
    return UserService.instance
  }

  async login(username: string, password: string): Promise<LoginResult> {
    const userRepo = AppDataSource.getRepository(User)
    
    const user = await userRepo.findOne({
      where: { username },
    })

    if (!user) {
      return { success: false, message: '用户名或密码错误' }
    }

    if (!user.isActive) {
      return { success: false, message: '账户已被禁用' }
    }

    const passwordValid = await bcrypt.compare(password, user.password)
    if (!passwordValid) {
      return { success: false, message: '用户名或密码错误' }
    }

    const secret = process.env.JWT_SECRET || 'default-secret'
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d'

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      secret,
      { expiresIn }
    )

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
    }
  }

  async register(
    username: string,
    password: string,
    role: UserRole = UserRole.MEMBER,
    extraInfo?: {
      name?: string
      phone?: string
      email?: string
    }
  ): Promise<RegisterResult> {
    const userRepo = AppDataSource.getRepository(User)
    const memberRepo = AppDataSource.getRepository(Member)
    const accountRepo = AppDataSource.getRepository(PointsAccount)

    const existingUser = await userRepo.findOne({
      where: { username },
    })

    if (existingUser) {
      return { success: false, message: '用户名已存在' }
    }

    if (extraInfo?.phone) {
      const existingPhone = await userRepo.findOne({
        where: { phone: extraInfo.phone },
      })
      if (existingPhone) {
        return { success: false, message: '手机号已被注册' }
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    return AppDataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User)
      const memberRepo = manager.getRepository(Member)
      const accountRepo = manager.getRepository(PointsAccount)

      const user = userRepo.create({
        username,
        password: hashedPassword,
        role,
        name: extraInfo?.name,
        phone: extraInfo?.phone,
        email: extraInfo?.email,
        isActive: true,
      })

      const savedUser = await userRepo.save(user)

      if (role === UserRole.MEMBER) {
        const member = memberRepo.create({
          userId: savedUser.id,
          memberNo: await this.generateMemberNo(),
          level: 1,
          totalConsumption: 0,
          totalPointsEarned: 0,
          totalPointsSpent: 0,
          totalPointsExpired: 0,
        })

        const savedMember = await memberRepo.save(member)

        const account = accountRepo.create({
          memberId: savedMember.id,
          totalBalance: 0,
          availableBalance: 0,
          frozenBalance: 0,
          pendingBalance: 0,
        })

        await accountRepo.save(account)
      }

      return {
        success: true,
        user: savedUser,
      }
    })
  }

  async getUserById(userId: string): Promise<User | null> {
    const userRepo = AppDataSource.getRepository(User)
    return userRepo.findOne({
      where: { id: userId },
    })
  }

  async getMemberByUserId(userId: string): Promise<Member | null> {
    const memberRepo = AppDataSource.getRepository(Member)
    return memberRepo.findOne({
      where: { userId },
      relations: ['pointsAccount', 'user'],
    })
  }

  async updateUser(
    userId: string,
    updates: Partial<Pick<User, 'name' | 'phone' | 'email' | 'isActive'>>
  ): Promise<User | null> {
    const userRepo = AppDataSource.getRepository(User)
    
    const user = await userRepo.findOne({
      where: { id: userId },
    })

    if (!user) {
      return null
    }

    Object.assign(user, updates)
    return userRepo.save(user)
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> {
    const userRepo = AppDataSource.getRepository(User)
    
    const user = await userRepo.findOne({
      where: { id: userId },
    })

    if (!user) {
      return { success: false, message: '用户不存在' }
    }

    const passwordValid = await bcrypt.compare(oldPassword, user.password)
    if (!passwordValid) {
      return { success: false, message: '原密码错误' }
    }

    user.password = await bcrypt.hash(newPassword, 10)
    await userRepo.save(user)

    return { success: true }
  }

  private async generateMemberNo(): Promise<string> {
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const random = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
    return `M${dateStr}${random}`
  }
}
