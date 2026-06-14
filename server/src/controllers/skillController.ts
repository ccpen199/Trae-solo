import { Request, Response } from 'express'
import prisma from '../utils/prisma'

export async function getAllSkills(req: Request, res: Response) {
  try {
    const { category, sortBy = 'demand', sortOrder = 'desc' } = req.query

    const where = category ? { category: category as string } : undefined

    const skills = await prisma.skill.findMany({
      where,
      include: {
        _count: {
          select: {
            tasks: { where: { status: { not: 'DRAFT' } } },
            users: { where: { role: 'PROVIDER' } },
          },
        },
      },
    })

    const enriched = skills.map(sk => {
      const demandCount = sk._count?.tasks ?? 0
      const supplyCount = sk._count?.users ?? 0
      const gap = supplyCount > 0 ? Math.round(((demandCount - supplyCount) / supplyCount) * 100) : demandCount * 50
      return {
        id: sk.id,
        name: sk.name,
        category: sk.category,
        description: sk.description,
        icon: sk.icon,
        demandCount,
        supplyCount,
        gapType: gap >= 30 ? 'UNDER_SUPPLIED' : gap <= -20 ? 'OVER_SUPPLIED' : 'BALANCED',
        gapPercentage: gap,
      }
    })

    enriched.sort((a, b) => {
      let diff = 0
      if (sortBy === 'demand') diff = (a.demandCount as number) - (b.demandCount as number)
      else if (sortBy === 'supply') diff = (a.supplyCount as number) - (b.supplyCount as number)
      else if (sortBy === 'gap') diff = (a.gapPercentage as number) - (b.gapPercentage as number)
      return sortOrder === 'desc' ? -diff : diff
    })

    res.json(enriched)
  } catch (e) {
    console.error(e)
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
