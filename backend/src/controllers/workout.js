const { runAsync, getAsync, allAsync } = require('../database')

async function createWorkout(req, res) {
  try {
    const { type, distance, duration, calories, pace, route_data, start_time, end_time } = req.body
    const userId = req.user.id
    
    if (!type) {
      return res.error('运动类型不能为空')
    }
    
    const result = await runAsync(
      'INSERT INTO workouts (user_id, type, distance, duration, calories, pace, route_data, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, type, distance || 0, duration || 0, calories || 0, pace || null, route_data || null, start_time || new Date().toISOString(), end_time || new Date().toISOString()]
    )
    
    await runAsync(
      'UPDATE users SET total_duration = total_duration + ?, calories = calories + ? WHERE id = ?',
      [duration || 0, calories || 0, userId]
    )
    
    const workout = await getAsync('SELECT * FROM workouts WHERE id = ?', [result.lastID])
    res.success({ workout }, '运动记录已保存')
  } catch (err) {
    res.error('保存失败: ' + err.message)
  }
}

async function getWorkoutList(req, res) {
  try {
    const userId = req.user.id
    const { type } = req.query
    
    let sql = 'SELECT * FROM workouts WHERE user_id = ?'
    let params = [userId]
    
    if (type) {
      sql += ' AND type = ?'
      params.push(type)
    }
    
    sql += ' ORDER BY created_at DESC LIMIT 50'
    
    const workouts = await allAsync(sql, params)
    res.success({ workouts })
  } catch (err) {
    res.error('获取失败: ' + err.message)
  }
}

async function getWorkoutStats(req, res) {
  try {
    const userId = req.user.id
    
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    const weekStats = await getAsync(
      'SELECT SUM(duration) as week_duration, SUM(calories) as week_calories, SUM(distance) as week_distance FROM workouts WHERE user_id = ? AND created_at >= ?',
      [userId, weekStart.toISOString()]
    )
    
    const totalStats = await getAsync(
      'SELECT SUM(duration) as total_duration, SUM(calories) as total_calories, COUNT(*) as workout_count FROM workouts WHERE user_id = ?',
      [userId]
    )
    
    res.success({
      week_duration: weekStats?.week_duration || 0,
      week_calories: weekStats?.week_calories || 0,
      week_distance: weekStats?.week_distance || 0,
      total_duration: totalStats?.total_duration || 0,
      total_calories: totalStats?.total_calories || 0,
      workout_count: totalStats?.workout_count || 0
    })
  } catch (err) {
    res.error('获取失败: ' + err.message)
  }
}

module.exports = { createWorkout, getWorkoutList, getWorkoutStats }
