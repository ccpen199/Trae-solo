import BaseRepository from './base.js'

interface User {
  id: number
  idCard: string
  name: string
  phone: string
  passwordHash: string
  userType: 'resident' | 'flexible' | 'admin_tax' | 'admin_ops'
  status: 'active' | 'suspended'
  createdAt: string
}

interface UserCreateData {
  idCard: string
  name: string
  phone: string
  passwordHash: string
  userType: 'resident' | 'flexible' | 'admin_tax' | 'admin_ops'
  status?: 'active' | 'suspended'
}

interface UserUpdateData {
  name?: string
  phone?: string
  passwordHash?: string
  status?: 'active' | 'suspended'
}

class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users')
  }

  findByIdCard(idCard: string): User | undefined {
    return this.findOne([{ field: 'id_card', value: idCard }])
  }

  findByPhone(phone: string): User | undefined {
    return this.findOne([{ field: 'phone', value: phone }])
  }

  create(data: UserCreateData): { id: number; changes: number } {
    const userData = {
      id_card: data.idCard,
      name: data.name,
      phone: data.phone,
      password_hash: data.passwordHash,
      user_type: data.userType,
      status: data.status || 'active',
    }
    return super.create(userData as Partial<User>)
  }

  update(id: number, data: UserUpdateData): { changes: number } {
    const updateData: Partial<User> = {}
    if (data.name !== undefined) {
      ;(updateData as Record<string, unknown>).name = data.name
    }
    if (data.phone !== undefined) {
      ;(updateData as Record<string, unknown>).phone = data.phone
    }
    if (data.passwordHash !== undefined) {
      ;(updateData as Record<string, unknown>).password_hash = data.passwordHash
    }
    if (data.status !== undefined) {
      ;(updateData as Record<string, unknown>).status = data.status
    }
    return super.update(id, updateData)
  }

  findByUserType(userType: string): User[] {
    return this.findAll([{ field: 'user_type', value: userType }])
  }
}

const userRepository = new UserRepository()

export default userRepository
export { UserRepository, type User, type UserCreateData, type UserUpdateData }
