import { Router, type Request, type Response } from 'express'
import type { ApiResponse, NameProposal } from '../../shared/types'
import * as namingService from '../services/namingService.js'
import { nameProposals } from '../db/index.js'

const router = Router()

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const row = nameProposals.find(p => p.id === id)
    if (!row) {
      const response: ApiResponse<null> = { code: 404, message: '名字不存在', data: null }
      res.status(404).json(response)
      return
    }
    const proposal: NameProposal = {
      id: row.id,
      fullName: row.fullName,
      pinyin: row.pinyin,
      characters: JSON.parse(row.charactersJson),
      meaning: row.explanation,
      score: {
        overall: row.overallScore,
        auspiciousness: row.auspiciousnessScore,
        uniqueness: row.uniquenessScore,
        writingEase: row.writingScore,
        phoneticHarmony: row.phoneticScore
      },
      fiveElementsMatch: 80,
      fiveElementsNote: '',
      phoneticAnalysis: JSON.parse(row.phoneticAnalysisJson),
      duplicateRate: namingService.queryDuplicateRate(row.fullName),
      poetryReferences: [],
      tags: []
    }
    const response: ApiResponse<NameProposal> = { code: 0, message: '获取成功', data: proposal }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

router.get('/duplicate-rate/:name', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params
    const result = namingService.queryDuplicateRate(decodeURIComponent(name))
    const response: ApiResponse<typeof result> = { code: 0, message: '查询成功', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

export default router
