import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

export const generateRandomCode = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const generateCouponCode = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = generateRandomCode(6)
  return `SY${timestamp}${random}`
}
