import { type Request, type Response, type NextFunction } from 'express'
import universityService from '../services/universityService.js'
import majorService from '../services/majorService.js'

export const getUniversities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { keyword, level, province, type, page = 1, pageSize = 10 } = req.query
    const result = await universityService.getUniversities({
      keyword: keyword as string,
      level: level as string,
      province: province as string,
      type: type as string,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string)
    })
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const getUniversityById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const result = await universityService.getUniversityById(parseInt(id))
    if (!result.success) { res.status(404).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const getUniversityScores = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const { year, province } = req.query
    const result = await universityService.getUniversityScores(parseInt(id), {
      year: year ? parseInt(year as string) : undefined,
      province: province as string
    })
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const compareUniversities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.query
    const idArray = (ids as string).split(',').map(id => parseInt(id.trim()))
    const result = await universityService.compareUniversities(idArray)
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const getUniversityMajors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const result = await majorService.getMajorsByUniversity(parseInt(id))
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}
