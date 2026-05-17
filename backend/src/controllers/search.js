const { runAsync, getAsync, allAsync } = require('../database')

const hotKeywords = ['HIIT', '腹肌', '减脂', '瑜伽', '跑步', '深蹲', '平板支撑', '马甲线']

async function search(req, res) {
  try {
    const { keyword, category = 'course' } = req.query
    const userId = req.user.id
    
    if (!keyword) {
      return res.success({ results: [], hotKeywords })
    }
    
    if (keyword.trim()) {
      const existing = await getAsync(
        'SELECT id FROM search_history WHERE user_id = ? AND keyword = ?',
        [userId, keyword]
      )
      
      if (existing) {
        await runAsync(
          'UPDATE search_history SET search_count = search_count + 1, created_at = ? WHERE id = ?',
          [new Date().toISOString(), existing.id]
        )
      } else {
        await runAsync(
          'INSERT INTO search_history (user_id, keyword, category) VALUES (?, ?, ?)',
          [userId, keyword, category]
        )
      }
    }
    
    let results = []
    
    switch (category) {
      case 'course':
        results = await allAsync(
          "SELECT id, title, cover, description, duration, category, calories FROM courses WHERE title LIKE ? OR description LIKE ? OR category LIKE ? LIMIT 20",
          [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
        )
        break
      case 'action':
        results = await allAsync(
          "SELECT id, name, course_id FROM course_actions WHERE name LIKE ? LIMIT 20",
          [`%${keyword}%`]
        )
        break
      default:
        const courses = await allAsync(
          "SELECT 'course' as type, id, title as name, cover, description, duration, category FROM courses WHERE title LIKE ? LIMIT 10",
          [`%${keyword}%`]
        )
        const actions = await allAsync(
          "SELECT 'action' as type, id, name, course_id FROM course_actions WHERE name LIKE ? LIMIT 10",
          [`%${keyword}%`]
        )
        results = [...courses, ...actions]
    }
    
    res.success({ results, hotKeywords })
  } catch (err) {
    res.error('搜索失败: ' + err.message)
  }
}

async function getSearchHistory(req, res) {
  try {
    const userId = req.user.id
    
    const history = await allAsync(
      'SELECT keyword, category, MAX(created_at) as search_time FROM search_history WHERE user_id = ? GROUP BY keyword ORDER BY search_time DESC LIMIT 10',
      [userId]
    )
    
    res.success({ history, hotKeywords })
  } catch (err) {
    res.error('获取失败: ' + err.message)
  }
}

async function clearSearchHistory(req, res) {
  try {
    const userId = req.user.id
    
    await runAsync('DELETE FROM search_history WHERE user_id = ?', [userId])
    
    res.success(null, '历史记录已清空')
  } catch (err) {
    res.error('清空失败: ' + err.message)
  }
}

module.exports = { search, getSearchHistory, clearSearchHistory }
