import Database from 'better-sqlite3'
import type { ChatHistory } from '../db/index.js'

export interface ArchiveDocument {
  id: string
  title: string
  content: string
  category: string
  keywords: string[]
  relevance: number
}

export interface AskRequest {
  userId?: number
  sessionId: string
  question: string
}

export interface AskResponse {
  answer: string
  sourceDocs: ArchiveDocument[]
  relatedQuestions: string[]
}

export interface QueryArchiveRequest {
  query: string
  category?: string
  limit?: number
}

export interface ChatHistoryQuery {
  userId?: number
  sessionId?: string
  page?: number
  pageSize?: number
}

export interface ChatHistoryResult {
  list: ChatHistory[]
  total: number
  page: number
  pageSize: number
}

const KNOWLEDGE_BASE: ArchiveDocument[] = [
  {
    id: 'kb-001',
    title: '进京证办理指南',
    content: '进京证是指外埠机动车进入北京市行政区域内（不含高速公路主路）行驶时，必须办理的临时通行证明。办理方式：1. 线上办理：通过"北京交警"APP提前1-4天申请；2. 线下办理：到北京市各进京检查站办证窗口办理。所需材料：驾驶人身份证、驾驶证、车辆行驶证、交强险保单。有效期：最长7天，可续期一次。',
    category: 'permit',
    keywords: ['进京证', '办理', '外埠车辆', '通行证明'],
    relevance: 1,
  },
  {
    id: 'kb-002',
    title: '电动车登记上牌流程',
    content: '电动自行车登记上牌流程：1. 准备材料：身份证、购车发票、车辆合格证、3C认证证书；2. 线上预约：通过"北京交警"APP预约登记时间和地点；3. 现场验车：携带材料和车辆到指定登记点验车；4. 选号领证：审核通过后，现场选取号牌并领取行驶证。注意：车辆必须符合国家标准，车架号和电机号必须清晰可辨。',
    category: 'ebike',
    keywords: ['电动车', '上牌', '登记', '行驶证'],
    relevance: 1,
  },
  {
    id: 'kb-003',
    title: '交通违法行为举报须知',
    content: '市民可通过以下方式举报交通违法行为：1. "北京交警"APP随手拍功能；2. 122报警电话；3. 各交通支大队窗口。举报需提供：清晰的违法照片或视频（包含车牌号码、违法时间、地点）、准确的违法类型描述。注意：举报人需实名举报，举报信息将严格保密。经查证属实的，可获得相应奖励。',
    category: 'violation',
    keywords: ['举报', '违法', '随手拍', '交通违章'],
    relevance: 1,
  },
  {
    id: 'kb-004',
    title: '交通事故处理流程',
    content: '发生交通事故后处理流程：1. 确保安全：开启危险报警闪光灯，在车后设置警告标志；2. 拍照取证：拍摄事故现场全景、车辆碰撞部位、车牌号码等；3. 人员伤亡：如有人员受伤，立即拨打120急救电话；4. 报警处理：拨打122报警电话，等待交警到场；5. 保险报案：及时向保险公司报案。对于轻微事故，双方无争议的，可自行协商处理。',
    category: 'accident',
    keywords: ['事故', '处理', '报警', '保险', '理赔'],
    relevance: 1,
  },
  {
    id: 'kb-005',
    title: '常见交通违法行为及处罚标准',
    content: '常见交通违法行为及处罚：1. 闯红灯：记6分，罚款200元；2. 超速20%-50%：记6分，罚款200元；3. 不系安全带：记2分，罚款50元；4. 违停：罚款200元，不记分；5. 酒驾：记12分，罚款1000-2000元，暂扣驾驶证6个月；6. 醉驾：吊销驾驶证，依法追究刑事责任，5年内不得重新取得驾驶证。',
    category: 'violation',
    keywords: ['违章', '处罚', '扣分', '罚款'],
    relevance: 1,
  },
  {
    id: 'kb-006',
    title: '驾驶证补换领业务',
    content: '驾驶证补领、换领业务：1. 线上办理：通过"交管12123"APP申请，邮寄送达；2. 线下办理：到车管所或各交通支大队窗口办理。所需材料：身份证、近期免冠白底彩照。补领费用：工本费10元。办理时限：1个工作日。注意：补领后原驾驶证作废，不得继续使用。',
    category: 'certificate',
    keywords: ['驾驶证', '补领', '换领', '12123'],
    relevance: 1,
  },
  {
    id: 'kb-007',
    title: '机动车年检规定',
    content: '机动车年检规定：1. 小型、微型非营运载客汽车：6年内免检，每2年申领检验合格标志；超过6年的，每年检验1次；超过15年的，每6个月检验1次；2. 营运载客汽车：5年内每年检验1次；超过5年的，每6个月检验1次；3. 摩托车：4年内每2年检验1次；超过4年的，每年检验1次。可提前3个月办理年检。',
    category: 'certificate',
    keywords: ['年检', '年审', '机动车', '检验'],
    relevance: 1,
  },
  {
    id: 'kb-008',
    title: '预约服务说明',
    content: '本平台提供多项业务预约服务：1. 进京证办理预约；2. 电动车登记预约；3. 违法处理预约；4. 事故处理预约；5. 证照办理预约。预约方式：通过APP或官网选择业务类型、时间和地点。取消预约：需提前1小时取消，否则影响预约信用。爽约3次将被暂停预约服务30天。',
    category: 'appointment',
    keywords: ['预约', '办理', '时间', '取消'],
    relevance: 1,
  },
  {
    id: 'kb-009',
    title: '限行规定说明',
    content: '北京市现行限行规定：1. 工作日尾号限行：7:00-20:00，五环路以内道路（不含五环路），按车牌尾号工作日高峰时段区域限行；2. 外地车限行：工作日7:00-9:00、17:00-20:00，五环路以内道路（含五环路）禁止通行；3. 尾号轮换：每3个月轮换一次。限行日开车进入限行区域，罚款100元，不记分。',
    category: 'permit',
    keywords: ['限行', '尾号', '外地车', '高峰'],
    relevance: 1,
  },
  {
    id: 'kb-010',
    title: '平台使用常见问题',
    content: '常见问题解答：1. 如何注册？点击"注册"按钮，填写手机号、身份证号等信息完成实名认证；2. 忘记密码？点击"忘记密码"，通过手机验证码重置；3. 如何修改个人信息？进入"个人中心"-"设置"-"修改资料"；4. 业务办理进度查询？进入"我的业务"查看各业务办理状态。如有其他问题，可拨打服务热线12123咨询。',
    category: 'consultation',
    keywords: ['注册', '密码', '修改', '咨询', '12123'],
    relevance: 1,
  },
]

export default class ChatbotService {
  private db: Database

  constructor(db: Database) {
    this.db = db
  }

  async ask(req: AskRequest): Promise<AskResponse> {
    if (!req.question.trim()) {
      throw new Error('问题不能为空')
    }

    const sourceDocs = this.queryArchive({
      query: req.question,
      limit: 3,
    })

    const answer = this.generateAnswer(req.question, sourceDocs)

    const relatedQuestions = this.generateRelatedQuestions(req.question, sourceDocs)

    this.saveChatHistory({
      userId: req.userId,
      sessionId: req.sessionId,
      question: req.question,
      answer,
      sourceDocs,
    })

    return {
      answer,
      sourceDocs,
      relatedQuestions,
    }
  }

  private generateAnswer(question: string, sourceDocs: ArchiveDocument[]): string {
    const lowerQuestion = question.toLowerCase()

    if (sourceDocs.length === 0) {
      return '抱歉，我暂时无法回答您的问题。您可以尝试：\n1. 换一种问法\n2. 查看常见问题\n3. 拨打服务热线12123咨询\n\n我可以为您解答关于进京证办理、电动车登记、交通违法处理、事故处理、证照办理、业务预约等方面的问题。'
    }

    let answer = `根据您的问题"${question}"，我为您整理了以下信息：\n\n`

    sourceDocs.forEach((doc, index) => {
      answer += `【${index + 1}】${doc.title}\n${doc.content}\n\n`
    })

    if (lowerQuestion.includes('怎么办') || lowerQuestion.includes('如何') || lowerQuestion.includes('怎么')) {
      answer += '如以上信息不够详细，您可以：\n'
      answer += '• 通过APP提交相关业务申请\n'
      answer += '• 预约线下窗口办理\n'
      answer += '• 拨打12123电话咨询\n'
    }

    if (lowerQuestion.includes('费用') || lowerQuestion.includes('多少钱') || lowerQuestion.includes('收费')) {
      answer += '\n温馨提示：本平台办理各项业务均不收取服务费，仅收取相关证照工本费。'
    }

    if (lowerQuestion.includes('时间') || lowerQuestion.includes('多久') || lowerQuestion.includes('什么时候')) {
      answer += '\n温馨提示：各项业务办理时间详见具体业务说明，建议提前预约以节省您的时间。'
    }

    return answer
  }

  private generateRelatedQuestions(question: string, sourceDocs: ArchiveDocument[]): string[] {
    const relatedQuestions: string[] = []
    const categories = new Set(sourceDocs.map(d => d.category))

    if (categories.has('permit')) {
      relatedQuestions.push('进京证如何续期？')
      relatedQuestions.push('进京证可以办理几次？')
    }

    if (categories.has('ebike')) {
      relatedQuestions.push('电动车上牌需要什么材料？')
      relatedQuestions.push('电动车可以代办上牌吗？')
    }

    if (categories.has('violation')) {
      relatedQuestions.push('如何查询违章记录？')
      relatedQuestions.push('违章多久能查到？')
    }

    if (categories.has('accident')) {
      relatedQuestions.push('交通事故责任如何划分？')
      relatedQuestions.push('事故理赔流程是怎样的？')
    }

    if (categories.has('certificate')) {
      relatedQuestions.push('驾驶证到期如何换证？')
      relatedQuestions.push('行驶证丢失怎么补办？')
    }

    if (categories.has('appointment')) {
      relatedQuestions.push('如何取消预约？')
      relatedQuestions.push('预约满了怎么办？')
    }

    if (relatedQuestions.length === 0) {
      relatedQuestions.push('如何注册账号？')
      relatedQuestions.push('如何修改个人信息？')
      relatedQuestions.push('忘记密码怎么办？')
    }

    return relatedQuestions.slice(0, 3)
  }

  queryArchive(req: QueryArchiveRequest): ArchiveDocument[] {
    const lowerQuery = req.query.toLowerCase()
    const queryWords = lowerQuery.split(/[\s,，。？?!！]+/).filter(w => w.length > 0)

    let docs = [...KNOWLEDGE_BASE]

    if (req.category) {
      docs = docs.filter(d => d.category === req.category)
    }

    const scoredDocs = docs.map(doc => {
      let score = 0

      for (const word of queryWords) {
        if (doc.title.toLowerCase().includes(word)) score += 5
        if (doc.content.toLowerCase().includes(word)) score += 2
        if (doc.keywords.some(k => k.toLowerCase().includes(word))) score += 3
      }

      if (lowerQuery.includes(doc.category)) score += 2

      return {
        ...doc,
        relevance: score,
      }
    }).filter(d => d.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, req.limit || 5)

    return scoredDocs
  }

  private saveChatHistory(data: {
    userId?: number
    sessionId: string
    question: string
    answer: string
    sourceDocs: ArchiveDocument[]
  }): void {
    this.db.prepare(`
      INSERT INTO chat_histories (
        user_id, session_id, question, answer, source_docs
      ) VALUES (?, ?, ?, ?, ?)
    `).run(
      data.userId || null,
      data.sessionId,
      data.question,
      data.answer,
      JSON.stringify(data.sourceDocs),
    )
  }

  getChatHistory(query: ChatHistoryQuery): ChatHistoryResult {
    const page = query.page || 1
    const pageSize = query.pageSize || 20
    const offset = (page - 1) * pageSize

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (query.userId !== undefined) {
      conditions.push('user_id = ?')
      params.push(query.userId)
    }

    if (query.sessionId) {
      conditions.push('session_id = ?')
      params.push(query.sessionId)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const countResult = this.db.prepare(`
      SELECT COUNT(*) as total FROM chat_histories ${whereClause}
    `).get(...params) as { total: number }

    const list = this.db.prepare(`
      SELECT * FROM chat_histories ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as ChatHistory[]

    return {
      list,
      total: countResult.total,
      page,
      pageSize,
    }
  }

  getChatSessions(userId: number): {
    sessionId: string
    lastQuestion: string
    lastTime: string
    messageCount: number
  }[] {
    const sessions = this.db.prepare(`
      SELECT 
        session_id,
        MAX(question) as last_question,
        MAX(created_at) as last_time,
        COUNT(*) as message_count
      FROM chat_histories 
      WHERE user_id = ?
      GROUP BY session_id
      ORDER BY last_time DESC
      LIMIT 20
    `).all(userId) as {
      session_id: string
      last_question: string
      last_time: string
      message_count: number
    }[]

    return sessions.map(s => ({
      sessionId: s.session_id,
      lastQuestion: s.last_question,
      lastTime: s.last_time,
      messageCount: s.message_count,
    }))
  }

  clearSessionHistory(userId: number, sessionId: string): boolean {
    this.db.prepare(`
      DELETE FROM chat_histories 
      WHERE user_id = ? AND session_id = ?
    `).run(userId, sessionId)

    return true
  }
}
