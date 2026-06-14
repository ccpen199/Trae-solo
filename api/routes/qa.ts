import { Router, type Request, type Response } from 'express'
import { qaRecords, qaAnalysis } from '../../src/mock/data.js'
import type { QARecord } from '../../src/types/index.js'

const router = Router()

let nextQaId = 100

router.get('/records', async (req: Request, res: Response): Promise<void> => {
  const { rating, category } = req.query

  let filtered = [...qaRecords]

  if (rating) {
    filtered = filtered.filter(r => r.rating === parseInt(rating as string, 10))
  }
  if (category) {
    filtered = filtered.filter(r => r.root_cause_category === category)
  }

  res.status(200).json({
    success: true,
    data: filtered,
  })
})

router.get('/records/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const record = qaRecords.find(r => r.id === id)

  if (!record) {
    res.status(404).json({
      success: false,
      error: '质检记录不存在',
    })
    return
  }

  res.status(200).json({
    success: true,
    data: record,
  })
})

router.post('/transcribe', async (req: Request, res: Response): Promise<void> => {
  const { order_id, audio_url } = req.body

  if (!order_id || !audio_url) {
    res.status(400).json({
      success: false,
      error: '订单ID和音频URL不能为空',
    })
    return
  }

  const mockTranscripts = [
    '用户：阿姨你好，我已经到了，请问从哪里开始打扫？用户：先打扫厨房吧，油烟机比较脏。阿姨：好的，我先打扫厨房。',
    '用户：这个地方没擦干净啊，还有灰尘。阿姨：不好意思我再擦一遍。用户：算了，下次注意。',
    '用户：阿姨你迟到了半小时，怎么回事？阿姨：抱歉路上堵车了。',
  ]

  const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]

  const keywordsResult = transcript.match(/[\u4e00-\u9fa5]+/g)?.filter(w => w.length >= 2).slice(0, 5) || ['打扫', '迟到', '质量']

  const newRecord: QARecord = {
    id: nextQaId++,
    order_id,
    audio_url,
    transcript_text: transcript,
    keywords: keywordsResult,
    root_cause: keywordsResult.includes('迟到') ? '阿姨未按时到达' : '服务质量不达标',
    root_cause_category: keywordsResult.includes('迟到') ? '履约问题' : '服务质量',
    rating: 3,
    created_at: new Date().toISOString(),
  }

  qaRecords.push(newRecord)

  res.status(200).json({
    success: true,
    data: newRecord,
  })
})

router.post('/cluster', async (_req: Request, res: Response): Promise<void> => {
  const clusters = [
    {
      category: '履约问题',
      count: 8,
      records: qaRecords.filter(r => r.root_cause_category === '履约问题'),
    },
    {
      category: '服务质量',
      count: 7,
      records: qaRecords.filter(r => r.root_cause_category === '服务质量'),
    },
    {
      category: '服务态度',
      count: 4,
      records: qaRecords.filter(r => r.root_cause_category === '服务态度'),
    },
  ]

  res.status(200).json({
    success: true,
    data: {
      total_clusters: clusters.length,
      clusters,
    },
  })
})

router.get('/analysis', async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: qaAnalysis,
  })
})

router.post('/records', async (req: Request, res: Response): Promise<void> => {
  const { order_id, transcript_text, keywords, root_cause, root_cause_category, rating } = req.body

  if (!order_id || !transcript_text) {
    res.status(400).json({
      success: false,
      error: '订单ID和转写文本不能为空',
    })
    return
  }

  const newRecord: QARecord = {
    id: nextQaId++,
    order_id,
    audio_url: '',
    transcript_text,
    keywords: keywords || [],
    root_cause: root_cause || '',
    root_cause_category: root_cause_category || '其他',
    rating: rating || 3,
    created_at: new Date().toISOString(),
  }

  qaRecords.push(newRecord)

  res.status(201).json({
    success: true,
    data: newRecord,
  })
})

export default router
