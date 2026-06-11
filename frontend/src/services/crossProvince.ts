import { get, post } from '@/utils/request';
import type { CrossProvinceService, ProvinceCoordinationNode, DataExchangeRecord } from '@/types/crossProvince';

const mockProvinces: ProvinceCoordinationNode[] = [
  {
    code: 'JS',
    name: '江苏省',
    status: 'active',
    endpoint: 'https://ggfw.jshrss.jiangsu.gov.cn/api',
    supportedServices: ['PENSION_CERT', 'SS_TRANSFER', 'TITLE_DECLARE', 'MEDICAL_REIMBURSEMENT'],
    responseTime: 120,
    lastSyncTime: '2026-06-08 07:00:00',
    load: 0.65,
    errorRate: 0.002
  },
  {
    code: 'SH',
    name: '上海市',
    status: 'active',
    endpoint: 'https://rsj.sh.gov.cn/api',
    supportedServices: ['PENSION_CERT', 'SS_TRANSFER', 'MEDICAL_REIMBURSEMENT'],
    responseTime: 85,
    lastSyncTime: '2026-06-08 07:05:00',
    load: 0.72,
    errorRate: 0.001
  },
  {
    code: 'ZJ',
    name: '浙江省',
    status: 'active',
    endpoint: 'https://rlsbt.zj.gov.cn/api',
    supportedServices: ['PENSION_CERT', 'SS_TRANSFER', 'TITLE_DECLARE', 'MEDICAL_REIMBURSEMENT'],
    responseTime: 95,
    lastSyncTime: '2026-06-08 06:55:00',
    load: 0.58,
    errorRate: 0.003
  },
  {
    code: 'AH',
    name: '安徽省',
    status: 'active',
    endpoint: 'https://hrss.ah.gov.cn/api',
    supportedServices: ['PENSION_CERT', 'SS_TRANSFER', 'MEDICAL_REIMBURSEMENT'],
    responseTime: 150,
    lastSyncTime: '2026-06-08 06:50:00',
    load: 0.45,
    errorRate: 0.005
  }
];

const mockCrossProvinceServices: CrossProvinceService[] = [
  {
    id: 'cps_001',
    serviceCode: 'PENSION_CERT_CROSS',
    serviceName: '养老待遇资格认证（长三角）',
    category: '养老保险',
    description: '长三角地区异地居住人员养老待遇资格认证',
    sourceProvince: 'JS',
    targetProvinces: ['SH', 'ZJ', 'AH'],
    supportedProvinces: ['江苏', '上海', '浙江', '安徽'],
    isOnline: true,
    averageProcessingTime: 2,
    successRate: 99.8,
    applyCount: 89650,
    satisfaction: 99.0,
    enableStatus: 'enabled',
    businessLine: 'pension'
  },
  {
    id: 'cps_002',
    serviceCode: 'SS_TRANSFER_CROSS',
    serviceName: '社保关系转移（长三角）',
    category: '养老保险',
    description: '长三角地区企业职工基本养老保险关系跨省转移接续',
    sourceProvince: 'JS',
    targetProvinces: ['SH', 'ZJ', 'AH', '全国'],
    supportedProvinces: ['全国'],
    isOnline: true,
    averageProcessingTime: 15,
    successRate: 98.5,
    applyCount: 67890,
    satisfaction: 94.2,
    enableStatus: 'enabled',
    businessLine: 'pension'
  },
  {
    id: 'cps_003',
    serviceCode: 'TITLE_DECLARE_CROSS',
    serviceName: '职称申报（长三角）',
    category: '职称评审',
    description: '长三角地区职称跨区域申报评审',
    sourceProvince: 'JS',
    targetProvinces: ['SH', 'ZJ'],
    supportedProvinces: ['江苏', '上海', '浙江'],
    isOnline: true,
    averageProcessingTime: 45,
    successRate: 92.0,
    applyCount: 12580,
    satisfaction: 90.5,
    enableStatus: 'enabled',
    businessLine: 'title'
  },
  {
    id: 'cps_004',
    serviceCode: 'MEDICAL_REIMBURSEMENT_CROSS',
    serviceName: '医保费用报销（长三角）',
    category: '医疗保险',
    description: '长三角地区异地就医医保费用直接结算',
    sourceProvince: 'JS',
    targetProvinces: ['SH', 'ZJ', 'AH'],
    supportedProvinces: ['长三角'],
    isOnline: true,
    averageProcessingTime: 5,
    successRate: 99.5,
    applyCount: 78960,
    satisfaction: 95.0,
    enableStatus: 'enabled',
    businessLine: 'medical'
  },
  {
    id: 'cps_005',
    serviceCode: 'UNEMPLOYMENT_CROSS',
    serviceName: '失业保险待遇申领（长三角）',
    category: '失业保险',
    description: '长三角地区失业保险关系跨省转移和待遇申领',
    sourceProvince: 'JS',
    targetProvinces: ['SH', 'ZJ', 'AH'],
    supportedProvinces: ['江苏', '上海', '浙江', '安徽'],
    isOnline: true,
    averageProcessingTime: 10,
    successRate: 97.5,
    applyCount: 34560,
    satisfaction: 93.0,
    enableStatus: 'enabled',
    businessLine: 'unemployment'
  }
];

const mockDataExchangeRecords: DataExchangeRecord[] = [
  {
    id: 'ex_001',
    sourceProvince: 'JS',
    targetProvince: 'SH',
    dataType: 'pension_cert',
    requestId: 'REQ202606080001',
    status: 'success',
    requestTime: '2026-06-08 09:30:00',
    responseTime: '2026-06-08 09:30:12',
    duration: 12,
    dataSize: 1024,
    businessNo: 'BZ20260608001',
    errorCode: null,
    errorMessage: null,
    encryptionMethod: 'SM2',
    transmissionMethod: 'HTTPS'
  },
  {
    id: 'ex_002',
    sourceProvince: 'SH',
    targetProvince: 'JS',
    dataType: 'ss_transfer',
    requestId: 'REQ202606080002',
    status: 'success',
    requestTime: '2026-06-08 10:15:00',
    responseTime: '2026-06-08 10:15:25',
    duration: 25,
    dataSize: 2048,
    businessNo: 'YB20260608001',
    errorCode: null,
    errorMessage: null,
    encryptionMethod: 'SM2',
    transmissionMethod: 'HTTPS'
  },
  {
    id: 'ex_003',
    sourceProvince: 'JS',
    targetProvince: 'ZJ',
    dataType: 'title_declare',
    requestId: 'REQ202606080003',
    status: 'processing',
    requestTime: '2026-06-08 11:00:00',
    responseTime: null,
    duration: 0,
    dataSize: 4096,
    businessNo: 'ZC20260608001',
    errorCode: null,
    errorMessage: null,
    encryptionMethod: 'SM2',
    transmissionMethod: 'HTTPS'
  }
];

export const getCoordinationNodes = async (): Promise<ProvinceCoordinationNode[]> => {
  console.log('[CrossProvinceService] 获取协同节点');
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockProvinces;
};

export const getCrossProvinceServices = async (): Promise<CrossProvinceService[]> => {
  console.log('[CrossProvinceService] 获取跨省通办服务');
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockCrossProvinceServices;
};

export const getDataExchangeRecords = async (): Promise<DataExchangeRecord[]> => {
  console.log('[CrossProvinceService] 获取数据交换记录');
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockDataExchangeRecords;
};

export const scheduleCrossProvinceTask = async (serviceCode: string, targetProvince: string, data: any): Promise<{ success: boolean; message: string; taskId?: string }> => {
  console.log('[CrossProvinceService] 调度跨省任务', serviceCode, targetProvince);
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: true,
    message: '任务已提交，正在协同处理中',
    taskId: `TASK_${Date.now()}`
  };
};

export const getCrossProvinceTaskStatus = async (taskId: string): Promise<{ status: string; message: string; progress: number; result?: any }> => {
  console.log('[CrossProvinceService] 查询跨省任务状态', taskId);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    status: 'processing',
    message: '正在与上海市人社部门数据同步中',
    progress: 65
  };
};

export const getCoordinationStats = async () => {
  console.log('[CrossProvinceService] 获取协同统计');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    todayTasks: 1256,
    todaySuccess: 1238,
    todayFail: 18,
    successRate: 98.57,
    averageResponseTime: 112,
    activeNodes: 4,
    totalServices: 5,
    monthlyTasks: 28560,
    dataExchangeVolume: 125.8
  };
};
