export interface Matter {
  id: string;
  matterCode: string;
  matterName: string;
  matterType: MatterType;
  applicantName: string;
  applicantIdCard: string;
  applicantPhone: string;
  applyTime: string;
  status: MatterStatus;
  currentNode: string;
  estimatedFinishTime: string;
  actualFinishTime?: string;
  acceptOrganization: string;
  handleOrganization: string;
  handler?: string;
  handlerPhone?: string;
  materials: MatterMaterial[];
  approvalNodes: ApprovalNode[];
  traceRecords: TraceRecord[];
  fee?: number;
  feePaid: boolean;
  paymentTime?: string;
  result?: string;
  resultFile?: string;
  isUrgent: boolean;
  isCrossProvince: boolean;
  crossProvinceInfo?: CrossProvinceInfo;
}

export type MatterType = 
  | 'pension_certification'
  | 'unemployment_registration'
  | 'title_declaration'
  | 'social_security_transfer'
  | 'labor_rights_protection'
  | 'ecard_apply'
  | 'other';

export type MatterStatus = 
  | 'draft'
  | 'submitted'
  | 'accepting'
  | 'accepted'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export interface MatterMaterial {
  id: string;
  name: string;
  type: 'required' | 'optional';
  format: 'image' | 'pdf' | 'other';
  fileUrl: string;
  uploadTime: string;
  verified: boolean;
  verifyTime?: string;
  verifyResult?: 'pass' | 'fail' | 'pending';
  verifyComment?: string;
}

export interface ApprovalNode {
  id: string;
  nodeName: string;
  nodeOrder: number;
  status: 'pending' | 'processing' | 'completed' | 'skipped';
  handler?: string;
  handleTime?: string;
  handleComment?: string;
  handleResult?: 'pass' | 'reject' | 'transfer';
  startTime?: string;
  endTime?: string;
  estimatedDuration: number;
}

export interface TraceRecord {
  id: string;
  operation: string;
  operator: string;
  operatorRole: string;
  operationTime: string;
  operationDetail: string;
  ipAddress?: string;
  deviceInfo?: string;
  previousStatus?: MatterStatus;
  currentStatus?: MatterStatus;
}

export interface CrossProvinceInfo {
  sourceProvince: string;
  sourceCity: string;
  targetProvince: string;
  targetCity: string;
  transferStatus: 'pending' | 'transferring' | 'transferred' | 'failed';
  transferTime?: string;
  receiveTime?: string;
  collaborationNodes: CollaborationNode[];
}

export interface CollaborationNode {
  id: string;
  province: string;
  city: string;
  organization: string;
  status: 'pending' | 'processing' | 'completed';
  handler?: string;
  handleTime?: string;
  remark?: string;
}

export interface MatterApplyParams {
  matterCode: string;
  matterName: string;
  matterType: MatterType;
  formData: Record<string, any>;
  materials: {
    name: string;
    type: 'required' | 'optional';
    format: string;
    fileUrl: string;
  }[];
  isUrgent: boolean;
  isCrossProvince: boolean;
  crossProvinceInfo?: {
    targetProvince: string;
    targetCity: string;
  };
}

export interface MatterQueryParams {
  status?: MatterStatus[];
  matterType?: MatterType[];
  startTime?: string;
  endTime?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface ServiceItem {
  id: string;
  serviceCode: string;
  serviceName: string;
  serviceType: string;
  category: string;
  description: string;
  handlingTime: string;
  handlingLocation: string;
  handlingMaterials: string[];
  handlingProcess: string[];
  handlingFee?: string;
  legalBasis: string;
  noticeItems: string[];
  hotLevel: number;
  isOnline: boolean;
  isCrossProvince: boolean;
  supportedProvinces?: string[];
  averageDuration: number;
  satisfaction: number;
  applyCount: number;
}

export interface ServiceCategory {
  id: string;
  categoryCode: string;
  categoryName: string;
  icon?: string;
  serviceCount: number;
  children?: ServiceCategory[];
}
