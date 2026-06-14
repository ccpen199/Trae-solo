import { type Request, type Response, type NextFunction } from 'express'
import majorService from '../services/majorService.js'

export const getMajors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { keyword, category, page = 1, pageSize = 10 } = req.query
    const result = await majorService.getMajors({
      keyword: keyword as string,
      category: category as string,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string)
    })
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const getMajorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const result = await majorService.getMajorById(parseInt(id))
    if (!result.success) { res.status(404).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const compareMajors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.query
    const idArray = (ids as string).split(',').map(id => parseInt(id.trim()))
    const result = await majorService.compareMajors(idArray)
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}
