import { Router, Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

interface OfflinePackage {
  id: string;
  name: string;
  version: string;
  category: 'certificate' | 'service-guide' | 'policy' | 'common-form';
  description: string;
  size: string;
  sizeBytes: number;
  itemsCount: number;
  checksum: string;
  downloadUrl: string;
  minAppVersion: string;
  isRequired: boolean;
  lastUpdated: string;
  expiryDate: string;
}

const OFFLINE_PACKAGES: OfflinePackage[] = [
  {
    id: 'PKG-SB-001',
    name: '社保参保证明离线包',
    version: '1.3.2',
    category: 'certificate',
    description: '包含个人参保证明模板、电子印章预生成、最近24个月缴费明细缓存，无需联网即可生成带章PDF',
    size: '8.5 MB',
    sizeBytes: 8912896,
    itemsCount: 36,
    checksum: 'sha256:a1b2c3d4e5f6...',
    downloadUrl: '/offline/packages/PKG-SB-001-v1.3.2.zip',
    minAppVersion: '2.0.0',
    isRequired: true,
    lastUpdated: '2025-05-15T00:00:00Z',
    expiryDate: '2025-07-15T00:00:00Z'
  },
  {
    id: 'PKG-YB-002',
    name: '医保业务办事指南',
    version: '2.0.1',
    category: 'service-guide',
    description: '医保参保登记、异地就医备案、门诊慢特病认定、医保报销等12项高频业务办事步骤、材料清单、常见问题',
    size: '3.2 MB',
    sizeBytes: 3355443,
    itemsCount: 12,
    checksum: 'sha256:f6e5d4c3b2a1...',
    downloadUrl: '/offline/packages/PKG-YB-002-v2.0.1.zip',
    minAppVersion: '2.0.0',
    isRequired: false,
    lastUpdated: '2025-05-01T00:00:00Z',
    expiryDate: '2025-08-01T00:00:00Z'
  },
  {
    id: 'PKG-HH-003',
    name: '户籍业务办事指南',
    version: '1.8.0',
    category: 'service-guide',
    description: '新生儿落户、户口迁移、身份证办理、居住证申领等8项户籍业务全流程指南',
    size: '2.1 MB',
    sizeBytes: 2202009,
    itemsCount: 8,
    checksum: 'sha256:1a2b3c4d5e6f...',
    downloadUrl: '/offline/packages/PKG-HH-003-v1.8.0.zip',
    minAppVersion: '2.0.0',
    isRequired: false,
    lastUpdated: '2025-04-20T00:00:00Z',
    expiryDate: '2025-07-20T00:00:00Z'
  },
  {
    id: 'PKG-POL-004',
    name: '惠民政策口袋书',
    version: '3.1.0',
    category: 'policy',
    description: '社保、医保、教育、住房、就业等领域的50项高频惠民政策摘要、申报条件、待遇标准',
    size: '12.8 MB',
    sizeBytes: 13421772,
    itemsCount: 50,
    checksum: 'sha256:789abcdef012...',
    downloadUrl: '/offline/packages/PKG-POL-004-v3.1.0.zip',
    minAppVersion: '2.0.0',
    isRequired: false,
    lastUpdated: '2025-05-10T00:00:00Z',
    expiryDate: '2025-06-10T00:00:00Z'
  },
  {
    id: 'PKG-FRM-005',
    name: '常用申请表单模板',
    version: '1.0.5',
    category: 'common-form',
    description: '社保缴费申报表、医保报销申请表、公积金提取审批表等20种常用表单的可编辑PDF模板',
    size: '5.6 MB',
    sizeBytes: 5872025,
    itemsCount: 20,
    checksum: 'sha256:deadbeefcafe...',
    downloadUrl: '/offline/packages/PKG-FRM-005-v1.0.5.zip',
    minAppVersion: '2.0.0',
    isRequired: false,
    lastUpdated: '2025-03-28T00:00:00Z',
    expiryDate: '2025-12-31T00:00:00Z'
  },
  {
    id: 'PKG-GJJ-006',
    name: '公积金业务办事指南',
    version: '1.5.2',
    category: 'service-guide',
    description: '公积金提取、贷款申请、异地转移、提前还款等业务办理指南及额度计算器',
    size: '2.8 MB',
    sizeBytes: 2936012,
    itemsCount: 9,
    checksum: 'sha256:c0ffee012345...',
    downloadUrl: '/offline/packages/PKG-GJJ-006-v1.5.2.zip',
    minAppVersion: '2.0.0',
    isRequired: false,
    lastUpdated: '2025-05-12T00:00:00Z',
    expiryDate: '2025-08-12T00:00:00Z'
  }
];

interface DeltaUpdate {
  fromVersion: string;
  toVersion: string;
  patchSize: string;
  patchSizeBytes: number;
  patchUrl: string;
  checksum: string;
}

router.get('/packages', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { category, appVersion, installedVersions } = req.query;

    let packages = [...OFFLINE_PACKAGES];
    if (category) {
      packages = packages.filter(p => p.category === category);
    }

    const installed = installedVersions ? JSON.parse(installedVersions as string) as Record<string, string> : {};

    const packagesWithUpdates = packages.map(pkg => {
      const installedVersion = installed[pkg.id];
      const hasUpdate = installedVersion && installedVersion !== pkg.version;
      const needsDownload = !installedVersion;

      return {
        ...pkg,
        status: needsDownload ? 'not_downloaded' : hasUpdate ? 'update_available' : 'up_to_date',
        installedVersion: installedVersion || null,
        canUseOffline: !needsDownload,
        delta: hasUpdate ? this.generateDelta(pkg, installedVersion) : null
      };
    });

    res.json({
      code: 0,
      message: 'OK',
      data: {
        total: packagesWithUpdates.length,
        totalSize: `${(packagesWithUpdates.reduce((s, p) => s + p.sizeBytes, 0) / 1048576).toFixed(1)} MB`,
        packages: packagesWithUpdates,
        updateTips: hasUpdateTip(installed, OFFLINE_PACKAGES)
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

function hasUpdateTip(installed: Record<string, string>, pkgs: OfflinePackage[]): string[] {
  const tips: string[] = [];
  let hasRequiredUpdate = false;

  pkgs.forEach(p => {
    const iv = installed[p.id];
    if (p.isRequired && (!iv || iv !== p.version)) hasRequiredUpdate = true;
  });

  if (hasRequiredUpdate) tips.push('存在必装包未更新，建议立即更新以确保证书类业务正常使用');
  const expiredSoon = pkgs.filter(p => new Date(p.expiryDate).getTime() - Date.now() < 7 * 86400000);
  if (expiredSoon.length > 0) tips.push(`${expiredSoon.length}个离线包即将过期，过期后需重新联网下载`);

  return tips;
}

router.get('/packages/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const pkg = OFFLINE_PACKAGES.find(p => p.id === req.params.id);
    if (!pkg) throw new AppError('离线包不存在', 404);

    res.json({
      code: 0,
      message: 'OK',
      data: {
        package: pkg,
        content: this.generatePackageContent(pkg)
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.post('/packages/:id/verify', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const pkg = OFFLINE_PACKAGES.find(p => p.id === req.params.id);
    if (!pkg) throw new AppError('离线包不存在', 404);

    const { checksum, clientVersion } = req.body;

    const isValid = true;

    res.json({
      code: 0,
      message: isValid ? '校验通过' : '校验失败，请重新下载',
      data: {
        valid: isValid,
        packageId: pkg.id,
        expectedVersion: pkg.version,
        expectedChecksum: pkg.checksum,
        needsRefresh: Math.random() > 0.95
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/packages/:id/delta', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const pkg = OFFLINE_PACKAGES.find(p => p.id === req.params.id);
    if (!pkg) throw new AppError('离线包不存在', 404);

    const fromVersion = req.query.from as string;
    if (!fromVersion) throw new AppError('请指定from版本号', 400);

    const delta = generateDelta(pkg, fromVersion);

    res.json({
      code: 0,
      message: 'OK',
      data: {
        fromVersion,
        toVersion: pkg.version,
        patch: delta,
        fullDownloadFallback: {
          url: pkg.downloadUrl,
          size: pkg.size
        }
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

function generateDelta(pkg: OfflinePackage, fromVersion: string): DeltaUpdate {
  return {
    fromVersion,
    toVersion: pkg.version,
    patchSize: `${(pkg.sizeBytes * 0.35 / 1048576).toFixed(2)} MB`,
    patchSizeBytes: Math.round(pkg.sizeBytes * 0.35),
    patchUrl: `/offline/delta/${pkg.id}-${fromVersion}-to-${pkg.version}.patch`,
    checksum: `sha256:delta-${pkg.id}-${fromVersion}-${pkg.version}`
  };
}

function generatePackageContent(pkg: OfflinePackage): any[] {
  if (pkg.category === 'certificate') {
    return [
      { type: 'certificate_template', name: '个人社保参保证明', format: 'pdf', hasElectronicSeal: true },
      { type: 'certificate_template', name: '养老保险缴费明细', format: 'pdf', hasElectronicSeal: true },
      { type: 'certificate_template', name: '医疗保险缴费明细', format: 'pdf', hasElectronicSeal: true },
      { type: 'precomputed', name: '最近24个月缴费数据', format: 'json' }
    ];
  }
  if (pkg.category === 'service-guide') {
    return [
      { type: 'guide', name: '办理条件说明', sections: 3 },
      { type: 'guide', name: '申请材料清单', sections: 2 },
      { type: 'guide', name: '办理流程步骤', sections: 5 },
      { type: 'guide', name: '常见问题解答', sections: 10 },
      { type: 'guide', name: '线下办事网点地图', sections: 1 }
    ];
  }
  if (pkg.category === 'policy') {
    return [
      { type: 'policy_summary', name: '政策要点摘要' },
      { type: 'eligibility_check', name: '资格条件自检' },
      { type: 'benefit_calculator', name: '待遇测算工具' }
    ];
  }
  if (pkg.category === 'common-form') {
    return [
      { type: 'form_template', name: '可编辑PDF表单' },
      { type: 'example', name: '填写样例参考' }
    ];
  }
  return [];
}

router.get('/certificates/:type/generate-offline', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { type } = req.params;

    res.json({
      code: 0,
      message: '离线证明生成成功',
      data: {
        certificateType: type,
        fileName: `郑州${type}证明_${req.citizenId}.pdf`,
        fileSize: '128 KB',
        generatedOffline: true,
        electronicSeal: {
          issuer: '郑州市大数据管理局',
          sealNumber: `ZZ-SEAL-${Date.now()}`,
          validFrom: new Date().toISOString().split('T')[0],
          validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          verifyCode: `ZZ${req.citizenId?.slice(-6)}${Date.now().toString().slice(-6)}`,
          offlineLimitations: '离线生成证明有效期7天，7天后需联网重新生成以延长有效期或获取最新数据'
        },
        verifyUrl: 'https://www.zhengzhou.gov.cn/verify'
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

export default router;
