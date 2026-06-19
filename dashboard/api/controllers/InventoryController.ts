import type { Response } from 'express'
import { inventoryService } from '../services/InventoryService.js'
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse, paginatedResponse } from '../utils/response.js'
import type { AuthRequest } from '../middleware/auth.js'

export class InventoryController {
  async getInventoryList(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 20
      const activityId = req.query.activityId as string | undefined

      const result = await inventoryService.getInventoryList(page, pageSize, activityId)
      paginatedResponse(res, result.inventory, result.total, page, pageSize)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getInventoryDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      
      const inventory = await inventoryService.getInventoryById(id)
      
      if (!inventory) {
        notFoundResponse(res, '库存记录不存在')
        return
      }

      successResponse(res, inventory)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async replenish(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { quantity, unitCost, expiryDate } = req.body
      const operatorId = req.user?.id || 'system'
      const operatorName = req.user?.name || 'System'

      if (!quantity || quantity <= 0) {
        errorResponse(res, '补货数量必须大于0')
        return
      }

      const result = await inventoryService.replenish(
        { activityId: id, quantity, unitCost, expiryDate: expiryDate ? new Date(expiryDate) : undefined },
        operatorId,
        operatorName,
      )

      if (!result) {
        errorResponse(res, '补货失败')
        return
      }

      successResponse(res, result, '补货成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async adjustInventory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { newQuantity, remark } = req.body
      const operatorId = req.user?.id || 'system'
      const operatorName = req.user?.name || 'System'

      if (newQuantity === undefined || newQuantity < 0) {
        errorResponse(res, '调整后的数量不能为负数')
        return
      }

      const result = await inventoryService.adjustInventory(id, newQuantity, operatorId, operatorName, remark)
      
      if (!result) {
        notFoundResponse(res, '库存记录不存在')
        return
      }

      successResponse(res, result, '库存调整成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getAvailableQuantity(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { activityId } = req.params
      
      const quantity = await inventoryService.getAvailableQuantity(activityId)
      successResponse(res, { availableQuantity: quantity })
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getInventoryLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { inventoryId } = req.params
      
      const logs = await inventoryService.getInventoryLogs(inventoryId)
      successResponse(res, logs)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getLowInventory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const threshold = parseInt(req.query.threshold as string) || 100
      
      const items = await inventoryService.checkLowInventory(threshold)
      successResponse(res, items)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getInventoryStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await inventoryService.getInventoryStats()
      successResponse(res, stats)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async createInventory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { activityId, quantity, unitCost, expiryDate } = req.body

      if (!activityId || !quantity || quantity <= 0) {
        errorResponse(res, '缺少必要参数')
        return
      }

      const inventory = await inventoryService.createInventory(
        activityId,
        quantity,
        unitCost,
        expiryDate ? new Date(expiryDate) : undefined,
      )

      successResponse(res, inventory, '库存创建成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }
}

export const inventoryController = new InventoryController()
