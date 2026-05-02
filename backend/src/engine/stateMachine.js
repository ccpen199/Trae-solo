import prisma from '../config/database.js'
import { StatusFlow, ActionToStatus, DeclarationStatus, UserRole, RolePermissions } from '../config/constants.js'

export const stateMachine = {
  canTransition(fromStatus, action) {
    const flow = StatusFlow[fromStatus]
    if (!flow) return false
    return flow.allowedActions.includes(action)
  },

  getNextStatus(currentStatus, action) {
    return ActionToStatus[action] || null
  },

  getAvailableActions(status, userRole) {
    const flow = StatusFlow[status]
    if (!flow) return []
    
    const permissions = RolePermissions[userRole]
    if (!permissions) return []

    return flow.allowedActions.filter(action => {
      if (action === 'VIEW') return permissions.canView
      if (action === 'CANCEL') return permissions.canEdit?.includes(status) || permissions.canDelete
      if (action === 'REASSIGN') return permissions.canReassign
      if (action === 'LOCK' || action === 'UNLOCK') return permissions.canApprove
      if (action === 'INSPECT') return permissions.canInspect
      if (action === 'PAY_TAX') return permissions.canApproveTax
      return permissions.canEdit?.includes(status) || permissions.canSubmit
    })
  },

  async transition(declarationId, action, operatorId, comment = null) {
    const declaration = await prisma.declaration.findUnique({
      where: { id: declarationId },
      include: { creator: true, assignee: true },
    })

    if (!declaration) {
      throw new Error('Declaration not found')
    }

    const operator = await prisma.user.findUnique({
      where: { id: operatorId },
    })

    if (!operator) {
      throw new Error('Operator not found')
    }

    if (!this.canTransition(declaration.status, action)) {
      throw new Error(`Cannot perform action ${action} from status ${declaration.status}`)
    }

    const availableActions = this.getAvailableActions(declaration.status, operator.role)
    if (!availableActions.includes(action) && operator.role !== UserRole.ADMIN) {
      throw new Error(`Operator ${operator.role} does not have permission for action ${action}`)
    }

    const nextStatus = this.getNextStatus(declaration.status, action)

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.declaration.update({
        where: { id: declarationId },
        data: {
          status: nextStatus,
          previousStatus: declaration.status,
          isLocked: action === 'LOCK' ? true : action === 'UNLOCK' ? false : undefined,
        },
      })

      await tx.statusHistory.create({
        data: {
          declarationId,
          fromStatus: declaration.status,
          toStatus: nextStatus,
          operatorId,
          operatorName: operator.name,
          operatorRole: operator.role,
          comment,
        },
      })

      await tx.operationLog.create({
        data: {
          declarationId,
          userId: operatorId,
          action,
          targetType: 'DECLARATION',
          targetId: declarationId,
          details: JSON.stringify({
            fromStatus: declaration.status,
            toStatus: nextStatus,
            comment,
          }),
        },
      })

      if (nextStatus) {
        await this.updateTodoAndMessages(tx, declarationId, nextStatus, operatorId)
      }

      return updated
    })
  },

  async updateTodoAndMessages(tx, declarationId, status, operatorId) {
    const declaration = await tx.declaration.findUnique({
      where: { id: declarationId },
    })

    const todoTitle = this.getTodoTitle(status)
    const assigneeId = this.getAssigneeForStatus(status, declaration)

    if (assigneeId) {
      await tx.todoItem.create({
        data: {
          declarationId,
          assigneeId,
          title: todoTitle,
          actionType: this.getActionTypeForStatus(status),
          status: 'PENDING',
          priority: 1,
        },
      })

      await tx.message.create({
        data: {
          declarationId,
          receiverId: assigneeId,
          title: `新待办：${todoTitle}`,
          content: `报关单 ${declaration.mainOrderNo} 需要您处理`,
          msgType: 'TODO',
          isRead: false,
        },
      })
    }

    await tx.message.updateMany({
      where: {
        declarationId,
        receiverId: operatorId,
        msgType: 'TODO',
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    })

    await tx.todoItem.updateMany({
      where: {
        declarationId,
        assigneeId: operatorId,
        status: 'PENDING',
      },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })
  },

  getTodoTitle(status) {
    const titles = {
      [DeclarationStatus.PENDING_DATA_ENTRY]: '待录入资料',
      [DeclarationStatus.PENDING_CLASSIFICATION]: '待商品归类',
      [DeclarationStatus.PENDING_DECLARATION]: '待申报审核',
      [DeclarationStatus.PENDING_INSPECTION_TAX]: '待查验缴税',
    }
    return titles[status] || '待处理'
  },

  getActionTypeForStatus(status) {
    const types = {
      [DeclarationStatus.PENDING_DATA_ENTRY]: 'DATA_ENTRY',
      [DeclarationStatus.PENDING_CLASSIFICATION]: 'CLASSIFICATION',
      [DeclarationStatus.PENDING_DECLARATION]: 'DECLARATION',
      [DeclarationStatus.PENDING_INSPECTION_TAX]: 'INSPECTION_TAX',
    }
    return types[status] || 'PROCESS'
  },

  getAssigneeForStatus(status, declaration) {
    if (status === DeclarationStatus.PENDING_DATA_ENTRY) {
      return declaration.creatorId
    }
    return declaration.assigneeId || null
  },
}

export default stateMachine
