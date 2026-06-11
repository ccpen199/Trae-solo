import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'

export interface CreateProfileData {
  anonymous_name: string
  phq9_score?: number
  gad7_score?: number
  life_event_tags?: string[]
  counseling_goals?: string
  risk_level?: string
}

export function createProfile(data: CreateProfileData) {
  const id = uuidv4()
  const tags = data.life_event_tags ?? []
  const riskLevel = data.risk_level ?? determineRiskLevel(data.phq9_score ?? 0, data.gad7_score ?? 0)

  db.prepare(`
    INSERT INTO profiles (id, anonymous_name, phq9_score, gad7_score, life_event_tags, counseling_goals, risk_level)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.anonymous_name, data.phq9_score ?? 0, data.gad7_score ?? 0, JSON.stringify(tags), data.counseling_goals ?? '', riskLevel)

  return getProfile(id)
}

export function getProfile(id: string) {
  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as any
  if (!row) return null
  return {
    ...row,
    life_event_tags: JSON.parse(row.life_event_tags),
  }
}

export function updateProfile(id: string, data: Partial<CreateProfileData>) {
  const existing = getProfile(id)
  if (!existing) return null

  const phq9 = data.phq9_score ?? existing.phq9_score
  const gad7 = data.gad7_score ?? existing.gad7_score
  const riskLevel = data.risk_level ?? determineRiskLevel(phq9, gad7)
  const tags = data.life_event_tags ?? existing.life_event_tags

  db.prepare(`
    UPDATE profiles SET phq9_score = ?, gad7_score = ?, life_event_tags = ?, counseling_goals = ?, risk_level = ?
    WHERE id = ?
  `).run(phq9, gad7, JSON.stringify(tags), data.counseling_goals ?? existing.counseling_goals, riskLevel, id)

  return getProfile(id)
}

export function deleteProfile(id: string) {
  return db.prepare('DELETE FROM profiles WHERE id = ?').run(id).changes > 0
}

function determineRiskLevel(phq9: number, gad7: number): string {
  const maxScore = Math.max(phq9, gad7)
  if (maxScore >= 20) return 'critical'
  if (maxScore >= 15) return 'high'
  if (maxScore >= 10) return 'medium'
  return 'low'
}
