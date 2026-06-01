export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

export interface Customer {
  id: number;
  name: string;
  unifiedSocialCode: string;
  legalRepresentative: string;
  contactPerson: string;
  contactPhone: string;
  address?: string;
  industry?: string;
  registeredCapital?: number;
  establishedDate?: string;
  userId?: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    applications: number;
    materials: number;
    certificates: number;
    qualificationCerts: number;
  };
}

export interface PersonnelRequirement {
  id: number;
  productId: number;
  certificateType: string;
  count: number;
  level?: string;
  position?: string;
  workExperience?: number;
  description?: string;
}

export interface PerformanceRequirement {
  id: number;
  productId: number;
  projectType: string;
  count: number;
  amount?: number;
  description?: string;
}

export interface MaterialTemplate {
  id: number;
  productId: number;
  name: string;
  type: string;
  description?: string;
  isRequired: boolean;
  exampleUrl?: string;
}

export interface QualificationProduct {
  id: number;
  name: string;
  qualificationType: string;
  region: string;
  estimatedCycle: number;
  description?: string;
  price?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  personnelRequirements: PersonnelRequirement[];
  performanceRequirements: PerformanceRequirement[];
  materialTemplates: MaterialTemplate[];
  _count?: { applications: number };
}

export interface ProcessNode {
  id: number;
  applicationId: number;
  nodeType: string;
  nodeName: string;
  status: string;
  operatorId?: number;
  handleDate?: string;
  remark?: string;
  rejectReason?: string;
  createdAt: string;
  operator?: User;
}

export interface QualificationApplication {
  id: number;
  customerId: number;
  productId: number;
  status: string;
  applicationNo: string;
  applicantId?: number;
  auditorId?: number;
  estimatedDate?: string;
  actualDate?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  product: QualificationProduct;
  applicant?: User;
  auditor?: User;
  processNodes: ProcessNode[];
}

export interface PersonnelCertificate {
  id: number;
  customerId: number;
  applicationId?: number;
  name: string;
  idCard: string;
  certificateType: string;
  certificateNo: string;
  position?: string;
  professionalTitle?: string;
  issueDate: string;
  expireDate: string;
  issuingAuthority?: string;
  fileUrl?: string;
  status: string;
  isOccupied: boolean;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
}

export interface QualificationCertificate {
  id: number;
  customerId: number;
  applicationId: number;
  certificateNo: string;
  certificateName: string;
  qualificationType: string;
  issueDate: string;
  expireDate: string;
  issuingAuthority?: string;
  status: string;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
}

export interface CustomerMaterial {
  id: number;
  customerId: number;
  applicationId?: number;
  name: string;
  fileType: string;
  fileUrl: string;
  status: string;
  remark?: string;
  uploadedAt: string;
  customer: Customer;
  application?: QualificationApplication;
}

export interface TodoItem {
  id: number;
  title: string;
  description?: string;
  type: string;
  status: string;
  priority?: string;
  applicationId?: number;
  assigneeId?: number;
  creatorId?: number;
  dueDate?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: { id: number; name: string };
  creator?: { id: number; name: string };
  application?: {
    id: number;
    applicationNo: string;
    customer: { name: string };
    product: { name: string };
  };
}

export interface AnnualInspection {
  id: number;
  certificateId: number;
  inspectionDate: string;
  result: string;
  remark?: string;
  createdAt: string;
}

export interface RenewalRecord {
  id: number;
  certificateId: number;
  applicationDate: string;
  approvalDate?: string;
  newExpiryDate?: string;
  status: string;
  remark?: string;
  createdAt: string;
}
