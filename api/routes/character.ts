import { Router, type Request, type Response } from 'express'
import type { ApiResponse, CharacterInfo } from '../../shared/types'
import { characters } from '../data/characters.js'

const router = Router()

router.get('/:char', async (req: Request, res: Response): Promise<void> => {
  try {
    const { char } = req.params
    const character = characters.find(c => c.char === char)
    if (!character) {
      const response: ApiResponse<null> = { code: 404, message: '未找到该字', data: null }
      res.status(404).json(response)
      return
    }
    const response: ApiResponse<CharacterInfo> = { code: 0, message: '获取成功', data: character }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

export default router
