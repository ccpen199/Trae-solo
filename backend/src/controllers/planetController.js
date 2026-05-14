const { db } = require('../models/database')

function getTests(req, res) {
  const tests = db.prepare('SELECT * FROM tests').all()
  tests.forEach(t => {
    t.questions = JSON.parse(t.questions)
  })
  res.json({ success: true, data: tests })
}

function submitTest(req, res) {
  const { testId, answers } = req.body
  const userId = req.user.userId

  if (!testId || !answers) {
    return res.status(400).json({ success: false, message: '缺少参数' })
  }

  const planetId = (answers.reduce((sum, a) => sum + (a.optionIndex || 0), 0) % 5) + 1
  const result = JSON.stringify({ planetId, score: answers.length * 20 })

  db.prepare('INSERT INTO user_test_results (user_id, test_id, answers, result, planet_id) VALUES (?, ?, ?, ?, ?)')
    .run(userId, testId, JSON.stringify(answers), result, planetId)

  db.prepare('UPDATE users SET planet_id = ? WHERE id = ?').run(planetId, userId)

  const planet = db.prepare('SELECT * FROM planets WHERE id = ?').get(planetId)
  res.json({ success: true, data: { planet } })
}

function getPlanets(req, res) {
  const planets = db.prepare('SELECT * FROM planets').all()
  res.json({ success: true, data: planets })
}

function getPlanetUsers(req, res) {
  const { planetId } = req.params
  const { minAge, maxAge, constellation, gender } = req.query
  const currentUserId = req.user.userId

  let query = `
    SELECT u.id, u.avatar, u.nickname, u.birthday, u.signature, u.gender, u.constellation, u.planet_id
    FROM users u
    WHERE u.planet_id = ? AND u.id != ?
  `
  let params = [planetId, currentUserId]

  if (minAge || maxAge) {
    const now = new Date()
    if (minAge) {
      const minBirthYear = now.getFullYear() - minAge
      query += ` AND u.birthday <= ?`
      params.push(`${minBirthYear}-12-31`)
    }
    if (maxAge) {
      const maxBirthYear = now.getFullYear() - maxAge
      query += ` AND u.birthday >= ?`
      params.push(`${maxBirthYear}-01-01`)
    }
  }

  if (constellation) {
    query += ` AND u.constellation = ?`
    params.push(constellation)
  }

  if (gender) {
    query += ` AND u.gender = ?`
    params.push(gender)
  }

  query += ` ORDER BY RANDOM() LIMIT 20`

  const users = db.prepare(query).all(...params)

  users.forEach(u => {
    if (u.birthday) {
      const birth = new Date(u.birthday)
      const now = new Date()
      u.age = now.getFullYear() - birth.getFullYear()
    }
  })

  res.json({ success: true, data: users })
}

function randomMatch(req, res) {
  const userId = req.user.userId
  const { minAge, maxAge, constellation, gender } = req.body

  const user = db.prepare('SELECT planet_id FROM users WHERE id = ?').get(userId)

  let query = `
    SELECT u.id, u.avatar, u.nickname, u.birthday, u.signature, u.gender, u.constellation, u.planet_id
    FROM users u
    WHERE u.id != ?
  `
  let params = [userId]

  if (user && user.planet_id) {
    query += ` AND u.planet_id = ?`
    params.push(user.planet_id)
  }

  if (minAge || maxAge) {
    const now = new Date()
    if (minAge) {
      const minBirthYear = now.getFullYear() - minAge
      query += ` AND u.birthday <= ?`
      params.push(`${minBirthYear}-12-31`)
    }
    if (maxAge) {
      const maxBirthYear = now.getFullYear() - maxAge
      query += ` AND u.birthday >= ?`
      params.push(`${maxBirthYear}-01-01`)
    }
  }

  if (constellation) {
    query += ` AND u.constellation = ?`
    params.push(constellation)
  }

  if (gender) {
    query += ` AND u.gender = ?`
    params.push(gender)
  }

  query += ` ORDER BY RANDOM() LIMIT 1`

  const matchedUser = db.prepare(query).get(...params)

  if (!matchedUser) {
    return res.json({ success: true, data: { matched: false } })
  }

  const result = db.prepare('INSERT INTO matches (user_id1, user_id2, match_type, status) VALUES (?, ?, ?, ?)')
    .run(userId, matchedUser.id, 'random', 'matched')

  if (matchedUser.birthday) {
    const birth = new Date(matchedUser.birthday)
    const now = new Date()
    matchedUser.age = now.getFullYear() - birth.getFullYear()
  }

  res.json({ success: true, data: { matched: true, user: matchedUser, matchId: result.lastInsertRowid } })
}

function getUserProfile(req, res) {
  const { userId } = req.params
  
  const user = db.prepare('SELECT id, avatar, nickname, birthday, signature, gender, constellation, planet_id FROM users WHERE id = ?').get(userId)
  
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' })
  }
  
  if (user.birthday) {
    const birth = new Date(user.birthday)
    const now = new Date()
    user.age = now.getFullYear() - birth.getFullYear()
  }

  const planet = db.prepare('SELECT * FROM planets WHERE id = ?').get(user.planet_id)
  user.planet = planet

  res.json({ success: true, data: user })
}

module.exports = { getTests, submitTest, getPlanets, getPlanetUsers, randomMatch, getUserProfile }
