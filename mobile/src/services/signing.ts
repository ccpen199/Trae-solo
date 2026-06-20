import { request } from '@/utils/request';
import type { SignDocument, SignLog, EvidencePackage } from '@/types';
import { mockSignDocuments } from '@/data/mock';
import dayjs from 'dayjs';

export const getSignDocuments = async (status?: string): Promise<SignDocument[]> => {
  console.log('[SignService] 获取待签署文件，状态:', status);
  let docs = [...mockSignDocuments];
  if (status) {
    docs = docs.filter(d => d.status === status);
  }
  return docs;
};

export const getSignDocument = async (id: string): Promise<SignDocument> => {
  console.log('[SignService] 获取签署文件详情:', id);
  return mockSignDocuments.find(d => d.id === id) || mockSignDocuments[0];
};

export const getSignLogs = async (documentId: string): Promise<SignLog[]> => {
  console.log('[SignService] 获取签署操作日志:', documentId);
  return [
    {
      id: 'SL001',
      documentId,
      userId: 'U20240001',
      userName: '张三',
      action: 'view',
      timestamp: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      deviceInfo: 'iPhone 15 Pro, iOS 17.2',
      ip: '221.xxx.xxx.xxx',
      location: '江苏省南京市'
    },
    {
      id: 'SL002',
      documentId,
      userId: 'U20240001',
      userName: '张三',
      action: 'verify',
      timestamp: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      deviceInfo: 'iPhone 15 Pro, iOS 17.2',
      ip: '221.xxx.xxx.xxx',
      biometricType: 'face',
      biometricVerified: true,
      tsaTimestamp: dayjs().subtract(1, 'hour').add(3, 'second').format('YYYY-MM-DD HH:mm:ss'),
      tsaHash: 'SHA256:7F83B1657FF1FC53B92DC18148A1D65DFC2D4B1FA3D677284ADDD200126D9069'
    }
  ];
};

export const verifyBiometric = async (type: 'face' | 'fingerprint'): Promise<{ success: boolean; score: number }> => {
  console.log('[SignService] 生物特征核验:', type);
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, score: 98.5 };
};

export const signDocument = async (params: {
  documentId: string;
  positionIndex: number;
  signature?: string;
  useSeal?: boolean;
}): Promise<{ success: boolean; signLog: SignLog; tsaInfo: any }> => {
  console.log('[SignService] 执行电子签名，文档:', params.documentId, '位置:', params.positionIndex);
  await new Promise(resolve => setTimeout(resolve, 2000));
  const now = dayjs();
  const signLog: SignLog = {
    id: 'SL' + Date.now(),
    documentId: params.documentId,
    userId: 'U20240001',
    userName: '张三',
    action: 'sign',
    timestamp: now.format('YYYY-MM-DD HH:mm:ss'),
    deviceInfo: 'iPhone 15 Pro, iOS 17.2',
    ip: '221.xxx.xxx.xxx',
    biometricType: 'face',
    biometricVerified: true,
    tsaTimestamp: now.format('YYYY-MM-DD HH:mm:ss.SSS'),
    tsaHash: 'SHA256:' + Math.random().toString(16).slice(2).padEnd(64, '0')
  };
  return { success: true, signLog, tsaInfo: { ts: now.valueOf(), serialNumber: 'TSA' + Date.now() } };
};

export const downloadEvidence = async (applyId: string): Promise<EvidencePackage> => {
  console.log('[SignService] 下载证据包:', applyId);
  await new Promise(resolve => setTimeout(resolve, 1500));
  return {
    id: 'EP' + Date.now(),
    applyId,
    fileName: `证据包_${applyId}.zip`,
    fileHash: 'SHA256:' + Math.random().toString(16).slice(2).padEnd(64, '0'),
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    size: 2048576,
    items: ['签署文件原文.pdf', '签署日志.json', '时间戳验证报告.pdf', 'CA证书信息.pem']
  };
};
