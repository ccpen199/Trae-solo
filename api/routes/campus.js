import { Router } from 'express'
import { db } from '../database.js'

const router = Router()

router.get('/schedule', (req, res) => {
  try {
    const schedules = db.prepare('SELECT * FROM campus_schedules ORDER BY event_date DESC').all()
    res.json(schedules)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/schedule', (req, res) => {
  try {
    const { university_name, event_type, event_date, location, contact_person, description, status } = req.body

    if (!university_name || !event_type || !event_date) {
      return res.status(400).json({ error: 'university_name, event_type, and event_date are required' })
    }

    const result = db.prepare(`
      INSERT INTO campus_schedules (university_name, event_type, event_date, location, contact_person, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(university_name, event_type, event_date, location || null, contact_person || null, description || null, status || 'planned')

    const schedule = db.prepare('SELECT * FROM campus_schedules WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(schedule)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/internships', (req, res) => {
  try {
    const internships = db.prepare(`
      SELECT i.*, ca.name AS candidate_name, j.title AS job_title
      FROM internships i
      LEFT JOIN candidates ca ON i.candidate_id = ca.id
      LEFT JOIN jobs j ON i.job_id = j.id
      ORDER BY i.created_at DESC
    `).all()
    res.json(internships)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/internships/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM internships WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Internship not found' })

    const { candidate_id, job_id, university, major, start_date, end_date,
      mentor_name, conversion_status, conversion_probability, performance_rating } = req.body

    db.prepare(`
      UPDATE internships SET candidate_id = ?, job_id = ?, university = ?, major = ?,
        start_date = ?, end_date = ?, mentor_name = ?, conversion_status = ?,
        conversion_probability = ?, performance_rating = ?
      WHERE id = ?
    `).run(
      candidate_id ?? existing.candidate_id, job_id ?? existing.job_id,
      university ?? existing.university, major ?? existing.major,
      start_date ?? existing.start_date, end_date ?? existing.end_date,
      mentor_name ?? existing.mentor_name, conversion_status ?? existing.conversion_status,
      conversion_probability ?? existing.conversion_probability,
      performance_rating ?? existing.performance_rating, req.params.id
    )

    const internship = db.prepare('SELECT * FROM internships WHERE id = ?').get(req.params.id)
    res.json(internship)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/ambassadors', (req, res) => {
  try {
    const ambassadors = db.prepare('SELECT * FROM ambassadors ORDER BY joined_at DESC').all()

    const result = ambassadors.map(a => {
      const tasks = db.prepare(
        'SELECT * FROM ambassador_tasks WHERE ambassador_id = ? ORDER BY created_at DESC'
      ).all(a.id)
      return { ...a, tasks }
    })

    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/ambassadors', (req, res) => {
  try {
    const { name, university, email, phone, status } = req.body

    if (!name || !university) {
      return res.status(400).json({ error: 'name and university are required' })
    }

    const result = db.prepare(`
      INSERT INTO ambassadors (name, university, email, phone, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, university, email || null, phone || null, status || 'active')

    const ambassador = db.prepare('SELECT * FROM ambassadors WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(ambassador)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/ambassador-tasks', (req, res) => {
  try {
    const { ambassador_id, task_type, task_title, description, deadline, reward_points, status } = req.body

    if (!ambassador_id || !task_type || !task_title) {
      return res.status(400).json({ error: 'ambassador_id, task_type, and task_title are required' })
    }

    const result = db.prepare(`
      INSERT INTO ambassador_tasks (ambassador_id, task_type, task_title, description, deadline, reward_points, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      ambassador_id, task_type, task_title, description || null,
      deadline || null, reward_points || 0, status || 'assigned'
    )

    const task = db.prepare('SELECT * FROM ambassador_tasks WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(task)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/schedule/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM campus_schedules WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Schedule not found' })
    const { status, attendees_count, resumes_received } = req.body
    db.prepare('UPDATE campus_schedules SET status = COALESCE(?, status), attendees_count = COALESCE(?, attendees_count), resumes_received = COALESCE(?, resumes_received) WHERE id = ?')
      .run(status ?? null, attendees_count ?? null, resumes_received ?? null, req.params.id)
    const schedule = db.prepare('SELECT * FROM campus_schedules WHERE id = ?').get(req.params.id)
    res.json(schedule)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/internships/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM internships WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Internship not found' })
    const { conversion_status, conversion_probability, performance_rating, mentor_feedback } = req.body
    db.prepare(`UPDATE internships SET conversion_status = COALESCE(?, conversion_status), conversion_probability = COALESCE(?, conversion_probability), performance_rating = COALESCE(?, performance_rating), mentor_feedback = COALESCE(?, mentor_feedback) WHERE id = ?`)
      .run(conversion_status ?? null, conversion_probability ?? null, performance_rating ?? null, mentor_feedback ?? null, req.params.id)
    const internship = db.prepare(`SELECT i.*, ca.name AS candidate_name, j.title AS job_title FROM internships i LEFT JOIN candidates ca ON i.candidate_id = ca.id LEFT JOIN jobs j ON i.job_id = j.id WHERE i.id = ?`).get(req.params.id)
    res.json(internship)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/ambassador-tasks/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM ambassador_tasks WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Task not found' })
    const { status, actual_points } = req.body
    db.prepare('UPDATE ambassador_tasks SET status = COALESCE(?, status), actual_points = COALESCE(?, actual_points) WHERE id = ?')
      .run(status ?? null, actual_points ?? null, req.params.id)
    const task = db.prepare('SELECT * FROM ambassador_tasks WHERE id = ?').get(req.params.id)
    res.json(task)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/dashboard', (req, res) => {
  try {
    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM campus_schedules').get().count
    const plannedEvents = db.prepare("SELECT COUNT(*) as count FROM campus_schedules WHERE status = 'planned'").get().count
    const ongoingEvents = db.prepare("SELECT COUNT(*) as count FROM campus_schedules WHERE status = 'ongoing'").get().count
    const completedEvents = db.prepare("SELECT COUNT(*) as count FROM campus_schedules WHERE status = 'completed'").get().count
    const totalAttendees = db.prepare('SELECT COALESCE(SUM(attendees_count), 0) as total FROM campus_schedules').get().total
    const totalResumes = db.prepare('SELECT COALESCE(SUM(resumes_received), 0) as total FROM campus_schedules').get().total
    const totalInterns = db.prepare('SELECT COUNT(*) as count FROM internships').get().count
    const convertedInterns = db.prepare("SELECT COUNT(*) as count FROM internships WHERE conversion_status = 'approved'").get().count
    const underReviewInterns = db.prepare("SELECT COUNT(*) as count FROM internships WHERE conversion_status = 'under_review'").get().count
    const avgConversion = db.prepare('SELECT AVG(conversion_probability) as avg FROM internships').get().avg || 0
    const activeAmbassadors = db.prepare("SELECT COUNT(*) as count FROM ambassadors WHERE status = 'active'").get().count
    const totalPoints = db.prepare('SELECT COALESCE(SUM(reward_points), 0) as total FROM ambassador_tasks WHERE status = ?').get('completed').total
    const totalTasks = db.prepare('SELECT COUNT(*) as count FROM ambassador_tasks').get().count
    const completedTasks = db.prepare("SELECT COUNT(*) as count FROM ambassador_tasks WHERE status = 'completed'").get().count
    const pendingTasks = db.prepare("SELECT COUNT(*) as count FROM ambassador_tasks WHERE status = 'pending' OR status = 'assigned'").get().count

    const totalEv = totalEvents || 1
    res.json({
      total_events: totalEvents,
      event_growth: 12,
      total_attendees: totalAttendees,
      attendee_growth: 8,
      total_resumes: totalResumes,
      resume_growth: 15,
      conversion_rate: Math.round(avgConversion * 100),
      conversion_growth: 5,
      planned_events: plannedEvents,
      planned_events_percent: Math.round(plannedEvents / totalEv * 100),
      ongoing_events: ongoingEvents,
      ongoing_events_percent: Math.round(ongoingEvents / totalEv * 100),
      completed_events: completedEvents,
      completed_events_percent: Math.round(completedEvents / totalEv * 100),
      total_interns: totalInterns,
      converted_interns: convertedInterns,
      under_review_interns: underReviewInterns,
      active_ambassadors: activeAmbassadors,
      total_points: totalPoints,
      overall_task_completion: totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0,
      pending_tasks: pendingTasks,
      completed_tasks: completedTasks,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
