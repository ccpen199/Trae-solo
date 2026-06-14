import { type Request, type Response, type NextFunction } from 'express'
import admissionScoreService from '../services/admissionScoreService.js'

export const getTrend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { universityId, majorId, province } = req.query
    const result = await admissionScoreService.getTrend(
      parseInt(universityId as string),
      majorId ? parseInt(majorId as string) : undefined,
      province as string
    )
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}
