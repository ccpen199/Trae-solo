import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DataAsset, AssetType } from '../entities/data-asset.entity';

export interface AssetSummaryItem {
  assetType: AssetType;
  assetTypeName: string;
  count: number;
  totalAmount?: Record<string, any>;
  lastUpdated?: Date;
}

export interface DashboardSummary {
  totalAssetCount: number;
  assetCategories: AssetSummaryItem[];
  syncedCount: number;
  pendingSyncCount: number;
  lastSyncTime?: Date;
}

const ASSET_TYPE_NAMES: Record<AssetType, string> = {
  cert: '电子证照',
  social_security: '社会保险',
  housing_fund: '住房公积金',
  tax: '税务信息',
  medical: '医疗保险',
  education: '教育信息',
  transport: '交通出行',
};

@Injectable()
export class DataAssetService {
  private readonly logger = new Logger(DataAssetService.name);

  constructor(
    @InjectRepository(DataAsset)
    private readonly dataAssetRepo: Repository<DataAsset>,
  ) {}

  async getDashboardSummary(userId: string): Promise<DashboardSummary> {
    const assets = await this.dataAssetRepo.find({
      where: { userId },
    });

    const categoryMap = new Map<AssetType, AssetSummaryItem>();

    for (const type of Object.keys(ASSET_TYPE_NAMES) as AssetType[]) {
      categoryMap.set(type, {
        assetType: type,
        assetTypeName: ASSET_TYPE_NAMES[type],
        count: 0,
      });
    }

    let totalCount = 0;
    let syncedCount = 0;
    let lastSyncTime: Date | undefined;

    for (const asset of assets) {
      const item = categoryMap.get(asset.assetType)!;
      item.count += asset.assetCount;
      item.totalAmount = asset.totalAmount;
      if (asset.lastUpdated) {
        if (!item.lastUpdated || asset.lastUpdated > item.lastUpdated) {
          item.lastUpdated = asset.lastUpdated;
        }
      }
      totalCount += asset.assetCount;
      if (asset.isSynced) syncedCount++;
      if (asset.lastUpdated && (!lastSyncTime || asset.lastUpdated > lastSyncTime)) {
        lastSyncTime = asset.lastUpdated;
      }
    }

    return {
      totalAssetCount: totalCount,
      assetCategories: Array.from(categoryMap.values()),
      syncedCount,
      pendingSyncCount: assets.length - syncedCount,
      lastSyncTime,
    };
  }

  async getAssetList(
    userId: string,
    assetType?: AssetType,
  ): Promise<DataAsset[]> {
    const where: any = { userId };
    if (assetType) {
      where.assetType = assetType;
    }
    return this.dataAssetRepo.find({
      where,
      order: { updatedAt: 'DESC' },
    });
  }

  async syncFromDepartments(userId: string): Promise<{ synced: number; failed: number }> {
    this.logger.log(`开始同步用户[${userId}]的各委办局数据...`);

    const mockData: Partial<DataAsset>[] = [
      {
        userId,
        assetType: 'social_security',
        assetCount: 60,
        totalAmount: { personalAccount: 45680.5, companyAccount: 120000, months: 60 },
        sourceDept: '人力资源和社会保障厅',
        lastUpdated: new Date(),
      },
      {
        userId,
        assetType: 'housing_fund',
        assetCount: 48,
        totalAmount: { balance: 89000, monthlyDeposit: 1800, months: 48 },
        sourceDept: '住房和城乡建设厅',
        lastUpdated: new Date(),
      },
      {
        userId,
        assetType: 'medical',
        assetCount: 24,
        totalAmount: { personalAccount: 12500, outpatientRecords: 18, inpatientRecords: 1 },
        sourceDept: '医疗保障局',
        lastUpdated: new Date(),
      },
      {
        userId,
        assetType: 'tax',
        assetCount: 12,
        totalAmount: { annualIncome: 180000, taxPaid: 15680, year: 2024 },
        sourceDept: '税务局',
        lastUpdated: new Date(),
      },
      {
        userId,
        assetType: 'cert',
        assetCount: 5,
        totalAmount: { certs: ['身份证', '驾驶证', '社保卡', '结婚证', '不动产权证'] },
        sourceDept: '政务服务管理局',
        lastUpdated: new Date(),
      },
      {
        userId,
        assetType: 'education',
        assetCount: 3,
        totalAmount: { degrees: ['本科', '硕士'] },
        sourceDept: '教育厅',
        lastUpdated: new Date(),
      },
      {
        userId,
        assetType: 'transport',
        assetCount: 2,
        totalAmount: { vehicles: 1, drivingScore: 12 },
        sourceDept: '交通运输厅',
        lastUpdated: new Date(),
      },
    ];

    let synced = 0;
    let failed = 0;

    for (const data of mockData) {
      try {
        const existing = await this.dataAssetRepo.findOne({
          where: { userId, assetType: data.assetType },
        });

        if (existing) {
          Object.assign(existing, {
            assetCount: data.assetCount,
            totalAmount: data.totalAmount,
            sourceDept: data.sourceDept,
            lastUpdated: data.lastUpdated,
            isSynced: true,
          });
          await this.dataAssetRepo.save(existing);
        } else {
          const asset = this.dataAssetRepo.create({
            ...data,
            isSynced: true,
          });
          await this.dataAssetRepo.save(asset);
        }
        synced++;
      } catch (error) {
        this.logger.error(`同步${data.assetType}失败: ${error.message}`);
        failed++;
      }
    }

    return { synced, failed };
  }

  async upsertAsset(userId: string, assetType: AssetType, data: Partial<DataAsset>): Promise<DataAsset> {
    let asset = await this.dataAssetRepo.findOne({
      where: { userId, assetType },
    });

    if (!asset) {
      asset = this.dataAssetRepo.create({ userId, assetType, ...data });
    } else {
      Object.assign(asset, data);
    }

    return this.dataAssetRepo.save(asset);
  }
}
