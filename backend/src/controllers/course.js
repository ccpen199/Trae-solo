const { runAsync, getAsync, allAsync } = require('../database')

async function getCourseList(req, res) {
  try {
    const { type, category, keyword } = req.query
    
    let sql = 'SELECT * FROM courses WHERE 1=1'
    let params = []
    
    if (type === 'recommended') {
      sql += ' AND is_recommended = 1'
    } else if (type === 'new') {
      sql += ' AND is_new = 1'
    }
    
    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }
    
    if (keyword) {
      sql += ' AND (title LIKE ? OR description LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    
    sql += ' ORDER BY created_at DESC LIMIT 50'
    
    const courses = await allAsync(sql, params)
    res.success({ courses })
  } catch (err) {
    res.error('获取失败: ' + err.message)
  }
}

async function getCourseDetail(req, res) {
  try {
    const { id } = req.params
    
    const course = await getAsync('SELECT * FROM courses WHERE id = ?', [id])
    if (!course) {
      return res.error('课程不存在', 404)
    }
    
    const actions = await allAsync('SELECT * FROM course_actions WHERE course_id = ? ORDER BY sort_order ASC', [id])
    course.actions = actions
    
    if (req.user) {
      const userCourse = await getAsync(
        'SELECT * FROM user_courses WHERE user_id = ? AND course_id = ?',
        [req.user.id, id]
      )
      course.user_progress = userCourse?.progress || 0
    }
    
    res.success({ course })
  } catch (err) {
    res.error('获取失败: ' + err.message)
  }
}

async function getHomeData(req, res) {
  try {
    const userId = req.user.id
    
    const recommended = await allAsync('SELECT * FROM courses WHERE is_recommended = 1 LIMIT 4')
    const newCourses = await allAsync('SELECT * FROM courses WHERE is_new = 1 LIMIT 4')
    const myCourses = await allAsync(
      'SELECT c.*, uc.progress, uc.last_study_at FROM courses c JOIN user_courses uc ON c.id = uc.course_id WHERE uc.user_id = ? ORDER BY uc.last_study_at DESC LIMIT 4',
      [userId]
    )
    
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    const weekStats = await getAsync(
      'SELECT SUM(duration) as week_duration, SUM(calories) as week_calories FROM workouts WHERE user_id = ? AND created_at >= ?',
      [userId, weekStart.toISOString()]
    )
    
    const friends = [
      { nickname: '健身达人', avatar: '🏃', week_duration: 320 },
      { nickname: '运动小王', avatar: '💪', week_duration: 280 },
      { nickname: '瑜伽女神', avatar: '🧘', week_duration: 240 },
      { nickname: req.user.nickname, avatar: req.user.avatar || '👤', week_duration: weekStats?.week_duration || 0, isMe: true }
    ].sort((a, b) => b.week_duration - a.week_duration)
    
    res.success({
      recommended,
      newCourses,
      myCourses,
      week_duration: weekStats?.week_duration || 0,
      week_calories: weekStats?.week_calories || 0,
      total_duration: req.user.total_duration || 0,
      step_count: req.user.step_count || 0,
      calories: req.user.calories || 0,
      friends_rank: friends
    })
  } catch (err) {
    res.error('获取失败: ' + err.message)
  }
}

async function updateCourseProgress(req, res) {
  try {
    const userId = req.user.id
    const { courseId, progress } = req.body
    
    await runAsync(
      'INSERT OR REPLACE INTO user_courses (user_id, course_id, progress, last_study_at) VALUES (?, ?, ?, ?)',
      [userId, courseId, progress, new Date().toISOString()]
    )
    
    res.success(null, '进度已更新')
  } catch (err) {
    res.error('更新失败: ' + err.message)
  }
}

module.exports = { getCourseList, getCourseDetail, getHomeData, updateCourseProgress }
