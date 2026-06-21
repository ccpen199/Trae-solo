import { Router, type Request, type Response } from 'express'
import { members, memberLevels } from '../data/mockData.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const level = req.query.level as string
  const keyword = req.query.keyword as string
  let filteredMembers = members

  if (level) {
    filteredMembers = filteredMembers.filter((member) => member.level === parseInt(level))
  }
  if (keyword) {
    filteredMembers = filteredMembers.filter(
      (member) =>
        member.name.includes(keyword) ||
        member.phone.includes(keyword),
    )
  }

  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedMembers = filteredMembers.slice(start, end)

  res.json({
    success: true,
    data: {
      list: paginatedMembers,
      total: filteredMembers.length,
      page,
      pageSize,
    },
    message: '获取会员列表成功',
  })
})

router.get('/levels', async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: memberLevels,
    message: '获取会员等级列表成功',
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const member = members.find((m) => m.id === id)

  if (!member) {
    res.status(404).json({
      success: false,
      data: null,
      message: '会员不存在',
    })
    return
  }

  res.json({
    success: true,
    data: member,
    message: '获取会员详情成功',
  })
})

export default router
