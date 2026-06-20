import { request } from '@/utils/request';
import type { RegistrationItem, ApplyRecord } from '@/types';
import { mockRegistrationItems, mockApplyRecords } from '@/data/mock';

export const getRegistrationItems = async (params?: { category?: string; keyword?: string }): Promise<RegistrationItem[]> => {
  console.log('[ApplyService] 获取登记事项列表，参数:', params);
  let items = [...mockRegistrationItems];
  if (params?.category) {
    items = items.filter(i => i.category === params.category);
  }
  if (params?.keyword) {
    const kw = params.keyword.toLowerCase();
    items = items.filter(i => i.name.toLowerCase().includes(kw) || i.code.toLowerCase().includes(kw));
  }
  return items;
};

export const createApply = async (itemId: string, formData: Record<string, any>): Promise<ApplyRecord> => {
  console.log('[ApplyService] 创建申请，事项ID:', itemId);
  await new Promise(resolve => setTimeout(resolve, 1500));
  const item = mockRegistrationItems.find(i => i.id === itemId);
  return {
    id: 'APP' + Date.now(),
    itemId,
    itemName: item?.name || '',
    itemCode: item?.code || '',
    applicantId: 'U20240001',
    applicantName: '张三',
    formData,
    materials: [],
    status: 'submitted',
    currentStep: 1,
    totalSteps: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvalNodes: []
  };
};

export const getApplyRecords = async (status?: string): Promise<ApplyRecord[]> => {
  console.log('[ApplyService] 获取申请列表，状态:', status);
  let records = [...mockApplyRecords];
  if (status) {
    records = records.filter(r => r.status === status);
  }
  return records;
};

export const getApplyDetail = async (id: string): Promise<ApplyRecord> => {
  console.log('[ApplyService] 获取申请详情:', id);
  return mockApplyRecords.find(r => r.id === id) || mockApplyRecords[0];
};

export const submitApply = async (id: string): Promise<ApplyRecord> => {
  console.log('[ApplyService] 提交申请:', id);
  await new Promise(resolve => setTimeout(resolve, 1000));
  const record = mockApplyRecords.find(r => r.id === id) || mockApplyRecords[0];
  return { ...record, status: 'submitted', currentStep: 1 };
};

export const getElectronicLicenses = async (): Promise<any[]> => {
  console.log('[ApplyService] 获取电子证照列表');
  return [];
};
