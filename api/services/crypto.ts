import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'petlife-32byte-secret-key-for-aes256!'
const IV_LENGTH = 16
const ALGORITHM = 'aes-256-cbc'

function deriveKey(): Buffer {
  return crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = deriveKey()
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return `${iv.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':')
  if (parts.length !== 2) {
    throw new Error('无效的加密数据格式')
  }

  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]
  const key = deriveKey()

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

export function encryptConsultationMessage(content: string): string {
  return encrypt(content)
}

export function decryptConsultationMessage(contentEncrypted: string): string {
  return decrypt(contentEncrypted)
}
