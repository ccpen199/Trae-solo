import prisma from '../config/database.js'
import { DeclarationStatus, StatusDisplayNames } from '../config/constants.js'

export const dashboardService = {
  async getStatusCounts() {
    const counts = await prisma.declaration.groupBy({
      by: ['status'],
      _count: true,
    })

    const result = {}
    for (const status of Object.values(DeclarationStatus)) {
      const count = counts.find(c => c.status === status)
      result[status] = {
        count: count?._count || 0,
        displayName: StatusDisplayNames[status],
      }
    }

    return result
  },

  async getTodoCounts(userId) {
    const [pending, overdue, today] = await Promise.all([
      prisma.todoItem.count({
        where: { assigneeId: userId, status: 'PENDING' },
      }),
      prisma.todoItem.count({
        where: {
          assigneeId: userId,
          status: 'PENDING',
          dueDate: { lt: new Date() },
        },
      }),
      prisma.todoItem.count({
        where: {
          assigneeId: userId,
          status: 'PENDING',
          dueDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ])

    return { pending, overdue, today }
  },

  async getExceptionCounts() {
    const [open, resolved, total] = await Promise.all([
      prisma.exceptionRecord.count({ where: { status: 'OPEN' } }),
      prisma.exceptionRecord.count({ where: { status: 'RESOLVED' } }),
      prisma.exceptionRecord.count(),
    ])

    return { open, resolved, total }
  },

  async getRecentActivities(userId, limit = 20) {
    return prisma.operationLog.findMany({
      where: { userId },
      include: {
        declaration: { select: { mainOrderNo: true, status: true } },
        user: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  },

  async getStatistics(dateRange = null) {
    const where = {}
    if (dateRange?.start && dateRange?.end) {
      where.createdAt = {
        gte: new Date(dateRange.start),
        lte: new Date(dateRange.end),
      }
    }

    const [total, completed, rejected, avgProcessing] = await Promise.all([
      prisma.declaration.count({ where }),
      prisma.declaration.count({
        where: { ...where, status: DeclarationStatus.RELEASED_ARCHIVED },
      }),
      prisma.declaration.count({
        where: { ...where, status: DeclarationStatus.REJECTED },
      }),
      this.getAverageProcessingTime(where),
    ])

    return {
      total,
      completed,
      rejected,
      inProgress: total - completed - rejected,
      avgProcessingTime: avgProcessing,
      completionRate: total > 0 ? (completed / total * 100).toFixed(2) : 0,
    }
  },

  async getAverageProcessingTime(where) {
    const completed = await prisma.declaration.findMany({
      where: {
        ...where,
        status: DeclarationStatus.RELEASED_ARCHIVED,
        actualDate: { not: null },
      },
      select: { createdAt: true, actualDate: true },
    })

    if (completed.length === 0) return 0

    const totalDays = completed.reduce((sum, d) => {
      const days = (d.actualDate - d.createdAt) / (1000 * 60 * 60 * 24)
      return sum + days
    }, 0)

    return (totalDays / completed.length).toFixed(1)
  },

  async getKanbanData() {
    const declarations = await prisma.declaration.findMany({
      where: {
        status: {
          in: [
            DeclarationStatus.PENDING_DATA_ENTRY,
            DeclarationStatus.PENDING_CLASSIFICATION,
            DeclarationStatus.PENDING_DECLARATION,
            DeclarationStatus.PENDING_INSPECTION_TAX,
          ],
        },
      },
      include: {
        creator: { select: { name: true } },
        assignee: { select: { name: true } },
        items: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const columns = {
      [DeclarationStatus.PENDING_DATA_ENTRY]: [],
      [DeclarationStatus.PENDING_CLASSIFICATION]: [],
      [DeclarationStatus.PENDING_DECLARATION]: [],
      [DeclarationStatus.PENDING_INSPECTION_TAX]: [],
    }

    for (const d of declarations) {
      if (columns[d.status]) {
        columns[d.status].push({
          id: d.id,
          mainOrderNo: d.mainOrderNo,
          shipper: d.shipper,
          consignee: d.consignee,
          assignee: d.assignee?.name,
          creator: d.creator?.name,
          itemCount: d.items.length,
          createdAt: d.createdAt,
          expectedDate: d.expectedDate,
          isLocked: d.isLocked,
        })
      }
    }

    return columns
  },
}

export default dashboardService
