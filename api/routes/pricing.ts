import { Router, type Request, type Response } from 'express'
import type { ApiResponse, PricingConfig } from '../../shared/types/index.js'
import {
  calculatePrice,
  getCurrentPricingConfig,
  updatePricingConfig,
  type PricingParams,
} from '../services/pricingService.js'

const router = Router()

router.post('/calculate', async (req: Request, res: Response): Promise<void> => {
  try {
    const params = req.body as PricingParams
    const breakdown = calculatePrice(params)

    const response: ApiResponse = {
      success: true,
      data: breakdown,
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate price',
    })
  }
})

router.get('/rules', async (req: Request, res: Response): Promise<void> => {
  try {
    const config = getCurrentPricingConfig()

    const response: ApiResponse = {
      success: true,
      data: config,
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch pricing rules',
    })
  }
})

router.put('/rules', async (req: Request, res: Response): Promise<void> => {
  try {
    const updates = req.body as Partial<PricingConfig>
    const updatedConfig = updatePricingConfig(updates)

    const response: ApiResponse = {
      success: true,
      data: updatedConfig,
      message: 'Pricing rules updated successfully',
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update pricing rules',
    })
  }
})

export default router
