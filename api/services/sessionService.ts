import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'

export function createSession(profileId: string, counselorId: string, scheduledAt: string, duration: number = 50) {
  const id = uuidv4()

  db.prepare(`
    INSERT INTO sessions (id, profile_id, counselor_id, scheduled_at, duration)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, profileId, counselorId, scheduledAt, duration)

  db.prepare(`
    UPDATE counselors SET session_count = session_count + 1 WHERE id = ?
  `).run(counselorId)

  return getSession(id)
}

export function getSession(id: string) {
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id)
}

export function getSessionHistory(profileId: string) {
  const rows = db.prepare(`
    SELECT s.*, c.anonymous_name as counselor_name, c.expertise_tags as counselor_tags
    FROM sessions s
    JOIN counselors c ON s.counselor_id = c.id
    WHERE s.profile_id = ?
    ORDER BY s.scheduled_at DESC
  `).all(profileId) as any[]

  return rows.map(row => ({
    ...row,
    counselor_tags: JSON.parse(row.counselor_tags),
  }))
}

export function updateSessionStatus(id: string, status: string) {
  db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run(status, id)
  return getSession(id)
}

export function generateSummary(sessionId: string) {
  const session = getSession(sessionId) as any
  if (!session) return null

  const emotionStates = ['焦虑', '低落', '平静', '愤怒', '希望', '恐惧']
  const coreIssuesOptions = [
    ['人际关系冲突', '自我认同困惑'],
    ['工作压力过大', '情绪调节困难'],
    ['学业焦虑', '社交退缩'],
    ['家庭沟通障碍', '自我价值感低'],
    ['亲密关系问题', '情绪波动'],
  ]
  const suggestedActionsOptions = [
    ['每日正念练习10分钟', '记录情绪日记', '尝试与信任的人沟通'],
    ['规律作息调整', '渐进式肌肉放松训练', '设定小目标积累成就感'],
    ['社交场景逐步暴露练习', '认知重构练习', '寻求支持网络'],
  ]
  const nextFocusOptions = [
    '探索情绪触发因素',
    '建立自我关怀习惯',
    '改善沟通模式',
    '提升情绪调节能力',
    '增强社交支持系统',
  ]

  const randPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  const summaryId = uuidv4()
  const emotionState = randPick(emotionStates)
  const coreIssues = randPick(coreIssuesOptions)
  const suggestedActions = randPick(suggestedActionsOptions)
  const nextFocus = randPick(nextFocusOptions)

  db.prepare(`
    INSERT INTO session_summaries (id, session_id, emotion_state, core_issues, suggested_actions, next_focus)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(summaryId, sessionId, emotionState, JSON.stringify(coreIssues), JSON.stringify(suggestedActions), nextFocus)

  return {
    id: summaryId,
    session_id: sessionId,
    emotion_state: emotionState,
    core_issues: coreIssues,
    suggested_actions: suggestedActions,
    next_focus: nextFocus,
  }
}
