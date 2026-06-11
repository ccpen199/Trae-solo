import { get, post, put, del } from '@/utils/request';
import type { Matter, MatterApplyParams, MatterQueryParams, ServiceItem, ServiceCategory } from '@/types/matter';
import { mockMatters, mockMatterStats, mockHotServices, mockServiceCategories, mockAllServices, mockHomeServices } from '@/data/services';

export { getCrossProvinceServices } from './crossProvince';

export const getMatterList = async (params?: MatterQueryParams): Promise<{ list: Matter[]; total: number }> => {
  console.log('[MatterService] 获取办件列表', params);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let list = [...mockMatters];
  
  if (params?.status?.length) {
    list = list.filter(m => params.status!.includes(m.status));
  }
  
  if (params?.matterType?.length) {
    list = list.filter(m => params.matterType!.includes(m.matterType));
  }
  
  if (params?.keyword) {
    const kw = params.keyword.toLowerCase();
    list = list.filter(m => 
      m.matterName.toLowerCase().includes(kw) ||
      m.matterCode.toLowerCase().includes(kw)
    );
  }
  
  return {
    list,
    total: list.length
  };
};

export const getMatterDetail = async (matterId: string): Promise<Matter | null> => {
  console.log('[MatterService] 获取办件详情', matterId);
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockMatters.find(m => m.id === matterId) || null;
};

export const getMatterStats = async () => {
  console.log('[MatterService] 获取办件统计');
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockMatterStats;
};

export const applyMatter = async (params: MatterApplyParams): Promise<{ success: boolean; message: string; matterId?: string; matterCode?: string }> => {
  console.log('[MatterService] 提交办件申请', params.matterName);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const matterId = `matter_${Date.now()}`;
  const matterCode = `${params.matterCode}_${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  
  return {
    success: true,
    message: '申请提交成功，请等待审核',
    matterId,
    matterCode
  };
};

export const cancelMatter = async (matterId: string): Promise<{ success: boolean; message: string }> => {
  console.log('[MatterService] 撤销办件', matterId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    message: '办件已撤销'
  };
};

export const getServiceList = async (category?: string): Promise<ServiceItem[]> => {
  console.log('[MatterService] 获取服务列表', category);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (category) {
    return mockAllServices.filter(s => s.category === category);
  }
  return mockAllServices;
};

export const getHotServices = async (limit: number = 8): Promise<ServiceItem[]> => {
  console.log('[MatterService] 获取热门服务');
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockHotServices.slice(0, limit);
};

export const getHomeServices = async (): Promise<ServiceItem[]> => {
  console.log('[MatterService] 获取首页服务');
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockHomeServices;
};

export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
  console.log('[MatterService] 获取服务分类');
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockServiceCategories;
};

export const getServiceDetail = async (serviceCode: string): Promise<ServiceItem | null> => {
  console.log('[MatterService] 获取服务详情', serviceCode);
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockAllServices.find(s => s.serviceCode === serviceCode) || null;
};

export const getMatterTrace = async (matterId: string) => {
  console.log('[MatterService] 获取办件溯源', matterId);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const matter = mockMatters.find(m => m.id === matterId);
  return matter?.traceRecords || [];
};

export const getApprovalNodes = async (matterId: string) => {
  console.log('[MatterService] 获取审批节点', matterId);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const matter = mockMatters.find(m => m.id === matterId);
  return matter?.approvalNodes || [];
};

export const uploadMatterMaterial = async (matterId: string, file: File | string): Promise<{ success: boolean; message: string; fileId?: string }> => {
  console.log('[MatterService] 上传办件材料', matterId);
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: true,
    message: '上传成功',
    fileId: `file_${Date.now()}`
  };
};

export const payMatterFee = async (matterId: string, amount: number): Promise<{ success: boolean; message: string; paymentNo?: string }> => {
  console.log('[MatterService] 缴纳办件费用', matterId, amount);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    success: true,
    message: '缴费成功',
    paymentNo: `PAY${Date.now()}`
  };
};

export const evaluateMatter = async (matterId: string, rating: number, comment: string): Promise<{ success: boolean; message: string }> => {
  console.log('[MatterService] 评价办件', matterId, rating);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    message: '感谢您的评价'
  };
};
