import { Injectable, Logger, Inject } from '@nestjs/common';
import { GuangdongCloudAdapter } from './adapters/guangdong-cloud.adapter';
import { NationalPlatformAdapter } from './adapters/national-platform.adapter';
import { PrismaService } from '@/prisma/prisma.service';
import { ApplicationStatus } from '@prisma/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Injectable()
export class IntegrationService {
  constructor(
    private gdCloud: GuangdongCloudAdapter,
    private national: NationalPlatformAdapter,
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async syncApplicationToAllPlatforms(applicationId: string) {
    this.logger.log(`开始全平台同步办件: ${applicationId}`, 'IntegrationService');
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { serviceItem: true },
    });
    if (!application) return { success: false, message: '办件不存在' };

    const [gdResult, nationalResult] = await Promise.all([
      this.gdCloud.syncApplicationToCloud(application),
      this.national.submitApplication(application),
    ]);

    return {
      applicationId,
      guangdongCloud: gdResult,
      nationalPlatform: nationalResult,
      allSuccess: gdResult.success && nationalResult.success,
    };
  }

  async syncCertificateToAllPlatforms(certificateId: string) {
    this.logger.log(`开始全平台同步证照: ${certificateId}`, 'IntegrationService');
    const cert = await this.prisma.electronicCertificate.findUnique({ where: { id: certificateId } });
    if (!cert) return { success: false, message: '证照不存在' };

    const [gdResult, nationalResult] = await Promise.all([
      this.gdCloud.syncCertificateToCloud(cert),
      this.national.submitCertificate(cert),
    ]);

    return {
      certificateId,
      guangdongCloud: gdResult,
      nationalPlatform: nationalResult,
      allSuccess: gdResult.success && nationalResult.success,
    };
  }

  async syncPendingApplications() {
    this.logger.log('批量同步待同步办件', 'IntegrationService');
    const apps = await this.prisma.application.findMany({
      where: {
        status: { in: [ApplicationStatus.APPROVED, ApplicationStatus.CERTIFICATE_ISSUED, ApplicationStatus.COMPLETED] },
      },
      take: 50,
      include: { serviceItem: true },
    });

    const results = [];
    for (const app of apps) {
      try {
        const r = await this.syncApplicationToAllPlatforms(app.id);
        results.push(r);
      } catch (e: any) {
        results.push({ applicationId: app.id, success: false, error: e.message });
      }
    }
    return { total: apps.length, synced: results.filter((r) => r.allSuccess).length };
  }
}
