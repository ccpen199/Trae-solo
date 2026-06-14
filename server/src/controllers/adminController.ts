import { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'

const resolveDisputeSchema = z.object({
  verdict: z.enum(['EMPLOYER_WINS', 'PROVIDER_WINS', 'SPLIT']),
  refundRatio: z.number().min(0).max(1).optional(),
  description: z.string().min(1),
})

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
        bio: true,
        location: true,
        status: true,
        createdAt: true,
      },
    })
    
    if (!provider) {
      return res.status(404).json({ success: false, error: '服务商不存在' })
    }
    
    const completionRate = provider.totalOrders > 0 
      ? (provider.completedOrders / provider.totalOrders * 100).toFixed(1)
      : '0'
    
    const recentBids = await prisma.bid.findMany({
      where: { providerId: parseInt(providerId) },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { task: { select: { id: true, title: true, category: true, status: true } } },
    })
    
    const snapshots = await prisma.providerRatingSnapshot.findMany({
      where: { userId: parseInt(providerId) },
      orderBy: { createdAt: 'desc' },
      take: 12,
    })
    
    const [totalEarnings, avgRating] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          userId: parseInt(providerId),
          type: 'MILESTONE_RELEASE',
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.milestone.aggregate({
        where: {
          task: { selectedBid: { providerId: parseInt(providerId) } },
          rating: { not: null },
        },
        _avg: { rating: true },
      }),
    ])
    
    res.json({
      success: true,
      data: {
        provider,
        completionRate,
        recentBids,
        ratingHistory: snapshots,
        totalEarnings: totalEarnings._sum.amount || 0,
        averageRating: avgRating._avg.rating || provider.rating,
      },
    })
  } catch {
    res.status(500).json({ success: false, error: '获取服务商数据失败' })
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
    
    const startDate = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000)
    
    const tasks = await prisma.task.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'DRAFT' },
      },
    })
    
    const bids = await prisma.bid.findMany({
      where: { createdAt: { gte: startDate } },
    })
    
    const categoryStats: Record<string, any> = {}
    
    for (const task of tasks) {
      if (!categoryStats[task.category]) {
        categoryStats[task.category] = {
          category: task.category,
          taskCount: 0,
          bidCount: 0,
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
    
    for (const bid of bids) {
      const task = tasks.find(t => t.id === bid.taskId)
      if (task && categoryStats[task.category]) {
        categoryStats[task.category].bidCount++
      }
    }
    
    const trends = Object.values(categoryStats).map(stat => ({
      ...stat,
      avgBudget: stat.taskCount > 0 ? Math.round(stat.totalBudget / stat.taskCount) : 0,
      completionRate: stat.taskCount > 0 ? Math.round(stat.completedCount / stat.taskCount * 100) : 0,
      avgBidsPerTask: stat.taskCount > 0 ? Math.round(stat.bidCount / stat.taskCount * 10) / 10 : 0,
    }))
    
    trends.sort((a, b) => b.taskCount - a.taskCount)
    
    res.json({ success: true, data: trends })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '获取行业趋势失败' })
  }
}

export async function getSkillGaps(req: Request, res: Response) {
  try {
    const skills = await prisma.skill.findMany({
      include: {
        _count: { select: { users: true } },
      },
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
      const demandCount = Number(skill.taskCount ?? skill.taskcount ?? 0)
      
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
    
    res.json({ success: true, data: result })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '获取技能供需数据失败' })
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
      totalProviders,
      newUsersToday,
      completedTasksToday,
      pendingRiskReports,
      originalityCheckCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.bid.count(),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.dispute.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { role: { in: ['PROVIDER', 'BOTH'] } } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.task.count({
        where: {
          status: 'COMPLETED',
          updatedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.riskReport.count({ where: { handled: false } }),
      prisma.originalityCheck.count(),
    ])
    
    const recentTasks = await prisma.task.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { employer: { select: { id: true, username: true, avatar: true } } },
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
    
    const recentDisputes = await prisma.dispute.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        task: { select: { id: true, title: true } },
        initiator: { select: { id: true, username: true } },
      },
    })
    
    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProviders,
          totalTasks,
          totalBids,
          totalAmount: totalPayments._sum.amount || 0,
          activeTasks,
          pendingDisputes,
          pendingRiskReports,
          originalityCheckCount,
          newUsersToday,
          completedTasksToday,
        },
        recentTasks,
        topProviders,
        recentDisputes,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '获取统计数据失败' })
  }
}

export async function getProviders(req: Request, res: Response) {
  try {
    const { 
      page = '1', 
      pageSize = '20', 
      status,
      minRating,
      skill,
      sortBy = 'rating',
      sortOrder = 'desc',
    } = req.query
    
    const where: any = {
      role: { in: ['PROVIDER', 'BOTH'] },
    }
    
    if (status) where.status = status
    if (minRating) where.rating = { gte: parseFloat(minRating as string) }
    if (skill) {
      where.skills = {
        some: {
          name: { contains: skill as string, mode: 'insensitive' },
        },
      }
    }
    
    const orderBy: any = {}
    if (sortBy === 'rating') orderBy.rating = sortOrder
    else if (sortBy === 'completedOrders') orderBy.completedOrders = sortOrder
    else if (sortBy === 'level') orderBy.level = sortOrder
    else if (sortBy === 'createdAt') orderBy.createdAt = sortOrder
    
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string)
    const take = parseInt(pageSize as string)
    
    const [providers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          username: true,
          avatar: true,
          rating: true,
          level: true,
          totalOrders: true,
          completedOrders: true,
          complaintCount: true,
          skills: true,
          bio: true,
          location: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ])
    
    const providersWithStats = providers.map(p => ({
      ...p,
      completionRate: p.totalOrders > 0 
        ? Math.round(p.completedOrders / p.totalOrders * 100) 
        : 0,
    }))
    
    res.json({
      success: true,
      data: {
        items: providersWithStats,
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '获取服务商列表失败' })
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
          task: { select: { id: true, title: true, totalAmount: true } },
          initiator: { select: { id: true, username: true, avatar: true } },
          expert: { select: { id: true, username: true } },
        },
      }),
      prisma.dispute.count({ where }),
    ])
    
    res.json({
      success: true,
      data: {
        items: disputes,
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      },
    })
  } catch {
    res.status(500).json({ success: false, error: '获取争议列表失败' })
  }
}

export async function resolveDispute(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    
    const data = resolveDisputeSchema.parse(req.body)
    
    const dispute = await prisma.dispute.findUnique({
      where: { id: parseInt(id) },
      include: { 
        task: { 
          include: { 
            selectedBid: { include: { provider: true } },
            employer: true,
          } 
        },
      },
    })
    
    if (!dispute) {
      return res.status(404).json({ success: false, error: '争议不存在' })
    }
    
    if (dispute.status === 'RESOLVED') {
      return res.status(400).json({ success: false, error: '争议已解决' })
    }
    
    const updated = await prisma.dispute.update({
      where: { id: parseInt(id) },
      data: {
        status: 'RESOLVED',
        expertId: userId,
        verdict: data.verdict,
        refundRatio: data.refundRatio,
        description_result: data.description,
        resolvedAt: new Date(),
      },
    })
    
    const escrowAmount = dispute.task.escrowAmount
    const refundRatio = data.refundRatio ?? 1
    
    await prisma.$transaction(async (tx) => {
      if (data.verdict === 'EMPLOYER_WINS') {
        const refundAmount = escrowAmount * refundRatio
        await tx.user.update({
          where: { id: dispute.task.employerId },
          data: {
            balance: { increment: refundAmount },
            frozenBalance: { decrement: refundAmount },
          },
        })
        
        const remainingAmount = escrowAmount - refundAmount
        if (remainingAmount > 0 && dispute.task.selectedBid) {
          await tx.user.update({
            where: { id: dispute.task.selectedBid.providerId },
            data: {
              balance: { increment: remainingAmount },
              frozenBalance: { decrement: remainingAmount },
            },
          })
        }
      } else if (data.verdict === 'PROVIDER_WINS') {
        if (dispute.task.selectedBid) {
          const platformFee = escrowAmount * 0.05
          const providerReceive = escrowAmount - platformFee
          
          await tx.user.update({
            where: { id: dispute.task.employerId },
            data: { frozenBalance: { decrement: escrowAmount } },
          })
          
          await tx.user.update({
            where: { id: dispute.task.selectedBid.providerId },
            data: { balance: { increment: providerReceive } },
          })
        }
      } else if (data.verdict === 'SPLIT') {
        const employerAmount = escrowAmount * refundRatio
        const providerAmount = escrowAmount * (1 - refundRatio)
        const platformFee = providerAmount * 0.05
        const providerReceive = providerAmount - platformFee
        
        await tx.user.update({
          where: { id: dispute.task.employerId },
          data: {
            balance: { increment: employerAmount },
            frozenBalance: { decrement: escrowAmount },
          },
        })
        
        if (dispute.task.selectedBid && providerReceive > 0) {
          await tx.user.update({
            where: { id: dispute.task.selectedBid.providerId },
            data: { balance: { increment: providerReceive } },
          })
        }
      }
      
      await tx.task.update({
        where: { id: dispute.taskId },
        data: { 
          status: 'COMPLETED',
          escrowAmount: 0,
        },
      })
      
      await tx.riskReport.create({
        data: {
          userId: dispute.initiatorId,
          taskId: dispute.taskId,
          type: 'DISPUTE',
          level: 'HIGH',
          title: `争议已仲裁：${data.verdict}`,
          description: data.description,
          handled: true,
          handledBy: userId,
          handledAt: new Date(),
          result: data.verdict,
        },
      })
    })
    
    res.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors })
    }
    console.error(error)
    res.status(500).json({ success: false, error: '仲裁失败' })
  }
}

export async function getDisputeDetail(req: Request, res: Response) {
  try {
    const { id } = req.params
    
    const dispute = await prisma.dispute.findUnique({
      where: { id: parseInt(id) },
      include: {
        task: { select: { id: true, title: true, escrowAmount: true, employerId: true, selectedBidId: true } },
        initiator: { select: { id: true, username: true, avatar: true } },
        evidences: {
          include: {
            user: { select: { id: true, username: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        expert: { select: { id: true, username: true } },
      },
    })
    
    if (!dispute) {
      return res.status(404).json({ success: false, error: '争议不存在' })
    }
    
    res.json({ success: true, data: dispute })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '获取争议详情失败' })
  }
}

export async function submitVerdict(req: Request, res: Response) {
  return resolveDispute(req, res)
}

export async function getProvidersList(req: Request, res: Response) {
  try {
    const { page = '1', pageSize = '50', level } = req.query
    
    const where: any = {
      role: { in: ['PROVIDER', 'BOTH'] }
    }
    if (level) where.level = parseInt(level as string)
    
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string)
    const take = parseInt(pageSize as string)
    
    const [providers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: [
          { level: 'desc' },
          { rating: 'desc' },
          { completedOrders: 'desc' },
        ],
        select: {
          id: true,
          username: true,
          avatar: true,
          role: true,
          rating: true,
          level: true,
          totalOrders: true,
          completedOrders: true,
          complaintCount: true,
          experience: true,
          createdAt: true,
          skills: true,
        },
      }),
      prisma.user.count({ where }),
    ])
    
    res.json({
      success: true,
      data: providers,
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '获取服务商列表失败' })
  }
}

export async function adjustProviderLevel(req: Request, res: Response) {
  try {
    const { providerId } = req.params
    const { level } = req.body
    
    if (!level || level < 1 || level > 10) {
      return res.status(400).json({ success: false, error: '无效的等级' })
    }
    
    const provider = await prisma.user.findUnique({
      where: { id: parseInt(providerId) },
    })
    
    if (!provider) {
      return res.status(404).json({ success: false, error: '服务商不存在' })
    }
    
    const updated = await prisma.user.update({
      where: { id: parseInt(providerId) },
      data: { level },
      select: {
        id: true,
        username: true,
        level: true,
      },
    })
    
    const ratingStats = await calculateProviderRating(parseInt(providerId))
    
    await prisma.providerRatingSnapshot.create({
      data: {
        userId: parseInt(providerId),
        overallRating: ratingStats?.overallRating || provider.rating,
        qualityScore: ratingStats?.qualityScore || provider.rating,
        deliveryScore: ratingStats?.deliveryScore || 5,
        serviceScore: ratingStats?.serviceScore || 5,
        complianceScore: ratingStats?.complianceScore || 4.5,
        orderCount: provider.completedOrders,
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
      },
    })
    
    res.json({
      success: true,
      message: '等级调整成功',
      data: updated,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '调整等级失败' })
  }
}
