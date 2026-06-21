import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

const mockTranslateZhToIt: Record<string, string> = {
  '中意友好合作关系源远流长。': 'Le relazioni di amicizia e cooperazione tra Cina e Italia hanno una lunga storia.',
  '我们致力于推动两国在经济、文化、教育等领域的交流与合作。':
    'Ci impegniamo a promuovere gli scambi e la cooperazione tra i due paesi nei settori economico, culturale, educativo e altri.',
  '欢迎来到中意文化交流平台。': 'Benvenuti sulla piattaforma di scambio culturale Cina-Italia.',
  '这个项目将为两国企业创造更多合作机会。': 'Questo progetto creerà maggiori opportunità di cooperazione per le imprese dei due paesi.',
  '今天天气很好。': 'Oggi il tempo è bello.',
  '谢谢。': 'Grazie.',
  '你好。': 'Ciao.',
  '再见。': 'Arrivederci.',
}

const mockTranslateItToZh: Record<string, string> = {
  'Le relazioni di amicizia e cooperazione tra Cina e Italia hanno una lunga storia.':
    '中意友好合作关系源远流长。',
  'Benvenuti sulla piattaforma di scambio culturale Cina-Italia.': '欢迎来到中意文化交流平台。',
  'Grazie.': '谢谢。',
  'Ciao.': '你好。',
  'Arrivederci.': '再见。',
  'Oggi il tempo è bello.': '今天天气很好。',
}

const mockTerminology: Record<string, Array<{ term: string; translation: string; confidence: number }>> = {
  zh: [
    { term: '中意', translation: 'Cina-Italia', confidence: 0.98 },
    { term: '合作', translation: 'cooperazione', confidence: 0.96 },
    { term: '文化', translation: 'cultura', confidence: 0.97 },
  ],
  it: [
    { term: 'Cina-Italia', translation: '中意', confidence: 0.98 },
    { term: 'cooperazione', translation: '合作', confidence: 0.96 },
    { term: 'cultura', translation: '文化', confidence: 0.97 },
  ],
}

router.post('/', (req: Request, res: Response): void => {
  const { sourceText, sourceLang, targetLang, domain = 'general' } = req.body

  if (!sourceText || !sourceLang || !targetLang) {
    res.status(400).json({
      success: false,
      error: 'Missing required fields: sourceText, sourceLang, targetLang',
    })
    return
  }

  if (sourceLang === targetLang) {
    res.status(400).json({
      success: false,
      error: 'sourceLang and targetLang must be different',
    })
    return
  }

  let translatedText = ''
  if (sourceLang === 'zh' && targetLang === 'it') {
    translatedText =
      mockTranslateZhToIt[sourceText] ||
      `[Traduzione automatica IT] ${sourceText}`
  } else if (sourceLang === 'it' && targetLang === 'zh') {
    translatedText =
      mockTranslateItToZh[sourceText] ||
      `[机器翻译 ZH] ${sourceText}`
  } else {
    translatedText = `[Translated] ${sourceText}`
  }

  const confidence = 0.85 + Math.random() * 0.14
  const needsHumanReview = confidence < 0.9
  const terminology = mockTerminology[sourceLang] || []

  const id = `trans_${Date.now()}`
  try {
    db.prepare(
      `INSERT INTO translation_history (id, source_text, source_lang, translated_text, target_lang, domain, terminology_json, confidence, needs_human_review)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      sourceText,
      sourceLang,
      translatedText,
      targetLang,
      domain,
      JSON.stringify(terminology),
      confidence,
      needsHumanReview ? 1 : 0,
    )
  } catch {
    // ignore
  }

  res.json({
    success: true,
    data: {
      id,
      translatedText,
      terminology,
      confidence,
      needsHumanReview,
    },
  })
})

router.post('/human-review', (req: Request, res: Response): void => {
  const { translationId, notes, sourceText, targetLang, priority = 'normal' } = req.body

  if (!translationId && !sourceText) {
    res.status(400).json({
      success: false,
      error: 'Either translationId or sourceText must be provided',
    })
    return
  }

  const reviewId = `review_${Date.now()}`

  try {
    db.prepare(
      `INSERT INTO content_reviews (id, content_type, content_id, submitted_by, sensitive_words_json, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      reviewId,
      'translation',
      translationId || `manual_${Date.now()}`,
      'user_001',
      JSON.stringify([]),
      'pending',
    )
  } catch {
    // ignore
  }

  res.status(201).json({
    success: true,
    data: {
      reviewId,
      status: 'pending',
      estimatedTime: priority === 'urgent' ? '2小时' : '24小时',
      priority,
      notes: notes || null,
    },
  })
})

export default router
