import prisma from '../config/database.js'
import { stateMachine } from '../engine/stateMachine.js'
import { taxRuleEngine } from '../engine/taxRuleEngine.js'
import { documentRuleEngine } from '../engine/documentRuleEngine.js'
import { generateMainOrderNo, validateDeclaration, checkDuplicateDeclaration } from '../utils/helpers.js'
import { DeclarationStatus } from '../config/constants.js'

export const declarationService = {
  async createDeclaration(data, creatorId) {
    const validation = await validateDeclaration(data)
    if (!validation.isValid) {
      return { success: false, errors: validation.errors }
    }

    const duplicate = await checkDuplicateDeclaration(data)
    if (duplicate.isDuplicate) {
      return {
        success: false,
        errors: [`该提单号(${data.billOfLadingNo})已有正在处理的报关单: ${duplicate.existingDeclaration.mainOrderNo}`],
      }
    }

    const mainOrderNo = await generateMainOrderNo()

    const declarationId = await prisma.$transaction(async (tx) => {
      const declaration = await tx.declaration.create({
        data: {
          mainOrderNo,
          status: DeclarationStatus.PENDING_DATA_ENTRY,
          declarationType: data.declarationType,
          tradeMode: data.tradeMode,
          customsCode: data.customsCode,
          iePort: data.iePort,
          shipper: data.shipper,
          consignee: data.consignee,
          notifyParty: data.notifyParty,
          transportMode: data.transportMode,
          voyageNo: data.voyageNo,
          billOfLadingNo: data.billOfLadingNo,
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
          creatorId,
          assigneeId: data.assigneeId || creatorId,
          totalValue: data.totalValue,
          currency: data.currency || 'USD',
        },
      })

      if (data.items && data.items.length > 0) {
        for (const [index, item] of data.items.entries()) {
          await tx.declarationItem.create({
            data: {
              declarationId: declaration.id,
              lineNo: index + 1,
              hsCode: item.hsCode,
              productName: item.productName,
              specification: item.specification,
              originCountry: item.originCountry,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              totalAmount: item.totalAmount,
              currency: item.currency || data.currency || 'USD',
              status: DeclarationStatus.PENDING_DATA_ENTRY,
            },
          })
        }
      }

      await tx.todoItem.create({
        data: {
          declarationId: declaration.id,
          assigneeId: data.assigneeId || creatorId,
          title: '待录入资料',
          actionType: 'DATA_ENTRY',
          status: 'PENDING',
          priority: 1,
        },
      })

      await tx.operationLog.create({
        data: {
          declarationId: declaration.id,
          userId: creatorId,
          action: 'CREATE',
          targetType: 'DECLARATION',
          targetId: declaration.id,
          details: JSON.stringify({ mainOrderNo }),
        },
      })

      return declaration.id
    })

    return {
      success: true,
      data: await declarationService.getDeclarationById(declarationId),
    }
  },

  async getDeclarationById(id) {
    return prisma.declaration.findUnique({
      where: { id },
      include: {
        items: { orderBy: { lineNo: 'asc' } },
        documents: true,
        taxes: true,
        inspections: { orderBy: { createdAt: 'desc' } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        operationLogs: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, role: true } } },
        },
        todoItems: { include: { assignee: { select: { name: true } } } },
        messages: { include: { receiver: { select: { name: true } } } },
        exceptions: true,
        creator: { select: { id: true, name: true, role: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    })
  },

  async getDeclarations(params = {}) {
    const {
      status,
      creatorId,
      assigneeId,
      search,
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params

    const where = {}

    if (status) {
      where.status = status
    }
    if (creatorId) {
      where.creatorId = creatorId
    }
    if (assigneeId) {
      where.assigneeId = assigneeId
    }
    if (search) {
      where.OR = [
        { mainOrderNo: { contains: search } },
        { shipper: { contains: search } },
        { consignee: { contains: search } },
        { billOfLadingNo: { contains: search } },
      ]
    }

    const [total, items] = await Promise.all([
      prisma.declaration.count({ where }),
      prisma.declaration.findMany({
        where,
        include: {
          creator: { select: { name: true } },
          assignee: { select: { name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      items,
    }
  },

  async updateDeclaration(id, data, operatorId) {
    const declaration = await prisma.declaration.findUnique({ where: { id } })

    if (!declaration) {
      return { success: false, errors: ['报关单不存在'] }
    }

    if (declaration.isLocked) {
      return { success: false, errors: ['报关单已被锁定，无法修改'] }
    }

    const validation = await validateDeclaration(data, true)
    if (!validation.isValid) {
      return { success: false, errors: validation.errors }
    }

    await prisma.$transaction(async (tx) => {
      await tx.declaration.update({
        where: { id },
        data: {
          declarationType: data.declarationType,
          tradeMode: data.tradeMode,
          customsCode: data.customsCode,
          iePort: data.iePort,
          shipper: data.shipper,
          consignee: data.consignee,
          notifyParty: data.notifyParty,
          transportMode: data.transportMode,
          voyageNo: data.voyageNo,
          billOfLadingNo: data.billOfLadingNo,
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
          assigneeId: data.assigneeId,
          totalValue: data.totalValue,
          currency: data.currency,
        },
      })

      if (data.items) {
        await tx.declarationItem.deleteMany({ where: { declarationId: id } })
        for (const [index, item] of data.items.entries()) {
          await tx.declarationItem.create({
            data: {
              declarationId: id,
              lineNo: index + 1,
              hsCode: item.hsCode,
              productName: item.productName,
              specification: item.specification,
              originCountry: item.originCountry,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              totalAmount: item.totalAmount,
              currency: item.currency,
              status: declaration.status,
            },
          })
        }
      }

      await tx.operationLog.create({
        data: {
          declarationId: id,
          userId: operatorId,
          action: 'UPDATE',
          targetType: 'DECLARATION',
          targetId: id,
        },
      })
    })

    return {
      success: true,
      data: await declarationService.getDeclarationById(id),
    }
  },

  async performAction(declarationId, action, operatorId, comment = null) {
    try {
      const updated = await stateMachine.transition(
        declarationId,
        action,
        operatorId,
        comment
      )

      return {
        success: true,
        data: updated,
      }
    } catch (error) {
      return {
        success: false,
        errors: [error.message],
      }
    }
  },

  async calculateAndSaveTaxes(declarationId, operatorId) {
    try {
      const result = await taxRuleEngine.calculateTaxes(declarationId)
      await taxRuleEngine.saveTaxRecords(declarationId, result.taxRecords)

      await prisma.operationLog.create({
        data: {
          declarationId,
          userId: operatorId,
          action: 'CALCULATE_TAX',
          targetType: 'DECLARATION',
          targetId: declarationId,
          details: JSON.stringify({ totalTax: result.totalTax }),
        },
      })

      return {
        success: true,
        data: {
          totalTax: result.totalTax,
          exchangeRate: result.exchangeRate,
          taxRecords: result.taxRecords,
        },
      }
    } catch (error) {
      return {
        success: false,
        errors: [error.message],
      }
    }
  },

  async validateDocuments(declarationId) {
    return documentRuleEngine.validateDeclarationDocuments(declarationId)
  },

  async lockDeclaration(declarationId, operatorId) {
    const declaration = await prisma.declaration.findUnique({ where: { id: declarationId } })

    if (!declaration) {
      return { success: false, errors: ['报关单不存在'] }
    }

    if (declaration.isLocked && declaration.lockedBy !== operatorId) {
      return { success: false, errors: ['报关单已被其他用户锁定'] }
    }

    const updated = await prisma.declaration.update({
      where: { id: declarationId },
      data: {
        isLocked: true,
        lockedBy: operatorId,
        lockedAt: new Date(),
      },
    })

    await prisma.operationLog.create({
      data: {
        declarationId,
        userId: operatorId,
        action: 'LOCK',
        targetType: 'DECLARATION',
        targetId: declarationId,
      },
    })

    return { success: true, data: updated }
  },

  async unlockDeclaration(declarationId, operatorId) {
    const declaration = await prisma.declaration.findUnique({ where: { id: declarationId } })

    if (!declaration) {
      return { success: false, errors: ['报关单不存在'] }
    }

    if (declaration.isLocked && declaration.lockedBy !== operatorId) {
      return { success: false, errors: ['无法解锁其他用户锁定的报关单'] }
    }

    const updated = await prisma.declaration.update({
      where: { id: declarationId },
      data: {
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
      },
    })

    await prisma.operationLog.create({
      data: {
        declarationId,
        userId: operatorId,
        action: 'UNLOCK',
        targetType: 'DECLARATION',
        targetId: declarationId,
      },
    })

    return { success: true, data: updated }
  },
}

export default declarationService
