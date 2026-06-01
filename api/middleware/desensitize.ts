import { type Request, type Response, type NextFunction } from 'express'

const phoneRegex = /^1[3-9]\d{9}$/
const idCardRegex = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/

export function desensitizePhone(phone: string): string {
  if (!phone) return phone
  if (phoneRegex.test(phone)) {
    return phone.substring(0, 3) + '****' + phone.substring(7)
  }
  return phone
}

export function desensitizeIdCard(id: string): string {
  if (!id) return id
  if (idCardRegex.test(id)) {
    return id.substring(0, 6) + '********' + id.substring(14)
  }
  return id
}

export function desensitizeName(name: string): string {
  if (!name || name.length <= 1) return name
  if (name.length === 2) {
    return name[0] + '*'
  }
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}

function desensitizeValue(key: string, value: any): any {
  if (typeof value !== 'string') return value

  const lowerKey = key.toLowerCase()

  if (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('tel')) {
    return desensitizePhone(value)
  }

  if (lowerKey.includes('idcard') || lowerKey.includes('id_card') || lowerKey.includes('identity')) {
    return desensitizeIdCard(value)
  }

  if (lowerKey.includes('name') && lowerKey !== 'username' && lowerKey !== 'goods_type') {
    return desensitizeName(value)
  }

  if (lowerKey.includes('address') && value.length > 6) {
    return value.substring(0, 6) + '***'
  }

  return value
}

function desensitizeObject(obj: any, visited = new WeakSet()): any {
  if (obj === null || typeof obj !== 'object') return obj
  if (visited.has(obj)) return obj

  if (Array.isArray(obj)) {
    return obj.map(item => desensitizeObject(item, visited))
  }

  visited.add(obj)
  const result: any = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      result[key] = desensitizeObject(value, visited)
    } else {
      result[key] = desensitizeValue(key, value)
    }
  }

  return result
}

export function desensitizeMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res)

  res.json = function(body: any) {
    if (body && typeof body === 'object' && req.headers['x-skip-desensitize'] !== 'true') {
      if (body.data) {
        body.data = desensitizeObject(body.data)
      } else if (body.success && !body.error) {
        body = desensitizeObject(body)
      }
    }
    return originalJson(body)
  }

  next()
}
