import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'

export function getEmotionTrend(profileId: string, rangeDays: number = 30) {
  const rows = db.prepare(`
    SELECT * FROM emotion_trends
    WHERE profile_id = ?
    AND record_date >= date('now', '-' || ? || ' days')
    ORDER BY record_date ASC
  `).all(profileId, rangeDays) as any[]

  if (rows.length > 0) return rows

  return generateMockTrend(profileId, rangeDays)
}

export function addEmotionRecord(profileId: string, phq9: number, gad7: number, dominantEmotion: string) {
  const id = uuidv4()
  const recordDate = new Date().toISOString().slice(0, 10)

  db.prepare(`
    INSERT OR REPLACE INTO emotion_trends (id, profile_id, record_date, phq9_score, gad7_score, dominant_emotion)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, profileId, recordDate, phq9, gad7, dominantEmotion)

  return { id, profile_id: profileId, record_date: recordDate, phq9_score: phq9, gad7_score: gad7, dominant_emotion: dominantEmotion }
}

function generateMockTrend(profileId: string, days: number) {
  const emotions = ['anxiety', 'depression', 'anger', 'calm', 'hope', 'fear']
  const records: any[] = []
  const transaction = db.transaction(() => {
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().slice(0, 10)

      const phq9 = Math.max(0, Math.min(27, Math.round(10 + Math.sin(i / 5) * 5 + Math.random() * 4)))
      const gad7 = Math.max(0, Math.min(21, Math.round(8 + Math.cos(i / 4) * 4 + Math.random() * 3)))

      const dominant = emotions[Math.floor(Math.random() * emotions.length)]

      const id = uuidv4()
      db.prepare(`
        INSERT INTO emotion_trends (id, profile_id, record_date, phq9_score, gad7_score, dominant_emotion)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, profileId, dateStr, phq9, gad7, dominant)

      records.push({ id, profile_id: profileId, record_date: dateStr, phq9_score: phq9, gad7_score: gad7, dominant_emotion: dominant })
    }
  })

  transaction()
  return records
}
