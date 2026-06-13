import { Request, Response } from 'express'
import prisma from '../utils/prisma'

export async function getProviderStats(req: Request, res: Response) {
  try {
    const { providerId } = req.params
    
    const provider = await prisma.user.findUnique({
      where: { id: parseInt(providerId) },
      select: {
        id: true,
        username: true,
        avatar: true,
        rating: true,
        totalOrders: true,
        completedOrders: true,
        complaintCount: true,
        level: true,
        skills: true,
      },
    })
    
    if (!provider) {
      return res.status(404).json({ error: '服务商不存在' })
    }
    
    const completionRate = provider.totalOrders > 0 
      ? (provider.completedOrders / provider.totalOrders * 100).toFixed(1)
      : '0'
    
    const recentBids = await prisma.bid.findMany({
      where: { providerId: parseInt(providerId) },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { task: { select: { id: true, title: true, category: true } } },
    })
    
    const snapshots = await prisma.providerRatingSnapshot.findMany({
      where: { userId: parseInt(providerId) },
      orderBy: { createdAt: 'desc' },
      take: 12,
    })
    
    res.json({
      provider,
      completionRate,
      recentBids,
      ratingHistory: snapshots,
    })
  } catch {
    res.status(500).json({ error: '获取服务商数据失败' })
  }
}

export async function calculateProviderRating(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return null
  
  const qualityScore = user.rating || 5.0
  
  const deliveryScore = user.totalOrders > 0
    ? Math.min(5, (user.completedOrders / user.totalOrders) * 5)
    : 5.0
  
  const serviceScore = user.complaintCount > 0
    ? Math.max(0, 5 - user.complaintCount * 0.5)
    : 5.0
  
  const complianceScore = 4.5
  
  const overallRating = (
    qualityScore * 0.4 +
    deliveryScore * 0.3 +
    serviceScore * 0.2 +
    complianceScore * 0.1
  )
  
  return {
    overallRating: Math.round(overallRating * 100) / 100,
    qualityScore: Math.round(qualityScore * 100) / 100,
    deliveryScore: Math.round(deliveryScore * 100) / 100,
    serviceScore: Math.round(serviceScore * 100) / 100,
    complianceScore: Math.round(complianceScore * 100) / 100,
  }
}

export async function getIndustryTrends(req: Request, res: Response) {
  try {
    const { days = '30' } = req.query
    
    const tasks = await prisma.task.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000),
        },
      },
    })
    
    const categoryStats: Record<string, any> = {}
    
    for (const task of tasks) {
      if (!categoryStats[task.category]) {
        categoryStats[task.category] = {
          category: task.category,
          taskCount: 0,
          totalBudget: 0,
          completedCount: 0,
        }
      }
      categoryStats[task.category].taskCount++
      categoryStats[task.category].totalBudget += (task.budgetMin + task.budgetMax) / 2
      if (task.status === 'COMPLETED') {
        categoryStats[task.category].completedCount++
      }
    }
    
    const trends = Object.values(categoryStats).map(stat => ({
      ...stat,
      avgBudget: stat.taskCount > 0 ? Math.round(stat.totalBudget / stat.taskCount) : 0,
      completionRate: stat.taskCount > 0 ? Math.round(stat.completedCount / stat.taskCount * 100) : 0,
    }))
    
    trends.sort((a, b) => b.taskCount - a.taskCount)
    
    res.json(trends)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '获取行业趋势失败' })
  }
}

export async function getSkillGaps(req: Request, res: Response) {
  try {
    const skills = await prisma.skill.findMany({
      include: {
        _count: { select: { users: true } },
      },
    })
    
    const taskSkills = await prisma.task.groupBy({
      by: [],
      _count: true,
    })
    
    const allTaskSkills = await prisma.$queryRaw`
      SELECT s.id, s.name, s.category, COUNT(t.id) as taskCount
      FROM skills s
      LEFT JOIN _TaskSkills ts ON ts."B" = s.id
      LEFT JOIN tasks t ON t.id = ts."A" AND t.status != 'DRAFT'
      GROUP BY s.id, s.name, s.category
      ORDER BY taskCount DESC
    ` as any[]
    
    const result = allTaskSkills.map(skill => {
      const supplyCount = skills.find(s => s.id === skill.id)?._count.users || 0
      const demandCount = skill.taskcount || 0
      
      let gapType = 'BALANCE'
      let gapPercentage = 0
      
      if (supplyCount > 0) {
        gapPercentage = Math.round((demandCount - supplyCount) / supplyCount * 100)
        if (gapPercentage > 20) gapType = 'SHORTAGE'
        else if (gapPercentage < -20) gapType = 'SURPLUS'
      } else if (demandCount > 0) {
        gapType = 'SHORTAGE'
        gapPercentage = 100
      }
      
      return {
        skillId: skill.id,
        name: skill.name,
        category: skill.category,
        demandCount,
        supplyCount,
        gapType,
        gapPercentage,
      }
    })
    
    result.sort((a, b) => b.gapPercentage - a.gapPercentage)
    
    res.json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '获取技能供需数据失败' })
  }
}

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const [
      totalUsers,
      totalTasks,
      totalBids,
      totalPayments,
      activeTasks,
      pendingDisputes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.bid.count(),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.dispute.count({ where: { status: 'PENDING' } }),
    ])
    
    const recentTasks = await prisma.task.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { employer: { select: { id: true, username: true } } },
    })
    
    const topProviders = await prisma.user.findMany({
      where: { role: { in: ['PROVIDER', 'BOTH'] } },
      orderBy: { rating: 'desc' },
      take: 5,
      select: {
        id: true,
        username: true,
        avatar: true,
        rating: true,
        completedOrders: true,
        skills: true,
      },
    })
    
    res.json({
      overview: {
        totalUsers,
        totalTasks,
        totalBids,
        totalAmount: totalPayments._sum.amount || 0,
        activeTasks,
        pendingDisputes,
      },
      recentTasks,
      topProviders,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '获取统计数据失败' })
  }
}

export async function getDisputes(req: Request, res: Response) {
  try {
    const { status, page = '1', pageSize = '20' } = req.query
    
    const where: any = {}
    if (status) where.status = status
    
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string)
    const take = parseInt(pageSize as string)
    
    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          task: { select: { id: true, title: true } },
          initiator: { select: { id: true, username: true, avatar: true } },
        },
      }),
      prisma.dispute.count({ where }),
    ])
    
    res.json({
      data: disputes,
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    })
  } catch {
    res.status(500).json({ error: '获取争议列表失败' })
  }
}

export async function resolveDispute(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    const { verdict, refundRatio, description } = req.body
    
    const dispute = await prisma.dispute.findUnique({
      where: { id: parseInt(id) },
      include: { task: true },
    })
    
    if (!dispute) {
      return res.status(404).json({ error: '争议不存在' })
    }
    
    const updated = await prisma.dispute.update({
      where: { id: parseInt(id) },
      data: {
        status: 'RESOLVED',
        expertId: userId,
        verdict,
        refundRatio,
        description_result: description,
        resolvedAt: new Date(),
      },
    })
    
    if (verdict === 'EMPLOYER_WINS') {
      const refundAmount = dispute.task.escrowAmount * (refundRatio || 1)
      await prisma.user.update({
        where: { id: dispute.task.employerId },
        data: {
          balance: { increment: refundAmount },
          frozenBalance: { decrement: refundAmount },
        },
      })
    } else if (verdict === 'PROVIDER_WINS') {
      // 款项释放给服务商
    }
    
    await prisma.task.update({
      where: { id: dispute.taskId },
      data: { status: 'COMPLETED' },
    })
    
    res.json(updated)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '仲裁失败' })
  }
}
