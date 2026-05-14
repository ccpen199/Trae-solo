const { db } = require('../models/database')

function createPost(req, res) {
  const { content, type, mediaUrl, location, tags } = req.body
  const userId = req.user.userId

  if (!content) {
    return res.status(400).json({ success: false, message: '内容不能为空' })
  }

  const result = db.prepare('INSERT INTO posts (user_id, content, type, media_url, location, tags) VALUES (?, ?, ?, ?, ?, ?)')
    .run(userId, content, type || 'text', mediaUrl || '', location || '', JSON.stringify(tags || []))

  res.json({ success: true, data: { id: result.lastInsertRowid } })
}

function getPosts(req, res) {
  const { type = 'latest', page = 1, limit = 10 } = req.query
  const offset = (page - 1) * limit

  let orderBy = 'created_at DESC'
  if (type === 'hot') {
    orderBy = 'likes_count DESC, created_at DESC'
  }

  const posts = db.prepare(`
    SELECT p.*, u.avatar, u.nickname, u.planet_id, pl.name as planet_name
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN planets pl ON u.planet_id = pl.id
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(parseInt(limit), offset)

  posts.forEach(p => {
    p.tags = p.tags ? JSON.parse(p.tags) : []
  })

  res.json({ success: true, data: posts })
}

function getFollowPosts(req, res) {
  const userId = req.user.userId
  const { page = 1, limit = 10 } = req.query
  const offset = (page - 1) * limit

  const posts = db.prepare(`
    SELECT p.*, u.avatar, u.nickname, u.planet_id, pl.name as planet_name
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN planets pl ON u.planet_id = pl.id
    JOIN follows f ON p.user_id = f.following_id AND f.follower_id = ?
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, parseInt(limit), offset)

  posts.forEach(p => {
    p.tags = p.tags ? JSON.parse(p.tags) : []
  })

  res.json({ success: true, data: posts })
}

function likePost(req, res) {
  const { postId } = req.params
  const userId = req.user.userId

  try {
    db.prepare('INSERT OR IGNORE INTO likes (post_id, user_id) VALUES (?, ?)').run(postId, userId)
    db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').run(postId)
    res.json({ success: true, message: '点赞成功' })
  } catch (e) {
    res.status(500).json({ success: false, message: '操作失败' })
  }
}

function unlikePost(req, res) {
  const { postId } = req.params
  const userId = req.user.userId

  try {
    db.prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?').run(postId, userId)
    db.prepare('UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').run(postId)
    res.json({ success: true, message: '取消点赞成功' })
  } catch (e) {
    res.status(500).json({ success: false, message: '操作失败' })
  }
}

function addComment(req, res) {
  const { postId } = req.params
  const { content } = req.body
  const userId = req.user.userId

  if (!content) {
    return res.status(400).json({ success: false, message: '内容不能为空' })
  }

  try {
    const result = db.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)').run(postId, userId, content)
    db.prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?').run(postId)
    res.json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (e) {
    res.status(500).json({ success: false, message: '评论失败' })
  }
}

function getComments(req, res) {
  const { postId } = req.params

  const comments = db.prepare(`
    SELECT c.*, u.avatar, u.nickname
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at DESC
  `).all(postId)

  res.json({ success: true, data: comments })
}

function followUser(req, res) {
  const { userId } = req.params
  const followerId = req.user.userId

  if (parseInt(userId) === followerId) {
    return res.status(400).json({ success: false, message: '不能关注自己' })
  }

  try {
    db.prepare('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)').run(followerId, userId)
    res.json({ success: true, message: '关注成功' })
  } catch (e) {
    res.status(500).json({ success: false, message: '关注失败' })
  }
}

function unfollowUser(req, res) {
  const { userId } = req.params
  const followerId = req.user.userId

  try {
    db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(followerId, userId)
    res.json({ success: true, message: '取消关注成功' })
  } catch (e) {
    res.status(500).json({ success: false, message: '取消关注失败' })
  }
}

module.exports = { createPost, getPosts, getFollowPosts, likePost, unlikePost, addComment, getComments, followUser, unfollowUser }
