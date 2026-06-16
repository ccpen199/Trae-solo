import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../database.js'
import { optionalAuth, authenticateToken } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import type { CommunityPost, LostPetTask, LostPetClue } from '@shared/types'

const router = Router()

function rowToPost(row: any): CommunityPost {
  return {
    id: row.id,
    ownerId: row.owner_id,
    petId: row.pet_id,
    content: row.content,
    images: JSON.parse(row.images || '[]'),
    tags: JSON.parse(row.tags || '[]'),
    vaccineTag: row.vaccine_tag,
    dewormingTag: row.deworming_tag,
    likes: row.likes,
    comments: row.comments,
    createdAt: row.created_at,
  }
}

function rowToTask(row: any, db: any): LostPetTask {
  const clueRows = db.prepare('SELECT * FROM lost_pet_clues WHERE task_id = ?').all(row.id) as any[]
  const intentRows = db.prepare('SELECT * FROM adoption_intents WHERE task_id = ?').all(row.id) as any[]

  const clues: LostPetClue[] = clueRows.map((c: any) => ({
    id: c.id,
    taskId: c.task_id,
    reporterId: c.reporter_id,
    content: c.content,
    locationLat: c.location_lat,
    locationLng: c.location_lng,
    verified: c.verified === 1,
    createdAt: c.created_at,
  }))

  const adoptionIntents = intentRows.map((i: any) => ({
    id: i.id,
    taskId: i.task_id,
    applicantId: i.applicant_id,
    message: i.message,
    level: i.level,
    createdAt: i.created_at,
  }))

  return {
    id: row.id,
    ownerId: row.owner_id,
    petName: row.pet_name,
    species: row.species,
    description: row.description,
    lastSeenLocation: {
      lat: row.last_seen_lat,
      lng: row.last_seen_lng,
      address: row.last_seen_address,
    },
    lastSeenTime: row.last_seen_time,
    reward: row.reward,
    status: row.status,
    clues,
    adoptionIntents,
    createdAt: row.created_at,
  }
}

router.get('/posts', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const { tag } = req.query as any

    let sql = 'SELECT * FROM community_posts WHERE 1=1'
    const params: any[] = []

    if (tag) {
      sql += ' AND tags LIKE ?'
      params.push(`%${tag}%`)
    }

    sql += ' ORDER BY created_at DESC'

    const rows = db.prepare(sql).all(...params) as any[]
    const posts = rows.map(rowToPost)

    res.json({
      success: true,
      data: posts,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取帖子列表失败',
    })
  }
})

router.post('/posts', authenticateToken, requireRole('owner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, images, tags, petId, vaccineTag, dewormingTag } = req.body
    const db = getDatabase()

    if (!content) {
      res.status(400).json({
        success: false,
        error: '帖子内容不能为空',
      })
      return
    }

    const id = uuidv4()
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')

    db.prepare(
      'INSERT INTO community_posts (id, owner_id, pet_id, content, images, tags, vaccine_tag, deworming_tag, likes, comments, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)'
    ).run(
      id,
      req.user!.id,
      petId || null,
      content,
      JSON.stringify(images || []),
      JSON.stringify(tags || []),
      vaccineTag || null,
      dewormingTag || null,
      createdAt
    )

    const row = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(id) as any
    const post = rowToPost(row)

    res.json({
      success: true,
      data: post,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '发布帖子失败',
    })
  }
})

router.get('/lost-pets', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const { status } = req.query as any

    let sql = 'SELECT * FROM lost_pet_tasks WHERE 1=1'
    const params: any[] = []

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    sql += ' ORDER BY created_at DESC'

    const rows = db.prepare(sql).all(...params) as any[]
    const tasks = rows.map((row) => rowToTask(row, db))

    res.json({
      success: true,
      data: tasks,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取寻宠列表失败',
    })
  }
})

router.post('/lost-pets', authenticateToken, requireRole('owner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { petName, species, description, lastSeenLat, lastSeenLng, lastSeenAddress, lastSeenTime, reward } = req.body
    const db = getDatabase()

    if (!petName || !species || !description || !lastSeenLat || !lastSeenLng || !lastSeenTime) {
      res.status(400).json({
        success: false,
        error: '请填写完整的寻宠信息',
      })
      return
    }

    const id = uuidv4()
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')

    db.prepare(
      'INSERT INTO lost_pet_tasks (id, owner_id, pet_name, species, description, last_seen_lat, last_seen_lng, last_seen_address, last_seen_time, reward, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      req.user!.id,
      petName,
      species,
      description,
      lastSeenLat,
      lastSeenLng,
      lastSeenAddress || null,
      lastSeenTime,
      reward || 0,
      'searching',
      createdAt
    )

    const row = db.prepare('SELECT * FROM lost_pet_tasks WHERE id = ?').get(id) as any
    const task = rowToTask(row, db)

    res.json({
      success: true,
      data: task,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '发布寻宠信息失败',
    })
  }
})

router.post('/lost-pets/:id/clues', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const task = db.prepare('SELECT * FROM lost_pet_tasks WHERE id = ?').get(req.params.id) as any

    if (!task) {
      res.status(404).json({
        success: false,
        error: '寻宠任务不存在',
      })
      return
    }

    const { content, locationLat, locationLng } = req.body

    if (!content) {
      res.status(400).json({
        success: false,
        error: '线索内容不能为空',
      })
      return
    }

    const id = uuidv4()
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')

    db.prepare(
      'INSERT INTO lost_pet_clues (id, task_id, reporter_id, content, location_lat, location_lng, verified, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)'
    ).run(id, req.params.id, req.user!.id, content, locationLat || null, locationLng || null, createdAt)

    const row = db.prepare('SELECT * FROM lost_pet_clues WHERE id = ?').get(id) as any
    const clue: LostPetClue = {
      id: row.id,
      taskId: row.task_id,
      reporterId: row.reporter_id,
      content: row.content,
      locationLat: row.location_lat,
      locationLng: row.location_lng,
      verified: row.verified === 1,
      createdAt: row.created_at,
    }

    res.json({
      success: true,
      data: clue,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '提交线索失败',
    })
  }
})

export default router
