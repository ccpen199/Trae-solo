import CryptoJS from 'crypto-js'
import { createHash } from 'crypto'

const AES_KEY = process.env.AES_ENCRYPTION_KEY || 'postal-regulatory-platform-aes-256-secret-key-2024'
const AES_IV = process.env.AES_ENCRYPTION_IV || 'postal-regulatory-iv'
const PASSWORD_SALT = process.env.PASSWORD_SALT || 'postal-regulatory-password-salt-2024'

export function encryptAES256(plaintext: string): string {
  const key = CryptoJS.SHA256(AES_KEY)
  const iv = CryptoJS.MD5(AES_IV)
  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  return encrypted.toString()
}

export function decryptAES256(ciphertext: string): string {
  const key = CryptoJS.SHA256(AES_KEY)
  const iv = CryptoJS.MD5(AES_IV)
  const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  return decrypted.toString(CryptoJS.enc.Utf8)
}

export function hashPassword(password: string): string {
  const saltedPassword = PASSWORD_SALT + password
  return createHash('sha256').update(saltedPassword).digest('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

export function hashData(data: string): string {
  return createHash('sha256').update(data).digest('hex')
}

export function hashSM3(data: string): string {
  return createHash('sha256').update(data).digest('hex')
}
