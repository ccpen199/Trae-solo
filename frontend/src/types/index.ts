export enum Role {
  DESIGNER = 'designer',
  PATTERN_MAKER = 'pattern_maker',
  PURCHASER = 'purchaser',
  FACTORY = 'factory',
  ADMIN = 'admin',
}

export enum StyleStatus {
  DRAFT = 'draft',
  PENDING_PATTERN = 'pending_pattern',
  PATTERN_IN_PROGRESS = 'pattern_in_progress',
  PATTERN_SUBMITTED = 'pattern_submitted',
  PENDING_CONFIRMATION = 'pending_confirmation',
  CONFIRMED = 'confirmed',
  BOM_GENERATED = 'bom_generated',
  PENDING_PURCHASE = 'pending_purchase',
  PURCHASE_IN_PROGRESS = 'purchase_in_progress',
  MATERIAL_READY = 'material_ready',
  PENDING_PRODUCTION = 'pending_production',
  PRODUCTION_IN_PROGRESS = 'production_in_progress',
  PRODUCTION_COMPLETED = 'production_completed',
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

export enum PatternStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  NEEDS_REVISION = 'needs_revision',
  ARCHIVED = 'archived',
}

export enum BomStatus {
  DRAFT = 'draft',
  GENERATED = 'generated',
  PENDING_REVIEW = 'pending_review',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  OBSOLETE = 'obsolete',
}

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  SENT_TO_SUPPLIER = 'sent_to_supplier',
  SUPPLIER_CONFIRMED = 'supplier_confirmed',
  IN_PRODUCTION = 'in_production',
  SHIPPED = 'shipped',
  PARTIALLY_RECEIVED = 'partially_received',
  FULLY_RECEIVED = 'fully_received',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

export enum ProductionOrderStatus {
  DRAFT = 'draft',
  PENDING_MATERIALS = 'pending_materials',
  MATERIALS_READY = 'materials_ready',
  PENDING_SCHEDULING = 'pending_scheduling',
  SCHEDULED = 'scheduled',
  IN_PRODUCTION = 'in_production',
  QUALITY_CHECK = 'quality_check',
  PENDING_SHIPMENT = 'pending_shipment',
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

export enum NotificationType {
  STYLE_CREATED = 'style_created',
  STYLE_STATUS_UPDATED = 'style_status_updated',
  PATTERN_ASSIGNED = 'pattern_assigned',
  PATTERN_SUBMITTED = 'pattern_submitted',
  PATTERN_CONFIRMED = 'pattern_confirmed',
  PATTERN_REJECTED = 'pattern_rejected',
  BOM_GENERATED = 'bom_generated',
  BOM_CONFIRMED = 'bom_confirmed',
  PURCHASE_ORDER_CREATED = 'purchase_order_created',
  PURCHASE_ORDER_UPDATED = 'purchase_order_updated',
  MATERIAL_RECEIVED = 'material_received',
  PRODUCTION_ORDER_ASSIGNED = 'production_order_assigned',
  PRODUCTION_PROGRESS_UPDATED = 'production_progress_updated',
  PRODUCTION_ISSUE_REPORTED = 'production_issue_reported',
  PRODUCTION_ISSUE_RESOLVED = 'production_issue_resolved',
  SHIPMENT_REQUESTED = 'shipment_requested',
  QUALITY_CHECK_COMPLETED = 'quality_check_completed',
  ORDER_COMPLETED = 'order_completed',
  COMMUNICATION_RECEIVED = 'communication_received',
  SYSTEM_ALERT = 'system_alert',
  REMINDER = 'reminder',
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: Role;
  phoneNumber?: string;
  avatarUrl?: string;
  department?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface LoginResult {
  accessToken: string;
  user: User;
}

export interface Style {
  id: string;
  styleNumber: string;
  name: string;
  styleCategory?: string;
  season?: string;
  year?: number;
  status: StyleStatus;
  targetGender?: string;
  ageGroup?: string;
  description?: string;
  effectImageUrls?: string[];
  detailImageUrls?: string[];
  sizeChartUrl?: string;
  sizeSpecs?: SizeSpec[];
  processRequirements?: string;
  detailNotes?: string;
  referenceNumber?: string;
  sampleSize?: string;
  estimatedProductionQuantity?: number;
  targetUnitCost?: number;
  targetRetailPrice?: number;
  priority: number;
  isArchived: boolean;
  isReusable: boolean;
  tags?: string[];
  designerId?: string;
  designer?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface SizeSpec {
  size: string;
  measurements: Record<string, number>;
}

export interface StyleHistory {
  id: string;
  styleId: string;
  operatorId?: string;
  operator?: User;
  oldStatus?: StyleStatus;
  newStatus: StyleStatus;
  actionType: string;
  actionDescription?: string;
  changedFields?: Record<string, { old: any; new: any }>;
  remarks?: string;
  attachmentUrls?: string[];
  createdAt: Date;
}

export interface Pattern {
  id: string;
  patternNumber: string;
  styleId: string;
  style?: Style;
  patternMakerId?: string;
  patternMaker?: User;
  status: PatternStatus;
  version: number;
  isLatest: boolean;
  parentPatternId?: string;
  patternFileUrls?: string[];
  measurementTableUrl?: string;
  measurements?: Measurement[];
  processSpecUrl?: string;
  processSpecs?: ProcessSpec[];
  patternPieces?: PatternPiece[];
  gradingRules?: GradingRule[];
  sizesAvailable?: string[];
  baseSize?: string;
  fabricWidth?: number;
  fabricConsumption?: number;
  liningConsumption?: number;
  interfacingConsumption?: number;
  estimatedMaterials?: EstimatedMaterial[];
  sewingDifficulty: number;
  estimatedSewingTime?: number;
  specialEquipment?: string[];
  qualityRequirements?: string;
  patternNotes?: string;
  submittedAt?: Date;
  confirmedAt?: Date;
  confirmedBy?: string;
  revisionNotes?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Measurement {
  name: string;
  code: string;
  baseSizeValue: number;
  unit: string;
  tolerance: number;
  description?: string;
}

export interface ProcessSpec {
  step: number;
  operation: string;
  equipment?: string;
  stitchType?: string;
  stitchCount?: number;
  seamAllowance?: number;
  notes?: string;
}

export interface PatternPiece {
  name: string;
  code: string;
  quantity: number;
  toBeCut: string;
  hasNotches: boolean;
  grainLine: string;
  mirrorImage: boolean;
  notes?: string;
}

export interface GradingRule {
  measurementCode: string;
  sizeDifferences: Record<string, number>;
}

export interface EstimatedMaterial {
  category: string;
  type: string;
  consumption: number;
  unit: string;
  notes?: string;
}

export interface Bom {
  id: string;
  bomNumber: string;
  styleId: string;
  style?: Style;
  patternId?: string;
  pattern?: Pattern;
  status: BomStatus;
  version: number;
  isLatest: boolean;
  parentBomId?: string;
  sizes?: string[];
  productionQuantity: number;
  bomType: string;
  generatedBy?: string;
  generatedAt?: Date;
  confirmedBy?: string;
  confirmedAt?: Date;
  totalFabricCost: number;
  totalAccessoryCost: number;
  totalLaborCost: number;
  totalCost: number;
  unitCost: number;
  notes?: string;
  specialInstructions?: string;
  tags?: string[];
  items?: BomItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BomItem {
  id: string;
  bomId: string;
  bom?: Bom;
  materialId?: string;
  material?: Material;
  lineNumber: number;
  itemType: string;
  category: string;
  materialCode?: string;
  name: string;
  specification?: string;
  color?: string;
  size?: string;
  unit: string;
  quantityPerUnit: number;
  wasteRate: number;
  totalQuantity: number;
  totalQuantityWithWaste: number;
  unitPrice: number;
  totalCost: number;
  currency: string;
  placement?: string;
  sizesApplicable?: string[];
  alternativeMaterials?: AlternativeMaterial[];
  supplierId?: string;
  supplierName?: string;
  leadTimeDays?: number;
  isCritical: boolean;
  isOptional: boolean;
  notes?: string;
  referenceImageUrl?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AlternativeMaterial {
  materialId: string;
  materialCode: string;
  name: string;
  priority: number;
  notes?: string;
}

export interface Material {
  id: string;
  materialCode: string;
  name: string;
  category: string;
  subCategory?: string;
  type?: string;
  specification?: string;
  composition?: string;
  weight?: number;
  weightUnit: string;
  width?: number;
  widthUnit: string;
  color?: string;
  colorCode?: string;
  pattern?: string;
  finish?: string;
  unit: string;
  minOrderQuantity: number;
  unitPrice: number;
  currency: string;
  supplierId?: string;
  supplierName?: string;
  supplierItemCode?: string;
  leadTimeDays?: number;
  safetyStock: number;
  reorderPoint: number;
  isActive: boolean;
  isObsolete: boolean;
  description?: string;
  careInstructions?: string;
  qualityStandards?: string;
  imageUrl?: string;
  attachmentUrls?: string[];
  tags?: string[];
  customAttributes?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  styleId?: string;
  style?: Style;
  bomId?: string;
  bom?: Bom;
  purchaserId?: string;
  purchaser?: User;
  status: PurchaseOrderStatus;
  supplierId?: string;
  supplierName: string;
  supplierContact?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  orderDate?: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  paymentTerms?: string;
  shippingMethod?: string;
  shippingAddress?: string;
  billingAddress?: string;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  isUrgent: boolean;
  priority: number;
  approvedBy?: string;
  approvedAt?: Date;
  sentToSupplierAt?: Date;
  supplierConfirmedAt?: Date;
  notes?: string;
  internalNotes?: string;
  tags?: string[];
  customAttributes?: Record<string, any>;
  items?: PurchaseOrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  purchaseOrder?: PurchaseOrder;
  materialId?: string;
  material?: Material;
  lineNumber: number;
  materialCode?: string;
  name: string;
  specification?: string;
  color?: string;
  unit: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityRejected: number;
  unitPrice: number;
  subtotal: number;
  currency: string;
  bomItemId?: string;
  supplierItemCode?: string;
  expectedDeliveryDate?: Date;
  isReceived: boolean;
  isCritical: boolean;
  notes?: string;
  customAttributes?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductionOrder {
  id: string;
  poNumber: string;
  styleId: string;
  style?: Style;
  bomId?: string;
  bom?: Bom;
  factoryId?: string;
  factory?: User;
  status: ProductionOrderStatus;
  orderQuantity: number;
  sizesBreakdown?: SizeBreakdown[];
  scheduledStartDate?: Date;
  scheduledEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  deliveryDate?: Date;
  productionLine?: string;
  workshop?: string;
  dailyProductionTarget?: number;
  quantityProduced: number;
  quantityQualityPassed: number;
  quantityRejected: number;
  progressPercentage: number;
  unitCost: number;
  totalCost: number;
  currency: string;
  isUrgent: boolean;
  priority: number;
  assignedBy?: string;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  shippedAt?: Date;
  shippingMethod?: string;
  trackingNumber?: string;
  notes?: string;
  specialInstructions?: string;
  tags?: string[];
  customAttributes?: Record<string, any>;
  progresses?: ProductionProgress[];
  issues?: ProductionIssue[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SizeBreakdown {
  size: string;
  quantity: number;
}

export interface ProductionProgress {
  id: string;
  productionOrderId: string;
  productionOrder?: ProductionOrder;
  reportedBy?: string;
  reporter?: User;
  stage: string;
  stageOrder: number;
  status: string;
  quantityStarted: number;
  quantityCompleted: number;
  quantityRejected: number;
  progressPercentage: number;
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletionAt?: Date;
  workstation?: string;
  operatorName?: string;
  dailyOutput?: number;
  notes?: string;
  imageUrls?: string[];
  customAttributes?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductionIssue {
  id: string;
  issueNumber: string;
  productionOrderId: string;
  productionOrder?: ProductionOrder;
  reportedBy?: string;
  reporter?: User;
  issueType: string;
  priority: number;
  stage?: string;
  title: string;
  description: string;
  rootCause?: string;
  impactAnalysis?: string;
  status: string;
  assigneeId?: string;
  assignee?: User;
  dueDate?: Date;
  reportedAt?: Date;
  resolvedAt?: string;
  closedAt?: Date;
  resolution?: string;
  preventiveMeasures?: string;
  imageUrls?: string[];
  attachmentUrls?: string[];
  estimatedDelayHours?: number;
  actualDelayHours?: number;
  costImpact?: number;
  tags?: string[];
  customAttributes?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  user?: User;
  type: NotificationType;
  title: string;
  message?: string;
  isRead: boolean;
  readAt?: Date;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  actionText?: string;
  senderId?: string;
  senderName?: string;
  priority: number;
  expiresAt?: Date;
  data?: Record<string, any>;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Communication {
  id: string;
  messageNumber: string;
  senderId: string;
  sender?: User;
  receiverId?: string;
  receiver?: User;
  communicationType: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedStyleId?: string;
  relatedStyle?: Style;
  subject: string;
  content: string;
  contentType: string;
  isRead: boolean;
  readAt?: Date;
  parentId?: string;
  threadId?: string;
  priority: number;
  category?: string;
  subCategory?: string;
  status: string;
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  attachmentUrls?: string[];
  imageUrls?: string[];
  tags?: string[];
  customAttributes?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
