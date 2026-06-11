import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'

const EMOTION_KEYWORDS: Record<string, string[]> = {
  anxiety: ['焦虑', '担心', '害怕'],
  depression: ['抑郁', '低落', '无力'],
  anger: ['愤怒', '烦躁', '生气'],
  calm: ['平静', '放松', '安心'],
  hope: ['希望', '期待', '向往'],
  fear: ['恐惧', '绝望'],
}

function analyzeText(text: string) {
  const emotionScores: Record<string, number> = {}
  const matchedKeywords: string[] = []

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    let count = 0
    for (const kw of keywords) {
      const regex = new RegExp(kw, 'g')
      const matches = text.match(regex)
      if (matches) {
        count += matches.length
        matchedKeywords.push(kw)
      }
    }
    emotionScores[emotion] = count
  }

  const totalHits = Object.values(emotionScores).reduce((a, b) => a + b, 0)
  const normalized: Record<string, number> = {}

  if (totalHits > 0) {
    const totalChars = Math.max(text.length, 1)
    const densityFactor = Math.min(totalHits / totalChars * 100, 1)

    for (const [emotion, score] of Object.entries(emotionScores)) {
      normalized[emotion] = Math.round((score / totalHits) * 100 * (0.5 + densityFactor * 0.5))
    }
  } else {
    normalized.calm = 60
    normalized.hope = 20
    normalized.anxiety = 10
    normalized.depression = 10
  }

  const riskLevel = determineVentRiskLevel(normalized, totalHits, text.length)

  return {
    emotion_clustering: normalized,
    risk_level: riskLevel,
    keywords: matchedKeywords,
  }
}

function determineVentRiskLevel(
  scores: Record<string, number>,
  totalHits: number,
  textLength: number,
): string {
  const negativeScore = (scores.depression ?? 0) + (scores.fear ?? 0) + (scores.anger ?? 0)
  const density = totalHits / Math.max(textLength, 1) * 100

  if (negativeScore >= 70 && density > 3) return 'critical'
  if (negativeScore >= 50 || density > 2) return 'high'
  if (negativeScore >= 30 || density > 1) return 'medium'
  return 'low'
}

export function analyzeVentText(profileId: string, content: string) {
  const result = analyzeText(content)

  const id = uuidv4()
  db.prepare(`
    INSERT INTO vent_records (id, profile_id, content, emotion_clustering, risk_level, keywords)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, profileId, content, JSON.stringify(result.emotion_clustering), result.risk_level, JSON.stringify(result.keywords))

  return {
    id,
    profile_id: profileId,
    content,
    emotion_clustering: result.emotion_clustering,
    risk_level: result.risk_level,
    keywords: result.keywords,
  }
}

export function getVentRecords(profileId: string) {
  const rows = db.prepare('SELECT * FROM vent_records WHERE profile_id = ? ORDER BY created_at DESC').all(profileId) as any[]
  return rows.map(row => ({
    ...row,
    emotion_clustering: JSON.parse(row.emotion_clustering),
    keywords: JSON.parse(row.keywords),
  }))
}
