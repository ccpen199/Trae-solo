import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

function buildDashboard() {
  const db = getDb()
  const communities = (db.prepare('SELECT COUNT(*) as cnt FROM communities').get() as any).cnt
  const properties = (db.prepare("SELECT COUNT(*) as cnt FROM properties WHERE status = 'active'").get() as any).cnt
  const agents = (db.prepare('SELECT COUNT(*) as cnt FROM agents').get() as any).cnt
  const cards = (db.prepare('SELECT COUNT(*) as cnt FROM ai_property_cards').get() as any).cnt
  const verifications = (db.prepare('SELECT COUNT(*) as cnt FROM property_verifications').get() as any).cnt

  return {
    summary: {
      communities,
      properties,
      agents,
      cards,
      verifications,
    },
    modules: [
      { name: '小区管理', owner: '社区运营组', count: communities, status: '价格与带看数据已同步' },
      { name: '房源管理', owner: '房源核验组', count: properties, status: 'VR/实勘/价格趋势待复核' },
      { name: '经纪人管理', owner: '门店督导组', count: agents, status: '认证与服务评分正常' },
      { name: 'AI房卡', owner: '增长运营组', count: cards, status: '筛选条件和推送记录正常' },
      { name: '房源核验流水线', owner: '核验专员', count: verifications, status: '核验任务可追踪' },
    ],
  }
}

router.get('/stats', (_req: Request, res: Response): void => {
  res.json({ success: true, data: buildDashboard().summary })
})

router.get('/dashboard', (_req: Request, res: Response): void => {
  res.json({ success: true, data: buildDashboard() })
})

export default router
