import { Request, Response } from 'express'
import prisma from '../utils/prisma'

export async function getAllSkills(req: Request, res: Response) {
  try {
    const { category } = req.query
    
    const skills = await prisma.skill.findMany({
      where: category ? { category: category as string } : undefined,
      orderBy: { demandCount: 'desc' },
    })
    
    res.json(skills)
  } catch {
    res.status(500).json({ error: '获取技能列表失败' })
  }
}

export async function createSkill(req: Request, res: Response) {
  try {
    const { name, category, description, icon } = req.body
    
    const skill = await prisma.skill.create({
      data: { name, category, description, icon },
    })
    
    res.status(201).json(skill)
  } catch {
    res.status(500).json({ error: '创建技能失败' })
  }
}

export async function getSkillCategories(req: Request, res: Response) {
  try {
    const skills = await prisma.skill.findMany()
    const categories = [...new Set(skills.map(s => s.category))]
    res.json(categories)
  } catch {
    res.status(500).json({ error: '获取分类失败' })
  }
}
