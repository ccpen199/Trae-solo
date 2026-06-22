import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = 'repair-platform-decentralized-secret-key-2024'

export const encryptData = (data: unknown): string => {
  try {
    const jsonStr = JSON.stringify(data)
    return CryptoJS.AES.encrypt(jsonStr, ENCRYPTION_KEY).toString()
  } catch (e) {
    console.error('Encryption failed:', e)
    return ''
  }
}

export const decryptData = <T = unknown>(encrypted: string): T | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY)
    const jsonStr = bytes.toString(CryptoJS.enc.Utf8)
    return JSON.parse(jsonStr) as T
  } catch (e) {
    console.error('Decryption failed:', e)
    return null
  }
}

export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const hashData = (data: string): string => {
  return CryptoJS.SHA256(data).toString()
}
