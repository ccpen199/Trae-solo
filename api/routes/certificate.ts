import { Router } from 'express';
import type { Request, Response } from 'express';
import { sendResponse, generateId } from '../utils';
import { mockCertificates } from '../../shared/mockData';
import type { Certificate, CertificateType } from '../../shared/types';

const router = Router();

let certificates = [...mockCertificates];

router.get('/', (req: Request, res: Response) => {
  const { userId, type, page = 1, pageSize = 10 } = req.query;
  let filtered = [...certificates];
  if (userId) filtered = filtered.filter(c => c.userId === userId);
  if (type) filtered = filtered.filter(c => c.type === type);
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const start = (Number(page) - 1) * Number(pageSize);
  const paged = filtered.slice(start, start + Number(pageSize));
  res.json(sendResponse({
    list: paged,
    total: filtered.length,
    page: Number(page),
    pageSize: Number(pageSize),
  }));
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const cert = certificates.find(c => c.id === id || c.certificateNo === id);
  if (!cert) return res.json(sendResponse(null, '凭证不存在', 404));
  res.json(sendResponse(cert));
});

router.post('/verify', (req: Request, res: Response) => {
  const { certificateNo, hash, qrCode } = req.body;
  const lookupId = certificateNo || (qrCode ? qrCode.split('/').pop() : null);
  const cert = certificates.find(c => c.certificateNo === lookupId || c.id === lookupId);
  setTimeout(() => {
    if (!cert) {
      return res.json(sendResponse({ valid: false, reason: '凭证编号不存在' }, 'ok', 0));
    }
    if (hash && hash !== cert.hash) {
      return res.json(sendResponse({ valid: false, reason: '哈希校验失败，凭证可能被篡改' }, 'ok', 0));
    }
    res.json(sendResponse({
      valid: true,
      certificate: cert,
      blockchainVerified: !!cert.blockchainTxId,
      blockchainTxId: cert.blockchainTxId,
      verifyTime: new Date().toISOString(),
    }));
  }, 600);
});

router.post('/generate', (req: Request, res: Response) => {
  const { userId, type, transactionId, title, content } = req.body;
  if (!userId || !type) {
    return res.json(sendResponse(null, '参数不完整', 400));
  }
  const now = new Date().toISOString();
  const dateStr = now.slice(0, 10).replace(/-/g, '');
  const newCert: Certificate = {
    id: generateId('C'),
    certificateNo: `SI${dateStr}${(type as CertificateType).slice(0, 2)}${Math.floor(100000 + Math.random() * 900000)}`,
    type: type as CertificateType,
    userId,
    transactionId,
    title: title || '电子凭证',
    content: content || {},
    timestamp: now,
    ipAddress: req.ip || '127.0.0.1',
    operatorName: '系统自动生成',
    hash: '0x' + Math.random().toString(16).slice(2, 34) + Math.random().toString(16).slice(2, 34),
    blockchainTxId: '0x' + Math.random().toString(16).slice(2, 18),
    pdfUrl: '#',
    qrCodeUrl: '#',
    verifyUrl: '#',
    createdAt: now,
  };
  certificates.unshift(newCert);
  res.json(sendResponse(newCert));
});

export default router;
