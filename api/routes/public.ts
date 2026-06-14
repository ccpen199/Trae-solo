import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/overview', (_req: Request, res: Response): void => {
  const total_news = (db.prepare('SELECT COUNT(*) as count FROM news').get() as any).count
  const published_news = (db.prepare("SELECT COUNT(*) as count FROM news WHERE status = 'published'").get() as any).count
  const total_complaints = (db.prepare('SELECT COUNT(*) as count FROM complaints').get() as any).count
  const resolved_complaints = (db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status IN ('resolved','closed')").get() as any).count
  const total_services = (db.prepare('SELECT COUNT(*) as count FROM services').get() as any).count
  const total_pois = (db.prepare('SELECT COUNT(*) as count FROM pois').get() as any).count

  const latest_news = db.prepare("SELECT id, title, category, published_at FROM news WHERE status = 'published' ORDER BY published_at DESC LIMIT 5").all()
  const hot_services = db.prepare('SELECT id, name, bureau, category FROM services ORDER BY sort_order LIMIT 8').all()
  const complaint_by_status = db.prepare('SELECT status, COUNT(*) as count FROM complaints GROUP BY status').all()
  const recent_complaints = db.prepare("SELECT id, title, status, priority, assigned_department, created_at FROM complaints ORDER BY created_at DESC LIMIT 5").all()

  const hot_opinion = db.prepare('SELECT keyword, SUM(heat_value) as total_heat, MAX(sentiment) as sentiment FROM public_opinion GROUP BY keyword ORDER BY total_heat DESC LIMIT 5').all()
  const bureau_list = db.prepare('SELECT DISTINCT bureau FROM services ORDER BY bureau').all()

  const pending_reviews = (db.prepare("SELECT COUNT(*) as count FROM content_reviews WHERE result = 'pending'").get() as any).count

  res.json({
    success: true,
    data: {
      stats: { total_news, published_news, total_complaints, resolved_complaints, total_services, total_pois, pending_reviews },
      latest_news,
      hot_services,
      complaint_by_status,
      recent_complaints,
      hot_opinion,
      bureau_list,
    },
  })
})

router.get('/roles', (_req: Request, res: Response): void => {
  const roles = [
    {
      role: 'admin',
      label: '超级管理员',
      workspace: '超级管理员工作台',
      workspace_path: '/',
      description: '全平台数据概览、系统管理、督办考核',
      capabilities: [
        { module: '数据概览', desc: '查看全平台运营数据、督办看板', path: '/' },
        { module: '新闻资讯', desc: '新闻采编、审核、发布全流程管理', path: '/news' },
        { module: '便民服务', desc: '23个委办局服务事项管理', path: '/services' },
        { module: '市民问政', desc: '诉求派单、督办、满意度回访', path: '/complaints' },
        { module: '视听创作', desc: '视频/直播管理、AI字幕生成', path: '/media' },
        { module: '本地生活', desc: 'POI管理、商家资质核验', path: '/poi' },
        { module: '内容审核', desc: '图文/音视频多模态安全审核', path: '/review' },
        { module: '舆情监测', desc: '区域热力图、风险分级', path: '/opinion' },
        { module: '信用积分', desc: '创作者信用积分管理', path: '/credits' },
      ],
    },
    {
      role: 'editor',
      label: '编审人员',
      workspace: '编审工作台',
      workspace_path: '/news',
      description: '新闻采编审核、内容发布、视听创作',
      capabilities: [
        { module: '数据概览', desc: '查看采编数据概览', path: '/' },
        { module: '新闻资讯', desc: '新闻采编、审核、发布', path: '/news' },
        { module: '便民服务', desc: '服务事项查看', path: '/services' },
        { module: '市民问政', desc: '查看诉求处理情况', path: '/complaints' },
        { module: '视听创作', desc: '视频/直播管理', path: '/media' },
        { module: '本地生活', desc: 'POI信息查看', path: '/poi' },
        { module: '内容审核', desc: '内容安全审核', path: '/review' },
        { module: '舆情监测', desc: '舆情数据查看', path: '/opinion' },
      ],
    },
    {
      role: 'user',
      label: '市民用户',
      workspace: '市民服务工作台',
      workspace_path: '/complaints',
      description: '诉求提交、办事预约、满意度评价',
      capabilities: [
        { module: '数据概览', desc: '查看公开服务数据', path: '/' },
        { module: '便民服务', desc: '在线办事预约', path: '/services' },
        { module: '市民问政', desc: '提交诉求、查看办理进度', path: '/complaints' },
        { module: '本地生活', desc: '查看POI信息、消费评价', path: '/poi' },
      ],
    },
  ]

  res.json({ success: true, data: roles })
})

export default router
