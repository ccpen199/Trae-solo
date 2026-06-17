import { Router, type Request, type Response } from 'express'
import type { VoiceprintAnalysis, VoiceprintReport, Emotion } from '../../shared/types.js'

const router = Router()

const emotionLabels: Record<Emotion, string> = {
  happy: '开心',
  angry: '生气',
  hungry: '饥饿',
  anxious: '焦虑',
  curious: '好奇',
  sleepy: '困倦',
  playful: '玩耍',
  lonely: '孤独',
}

const generateReport = (): VoiceprintReport => ({
  frequency: Math.round((100 + Math.random() * 900) * 100) / 100,
  duration: Math.round((0.5 + Math.random() * 4.5) * 100) / 100,
  intensity: Math.round((30 + Math.random() * 70) * 100) / 100,
  pattern: ['高频短促', '低频悠长', '连续起伏', '平稳单调'][Math.floor(Math.random() * 4)],
})

const mockAnalyses: VoiceprintAnalysis[] = [
  {
    id: 'va1',
    petId: 'pet1',
    audioUrl: '/audio/sample1.wav',
    emotion: 'happy',
    emotionLabel: emotionLabels.happy,
    confidence: 0.94,
    semanticText: '主人摸摸我好开心呀！尾巴摇个不停~',
    voiceprintReport: generateReport(),
    createdAt: '2026-06-15T10:30:00Z',
  },
  {
    id: 'va2',
    petId: 'pet1',
    audioUrl: '/audio/sample2.wav',
    emotion: 'hungry',
    emotionLabel: emotionLabels.hungry,
    confidence: 0.88,
    semanticText: '肚子好饿啊！饭盆在哪里？快给我吃的！',
    voiceprintReport: generateReport(),
    createdAt: '2026-06-15T08:15:00Z',
  },
  {
    id: 'va3',
    petId: 'pet2',
    audioUrl: '/audio/sample3.wav',
    emotion: 'sleepy',
    emotionLabel: emotionLabels.sleepy,
    confidence: 0.91,
    semanticText: '好困好困~让我再睡五分钟嘛~',
    voiceprintReport: generateReport(),
    createdAt: '2026-06-14T22:00:00Z',
  },
  {
    id: 'va4',
    petId: 'pet3',
    audioUrl: '/audio/sample4.wav',
    emotion: 'playful',
    emotionLabel: emotionLabels.playful,
    confidence: 0.87,
    semanticText: '快丢球！快丢球！我要去捡回来！',
    voiceprintReport: generateReport(),
    createdAt: '2026-06-14T16:45:00Z',
  },
  {
    id: 'va5',
    petId: 'pet4',
    audioUrl: '/audio/sample5.wav',
    emotion: 'curious',
    emotionLabel: emotionLabels.curious,
    confidence: 0.79,
    semanticText: '这个盒子里装的是什么？让我闻闻看~',
    voiceprintReport: generateReport(),
    createdAt: '2026-06-14T12:20:00Z',
  },
]

router.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  const { petId, audioUrl } = req.body
  const emotions: Emotion[] = ['happy', 'angry', 'hungry', 'anxious', 'curious', 'sleepy', 'playful', 'lonely']
  const emotion = emotions[Math.floor(Math.random() * emotions.length)]
  const semanticTexts: Record<Emotion, string> = {
    happy: '今天心情超好！和主人在一起真开心~',
    angry: '哼！别理我，我在生气！',
    hungry: '咕咕咕~肚子好饿啊，快开饭！',
    anxious: '有点不安...主人什么时候回来？',
    curious: '咦？这是什么东西？让我研究一下！',
    sleepy: '好困啊~眼皮都睁不开了，晚安~',
    playful: '来玩呀来玩呀！把球丢给我！',
    lonely: '一个人好寂寞...有人陪我玩吗？',
  }

  const analysis: VoiceprintAnalysis = {
    id: `va${Date.now()}`,
    petId,
    audioUrl: audioUrl || `/audio/${Date.now()}.wav`,
    emotion,
    emotionLabel: emotionLabels[emotion],
    confidence: Math.round((0.7 + Math.random() * 0.29) * 100) / 100,
    semanticText: semanticTexts[emotion],
    voiceprintReport: generateReport(),
    createdAt: new Date().toISOString(),
  }
  mockAnalyses.unshift(analysis)
  res.status(200).json({
    success: true,
    data: analysis,
  })
})

router.get('/history', async (req: Request, res: Response): Promise<void> => {
  const { petId, limit = 20 } = req.query
  let analyses = [...mockAnalyses]
  if (petId) {
    analyses = analyses.filter(a => a.petId === petId)
  }
  analyses = analyses.slice(0, Number(limit))
  res.status(200).json({
    success: true,
    data: analyses,
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const analysis = mockAnalyses.find(a => a.id === id)
  if (!analysis) {
    res.status(404).json({
      success: false,
      error: 'Analysis not found',
    })
    return
  }
  res.status(200).json({
    success: true,
    data: analysis,
  })
})

router.get('/emotions/stats', async (req: Request, res: Response): Promise<void> => {
  const { petId } = req.query
  let analyses = mockAnalyses
  if (petId) {
    analyses = analyses.filter(a => a.petId === petId)
  }
  const stats: Record<string, number> = {}
  analyses.forEach(a => {
    stats[a.emotionLabel] = (stats[a.emotionLabel] || 0) + 1
  })
  res.status(200).json({
    success: true,
    data: stats,
  })
})

export default router
