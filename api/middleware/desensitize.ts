import { type Request, type Response, type NextFunction } from 'express'

const phoneRegex = /^1[3-9]\d{9}$/
const idCardRegex = /^\d{17}[\dXx]$/

const maskPhone = (phone: string): string => {
  if (!phoneRegex.test(phone)) {
    return phone
  }
  return phone.slice(0, 3) + '****' + phone.slice(7)
}

const maskIdCard = (idCard: string): string => {
  if (!idCardRegex.test(idCard)) {
    return idCard
  }
  return idCard.slice(0, 6) + '********' + idCard.slice(14)
}

const maskName = (name: string): string => {
  if (!name || name.length < 2) {
    return name
  }
  if (name.length === 2) {
    return name[0] + '*'
  }
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}

const maskSensitiveField = (key: string, value: string): string => {
  const lowerKey = key.toLowerCase()

  if (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('tel')) {
    return maskPhone(value)
  }

  if (lowerKey.includes('idcard') || lowerKey.includes('id_card') || lowerKey.includes('identity') || lowerKey.includes('身份证')) {
    return maskIdCard(value)
  }

  if (lowerKey === 'name' || lowerKey === 'username' || lowerKey === 'realname' || lowerKey === 'real_name') {
    return maskName(value)
  }

  return value
}

const desensitizeData = <T>(data: T): T => {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === 'string') {
    return data as T
  }

  if (Array.isArray(data)) {
    return data.map(item => desensitizeData(item)) as unknown as T
  }

  if (typeof data === 'object') {
    const result = {} as T
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key]
        if (typeof value === 'string') {
          ;(result as Record<string, unknown>)[key] = maskSensitiveField(key, value)
        } else {
          ;(result as Record<string, unknown>)[key] = desensitizeData(value)
        }
      }
    }
    return result
  }

  return data
}

export const desensitize = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json.bind(res)

  res.json = ((data: unknown): Response => {
    if (data && typeof data === 'object') {
      const desensitized = desensitizeData(data)
      return originalJson(desensitized)
    }
    return originalJson(data)
  }) as typeof res.json

  next()
}

export { maskPhone, maskIdCard, maskName, desensitizeData }
export default desensitize
