import { SM4 } from 'gm-crypto'

const KEY_MAP: Record<string, string> = {
  main: process.env.SM4_MAIN_KEY || '0123456789abcdeffedcba9876543210'
}

const IV = process.env.SM4_IV || '0123456789abcdeffedcba9876543210'

function getKey(keyId?: string): string {
  const key = KEY_MAP[keyId || 'main'] || KEY_MAP.main
  if (!key) {
    throw new Error(`SM4 key not found for keyId: ${keyId || 'main'}`)
  }
  return key
}

export function encrypt(plaintext: string, keyId?: string): string {
  const key = getKey(keyId)
  const iv = IV

  const ciphertext = SM4.encrypt(plaintext, key, {
    iv,
    mode: SM4.constants.CBC,
    inputEncoding: 'utf8',
    outputEncoding: 'base64'
  })

  const ivBase64 = Buffer.from(iv, 'utf8').toString('base64')
  return `${ivBase64}:${ciphertext}`
}

export function decrypt(ciphertext: string, keyId?: string): string {
  const key = getKey(keyId)

  const [ivBase64, encrypted] = ciphertext.split(':')
  if (!encrypted) {
    throw new Error('Invalid ciphertext format')
  }

  const iv = Buffer.from(ivBase64, 'base64').toString('utf8')

  const plaintext = SM4.decrypt(encrypted, key, {
    iv,
    mode: SM4.constants.CBC,
    inputEncoding: 'base64',
    outputEncoding: 'utf8'
  })

  return plaintext
}

export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 10) {
    return idCard || ''
  }
  const prefix = idCard.slice(0, 6)
  const suffix = idCard.slice(-4)
  const middle = '*'.repeat(idCard.length - 10)
  return `${prefix}${middle}${suffix}`
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) {
    return phone || ''
  }
  const prefix = phone.slice(0, 3)
  const suffix = phone.slice(-4)
  const middle = '*'.repeat(phone.length - 7)
  return `${prefix}${middle}${suffix}`
}

export default {
  encrypt,
  decrypt,
  maskIdCard,
  maskPhone
}
