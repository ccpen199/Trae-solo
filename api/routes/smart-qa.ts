import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../lib/database.js'

const router = Router()

interface KnowledgeBaseRow {
  id: number
  question: string
  answer: string
  category?: string
  keywords?: string
  view_count?: number
  helpful_count?: number
  sort_order?: number
  status: string
  created_at: string
  updated_at: string
}

interface QaSessionRow {
  id: number
  session_id: string
  user_id?: number
  topic?: string
  created_at: string
  updated_at: string
}

interface QaMessageRow {
  id: number
  session_id: string
  role: string
  content: string
  intent?: string
  matched_kb_id?: number
  created_at: string
}

const DIALECT_TIPS: Record<string, string> = {
  '粤语': '已识别为粤语口音，系统已自动转换为普通话进行智能应答',
  '广东话': '已识别为粤语口音，系统已自动转换为普通话进行智能应答',
  '四川话': '已识别为四川方言，系统已自动转换为普通话进行智能应答',
  '川普': '已识别为四川方言，系统已自动转换为普通话进行智能应答',
  '上海话': '已识别为沪语方言，系统已自动转换为普通话进行智能应答',
  '东北话': '已识别为东北方言，系统已自动转换为普通话进行智能应答',
  '闽南语': '已识别为闽南语，系统已自动转换为普通话进行智能应答',
  '客家话': '已识别为客家话，系统已自动转换为普通话进行智能应答',
}

function tokenize(text: string): string[] {
  const cleaned = text.replace(/[，。！？、,.!?\s]/g, '')
  const tokens: string[] = []
  for (let i = 0; i < cleaned.length; i++) {
    if (i + 2 <= cleaned.length) tokens.push(cleaned.slice(i, i + 2))
  }
  for (let i = 0; i < cleaned.length; i++) {
    if (i + 3 <= cleaned.length) tokens.push(cleaned.slice(i, i + 3))
  }
  tokens.push(cleaned)
  return tokens.filter((t) => t.length >= 1)
}

function scoreMatch(query: string, kb: KnowledgeBaseRow): number {
  const q = query.toLowerCase()
  const question = (kb.question || '').toLowerCase()
  const keywords = (kb.keywords || '').toLowerCase()
  const answer = (kb.answer || '').toLowerCase()

  let score = 0

  if (question === q) return 100
  if (keywords.includes(q) || keywords.split(/[,，、]/).some((k) => k.trim() === q)) return 95
  if (question.includes(q)) score += 40
  if (keywords.includes(q)) score += 30

  const qTokens = tokenize(query)
  const kTokens = (kb.keywords || '').split(/[,，、]/).map((k) => k.trim().toLowerCase())
  for (const qt of qTokens) {
    if (question.includes(qt)) score += 8
    for (const kt of kTokens) {
      if (kt && kt.includes(qt)) score += 6
    }
    if (answer.includes(qt)) score += 2
  }

  const exactKeyword = kTokens.filter((k) => k && q.includes(k))
  score += exactKeyword.length * 15

  return Math.min(score, 99)
}

function findBestMatch(query: string, kbs: KnowledgeBaseRow[]): {
  kb: KnowledgeBaseRow | null
  score: number
  intent: string
} {
  if (!query.trim()) {
    return {
      kb: null,
      score: 0,
      intent: 'unknown',
    }
  }

  let bestKb: KnowledgeBaseRow | null = null
  let bestScore = 0

  for (const kb of kbs) {
    const s = scoreMatch(query, kb)
    if (s > bestScore) {
      bestScore = s
      bestKb = kb
    }
  }

  let intent = 'general_inquiry'
  if (bestKb?.category) {
    const cat = bestKb.category
    if (cat.includes('失业') || cat.includes('失业保险')) intent = 'unemployment_insurance'
    else if (cat.includes('养老')) intent = 'pension_insurance'
    else if (cat.includes('创业') || cat.includes('贷款')) intent = 'entrepreneurship'
    else if (cat.includes('社保') || cat.includes('保险')) intent = 'social_insurance'
    else if (cat.includes('技能') || cat.includes('培训')) intent = 'skill_training'
    else if (cat.includes('仲裁') || cat.includes('劳动')) intent = 'labor_arbitration'
    else if (cat.includes('社保卡')) intent = 'social_security_card'
    else if (cat.includes('稳岗')) intent = 'stability_return'
  }

  return {
    kb: bestScore >= 15 ? bestKb : null,
    score: bestScore,
    intent,
  }
}

router.post('/session', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, topic } = req.body

    const sessionId = uuidv4()
    const db = getDatabase()

    db.prepare(`
      INSERT INTO qa_sessions (session_id, user_id, topic)
      VALUES (?, ?, ?)
    `).run(sessionId, userId || null, topic || null)

    res.status(201).sendJson({
      code: 0,
      message: '会话创建成功',
      data: {
        sessionId,
        topic: topic || '12333人社智能客服',
        createdAt: new Date().toISOString(),
        greeting: '您好！我是12333人社智能客服，请问有什么可以帮助您？',
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '创建失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.post('/message', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, role, content, dialect, voiceBase64, userId } = req.body

    if (!sessionId) {
      res.status(400).sendJson({ code: 400, message: 'sessionId 必填', data: null, traceId: req.traceId })
      return
    }
    if (!role || !content) {
      res.status(400).sendJson({ code: 400, message: 'role 和 content 必填', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()

    let session = db.prepare('SELECT * FROM qa_sessions WHERE session_id = ?').get(sessionId) as QaSessionRow | undefined
    if (!session) {
      const sid = uuidv4()
      db.prepare(`
        INSERT INTO qa_sessions (session_id, user_id, topic) VALUES (?, ?, ?)
      `).run(sid, userId || null, '12333人社智能客服')
      session = db.prepare('SELECT * FROM qa_sessions WHERE session_id = ?').get(sid) as QaSessionRow
    }

    let effectiveContent = content
    let dialectTip: string | null = null

    if (dialect && DIALECT_TIPS[dialect]) {
      dialectTip = DIALECT_TIPS[dialect]
    }

    if (voiceBase64) {
      dialectTip = dialectTip || '已完成语音转文字识别'
    }

    db.prepare(`
      INSERT INTO qa_messages (session_id, role, content, intent)
      VALUES (?, ?, ?, ?)
    `).run(session.session_id, role, effectiveContent, null)

    if (role !== 'user') {
      res.status(200).sendJson({
        code: 0,
        message: '消息已记录',
        data: {
          sessionId: session.session_id,
          role,
          content: effectiveContent,
          dialectTip,
        },
        traceId: req.traceId,
      })
      return
    }

    const kbs = db.prepare("SELECT * FROM knowledge_base WHERE status = 'active'").all() as KnowledgeBaseRow[]
    const match = findBestMatch(effectiveContent, kbs)

    let answer = ''
    let matchedKbId: number | null = null

    if (match.kb) {
      answer = match.kb.answer
      matchedKbId = match.kb.id

      db.prepare('UPDATE knowledge_base SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?').run(match.kb.id)
    } else {
      answer =
        '很抱歉，我暂时无法准确回答您的问题。建议您：\n' +
        '1. 尝试使用更简洁的关键词提问，如"失业金"、"社保转移"\n' +
        '2. 查看政策公告栏了解最新政策\n' +
        '3. 拨打12333人工服务热线咨询\n' +
        '4. 前往就近的人社服务网点现场办理'
    }

    db.prepare(`
      INSERT INTO qa_messages (session_id, role, content, intent, matched_kb_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(session.session_id, 'assistant', answer, match.intent, matchedKbId)

    db.prepare('UPDATE qa_sessions SET updated_at = CURRENT_TIMESTAMP WHERE session_id = ?').run(session.session_id)

    const assistantMessage = db.prepare(
      "SELECT * FROM qa_messages WHERE session_id = ? AND role = 'assistant' ORDER BY id DESC LIMIT 1"
    ).get(session.session_id) as QaMessageRow

    res.status(200).sendJson({
      code: 0,
      message: '应答成功',
      data: {
        sessionId: session.session_id,
        userMessage: {
          role: 'user',
          content: effectiveContent,
        },
        assistantMessage: {
          id: assistantMessage.id,
          role: 'assistant',
          content: answer,
          intent: match.intent,
          matchedKbId,
          matchScore: match.score,
          matchedQuestion: match.kb?.question,
          matchedCategory: match.kb?.category,
          createdAt: assistantMessage.created_at,
        },
        dialectTip,
        relatedQuestions: match.kb
          ? kbs
              .filter((k) => k.id !== match.kb!.id && k.category === match.kb!.category)
              .slice(0, 3)
              .map((k) => ({ id: k.id, question: k.question, category: k.category }))
          : [],
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '处理失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.get('/session/:sessionId/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params
    if (!sessionId) {
      res.status(400).sendJson({ code: 400, message: 'sessionId 必填', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()

    const session = db.prepare('SELECT * FROM qa_sessions WHERE session_id = ?').get(sessionId) as QaSessionRow | undefined
    if (!session) {
      res.status(404).sendJson({ code: 404, message: '会话不存在', data: null, traceId: req.traceId })
      return
    }

    const messages = db.prepare(
      'SELECT * FROM qa_messages WHERE session_id = ? ORDER BY id ASC'
    ).all(sessionId) as QaMessageRow[]

    res.status(200).sendJson({
      code: 0,
      message: '查询成功',
      data: {
        session: {
          sessionId: session.session_id,
          topic: session.topic,
          createdAt: session.created_at,
          updatedAt: session.updated_at,
        },
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          intent: m.intent,
          matchedKbId: m.matched_kb_id,
          createdAt: m.created_at,
        })),
        total: messages.length,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.get('/knowledge', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const rows = db.prepare(
      "SELECT * FROM knowledge_base WHERE status = 'active' ORDER BY COALESCE(view_count, 0) DESC, sort_order ASC LIMIT 20"
    ).all() as KnowledgeBaseRow[]

    const data = rows.map((k) => ({
      id: k.id,
      question: k.question,
      answer: k.answer,
      category: k.category,
      keywords: k.keywords ? k.keywords.split(/[,，、]/).map((s) => s.trim()).filter(Boolean) : [],
      viewCount: k.view_count || 0,
      helpfulCount: k.helpful_count || 0,
      createdAt: k.created_at,
    }))

    res.status(200).sendJson({
      code: 0,
      message: '查询成功',
      data: {
        total: data.length,
        hotTopics: data.slice(0, 5).map((k) => k.question),
        items: data,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

export default router
