export type Role = 'PURCHASER' | 'WAREHOUSE_MANAGER' | 'PRODUCTION_LEADER' | 'QUALITY_INSPECTOR' | 'ADMIN'

export type OrderStatus = 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type InspectionStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'ISOLATED'

export type InventoryType = 'MATERIAL' | 'PRODUCT'

export type InventoryOpType = 'INBOUND' | 'OUTBOUND' | 'ADJUST'

export interface User {
  id: string
  username: string
  name: string
  role: Role
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: string
  code: string
  name: string
  contactPerson?: string
  contactPhone?: string
  address?: string
  remark?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Material {
  id: string
  code: string
  name: string
  specification?: string
  unit: string
  category?: string
  safetyStock: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MaterialBatch {
  id: string
  batchNo: string
  materialId: string
  supplierId?: string
  quantity: number
  unit: string
  productionDate?: string
  expiryDate?: string
  inboundDate: string
  operatorId: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  code: string
  name: string
  specification?: string
  unit: string
  category?: string
  safetyStock: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Bom {
  id: string
  code: string
  name: string
  productId: string
  version: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BomMaterial {
  id: string
  bomId: string
  materialId: string
  quantity: number
  unit: string
  lossRate: number
  sortOrder: number
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface WorkOrder {
  id: string
  orderNo: string
  productId: string
  plannedQty: number
  actualQty: number
  unit: string
  status: OrderStatus
  plannedStartDate?: string
  plannedEndDate?: string
  actualStartDate?: string
  actualEndDate?: string
  operatorId?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface WorkOrderProcess {
  id: string
  workOrderId: string
  processName: string
  processCode: string
  sortOrder: number
  plannedHours?: number
  actualHours?: number
  status: OrderStatus
  operatorId?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface MaterialRequisition {
  id: string
  requisitionNo: string
  workOrderId: string
  status: OrderStatus
  operatorId?: string
  approvedBy?: string
  approvedAt?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface MaterialRequisitionItem {
  id: string
  requisitionId: string
  materialId: string
  materialBatchId?: string
  requiredQty: number
  actualQty?: number
  unit: string
  bomRequired: boolean
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface ProductionRecord {
  id: string
  workOrderId: string
  processId?: string
  processName?: string
  productQty: number
  scrapQty: number
  unit: string
  operatorId: string
  equipmentId?: string
  equipmentName?: string
  remark?: string
  recordedAt: string
  createdAt: string
  updatedAt: string
}

export interface InspectionRecord {
  id: string
  inspectionNo: string
  workOrderId?: string
  productBatchId?: string
  inspectionType: string
  status: InspectionStatus
  inspectorId: string
  inspectionDate: string
  conclusion?: string
  isolatedReason?: string
  disposalPlan?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface InspectionItem {
  id: string
  inspectionId: string
  itemName: string
  itemCode?: string
  standardValue?: string
  actualValue?: string
  isPassed?: boolean
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface ProductBatch {
  id: string
  batchNo: string
  productId: string
  workOrderId?: string
  quantity: number
  unit: string
  productionDate: string
  expiryDate?: string
  inboundDate?: string
  isQualified: boolean
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface Inventory {
  id: string
  type: InventoryType
  materialId?: string
  productId?: string
  totalQty: number
  availableQty: number
  lockedQty: number
  unit: string
  lastUpdatedAt: string
  createdAt: string
  updatedAt: string
}

export interface InventoryLog {
  id: string
  inventoryId: string
  opType: InventoryOpType
  beforeQty: number
  changeQty: number
  afterQty: number
  unit: string
  referenceType?: string
  referenceId?: string
  remark?: string
  operatorId: string
  operatedAt: string
  createdAt: string
}

export interface Shipment {
  id: string
  shipmentNo: string
  customerName: string
  customerPhone?: string
  address?: string
  logisticsCompany?: string
  trackingNo?: string
  totalQty: number
  unit: string
  operatorId: string
  shippedAt: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface ShipmentItem {
  id: string
  shipmentId: string
  productBatchId: string
  quantity: number
  unit: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
