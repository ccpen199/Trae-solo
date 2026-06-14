import { type Request, type Response, type NextFunction } from 'express'
import recommendService from '../services/recommendService.js'
import * as recommendEngine from '../engine/recommendEngine.js'
import type { ApiResponse, PlanRiskAnalysis } from '../types/index.js'

export const generateRecommend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId
    const result = await recommendService.generateRecommendations(userId, req.body)
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const analyzePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { planItems } = req.body
    const analysis = recommendEngine.analyzePlanRisk(planItems || [])
    const result: ApiResponse<PlanRiskAnalysis> = {
      success: true,
      data: analysis
    }
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const getProbability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { universityId, majorId, score, rank, province } = req.query
    const result = await recommendService.getProbabilitySimulation(
      parseInt(universityId as string),
      parseInt(majorId as string),
      parseInt(score as string),
      parseInt(rank as string),
      province as string
    )
    if (!result.success) { res.status(400).json(result); return }
    res.json(result)
  } catch (error) {
    next(error)
  }
}
