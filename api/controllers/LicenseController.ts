import { Response } from 'express';
import { LicenseService } from '../services/LicenseService.js';
import { AuthRequest } from '../middleware/auth.js';

const licenseService = new LicenseService();

export class LicenseController {
  static getMyLicenses(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }
    const licenses = licenseService.getUserLicenses(req.user.id);
    res.json(licenses);
  }

  static getLicenseById(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的ID' });
    }

    const license = licenseService.getLicenseById(id, req.user.id);
    if (!license) {
      return res.status(404).json({ error: '证照不存在或无权限访问' });
    }
    res.json(license);
  }

  static generateQrCode(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的ID' });
    }

    const qrCode = licenseService.generateQrCode(id, req.user.id);
    if (!qrCode) {
      return res.status(404).json({ error: '证照不存在或无权限访问' });
    }
    res.json(qrCode);
  }

  static getUsageRecords(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的ID' });
    }

    const records = licenseService.getUsageRecords(id, req.user.id);
    if (!records) {
      return res.status(404).json({ error: '证照不存在或无权限访问' });
    }
    res.json(records);
  }
}
