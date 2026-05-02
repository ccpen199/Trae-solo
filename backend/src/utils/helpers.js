import prisma from '../config/database.js'
import { DeclarationStatus } from '../config/constants.js'

export const generateMainOrderNo = async () => {
  const date = new Date()
  const year = date.getFullYear().toString()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const datePrefix = `${year}${month}${day}`

  const count = await prisma.declaration.count({
    where: {
      mainOrderNo: {
        startsWith: `CD${datePrefix}`,
      },
    },
  })

  const sequence = (count + 1).toString().padStart(4, '0')
  return `CD${datePrefix}${sequence}`
}

export const validateDeclaration = async (data, isUpdate = false) => {
  const errors = []

  const requiredFields = [
    { field: 'declarationType', label: '报关类型' },
    { field: 'tradeMode', label: '贸易方式' },
    { field: 'customsCode', label: '海关代码' },
    { field: 'iePort', label: '进出口岸' },
    { field: 'shipper', label: '发货人' },
    { field: 'consignee', label: '收货人' },
    { field: 'transportMode', label: '运输方式' },
  ]

  if (!isUpdate) {
    for (const { field, label } of requiredFields) {
      if (!data[field]) {
        errors.push(`${label}不能为空`)
      }
    }
  }

  if (data.mainOrderNo) {
    const existing = await prisma.declaration.findUnique({
      where: { mainOrderNo: data.mainOrderNo },
    })
    if (existing && !isUpdate) {
      errors.push('主单号已存在')
    }
  }

  if (data.items && data.items.length === 0) {
    errors.push('至少需要一条商品明细')
  }

  if (data.items) {
    for (const [index, item] of data.items.entries()) {
      if (!item.productName) {
        errors.push(`第${index + 1}条商品名称不能为空`)
      }
      if (item.quantity !== undefined && item.quantity <= 0) {
        errors.push(`第${index + 1}条商品数量必须大于0`)
      }
      if (item.unitPrice !== undefined && item.unitPrice <= 0) {
        errors.push(`第${index + 1}条商品单价必须大于0`)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const checkDuplicateDeclaration = async (data) => {
  const { billOfLadingNo, voyageNo, shipper, consignee } = data

  if (!billOfLadingNo) return { isDuplicate: false }

  const existing = await prisma.declaration.findFirst({
    where: {
      billOfLadingNo,
      status: {
        notIn: [DeclarationStatus.CANCELLED, DeclarationStatus.RELEASED_ARCHIVED],
      },
    },
  })

  if (existing) {
    return {
      isDuplicate: true,
      existingDeclaration: {
        id: existing.id,
        mainOrderNo: existing.mainOrderNo,
        status: existing.status,
      },
    }
  }

  return { isDuplicate: false }
}

export const checkPermission = (userRole, action, declarationStatus) => {
  const { RolePermissions } = require('../config/constants.js')
  const permissions = RolePermissions[userRole]

  if (!permissions) return false

  if (action === 'CREATE') return permissions.canCreate
  if (action === 'VIEW') return permissions.canView
  if (action === 'EDIT') {
    return permissions.canEdit?.includes('*') || permissions.canEdit?.includes(declarationStatus)
  }
  if (action === 'SUBMIT') return permissions.canSubmit
  if (action === 'APPROVE') return permissions.canApprove
  if (action === 'DELETE') return permissions.canDelete
  if (action === 'REASSIGN') return permissions.canReassign

  return true
}
