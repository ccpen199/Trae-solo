export interface User {
  id: string
  username: string
  name: string
  role: UserRole
  department?: string
  email?: string
  phone?: string
  isActive: boolean
  createdAt: string
}

export type UserRole = 
  | 'DECLARANT'
  | 'CARGO_OWNER'
  | 'CUSTOMS'
  | 'FORWARDER'
  | 'TAX'
  | 'ADMIN'

export type DeclarationStatus =
  | 'DRAFT'
  | 'PENDING_DATA_ENTRY'
  | 'PENDING_CLASSIFICATION'
  | 'PENDING_DECLARATION'
  | 'PENDING_INSPECTION_TAX'
  | 'RELEASED_ARCHIVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXCEPTION'

export type DocumentType =
  | 'INVOICE'
  | 'PACKING_LIST'
  | 'BILL_OF_LADING'
  | 'CERTIFICATE_OF_ORIGIN'
  | 'INSPECTION_CERTIFICATE'
  | 'OTHER'

export type InspectionResult =
  | 'PASSED'
  | 'FAILED'
  | 'NEED_SUPPLEMENT'
  | 'TRANSFERRED'

export interface Declaration {
  id: string
  mainOrderNo: string
  status: DeclarationStatus
  previousStatus?: DeclarationStatus
  
  declarationType: string
  tradeMode: string
  customsCode: string
  iePort: string
  
  shipper: string
  consignee: string
  notifyParty?: string
  
  transportMode: string
  voyageNo?: string
  billOfLadingNo?: string
  
  entryDate?: string
  expectedDate?: string
  actualDate?: string
  
  creatorId: string
  assigneeId?: string
  lockedBy?: string
  lockedAt?: string
  
  totalValue?: number
  totalTax?: number
  currency?: string
  
  isLocked: boolean
  
  createdAt: string
  updatedAt: string
  
  creator?: User
  assignee?: User
  items?: DeclarationItem[]
  documents?: Document[]
  taxes?: TaxRecord[]
  inspections?: Inspection[]
  statusHistory?: StatusHistory[]
  operationLogs?: OperationLog[]
}

export interface DeclarationItem {
  id: string
  declarationId: string
  lineNo: number
  
  hsCode?: string
  productName: string
  specification?: string
  originCountry?: string
  
  quantity?: number
  unit?: string
  unitPrice?: number
  totalAmount?: number
  currency?: string
  
  taxRate?: number
  taxAmount?: number
  
  status: DeclarationStatus
  
  createdAt: string
  updatedAt: string
}

export interface Document {
  id: string
  declarationId: string
  docType: DocumentType
  docNo?: string
  title: string
  description?: string
  
  filePath?: string
  fileType?: string
  fileSize?: number
  
  isLocked: boolean
  verified: boolean
  verifiedBy?: string
  verifiedAt?: string
  
  createdAt: string
  updatedAt: string
}

export interface TaxRecord {
  id: string
  declarationId: string
  itemId?: string
  
  taxType: string
  taxBase?: number
  taxRate?: number
  taxAmount: number
  
  currency: string
  exchangeRate?: number
  
  paidStatus: string
  paidAt?: string
  paymentRef?: string
  
  createdAt: string
  updatedAt: string
}

export interface Inspection {
  id: string
  declarationId: string
  inspectionNo: string
  
  inspectionType: string
  inspector?: string
  inspectionDate?: string
  
  result?: InspectionResult
  conclusion?: string
  
  needSupplement: boolean
  supplementItems?: string
  
  createdAt: string
  updatedAt: string
}

export interface StatusHistory {
  id: string
  declarationId: string
  fromStatus?: DeclarationStatus
  toStatus: DeclarationStatus
  
  operatorId: string
  operatorName: string
  operatorRole: UserRole
  
  reason?: string
  comment?: string
  
  createdAt: string
}

export interface OperationLog {
  id: string
  declarationId?: string
  userId: string
  
  action: string
  targetType?: string
  targetId?: string
  
  details?: string
  ipAddress?: string
  
  createdAt: string
  user?: User
}

export interface TodoItem {
  id: string
  declarationId: string
  assigneeId: string
  
  title: string
  description?: string
  actionType: string
  
  status: string
  priority: number
  
  dueDate?: string
  completedAt?: string
  
  createdAt: string
  updatedAt: string
  
  assignee?: User
  declaration?: {
    id: string
    mainOrderNo: string
    status: DeclarationStatus
    shipper: string
    consignee: string
  }
}

export interface Message {
  id: string
  declarationId?: string
  receiverId: string
  
  title: string
  content?: string
  msgType: string
  
  isRead: boolean
  readAt?: string
  
  createdAt: string
  
  declaration?: {
    id: string
    mainOrderNo: string
    status: DeclarationStatus
  }
}

export interface SuccessResponse<T> {
  success: true
  data: T
}

export interface ErrorResponse {
  success: false
  errors: string[]
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse

export interface PaginatedResponse<T> {
  total: number
  page: number
  pageSize: number
  totalPages: number
  items: T[]
}
