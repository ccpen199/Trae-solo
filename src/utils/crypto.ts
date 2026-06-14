import CryptoJS from 'crypto-js'

const SECRET_KEY = 'sd_wisdom_tourism_2024@#$'
const IV = 'sd_tourism_iv_2024'

export const encryptAES = (data: string, key: string = SECRET_KEY): string => {
  const keyHex = CryptoJS.enc.Utf8.parse(key)
  const ivHex = CryptoJS.enc.Utf8.parse(IV)
  const encrypted = CryptoJS.AES.encrypt(data, keyHex, {
    iv: ivHex,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })
  return encrypted.toString()
}

export const decryptAES = (ciphertext: string, key: string = SECRET_KEY): string => {
  try {
    const keyHex = CryptoJS.enc.Utf8.parse(key)
    const ivHex = CryptoJS.enc.Utf8.parse(IV)
    const decrypted = CryptoJS.AES.decrypt(ciphertext, keyHex, {
      iv: ivHex,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    })
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch {
    return ''
  }
}

export const encryptMD5 = (data: string): string => {
  return CryptoJS.MD5(data).toString()
}

export const encryptSHA256 = (data: string, salt: string = ''): string => {
  return CryptoJS.SHA256(data + salt).toString()
}

export const encryptBase64 = (data: string): string => {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(data))
}

export const decryptBase64 = (data: string): string => {
  return CryptoJS.enc.Base64.parse(data).toString(CryptoJS.enc.Utf8)
}

export const generateRandomString = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export const hashPassword = (password: string, salt: string): string => {
  return encryptSHA256(password, salt)
}

export const verifyPassword = (password: string, salt: string, hash: string): boolean => {
  return hashPassword(password, salt) === hash
}
