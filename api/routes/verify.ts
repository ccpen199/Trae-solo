import { Router, type Request, type Response } from 'express'
import type { AntiFraudRecord, ApiResponse } from '../../shared/types.js'
import { verificationService } from '../services/VerificationService.js'
import { antiFraudService } from '../services/AntiFraudService.js'

const router = Router()

router.post('/owner', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ownerId, phone } = req.body

    if (!ownerId || !phone) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数：ownerId, phone'
      })
      return
    }

    const result = await verificationService.verifyOwnerPhone(ownerId, phone)

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '业主手机号验证失败'
    })
  }
})

router.post('/agent', async (req: Request, res: Response): Promise<void> => {
  try {
    const { agentId, licenseNumber } = req.body

    if (!agentId || !licenseNumber) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数：agentId, licenseNumber'
      })
      return
    }

    const result = await verificationService.verifyAgentLicense(agentId, licenseNumber)

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '经纪人身份备案失败'
    })
  }
})

router.post('/anti-fraud/image-similarity', async (req: Request, res: Response): Promise<void> => {
  try {
    const { propertyId, imageUrls } = req.body

    if (!propertyId || !imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数：propertyId, imageUrls（非空数组）'
      })
      return
    }

    const result = await antiFraudService.checkImageSimilarity(propertyId, imageUrls)

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(200).json(result as ApiResponse<AntiFraudRecord>)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '图片相似度检测失败'
    })
  }
})

router.post('/anti-fraud/list-frequency', async (req: Request, res: Response): Promise<void> => {
  try {
    const { propertyId, ownerId, publishTime } = req.body

    if (!propertyId || !ownerId) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数：propertyId, ownerId'
      })
      return
    }

    const result = await antiFraudService.checkListingFrequency(
      propertyId,
      ownerId,
      publishTime || new Date().toISOString()
    )

    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.status(200).json(result as ApiResponse<AntiFraudRecord>)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '挂牌频次检测失败'
    })
  }
})

export default router
