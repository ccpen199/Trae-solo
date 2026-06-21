import { Router, type Request, type Response } from 'express'
import { tournaments, liveStreams, teams } from '../data/mockData.js'

const router = Router()

router.get('/tournaments', async (req: Request, res: Response): Promise<void> => {
  const status = req.query.status as string
  const game = req.query.game as string
  let filteredTournaments = tournaments

  if (status) {
    filteredTournaments = filteredTournaments.filter((t) => t.status === status)
  }
  if (game) {
    filteredTournaments = filteredTournaments.filter((t) => t.game === game)
  }

  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedTournaments = filteredTournaments.slice(start, end)

  res.json({
    success: true,
    data: {
      list: paginatedTournaments,
      total: filteredTournaments.length,
      page,
      pageSize,
    },
    message: '获取赛事列表成功',
  })
})

router.get('/live-streams', async (req: Request, res: Response): Promise<void> => {
  const status = req.query.status as string
  let filteredStreams = liveStreams

  if (status) {
    filteredStreams = filteredStreams.filter((stream) => stream.status === status)
  }

  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedStreams = filteredStreams.slice(start, end)

  res.json({
    success: true,
    data: {
      list: paginatedStreams,
      total: filteredStreams.length,
      page,
      pageSize,
    },
    message: '获取直播列表成功',
  })
})

router.get('/teams', async (req: Request, res: Response): Promise<void> => {
  const game = req.query.game as string
  const status = req.query.status as string
  let filteredTeams = teams

  if (game) {
    filteredTeams = filteredTeams.filter((team) => team.game === game)
  }
  if (status) {
    filteredTeams = filteredTeams.filter((team) => team.status === status)
  }

  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedTeams = filteredTeams.slice(start, end)

  res.json({
    success: true,
    data: {
      list: paginatedTeams,
      total: filteredTeams.length,
      page,
      pageSize,
    },
    message: '获取战队列表成功',
  })
})

export default router
