import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import db from './database.js'
import authRoutes from './routes/auth.js'
import jobsRoutes from './routes/jobs.js'
import resumesRoutes from './routes/resumes.js'
import applicationsRoutes from './routes/applications.js'
import messagesRoutes from './routes/messages.js'
import communityRoutes from './routes/community.js'
import adminRoutes from './routes/admin.js'

dotenv.config({ quiet: true })

const app: express.Application = express()

app.use(cors({
  origin: ['http://127.0.0.1:49180', 'http://localhost:49180'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/users', authRoutes)
app.use('/api/user', authRoutes)
app.use('/api/jobs', jobsRoutes)
app.use('/api/resumes', resumesRoutes)
app.use('/api/applications', applicationsRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/admin', adminRoutes)

app.get('/api/search', (req: Request, res: Response): void => {
  const keyword = String(req.query.q || req.query.keyword || '').trim()
  const like = `%${keyword}%`

  const jobs = db.prepare(`
    SELECT j.id, j.title, j.department, j.required_title, j.location, j.salary_min, j.salary_max,
           j.status, ip.institution_name
    FROM jobs j
    JOIN institution_profiles ip ON j.institution_id = ip.id
    WHERE ? = ''
       OR j.title LIKE ?
       OR j.department LIKE ?
       OR j.required_title LIKE ?
       OR j.location LIKE ?
       OR ip.institution_name LIKE ?
    ORDER BY j.status = 'active' DESC, j.created_at DESC
    LIMIT 8
  `).all(keyword, like, like, like, like, like) as any[]

  const posts = db.prepare(`
    SELECT cp.id, cp.title, cp.category, cp.tags, cp.likes, cp.comments, u.name as author_name
    FROM community_posts cp
    JOIN users u ON cp.author_id = u.id
    WHERE ? = ''
       OR cp.title LIKE ?
       OR cp.content LIKE ?
       OR cp.tags LIKE ?
       OR cp.category LIKE ?
    ORDER BY cp.created_at DESC
    LIMIT 6
  `).all(keyword, like, like, like, like) as any[]

  const institutions = db.prepare(`
    SELECT id, institution_name, institution_type, review_status, verified_level, location
    FROM institution_profiles
    WHERE ? = ''
       OR institution_name LIKE ?
       OR institution_type LIKE ?
       OR location LIKE ?
    ORDER BY verified_level DESC, id ASC
    LIMIT 6
  `).all(keyword, like, like, like) as any[]

  res.json({
    success: true,
    data: {
      keyword,
      total: jobs.length + posts.length + institutions.length,
      items: [
        ...jobs.map((item) => ({ type: 'job', name: item.title, ...item })),
        ...posts.map((item) => ({ type: 'post', name: item.title, ...item })),
        ...institutions.map((item) => ({ type: 'institution', name: item.institution_name, ...item })),
      ],
      groups: { jobs, posts, institutions },
    },
  })
})

app.get('/api/admin/stats', (_req: Request, res: Response): void => {
  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count
  const totalTalents = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'talent'").get() as any).count
  const totalInstitutions = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'institution'").get() as any).count
  const totalJobs = (db.prepare('SELECT COUNT(*) as count FROM jobs').get() as any).count
  const activeJobs = (db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'active'").get() as any).count
  const pendingJobs = (db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'pending'").get() as any).count
  const totalApplications = (db.prepare('SELECT COUNT(*) as count FROM applications').get() as any).count
  const totalPosts = (db.prepare('SELECT COUNT(*) as count FROM community_posts').get() as any).count

  const applicationStatus = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM applications
    GROUP BY status
    ORDER BY count DESC
  `).all()

  const departments = db.prepare(`
    SELECT department, COUNT(*) as count
    FROM jobs
    GROUP BY department
    ORDER BY count DESC
    LIMIT 8
  `).all()

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalTalents,
        totalInstitutions,
        totalJobs,
        activeJobs,
        pendingJobs,
        totalApplications,
        totalPosts,
      },
      modules: ['职位审核', '机构资质', '人才简历', '社区内容', '数据脱敏'],
      distributions: {
        applicationStatus,
        departments,
      },
    },
  })
})

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
