import { get, post, put } from '@/utils/request';
import type { UserInfo, InsuranceInfo, UserProfileUpdateParams } from '@/types/user';
import { mockUserInfo, mockInsuranceInfo, mockFamilyMembers } from '@/data/user';

export const getUserInfo = async (): Promise<UserInfo> => {
  console.log('[UserService] 获取用户信息');
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockUserInfo;
};

export const getInsuranceInfo = async (): Promise<InsuranceInfo> => {
  console.log('[UserService] 获取参保信息');
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockInsuranceInfo;
};

export const updateUserProfile = async (params: UserProfileUpdateParams): Promise<{ success: boolean; message: string }> => {
  console.log('[UserService] 更新用户资料', params);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    message: '资料更新成功'
  };
};

export const getFamilyMembers = async () => {
  console.log('[UserService] 获取家庭成员');
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockFamilyMembers;
};

export const addFamilyMember = async (member: any): Promise<{ success: boolean; message: string; id?: string }> => {
  console.log('[UserService] 添加家庭成员', member.name);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    message: '添加成功',
    id: `member_${Date.now()}`
  };
};

export const updateAvatar = async (avatarUrl: string): Promise<{ success: boolean; message: string; avatarUrl?: string }> => {
  console.log('[UserService] 更新头像');
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: true,
    message: '头像更新成功',
    avatarUrl
  };
};

export const modifyPhone = async (newPhone: string, smsCode: string): Promise<{ success: boolean; message: string }> => {
  console.log('[UserService] 修改手机号', newPhone);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (smsCode !== '123456') {
    return {
      success: false,
      message: '验证码不正确'
    };
  }
  
  return {
    success: true,
    message: '手机号修改成功'
  };
};

export const getPensionBalance = async (): Promise<{ personalAccount: number; totalMonths: number; monthlyPension: number }> => {
  console.log('[UserService] 获取养老金余额');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    personalAccount: 128560.50,
    totalMonths: 186,
    monthlyPension: 3250.80
  };
};

export const getMedicalBalance = async (): Promise<{ personalAccount: number; overallAccount: number; thisYearExpense: number }> => {
  console.log('[UserService] 获取医保余额');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    personalAccount: 3560.25,
    overallAccount: 0,
    thisYearExpense: 1280.00
  };
};

export const getPaymentRecords = async (insuranceType: string, year?: number): Promise<any[]> => {
  console.log('[UserService] 获取缴费记录', insuranceType, year);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const months = ['01', '02', '03', '04', '05', '06'];
  const y = year || 2026;
  
  return months.map((m, i) => ({
    id: `pay_${y}${m}`,
    period: `${y}-${m}`,
    type: insuranceType,
    personalPayment: 325.60,
    companyPayment: 814.00,
    total: 1139.60,
    status: 'paid',
    payDate: `${y}-${m}-${10 + i}`
  }));
};
