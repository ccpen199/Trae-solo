import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Department } from '@prisma/client';
import { CurrentUserPayload } from '@/common/decorators/current-user.decorator';
import { generateCertNo } from '@/common/utils/id-generator.util';
import { ApplicationTimelineService } from '../application/application-timeline.service';
import { NotificationService } from '../notification/notification.service';
import { BusinessException } from '@/common/exceptions/business.exception';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import * as dayjs from 'dayjs';

export interface IssueCertificateOptions {
  applicationId: string;
  certType: string;
  certName: string;
  holderName: string;
  holderIdCard: string;
  issuer: string;
  issuerDept: Department;
  validDays?: number;
  certData?: any;
}

@Injectable()
export class CertificateService {
  constructor(
    private prisma: PrismaService,
    private timelineService: ApplicationTimelineService,
    private notificationService: NotificationService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async issueCertificate(options: IssueCertificateOptions) {
    this.logger.log(`签发电子证照: app=${options.applicationId} type=${options.certType}`, 'CertificateService');

    const application = await this.prisma.application.findUnique({
      where: { id: options.applicationId },
      include: { serviceItem: true, certificate: true },
    });
    if (!application) throw new NotFoundException('办件不存在');
    if (application.certificate) throw new BusinessException('该办件已签发电子证照', 'CERT_ALREADY_ISSUED');

    const deptCode = options.issuerDept.substring(0, 3).toUpperCase();
    const certNo = generateCertNo(deptCode, options.certType);
    const validDays = options.validDays || 3650;

    const certificate = await this.prisma.electronicCertificate.create({
      data: {
        applicationId: options.applicationId,
        certNo,
        certType: options.certType,
        certName: options.certName,
        holderName: options.holderName,
        holderIdCard: options.holderIdCard,
        issueDate: new Date(),
        validFrom: new Date(),
        validTo: dayjs().add(validDays, 'day').toDate(),
        issuer: options.issuer,
        issuerDept: options.issuerDept,
        certData: options.certData,
        status: 'valid',
      },
    });

    await this.prisma.application.update({
      where: { id: options.applicationId },
      data: {
        status: 'CERTIFICATE_ISSUED' as any,
        currentNode: 'certificate_issued',
      },
    });

    await this.timelineService.addNode(options.applicationId, {
      nodeCode: 'certificate_issued',
      nodeName: '电子证照已签发',
      status: 'completed',
      operatorName: options.issuer,
      department: options.issuerDept,
      opinion: `证照编号: ${certNo}`,
    });

    await this.notificationService.createNotification({
      userId: application.userId,
      applicationId: options.applicationId,
      title: '电子证照已签发',
      content: `您的${options.certName}已签发成功，证照编号：${certNo}，可在电子证照中心查看。`,
      channels: ['IN_APP', 'SMS', 'WECHAT'],
      templateCode: 'CERTIFICATE_ISSUED',
    });

    return certificate;
  }

  async findByUser(user: CurrentUserPayload, params: { page?: number; pageSize?: number; status?: string }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const userProfile = await this.prisma.user.findUnique({ where: { id: user.userId } });
    if (!userProfile?.idCardNumber) return { list: [], pagination: { page, pageSize, total: 0, totalPages: 0 } };

    const where: any = { holderIdCard: userProfile.idCardNumber };
    if (params.status) where.status = params.status;

    const [list, total] = await Promise.all([
      this.prisma.electronicCertificate.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { issueDate: 'desc' },
      }),
      this.prisma.electronicCertificate.count({ where }),
    ]);

    return {
      list,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findOne(id: string) {
    const cert = await this.prisma.electronicCertificate.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('证照不存在');
    return cert;
  }

  async verify(certNo: string): Promise<{ valid: boolean; certificate?: any; message?: string }> {
    this.logger.log(`验证电子证照: ${certNo}`, 'CertificateService');
    const certificate = await this.prisma.electronicCertificate.findUnique({
      where: { certNo },
      include: { application: { include: { serviceItem: true } } },
    });
    if (!certificate) return { valid: false, message: '证照不存在' };
    if (certificate.status !== 'valid') return { valid: false, message: `证照状态: ${certificate.status}` };
    const now = new Date();
    if (now > certificate.validTo) return { valid: false, message: '证照已过期' };

    await this.prisma.electronicCertificate.update({
      where: { id: certificate.id },
      data: { verifyCount: { increment: 1 }, lastVerifiedAt: now },
    });

    return { valid: true, certificate };
  }

  async revoke(certNo: string, reason: string) {
    const certificate = await this.prisma.electronicCertificate.findUnique({ where: { certNo } });
    if (!certificate) throw new NotFoundException('证照不存在');
    return this.prisma.electronicCertificate.update({
      where: { certNo },
      data: { status: 'revoked', revokedAt: new Date(), revokeReason: reason },
    });
  }
}
