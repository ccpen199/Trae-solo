import { Router, type Request, type Response } from 'express'
import {
  listFavorites,
  insertFavorite,
  deleteFavorite,
  getDb,
} from '../db/index.js'
import { mockUserProfile, mockFavorites } from '../data/mock.js'
import type { UserProfile, Favorite } from '../../shared/types.js'

const router = Router()

router.get('/profile', (req: Request, res: Response): void => {
  try {
    res.json({
      success: true,
      data: mockUserProfile as UserProfile,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户信息失败',
    })
  }
})

router.get('/favorites', (req: Request, res: Response): void => {
  try {
    let favorites = listFavorites()

    if (favorites.length === 0) {
      favorites = mockFavorites as Favorite[]
    }

    res.json({
      success: true,
      data: favorites,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取收藏夹失败',
    })
  }
})

router.post('/favorites', (req: Request, res: Response): void => {
  try {
    const { targetType, targetId, targetData } = req.body as {
      targetType?: Favorite['targetType']
      targetId?: string
      targetData?: string
    }

    if (!targetType || !targetId || !targetData) {
      res.status(400).json({
        success: false,
        error: '参数错误：targetType、targetId、targetData 为必填',
      })
      return
    }

    const id = `fav-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const createdAt = new Date().toISOString()

    const favorite: Favorite = {
      id,
      targetType,
      targetId,
      targetData,
      createdAt,
    }

    const existing = listFavorites().find(
      (f) => f.targetType === targetType && f.targetId === targetId,
    )
    if (existing) {
      res.status(409).json({
        success: false,
        error: '该收藏已存在',
      })
      return
    }

    insertFavorite(favorite)

    res.status(201).json({
      success: true,
      data: favorite,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '添加收藏失败',
    })
  }
})

router.delete('/favorites/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const existing = listFavorites().find((f) => f.id === id)
    if (!existing) {
      res.status(404).json({
        success: false,
        error: '未找到该收藏',
      })
      return
    }

    deleteFavorite(id)

    res.json({
      success: true,
      message: '删除收藏成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除收藏失败',
    })
  }
})

router.put('/favorites/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { targetData } = req.body as { targetData?: string }

    if (!targetData) {
      res.status(400).json({
        success: false,
        error: '参数错误：targetData 为必填',
      })
      return
    }

    const db = getDb()
    const result = db
      .prepare('UPDATE favorites SET target_data = ? WHERE id = ?')
      .run(targetData, id)

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        error: '未找到该收藏',
      })
      return
    }

    const updated = listFavorites().find((f) => f.id === id) as Favorite

    res.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新收藏失败',
    })
  }
})

export default router
