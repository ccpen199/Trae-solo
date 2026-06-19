import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { findUserByEmail, findUserById, addUser, generateId } from '../data/database'
import { generateToken, type AuthRequest } from '../middleware/auth.middleware'
import type { User, UserRole } from '../types'

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required',
      })
    }

    const user = findUserByEmail(email)

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      })
    }

    const token = generateToken(user.id, user.email, user.role)

    res.json({
      success: true,
      token,
      user,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, role = 'annotator' } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name, email, and password are required',
      })
    }

    const existingUser = findUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email already exists',
      })
    }

    const newUser: User = {
      id: generateId(),
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      role: role as UserRole,
      skills: [],
      accuracy: 100,
      totalTasks: 0,
      level: 1,
      points: 0,
      joinedAt: new Date().toISOString().split('T')[0],
    }

    addUser(newUser)

    const token = generateToken(newUser.id, newUser.email, newUser.role)

    res.status(201).json({
      success: true,
      token,
      user: newUser,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = findUserById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ success: true, user })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function changeRole(req: AuthRequest, res: Response) {
  try {
    const { role } = req.body
    const userId = req.user?.id

    if (!userId || !role) {
      return res.status(400).json({ error: 'Bad request' })
    }

    const user = findUserById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    user.role = role as UserRole

    const token = generateToken(user.id, user.email, user.role)

    res.json({
      success: true,
      token,
      user,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}
