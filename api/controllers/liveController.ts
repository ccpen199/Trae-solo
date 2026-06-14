import { type Request, type Response, type NextFunction } from 'express'
import liveService from '../services/liveService.js'

export const getUpcomingSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const result = await liveService.getUpcomingSessions({
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string)
    })
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const reserveSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    const result = await liveService.reserveSession(parseInt(id), userId)
    if (!result.success) { res.status(400).json(result); return }
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export const getMyReservations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId
    const result = await liveService.getReservationsByUserId(userId)
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}
