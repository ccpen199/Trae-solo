import jwt from 'jsonwebtoken';
import { LicenseRepository } from '../repositories/LicenseRepository.js';
import { License, LicenseUsageRecord, QrCodeResponse } from '../types/index.js';

const licenseRepository = new LicenseRepository();

export class LicenseService {
  getUserLicenses(userId: number): License[] {
    return licenseRepository.findByUserId(userId);
  }

  getLicenseById(id: number, userId: number): License | undefined {
    const license = licenseRepository.findById(id);
    if (license && license.userId === userId) {
      return license;
    }
    return undefined;
  }

  generateQrCode(licenseId: number, userId: number): QrCodeResponse | null {
    const license = this.getLicenseById(licenseId, userId);
    if (!license) {
      return null;
    }

    const secret = process.env.JWT_SECRET || 'default-secret';
    const expiresAt = Date.now() + 5 * 60 * 1000;
    
    const payload = {
      licenseId,
      licenseType: license.licenseType,
      licenseNumber: license.licenseNumber,
      holderName: license.holderName,
      expiresAt,
    };

    const token = jwt.sign(payload, secret, { expiresIn: '5m' as any });

    const qrData = JSON.stringify({
      token,
      licenseType: license.licenseType,
      licenseNumber: license.licenseNumber,
      holderName: license.holderName,
      issuer: license.issuer,
    });

    licenseRepository.addUsageRecord({
      licenseId,
      usedBy: '用户本人',
      purpose: '生成亮证二维码',
      location: '安徽省政务服务平台',
    });

    return {
      token,
      qrDataUrl: qrData,
      expiresAt,
    };
  }

  getUsageRecords(licenseId: number, userId: number): LicenseUsageRecord[] | null {
    const license = this.getLicenseById(licenseId, userId);
    if (!license) {
      return null;
    }
    return licenseRepository.getUsageRecords(licenseId);
  }

  getAvailableLicensesForMaterial(userId: number, licenseType: string): License | undefined {
    return licenseRepository.findByUserIdAndType(userId, licenseType);
  }
}
