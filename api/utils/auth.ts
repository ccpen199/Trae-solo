import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key'

export function generateToken(userId: number, role: string): string {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET)
}

export function hashPassword(password: string): string {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10)
  return bcrypt.hashSync(password, saltRounds)
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}
