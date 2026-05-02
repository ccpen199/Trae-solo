import { Router } from 'express'
import userService from '../services/userService.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const params = {
      role: req.query.role,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
    }

    const result = await userService.getUsers(params)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Error getting users:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, errors: ['用户不存在'] })
    }
    res.json({ success: true, data: user })
  } catch (error) {
    console.error('Error getting user:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.post('/', async (req, res) => {
  try {
    const result = await userService.createUser(req.body)
    if (result.success) {
      res.status(201).json(result)
    } else {
      res.status(400).json(result)
    }
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.get('/:id/todos', async (req, res) => {
  try {
    const params = {
      status: req.query.status,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
    }

    const result = await userService.getTodoItems(req.params.id, params)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Error getting todos:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.get('/:id/messages', async (req, res) => {
  try {
    const params = {
      isRead: req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
    }

    const result = await userService.getMessages(req.params.id, params)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Error getting messages:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.post('/messages/:id/read', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'system'
    const result = await userService.markMessageAsRead(req.params.id, userId)
    if (result.success) {
      res.json(result)
    } else {
      res.status(400).json(result)
    }
  } catch (error) {
    console.error('Error marking message as read:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

export default router
