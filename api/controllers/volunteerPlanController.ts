import { type Request, type Response, type NextFunction } from 'express'
import volunteerPlanService from '../services/volunteerPlanService.js'

export const getPlans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId
    const result = await volunteerPlanService.getUserPlans(userId)
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const createPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId
    const { name, planItems } = req.body
    const result = await volunteerPlanService.createPlan(userId, name, planItems)
    if (!result.success) { res.status(400).json(result); return }
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export const getPlanById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const result = await volunteerPlanService.getPlanById(parseInt(id))
    if (!result.success) { res.status(404).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const updatePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const { name, planItems } = req.body
    const result = await volunteerPlanService.updatePlan(parseInt(id), { name, items: planItems })
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const deletePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const result = await volunteerPlanService.deletePlan(parseInt(id))
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const analyzePlanRisk = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const result = await volunteerPlanService.analyzePlan(parseInt(id), {} as any)
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const exportPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const result = await volunteerPlanService.exportReport(parseInt(id))
    if (typeof result === 'object' && result !== null && 'success' in result && !result.success) {
      res.status(400).json(result)
      return
    }
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="plan-${id}.pdf"`)
    res.send(result)
  } catch (error) {
    next(error)
  }
}
