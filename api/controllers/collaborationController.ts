import { type Request, type Response, type NextFunction } from 'express'
import collaborationService from '../services/collaborationService.js'

export const getSpaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId
    const result = await collaborationService.getSpacesByUserId(userId)
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const createSpace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId
    const { name, planId } = req.body
    const result = await collaborationService.createSpace(userId, name, planId)
    if (!result.success) { res.status(400).json(result); return }
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export const getSpaceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    const result = await collaborationService.getSpaceById(parseInt(id), userId)
    if (!result.success) { res.status(404).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const addMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    const { userId: memberUserId, role } = req.body
    const result = await collaborationService.addMember(parseInt(id), userId, memberUserId, role)
    if (!result.success) { res.status(400).json(result); return }
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export const removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId
    const { id, userId: memberUserId } = req.params
    const result = await collaborationService.removeMember(parseInt(id), userId, parseInt(memberUserId))
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    const { content, itemId } = req.body
    const result = await collaborationService.sendMessage(parseInt(id), userId, content, itemId)
    if (!result.success) { res.status(400).json(result); return }
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}
