import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

const serviceItems = [
  { title: '三甲医院预约挂号', category: '卫健', url: '/health' },
  { title: '公交地铁实时查询', category: '交通', url: '/transport' },
  { title: '文旅景区实名预约', category: '文旅', url: '/tourism' },
  { title: '社保卡申领', category: '社保', url: '/social-security' },
  { title: '居住证办理', category: '公安', url: '/police' },
  { title: '公积金查询', category: '住房', url: '/applications' },
  { title: '个人中心资料管理', category: '账号', url: '/profile' },
  { title: '管理后台服务治理', category: '后台', url: '/admin/services' },
]

router.get('/', (req: Request, res: Response): void => {
  const keyword = String(req.query.q || req.query.keyword || '').trim()
  const like = `%${keyword}%`

  const services = keyword
    ? serviceItems.filter((item) => `${item.title}${item.category}`.includes(keyword))
    : serviceItems

  const knowledge = keyword
    ? db.prepare(
      `SELECT id, title, category
       FROM knowledge_entries
       WHERE title LIKE ? OR content LIKE ? OR keywords LIKE ?
       ORDER BY id DESC
       LIMIT 8`,
    ).all(like, like, like)
    : []

  const fallbackServices = keyword && services.length === 0 && knowledge.length === 0
    ? serviceItems.slice(0, 6).map((item) => ({
      ...item,
      category: `${item.category}推荐`,
    }))
    : services

  res.json({
    code: 0,
    message: 'success',
    data: {
      keyword,
      services: fallbackServices,
      knowledge,
      total: fallbackServices.length + knowledge.length,
    },
  })
})

export default router
