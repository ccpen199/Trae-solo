import { UserRole, ConsultationStatus, PrescriptionStatus, PaymentStatus, MessageType, AuditActionType, FollowUpStatus, OrderStatus, Department, NotificationType } from './enums';

export interface IBaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface IUser extends IBaseEntity {
  username: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  profile: IUserProfile;
  isActive: boolean;
  lastLoginAt?: Date;
}

export interface IUserProfile {
  name: string;
  idCard?: string;
  gender?: 'MALE' | 'FEMALE';
  birthDate?: Date;
  avatarUrl?: string;
  address?: string;
}

export interface IDoctorProfile extends IUserProfile {
  licenseNumber: string;
  department: Department;
  title: string;
  hospital: string;
  specialties: string[];
  introduction: string;
  consultationFee: number;
  rating: number;
  totalConsultations: number;
  isAvailable: boolean;
}

export interface IPatientProfile extends IUserProfile {
  medicalHistory?: IMedicalRecord[];
  allergies?: string[];
  currentMedications?: string[];
  emergencyContact?: IContact;
}

export interface IMedicalRecord extends IBaseEntity {
  patientId: string;
  doctorId: string;
  consultationId: string;
  diagnosis: string;
  symptoms: string;
  examination?: string;
  treatment?: string;
  notes?: string;
  attachments?: IAttachment[];
}

export interface IConsultation extends IBaseEntity {
  patientId: string;
  doctorId?: string;
  department: Department;
  status: ConsultationStatus;
  title: string;
  description: string;
  attachments: IAttachment[];
  medicalHistory?: string;
  currentMedications?: string[];
  allergies?: string[];
  paymentId?: string;
  prescriptionId?: string;
  consultationFee: number;
  startTime?: Date;
  endTime?: Date;
  acceptedAt?: Date;
  timeoutAt?: Date;
  isTimeout?: boolean;
  returnReason?: string;
  returnBy?: string;
  returnAt?: Date;
  retryCount: number;
  lastRetryAt?: Date;
  supplementaryInfo?: ISupplementaryInfo;
  isReviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface ISupplementaryInfo {
  id: string;
  consultationId: string;
  supplementerId: string;
  supplementerRole: UserRole;
  fieldName: string;
  oldValue?: string;
  newValue: string;
  reason: string;
  supplementedAt: Date;
  isReviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface IAttachment {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploaderId: string;
  uploadedAt: Date;
}

export interface IPrescription extends IBaseEntity {
  consultationId: string;
  patientId: string;
  doctorId: string;
  pharmacistId?: string;
  status: PrescriptionStatus;
  items: IPrescriptionItem[];
  diagnosis: string;
  notes?: string;
  complianceCheckResult?: IComplianceCheckResult;
  reviewComment?: string;
  reviewedAt?: Date;
  returnReason?: string;
  returnBy?: string;
  returnAt?: Date;
  isDispensed: boolean;
  dispensedAt?: Date;
  logisticsOrderId?: string;
  retryCount: number;
  lastRetryAt?: Date;
}

export interface IPrescriptionItem {
  id: string;
  prescriptionId: string;
  drugName: string;
  drugCode: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  unit: string;
  price: number;
  instructions?: string;
  isControlled: boolean;
}

export interface IComplianceCheckResult {
  passed: boolean;
  checkedAt: Date;
  engineVersion: string;
  warnings: IComplianceWarning[];
  errors: IComplianceError[];
  drugInteractions?: IDrugInteraction[];
  contraindications?: IContraindication[];
  dosageWarnings?: IDosageWarning[];
}

export interface IComplianceWarning {
  code: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  drugName?: string;
}

export interface IComplianceError {
  code: string;
  severity: 'CRITICAL' | 'BLOCKING';
  message: string;
  drugName?: string;
  recommendation?: string;
}

export interface IDrugInteraction {
  drug1: string;
  drug2: string;
  interactionType: 'MILD' | 'MODERATE' | 'SEVERE';
  description: string;
  recommendation: string;
}

export interface IContraindication {
  drugName: string;
  condition: string;
  description: string;
  recommendation: string;
}

export interface IDosageWarning {
  drugName: string;
  currentDosage: string;
  recommendedDosage: string;
  reason: string;
}

export interface IPayment extends IBaseEntity {
  consultationId: string;
  patientId: string;
  doctorId: string;
  amount: number;
  consultationFee: number;
  prescriptionFee?: number;
  logisticsFee?: number;
  status: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  frozenTransactionId?: string;
  unfrozenTransactionId?: string;
  frozenAt?: Date;
  unfrozenAt?: Date;
  paidAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  refundReason?: string;
  settlementStatus?: 'PENDING' | 'SETTLED' | 'FAILED';
  settledAt?: Date;
  settlementTransactionId?: string;
  doctorShare?: number;
  platformShare?: number;
  taxFee?: number;
}

export interface IMessage extends IBaseEntity {
  consultationId: string;
  senderId: string;
  senderRole: UserRole;
  type: MessageType;
  content: string;
  attachments?: IAttachment[];
  formData?: IFormData;
  isRead: boolean;
  readAt?: Date;
  parentMessageId?: string;
  metadata?: Record<string, unknown>;
}

export interface IFormData {
  formId: string;
  formTitle: string;
  fields: IFormField[];
  submittedAt?: Date;
  isCompleted: boolean;
}

export interface IFormField {
  id: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'MULTI_SELECT' | 'CHECKBOX' | 'TEXTAREA';
  options?: string[];
  value?: string | string[] | number;
  isRequired: boolean;
  placeholder?: string;
}

export interface IAuditLog extends IBaseEntity {
  userId: string;
  userRole: UserRole;
  action: AuditActionType;
  resourceType: string;
  resourceId: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  consultationId?: string;
  prescriptionId?: string;
  paymentId?: string;
}

export interface IFollowUp extends IBaseEntity {
  consultationId: string;
  patientId: string;
  doctorId: string;
  status: FollowUpStatus;
  scheduledAt: Date;
  sentAt?: Date;
  completedAt?: Date;
  content: string;
  response?: string;
  responseAt?: Date;
  reminderType: 'SMS' | 'APP_PUSH' | 'EMAIL' | 'WECHAT';
  isAutoGenerated: boolean;
  retryCount: number;
  lastRetryAt?: Date;
}

export interface ILogisticsOrder extends IBaseEntity {
  consultationId: string;
  prescriptionId: string;
  patientId: string;
  status: OrderStatus;
  trackingNumber?: string;
  logisticsCompany?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  logisticsFee: number;
  items: ILogisticsItem[];
}

export interface ILogisticsItem {
  id: string;
  logisticsOrderId: string;
  prescriptionItemId: string;
  drugName: string;
  quantity: number;
  unit: string;
  batchNumber?: string;
  expirationDate?: Date;
}

export interface INotification extends IBaseEntity {
  userId: string;
  userRole: UserRole;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  readAt?: Date;
  consultationId?: string;
  prescriptionId?: string;
  paymentId?: string;
  followUpId?: string;
  metadata?: Record<string, unknown>;
}

export interface IContact {
  name: string;
  phone: string;
  relationship?: string;
}

export interface IServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: IServiceError;
  timestamp: Date;
  requestId?: string;
}

export interface IServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface IPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IWebSocketEvent {
  event: string;
  data: unknown;
  timestamp: Date;
}

export interface IConsultationCreatedEvent extends IWebSocketEvent {
  event: 'consultation:created';
  data: {
    consultationId: string;
    department: Department;
    patientId: string;
    title: string;
    consultationFee: number;
    createdAt: Date;
    timeoutAt: Date;
  };
}

export interface IConsultationAcceptedEvent extends IWebSocketEvent {
  event: 'consultation:accepted';
  data: {
    consultationId: string;
    doctorId: string;
    doctorName: string;
    acceptedAt: Date;
  };
}

export interface IConsultationTimeoutEvent extends IWebSocketEvent {
  event: 'consultation:timeout';
  data: {
    consultationId: string;
    patientId: string;
    timeoutAt: Date;
    refundAmount: number;
  };
}

export interface IMessageSentEvent extends IWebSocketEvent {
  event: 'message:sent';
  data: {
    consultationId: string;
    messageId: string;
    senderId: string;
    senderRole: UserRole;
    type: MessageType;
    content: string;
    sentAt: Date;
  };
}

export interface IPrescriptionReviewedEvent extends IWebSocketEvent {
  event: 'prescription:reviewed';
  data: {
    prescriptionId: string;
    consultationId: string;
    pharmacistId: string;
    status: PrescriptionStatus;
    reviewComment?: string;
    reviewedAt: Date;
  };
}

export interface IPaymentCompletedEvent extends IWebSocketEvent {
  event: 'payment:completed';
  data: {
    paymentId: string;
    consultationId: string;
    amount: number;
    paidAt: Date;
  };
}
