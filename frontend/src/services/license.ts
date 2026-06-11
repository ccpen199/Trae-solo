import { get, post, put } from '@/utils/request';
import type { License, ECardInfo, LicenseVerifyParams, LicenseIssueParams, ECardApplyParams } from '@/types/license';
import { mockLicenses, mockECardInfo } from '@/data/licenses';

export const getLicenseList = async (): Promise<License[]> => {
  console.log('[LicenseService] 获取证照列表');
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockLicenses;
};

export const getLicenseDetail = async (licenseId: string): Promise<License | null> => {
  console.log('[LicenseService] 获取证照详情', licenseId);
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockLicenses.find(l => l.id === licenseId) || null;
};

export const getECardInfo = async (): Promise<ECardInfo> => {
  console.log('[LicenseService] 获取电子社保卡信息');
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockECardInfo;
};

export const verifyLicense = async (params: LicenseVerifyParams): Promise<{ valid: boolean; message: string; license?: License }> => {
  console.log('[LicenseService] 验证证照', params.licenseNumber);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const license = mockLicenses.find(l => l.licenseNumber === params.licenseNumber);
  
  if (!license) {
    return { valid: false, message: '证照不存在' };
  }
  
  if (license.verifyCode !== params.verifyCode) {
    return { valid: false, message: '验证码不正确' };
  }
  
  if (license.status === 'expired') {
    return { valid: false, message: '证照已过期', license };
  }
  
  if (license.status === 'revoked') {
    return { valid: false, message: '证照已吊销', license };
  }
  
  return { valid: true, message: '证照有效', license };
};

export const applyECard = async (params: ECardApplyParams): Promise<{ success: boolean; message: string; cardNumber?: string }> => {
  console.log('[LicenseService] 申请电子社保卡', params.name);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const cardNumber = `621700${Date.now().toString().slice(-12)}`;
  
  return {
    success: true,
    message: '电子社保卡申请成功，将在3个工作日内完成制卡',
    cardNumber
  };
};

export const issueLicense = async (params: LicenseIssueParams): Promise<{ success: boolean; message: string; licenseId?: string }> => {
  console.log('[LicenseService] 签发证照', params.type);
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: true,
    message: '证照签发成功',
    licenseId: `license_${Date.now()}`
  };
};

export const activateECard = async (): Promise<{ success: boolean; message: string }> => {
  console.log('[LicenseService] 激活电子社保卡');
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: true,
    message: '电子社保卡激活成功'
  };
};

export const reportLoss = async (licenseId: string): Promise<{ success: boolean; message: string }> => {
  console.log('[LicenseService] 挂失证照', licenseId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    message: '挂失成功，请及时补办新卡'
  };
};

export const unreportLoss = async (licenseId: string): Promise<{ success: boolean; message: string }> => {
  console.log('[LicenseService] 解挂失照', licenseId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    message: '解挂成功，证照恢复正常使用'
  };
};

export const getLicenseUsageRecords = async (licenseId: string): Promise<any[]> => {
  console.log('[LicenseService] 获取证照使用记录', licenseId);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 'usage_001',
      usageScene: '医院就医',
      usageTime: '2026-06-05 09:30:00',
      usageLocation: '江苏省人民医院',
      operator: '门诊收费处',
      result: 'success'
    },
    {
      id: 'usage_002',
      usageScene: '药店购药',
      usageTime: '2026-06-01 14:20:00',
      usageLocation: '先声再康药店',
      operator: '药店收银员',
      result: 'success'
    }
  ];
};

export const showECardQRCode = async (): Promise<string> => {
  console.log('[LicenseService] 生成电子社保卡二维码');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return `ECARD_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
};
