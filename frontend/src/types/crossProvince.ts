export interface CrossProvinceService {
  id: string;
  serviceCode: string;
  serviceName: string;
  description: string;
  sourceProvince: string;
  sourceCity: string;
  targetProvinces: string[];
  supportedCities: { province: string; cities: string[] }[];
  handlingTime: string;
  handlingMaterials: string[];
  handlingProcess: string[];
  handlingFee?: string;
  legalBasis: string;
  noticeItems: string[];
  isOnline: boolean;
  averageDuration: number;
  satisfaction: number;
  applyCount: number;
  collaborationNodes: CollaborationNodeConfig[];
}

export interface CollaborationNodeConfig {
  id: string;
  province: string;
  city: string;
  organization: string;
  organizationCode: string;
  contact: string;
  phone: string;
  address: string;
  businessHours: string;
  role: 'source' | 'target' | 'coordination';
  responsibilities: string[];
  interfaces: {
    name: string;
    code: string;
    description: string;
    status: 'available' | 'unavailable' | 'maintenance';
  }[];
}

export interface CrossProvinceApply {
  id: string;
  applyNo: string;
  serviceCode: string;
  serviceName: string;
  sourceProvince: string;
  sourceCity: string;
  targetProvince: string;
  targetCity: string;
  applicantName: string;
  applicantIdCard: string;
  applicantPhone: string;
  applyTime: string;
  status: CrossProvinceStatus;
  currentNode: string;
  formData: Record<string, any>;
  materials: CrossProvinceMaterial[];
  transferRecords: TransferRecord[];
  collaborationProgress: CollaborationProgress[];
  estimatedFinishTime: string;
  actualFinishTime?: string;
  result?: string;
  resultFile?: string;
  urgent: boolean;
}

export type CrossProvinceStatus = 
  | 'source_submitted'
  | 'source_reviewing'
  | 'source_approved'
  | 'data_transferring'
  | 'target_received'
  | 'target_reviewing'
  | 'target_approved'
  | 'result_transferring'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface CrossProvinceMaterial {
  id: string;
  name: string;
  type: 'required' | 'optional';
  format: 'image' | 'pdf' | 'other';
  fileUrl: string;
  uploadTime: string;
  crossRegionVerified: boolean;
  verifyTime?: string;
  verifyResult?: 'pass' | 'fail' | 'pending';
  transferStatus: 'not_transferred' | 'transferring' | 'transferred' | 'failed';
  transferTime?: string;
}

export interface TransferRecord {
  id: string;
  transferType: 'material' | 'data' | 'result' | 'notification';
  fromProvince: string;
  fromCity: string;
  fromOrganization: string;
  toProvince: string;
  toCity: string;
  toOrganization: string;
  transferTime: string;
  receiveTime?: string;
  status: 'transferring' | 'transferred' | 'failed' | 'confirmed';
  content?: string;
  fileUrls?: string[];
  remark?: string;
}

export interface CollaborationProgress {
  id: string;
  nodeId: string;
  province: string;
  city: string;
  organization: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  handler?: string;
  startTime?: string;
  endTime?: string;
  estimatedDuration: number;
  actualDuration?: number;
  comment?: string;
  operations: {
    operation: string;
    operator: string;
    time: string;
    detail: string;
  }[];
}

export interface ProvinceCity {
  provinceCode: string;
  provinceName: string;
  cities: {
    cityCode: string;
    cityName: string;
    supported: boolean;
  }[];
}

export interface CollaborationInterface {
  code: string;
  name: string;
  description: string;
  fromSystem: string;
  toSystem: string;
  status: 'available' | 'unavailable' | 'maintenance';
  lastCheckTime: string;
  responseTime: number;
  successRate: number;
}
