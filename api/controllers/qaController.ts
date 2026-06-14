import { type Request, type Response, type NextFunction } from 'express'
import qaService from '../services/qaService.js'

export const getQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { keyword, category, status, page = 1, pageSize = 10 } = req.query
    const result = await qaService.getQuestions({
      keyword: keyword as string,
      category: category as string,
      status: status as string,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string)
    })
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const createQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId
    const { title, content, category } = req.body
    const result = await qaService.createQuestion(userId, title, content, category)
    if (!result.success) { res.status(400).json(result); return }
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export const getQuestionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const result = await qaService.getQuestionById(parseInt(id))
    if (!result.success) { res.status(404).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const createAnswer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    const { content } = req.body
    const result = await qaService.createAnswer(userId, parseInt(id), content)
    if (!result.success) { res.status(400).json(result); return }
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export const likeAnswer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    const result = await qaService.likeAnswer(parseInt(id), userId)
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}
