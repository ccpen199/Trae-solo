import bcrypt from 'bcryptjs'
import CryptoJS from 'crypto-js'

const SALT_ROUNDS = 10

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export const hashPasswordSync = (password: string): string => {
  return bcrypt.hashSync(password, SALT_ROUNDS)
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

export const verifyPasswordSync = (password: string, hash: string): boolean => {
  return bcrypt.compareSync(password, hash)
}

export const hashEvidence = (data: string | Buffer): string => {
  if (Buffer.isBuffer(data)) {
    return CryptoJS.SHA256(CryptoJS.lib.WordArray.create(data)).toString()
  }
  return CryptoJS.SHA256(data).toString()
}

export const hashFile = async (filePath: string): Promise<string> => {
  const fs = await import('fs/promises')
  const content = await fs.readFile(filePath)
  return hashEvidence(content)
}

export const generateSignature = (data: string, secret: string): string => {
  return CryptoJS.HmacSHA256(data, secret).toString()
}

export const verifySignature = (data: string, signature: string, secret: string): boolean => {
  const expectedSignature = CryptoJS.HmacSHA256(data, secret).toString()
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(expectedSignature)) === 
         CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(signature))
}

export default {
  hashPassword,
  hashPasswordSync,
  verifyPassword,
  verifyPasswordSync,
  hashEvidence,
  hashFile,
  generateSignature,
  verifySignature,
}
