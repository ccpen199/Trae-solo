import { type Request, type Response, type NextFunction } from 'express'
import adminService from '../services/adminService.js'

export const getStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await adminService.getStatistics()
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const getHeatmap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date } = req.query
    const result = await adminService.getHeatmapData(date as string)
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const approveQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const result = await adminService.approveQuestion(parseInt(id))
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const rejectQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const result = await adminService.rejectQuestion(parseInt(id))
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const desensitizeData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await adminService.maskSensitiveData()
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}
