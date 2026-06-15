import { mockCertificates } from '../data/mockData';
import type { DigitalCertificate, CertificateType } from '../../shared/types';

export class IdentityService {
  async getCertificates(userId: string): Promise<DigitalCertificate[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockCertificates.map(cert => ({
      ...cert,
      qrCode: this.generateQRData(cert),
    }));
  }

  async getCertificateByType(userId: string, type: CertificateType): Promise<DigitalCertificate | null> {
    const certs = await this.getCertificates(userId);
    return certs.find(c => c.type === type) || null;
  }

  private generateQRData(cert: DigitalCertificate): string {
    const data = JSON.stringify({
      type: cert.type,
      number: cert.number,
      name: cert.name,
      timestamp: Date.now(),
    });
    return Buffer.from(data).toString('base64');
  }

  async verifyCertificate(certId: string): Promise<{ valid: boolean; message: string }> {
    const cert = mockCertificates.find(c => c.id === certId);
    if (!cert) {
      return { valid: false, message: '证照不存在' };
    }
    if (cert.status !== 'active') {
      return { valid: false, message: '证照状态异常' };
    }
    if (cert.expiryDate && new Date(cert.expiryDate) < new Date()) {
      return { valid: false, message: '证照已过期' };
    }
    return { valid: true, message: '证照验证通过' };
  }
}

export const identityService = new IdentityService();
