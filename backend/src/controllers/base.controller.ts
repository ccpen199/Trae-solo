import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import prisma from '../utils/prisma'
import { AuthRequest } from '../types'
import { success, error, pagination } from '../utils/response'

type ModelName = keyof Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>

export class BaseController {
  protected modelName: ModelName

  constructor(modelName: ModelName) {
    this.modelName = modelName
  }

  protected get model() {
    return prisma[this.modelName] as any
  }

  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, pageSize = 10, keyword, status, ...filters } = req.query

      const where: any = {}

      if (status !== undefined) {
        where.status = Number(status)
      }

      if (keyword && typeof keyword === 'string') {
        where.OR = [
          { name: { contains: keyword } },
          { code: { contains: keyword } },
        ]
      }

      const skip = (Number(page) - 1) * Number(pageSize)
      const take = Number(pageSize)

      const [list, total] = await Promise.all([
        this.model.findMany({
          where,
          skip,
          take,
          orderBy: [{ createdAt: 'desc' }],
        }),
        this.model.count({ where }),
      ])

      pagination(res, list, total, Number(page), Number(pageSize))
    } catch (err) {
      console.error('List error:', err)
      error(res, '获取列表失败')
    }
  }

  async all(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status = 1 } = req.query

      const where: any = {}
      if (status !== undefined) {
        where.status = Number(status)
      }

      const list = await this.model.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      })

      success(res, list)
    } catch (err) {
      console.error('All error:', err)
      error(res, '获取全部数据失败')
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params

      const item = await this.model.findUnique({
        where: { id },
      })

      if (!item) {
        error(res, '数据不存在', 404)
        return
      }

      success(res, item)
    } catch (err) {
      console.error('Get by id error:', err)
      error(res, '获取数据失败')
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = req.body

      const item = await this.model.create({
        data,
      })

      success(res, item, '创建成功')
    } catch (err) {
      console.error('Create error:', err)
      error(res, '创建失败')
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const data = req.body

      const existing = await this.model.findUnique({
        where: { id },
      })

      if (!existing) {
        error(res, '数据不存在', 404)
        return
      }

      const item = await this.model.update({
        where: { id },
        data: { ...data, updatedAt: new Date() },
      })

      success(res, item, '更新成功')
    } catch (err) {
      console.error('Update error:', err)
      error(res, '更新失败')
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params

      const existing = await this.model.findUnique({
        where: { id },
      })

      if (!existing) {
        error(res, '数据不存在', 404)
        return
      }

      await this.model.delete({
        where: { id },
      })

      success(res, null, '删除成功')
    } catch (err) {
      console.error('Delete error:', err)
      error(res, '删除失败')
    }
  }

  async batchDelete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { ids } = req.body

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        error(res, '请选择要删除的数据', 400)
        return
      }

      await this.model.deleteMany({
        where: { id: { in: ids } },
      })

      success(res, null, `批量删除成功，共删除 ${ids.length} 条数据`)
    } catch (err) {
      console.error('Batch delete error:', err)
      error(res, '批量删除失败')
    }
  }

  async toggleStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { status } = req.body

      const existing = await this.model.findUnique({
        where: { id },
      })

      if (!existing) {
        error(res, '数据不存在', 404)
        return
      }

      const item = await this.model.update({
        where: { id },
        data: { status, updatedAt: new Date() },
      })

      success(res, item, '状态更新成功')
    } catch (err) {
      console.error('Toggle status error:', err)
      error(res, '状态更新失败')
    }
  }
}
