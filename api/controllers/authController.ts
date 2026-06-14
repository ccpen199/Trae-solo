import { type Request, type Response, type NextFunction } from 'express'
import authService from '../services/authService.js'

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone, password } = req.body
    const result = await authService.login(phone, password)
    if (!result.success) {
      res.status(401).json(result)
      return
    }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone, password, name, role, province, relationship, schoolName } = req.body
    const result = await authService.register({ phone, password, name, role, province, relationship, schoolName } as any)
    if (!result.success) {
      res.status(400).json(result)
      return
    }
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId
    const result = await authService.getCurrentUser(userId)
    if (!result.success) {
      res.status(404).json(result)
      return
    }
    res.json(result)
  } catch (error) {
    next(error)
  }
}
