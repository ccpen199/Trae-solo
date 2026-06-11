import { Router, type Request, type Response } from 'express'
import { ApiResponse, LunarCalendar } from '../../shared/types'
import { getLunarCalendar, getLunarCalendarWithHealth } from '../services/lunarCalendar'
import { userDB, anniversaryDB } from '../db/index'

const router = Router()

router.get('/today', async (req: Request, res: Response<ApiResponse<LunarCalendar>>): Promise<void> => {
  try {
    const { userId } = req.query
    const calendar = getLunarCalendar(new Date(), userId as string)

    res.json({
      success: true,
      data: calendar
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取今日黄历失败'
    })
  }
})

router.get('/date/:date', async (req: Request, res: Response<ApiResponse<LunarCalendar>>): Promise<void> => {
  try {
    const { date } = req.params
    const { userId } = req.query

    const targetDate = new Date(date)
    if (isNaN(targetDate.getTime())) {
      res.status(400).json({
        success: false,
        error: '日期格式错误，请使用 YYYY-MM-DD 格式'
      })
      return
    }

    const calendar = getLunarCalendar(targetDate, userId as string)

    res.json({
      success: true,
      data: calendar
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取黄历信息失败'
    })
  }
})

router.get('/personalized/:userId', async (req: Request, res: Response<ApiResponse<LunarCalendar>>): Promise<void> => {
  try {
    const { userId } = req.params
    const { date } = req.query

    const user = userDB.findById(userId)
    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在'
      })
      return
    }

    const targetDate = date ? new Date(date as string) : new Date()
    const calendar = getLunarCalendarWithHealth(targetDate, user.chronicDiseases)

    const anniversaries = anniversaryDB.findByUserId(userId)
    calendar.anniversaries = anniversaries

    res.json({
      success: true,
      data: calendar
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取个性化黄历失败'
    })
  }
})

router.get('/month/:year/:month', async (req: Request, res: Response<ApiResponse<LunarCalendar[]>>): Promise<void> => {
  try {
    const { year, month } = req.params
    const { userId } = req.query

    const y = parseInt(year)
    const m = parseInt(month) - 1

    if (isNaN(y) || isNaN(m) || m < 0 || m > 11) {
      res.status(400).json({
        success: false,
        error: '年月参数错误'
      })
      return
    }

    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const calendars: LunarCalendar[] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(y, m, day)
      calendars.push(getLunarCalendar(date, userId as string))
    }

    res.json({
      success: true,
      data: calendars
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取月历数据失败'
    })
  }
})

export default router
