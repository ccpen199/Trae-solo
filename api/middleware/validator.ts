import { type Request, type Response, type NextFunction } from 'express'

interface ValidationRule {
  field: string
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required?: boolean
  validator?: (value: unknown) => boolean | string
  message?: string
}

const validateIdCard = (idCard: string): boolean => {
  const regex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
  if (!regex.test(idCard)) {
    return false
  }

  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i]) * weights[i]
  }
  const checkCode = checkCodes[sum % 11]
  return idCard[17].toUpperCase() === checkCode
}

const validatePhone = (phone: string): boolean => {
  const regex = /^1[3-9]\d{9}$/
  return regex.test(phone)
}

const validateRequired = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false
  }
  if (typeof value === 'string' && value.trim() === '') {
    return false
  }
  if (Array.isArray(value) && value.length === 0) {
    return false
  }
  return true
}

const createValidator = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = []
    const data = { ...req.body, ...req.query, ...req.params }

    for (const rule of rules) {
      const { field, type, required = true, validator, message } = rule
      const value = data[field]

      if (required && !validateRequired(value)) {
        errors.push(message || `${field} 不能为空`)
        continue
      }

      if (value === undefined || value === null) {
        continue
      }

      if (type) {
        let typeValid = false
        switch (type) {
          case 'string':
            typeValid = typeof value === 'string'
            break
          case 'number':
            typeValid = typeof value === 'number' || !isNaN(Number(value))
            break
          case 'boolean':
            typeValid = typeof value === 'boolean'
            break
          case 'array':
            typeValid = Array.isArray(value)
            break
          case 'object':
            typeValid = typeof value === 'object' && !Array.isArray(value)
            break
        }
        if (!typeValid) {
          errors.push(message || `${field} 类型不正确，应为 ${type}`)
          continue
        }
      }

      if (validator) {
        const result = validator(value)
        if (result === false) {
          errors.push(message || `${field} 格式不正确`)
        } else if (typeof result === 'string') {
          errors.push(result)
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: '参数校验失败',
        details: errors,
      })
      return
    }

    next()
  }
}

export { validateIdCard, validatePhone, validateRequired, createValidator }
