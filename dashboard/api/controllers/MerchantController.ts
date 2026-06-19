import type { Response } from 'express'
import { merchantService } from '../services/MerchantService.js'
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse, paginatedResponse } from '../utils/response.js'
import type { AuthRequest } from '../middleware/auth.js'

export class MerchantController {
  async createMerchant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = req.body
      
      if (!data.name || !data.licenseNo || !data.contactName || !data.contactPhone || !data.address) {
        errorResponse(res, '缺少必要参数')
        return
      }

      const merchant = await merchantService.createMerchant(data)
      successResponse(res, merchant, '商户创建成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getMerchantList(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 20
      const status = req.query.status as string | undefined
      const district = req.query.district as string | undefined
      const category = req.query.category as string | undefined

      const result = await merchantService.getMerchantList(page, pageSize, status, district, category)
      paginatedResponse(res, result.merchants, result.total, page, pageSize)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getMerchantDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      
      const merchant = await merchantService.getMerchantById(id)
      
      if (!merchant) {
        notFoundResponse(res, '商户不存在')
        return
      }

      successResponse(res, merchant)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async updateMerchant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const updates = req.body

      const merchant = await merchantService.updateMerchant(id, updates)
      
      if (!merchant) {
        notFoundResponse(res, '商户不存在')
        return
      }

      successResponse(res, merchant, '商户更新成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async updateMerchantStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { status } = req.body

      if (!status || !['active', 'inactive', 'pending'].includes(status)) {
        errorResponse(res, '无效的状态值')
        return
      }

      const merchant = await merchantService.updateMerchantStatus(id, status as 'active' | 'inactive' | 'pending')
      
      if (!merchant) {
        notFoundResponse(res, '商户不存在')
        return
      }

      successResponse(res, merchant, '状态更新成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async deleteMerchant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      
      const result = await merchantService.deleteMerchant(id)
      
      if (!result) {
        notFoundResponse(res, '商户不存在')
        return
      }

      successResponse(res, null, '删除成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async createStore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { merchantId } = req.params
      const data = req.body

      if (!data.name || !data.address || !data.district || !data.location) {
        errorResponse(res, '缺少必要参数')
        return
      }

      const store = await merchantService.createStore(merchantId, data)
      successResponse(res, store, '门店创建成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getStoresByMerchant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { merchantId } = req.params
      
      const stores = await merchantService.getStoresByMerchant(merchantId)
      successResponse(res, stores)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getStoreDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      
      const store = await merchantService.getStoreById(id)
      
      if (!store) {
        notFoundResponse(res, '门店不存在')
        return
      }

      successResponse(res, store)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async updateStore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const updates = req.body

      const store = await merchantService.updateStore(id, updates)
      
      if (!store) {
        notFoundResponse(res, '门店不存在')
        return
      }

      successResponse(res, store, '门店更新成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async deleteStore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      
      const result = await merchantService.deleteStore(id)
      
      if (!result) {
        notFoundResponse(res, '门店不存在')
        return
      }

      successResponse(res, null, '删除成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async createTerminal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { storeId } = req.params
      const { merchantId, ...data } = req.body

      if (!data.terminalNo || !data.model) {
        errorResponse(res, '缺少必要参数')
        return
      }

      const terminal = await merchantService.createTerminal(storeId, merchantId, data)
      successResponse(res, terminal, 'POS终端创建成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getTerminalsByStore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { storeId } = req.params
      
      const terminals = await merchantService.getTerminalsByStore(storeId)
      successResponse(res, terminals)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getTerminalsByMerchant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { merchantId } = req.params
      
      const terminals = await merchantService.getTerminalsByMerchant(merchantId)
      successResponse(res, terminals)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getTerminalDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      
      const terminal = await merchantService.getTerminalById(id)
      
      if (!terminal) {
        notFoundResponse(res, 'POS终端不存在')
        return
      }

      successResponse(res, terminal)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async updateTerminal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const updates = req.body

      const terminal = await merchantService.updateTerminal(id, updates)
      
      if (!terminal) {
        notFoundResponse(res, 'POS终端不存在')
        return
      }

      successResponse(res, terminal, 'POS终端更新成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async deleteTerminal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      
      const result = await merchantService.deleteTerminal(id)
      
      if (!result) {
        notFoundResponse(res, 'POS终端不存在')
        return
      }

      successResponse(res, null, '删除成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async updateTerminalHeartbeat(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { terminalNo } = req.body
      
      if (!terminalNo) {
        errorResponse(res, '终端编号不能为空')
        return
      }

      const result = await merchantService.updateTerminalHeartbeat(terminalNo)
      
      if (!result) {
        notFoundResponse(res, '终端不存在')
        return
      }

      successResponse(res, result, '心跳更新成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getMerchantStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await merchantService.getMerchantStats()
      successResponse(res, stats)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }
}

export const merchantController = new MerchantController()
