export interface User {
  id: string;
  name: string;
  idCardNo: string;
  phone: string;
  userType: 'individual' | 'enterprise';
  enterpriseName?: string;
  unifiedSocialCreditCode?: string;
  authToken: string;
  isVerified: boolean;
  authLevel: 'L1' | 'L2' | 'L3';
  avatarUrl?: string;
}

export interface CACertificate {
  id: string;
  userId: string;
  certSn: string;
  certType: 'SM2' | 'RSA';
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  status: 'active' | 'expired' | 'revoked';
  publicKey: string;
}

export interface FormField {
  key: string;
  label: string;
  type: 'input' | 'textarea' | 'select' | 'date' | 'radio' | 'checkbox' | 'upload' | 'license';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface RegistrationItem {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  estimatedDays: number;
  requiredMaterials: string[];
  formFields: FormField[];
  isHot: boolean;
  icon?: string;
}

export interface ApplyRecord {
  id: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  applicantId: string;
  applicantName: string;
  enterpriseName?: string;
  formData: Record<string, any>;
  materials: { name: string; url: string; fromLicense: boolean }[];
  status: 'draft' | 'submitted' | 'reviewing' | 'rejected' | 'approved' | 'completed';
  currentStep: number;
  totalSteps: number;
  createdAt: string;
  updatedAt: string;
  rejectReason?: RejectReason;
  approvalNodes: ApprovalNode[];
}

export interface ApprovalNode {
  id: string;
  name: string;
  role: string;
  assignee?: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  comment?: string;
  operatedAt?: string;
  level: number;
}

export interface RejectReason {
  category: string;
  reasons: { field: string; message: string; suggestion?: string }[];
  remark?: string;
  operator: string;
  rejectedAt: string;
}

export interface SignDocument {
  id: string;
  applyId: string;
  applyName: string;
  title: string;
  documentType: 'agreement' | 'application' | 'declaration' | 'certificate';
  content: string;
  fileUrl?: string;
  pages: number;
  signPositions: SignPosition[];
  requireSignerCount: number;
  status: 'pending' | 'signing' | 'completed';
  createdAt: string;
  deadline?: string;
}

export interface SignPosition {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  signerRole: string;
  signerName?: string;
  signedAt?: string;
  signature?: string;
  seal?: string;
}

export interface SignLog {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  action: 'view' | 'verify' | 'sign' | 'seal' | 'reject';
  timestamp: string;
  deviceInfo: string;
  ip: string;
  location?: string;
  biometricType?: 'face' | 'fingerprint';
  biometricVerified?: boolean;
  tsaTimestamp?: string;
  tsaHash?: string;
}

export interface EvidencePackage {
  id: string;
  applyId: string;
  fileName: string;
  fileHash: string;
  createdAt: string;
  size: number;
  items: string[];
}

export interface TodoItem {
  id: string;
  type: 'sign' | 'review' | 'reject' | 'complete' | 'remind';
  title: string;
  description: string;
  relatedId: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  isRead: boolean;
  deadline?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'policy' | 'notification';
  level: 'normal' | 'important' | 'urgent';
  publishedAt: string;
  publisher: string;
}

export interface ElectronicLicense {
  id: string;
  licenseType: string;
  licenseNo: string;
  holderName: string;
  issuer: string;
  issueDate: string;
  validFrom: string;
  validTo: string;
  status: 'valid' | 'expired' | 'invalid';
  imageUrl?: string;
  canBeShared: boolean;
}

export interface SignStep {
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed' | 'error';
  icon?: string;
}
