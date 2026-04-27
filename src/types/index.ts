export type UserRole = 'CUSTOMER' | 'DESIGNER' | 'SPLITTER' | 'FACTORY' | 'INSTALLER' | 'ADMIN';

export type OrderStatus = 
  | 'DEMAND_SUBMITTED'
  | 'DEMAND_ASSIGNED'
  | 'MEASURING_SCHEDULED'
  | 'MEASURING_COMPLETED'
  | 'DESIGN_IN_PROGRESS'
  | 'DESIGN_SUBMITTED'
  | 'QUOTE_GENERATED'
  | 'QUOTE_CONFIRMED'
  | 'CONTRACT_SIGNED'
  | 'PAYMENT_RECEIVED'
  | 'SPLIT_IN_PROGRESS'
  | 'SPLIT_COMPLETED'
  | 'PRODUCTION_SCHEDULED'
  | 'PRODUCTION_IN_PROGRESS'
  | 'PRODUCTION_COMPLETED'
  | 'INSTALLATION_ASSIGNED'
  | 'INSTALLATION_SCHEDULED'
  | 'INSTALLATION_IN_PROGRESS'
  | 'INSTALLATION_COMPLETED'
  | 'ACCEPTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export type DemandStatus = 
  | 'PENDING_ASSIGNMENT'
  | 'ASSIGNED'
  | 'MEASURING'
  | 'MEASURED'
  | 'DESIGNING'
  | 'CONVERTED_TO_ORDER'
  | 'CANCELLED';

export type MeasurementStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'APPROVED';

export type DesignStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'REJECTED'
  | 'APPROVED';

export type QuoteStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'NEGOTIATING'
  | 'CONFIRMED'
  | 'REJECTED';

export type SplitStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'REVIEWING'
  | 'APPROVED'
  | 'REJECTED';

export type ProductionStatus = 
  | 'PENDING'
  | 'SCHEDULED'
  | 'IN_PRODUCTION'
  | 'QUALITY_CHECK'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'CANCELLED';

export type InstallationStatus = 
  | 'PENDING_ASSIGNMENT'
  | 'ASSIGNED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'REWORK_REQUIRED';

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  actorRole: UserRole;
  previousState: Record<string, any>;
  newState: Record<string, any>;
  changes: Record<string, { old: any; new: any }>;
  reason: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface OrderFlowContext {
  orderId: string;
  currentStatus: OrderStatus;
  previousStatus: OrderStatus | null;
  actorId: string;
  actorRole: UserRole;
  data: Record<string, any>;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface QuoteCalculationContext {
  orderId: string;
  designId: string;
  items: QuoteItem[];
  customerId: string;
  discounts: Discount[];
  additionalFees: AdditionalFee[];
}

export interface QuoteItem {
  id: string;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  materialCost: number;
  laborCost: number;
  hardwareCost: number;
  processCost: number;
  discountAmount: number;
  totalPrice: number;
  dimensions: Dimensions;
  material: MaterialInfo;
  hardware: HardwareInfo[];
  processSteps: ProcessStep[];
}

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
  unit: 'mm' | 'cm' | 'm';
}

export interface MaterialInfo {
  id: string;
  name: string;
  type: string;
  unitPrice: number;
  unit: string;
  supplierId: string;
}

export interface HardwareInfo {
  id: string;
  name: string;
  type: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplierId: string;
}

export interface ProcessStep {
  id: string;
  name: string;
  description: string;
  cost: number;
  duration: number;
  unit: 'hour' | 'day';
  department: string;
}

export interface Discount {
  id: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'VOLUME';
  amount: number;
  description: string;
  applicableTo: string[];
  conditions: DiscountCondition[];
}

export interface DiscountCondition {
  field: string;
  operator: string;
  value: any;
}

export interface AdditionalFee {
  id: string;
  type: 'DELIVERY' | 'INSTALLATION' | 'DESIGN' | 'OTHER';
  name: string;
  amount: number;
  description: string;
  taxable: boolean;
}

export interface SplitContext {
  orderId: string;
  designId: string;
  components: SplitComponent[];
  materialBom: MaterialBomItem[];
  hardwareBom: HardwareBomItem[];
  processingInstructions: ProcessingInstruction[];
}

export interface SplitComponent {
  id: string;
  name: string;
  type: string;
  quantity: number;
  dimensions: Dimensions;
  material: MaterialInfo;
  edgeBanding: EdgeBandingInfo;
  drilling: DrillingInfo[];
  grooving: GroovingInfo[];
  hardwarePositions: HardwarePosition[];
  parentComponentId: string | null;
  assemblyInstructions: string;
}

export interface EdgeBandingInfo {
  edges: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
  };
  material: string;
  thickness: number;
}

export interface DrillingInfo {
  id: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  diameter: number;
  depth: number;
  type: 'THROUGH' | 'BLIND';
  purpose: string;
}

export interface GroovingInfo {
  id: string;
  type: 'DADO' | 'TONGUE' | 'GROOVE';
  positionX: number;
  positionY: number;
  width: number;
  depth: number;
  length: number;
  orientation: 'HORIZONTAL' | 'VERTICAL';
}

export interface HardwarePosition {
  hardwareId: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  orientation: string;
  quantity: number;
}

export interface MaterialBomItem {
  id: string;
  materialId: string;
  materialName: string;
  dimensions: Dimensions;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  supplierId: string;
  allocation: string;
}

export interface HardwareBomItem {
  id: string;
  hardwareId: string;
  hardwareName: string;
  type: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplierId: string;
}

export interface ProcessingInstruction {
  id: string;
  componentId: string;
  stepNumber: number;
  operation: string;
  machine: string;
  parameters: Record<string, any>;
  duration: number;
  notes: string;
}

export interface InstallationAssignmentContext {
  orderId: string;
  customerAddress: Address;
  installationItems: InstallationItem[];
  preferredDate: Date | null;
  timeSlot: string | null;
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  specialRequirements: string[];
  estimatedDuration: number;
}

export interface Address {
  province: string;
  city: string;
  district: string;
  street: string;
  detail: string;
  postalCode: string;
  longitude: number;
  latitude: number;
}

export interface InstallationItem {
  id: string;
  name: string;
  type: string;
  quantity: number;
  weight: number;
  dimensions: Dimensions;
  specialInstructions: string;
  requiredTools: string[];
}

export interface InstallerInfo {
  id: string;
  name: string;
  phone: string;
  rating: number;
  skills: string[];
  availableTimeSlots: TimeSlot[];
  currentWorkload: number;
  maxWorkload: number;
  serviceArea: ServiceArea;
  averageCompletionTime: number;
}

export interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface ServiceArea {
  provinces: string[];
  cities: string[];
  districts: string[];
  priorityAreas: string[];
}

export interface InstallationAssignmentResult {
  installerId: string;
  installerName: string;
  scheduledDate: Date;
  timeSlot: string;
  estimatedStartTime: Date;
  estimatedEndTime: Date;
  score: number;
  reasoning: string;
}
