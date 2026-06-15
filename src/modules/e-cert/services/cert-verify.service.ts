import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { nanoid } from 'nanoid';
import { CertVerifyLog, VerifyMethod, VerifyLevel } from '../entities/cert-verify-log.entity';
import { CertRecord } from '../entities/cert-record.entity';
import { CertField } from '../entities/cert-field.entity';
import {
  CertVerifyDto,
  FieldVerifyItem,
  FieldVerifyResult,
  VerifyReportData,
  CertVerifyByNoDto,
} from '../dto/cert-verify.dto';
import { VerifyLogQueryDto } from '../dto/cert-query.dto';
import { Sm4Util } from '../../../common/utils/sm4.util';
import { CertRepositoryService } from './cert-repository.service';
import { DeptGatewayService, DeptVerifyResult } from './dept-gateway.service';
import { CertAccessControlService } from './cert-access-control.service';

@Injectable()
export class CertVerifyService {
  private readonly logger = new Logger(CertVerifyService.name);

  constructor(
    @InjectRepository(CertVerifyLog)
    private readonly verifyLogRepository: Repository<CertVerifyLog>,
    @InjectRepository(CertRecord)
    private readonly certRecordRepository: Repository<CertRecord>,
    @InjectRepository(CertField)
    private readonly certFieldRepository: Repository<CertField>,
    private readonly sm4Util: Sm4Util,
    private readonly certRepositoryService: CertRepositoryService,
    private readonly deptGatewayService: DeptGatewayService,
    private readonly accessControlService: CertAccessControlService,
  ) {}

  private sha256Hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  private generateReportId(): string {
    const timestamp = Date.now().toString();
    const random = nanoid(8).toUpperCase();
    return `RPT${timestamp}${random}`;
  }

  async verifyCert(
    verifierId: string,
    verifierName: string | null,
    verifierType: string,
    dto: CertVerifyDto,
    ip?: string,
  ): Promise<{
    passed: boolean;
    results: FieldVerifyResult[];
    overallMessage: string;
    reportId?: string;
    reportData?: VerifyReportData;
    gatewayVerify?: DeptVerifyResult;
  }> {
    const certRecord = await this.certRepositoryService.findCertRecordById(dto.certRecordId);

    if (certRecord.status === 'revoked') {
      throw new BadRequestException('证照已注销，无法验真');
    }
    if (certRecord.status === 'expired') {
      throw new BadRequestException('证照已过期，无法验真');
    }
    if (certRecord.status === 'invalid') {
      throw new BadRequestException('证照已失效，无法验真');
    }

    const verifyFieldNames = dto.verifyItems.map((v) => v.fieldName);
    const storedHashes = await this.certRepositoryService.getFieldHashes(
      dto.certRecordId,
      verifyFieldNames,
    );

    const fieldResults: FieldVerifyResult[] = [];
    let hashAllPassed = true;

    for (const item of dto.verifyItems) {
      const actualHash = storedHashes[item.fieldName];
      const expectedHash = this.sha256Hash(item.fieldValue);

      if (!actualHash) {
        fieldResults.push({
          fieldName: item.fieldName,
          passed: false,
          expectedHash,
          message: '字段不存在或未存储哈希',
        });
        hashAllPassed = false;
        continue;
      }

      const passed = actualHash === expectedHash;
      if (!passed) {
        hashAllPassed = false;
      }

      fieldResults.push({
        fieldName: item.fieldName,
        passed,
        expectedHash: passed ? undefined : expectedHash,
        actualHash: passed ? undefined : actualHash,
        message: passed ? '字段哈希匹配' : '字段值不匹配',
      });
    }

    let finalPassed = hashAllPassed;
    let gatewayResult: DeptVerifyResult | undefined;
    let overallMessage = '';

    if (dto.verifyMethod === 'gateway' || dto.verifyLevel === 'strict') {
      const verifyData: Record<string, string> = {};
      dto.verifyItems.forEach((item) => {
        verifyData[item.fieldName] = item.fieldValue;
      });

      let certNoPlain = '';
      try {
        certNoPlain = this.sm4Util.decrypt(certRecord.certNo);
      } catch {
        this.logger.warn(`解密证照编号失败: ${dto.certRecordId}`);
      }

      try {
        gatewayResult = await this.deptGatewayService.verifyCert(
          certRecord.certCode,
          certNoPlain,
          verifyData,
        );

        if (gatewayResult) {
          if (dto.verifyLevel === 'strict') {
            finalPassed = gatewayResult.passed && hashAllPassed;
            overallMessage = finalPassed
              ? '哈希比对与委办局实时验真均通过'
              : !gatewayResult.passed
                ? '委办局实时验真不通过'
                : '部分字段哈希不匹配';
          } else {
            finalPassed = gatewayResult.passed;
            overallMessage = gatewayResult.passed
              ? '委办局实时验真通过'
              : '委办局实时验真不通过';
          }
        }
      } catch (error) {
        this.logger.error(`调用委办局网关验真失败: ${error.message}`);
        if (dto.verifyMethod === 'gateway') {
          throw new BadRequestException(`委办局验真服务不可用: ${error.message}`);
        }
        overallMessage = '哈希比对通过，委办局验真服务暂不可用（降级通过）';
        finalPassed = hashAllPassed;
      }
    } else {
      overallMessage = finalPassed
        ? '所有字段哈希比对通过'
        : '存在字段值不匹配';
    }

    let reportId: string | undefined;
    let reportData: VerifyReportData | undefined;

    if (dto.generateReport) {
      reportId = this.generateReportId();
      reportData = {
        reportId,
        verifyTime: new Date(),
        verifyResult: finalPassed,
        verifyMethod: dto.verifyMethod,
        verifyLevel: dto.verifyLevel,
        certRecordId: dto.certRecordId,
        certCode: certRecord.certCode,
        verifierId,
        verifierName,
        fields: fieldResults,
      };
    }

    await this.saveVerifyLog({
      verifierId,
      verifierName,
      verifierType,
      certRecordId: dto.certRecordId,
      certCode: certRecord.certCode,
      verifyFields: verifyFieldNames,
      verifyMethod: dto.verifyMethod,
      verifyLevel: dto.verifyLevel,
      verifyResult: finalPassed,
      detail: {
        fieldResults,
        gatewayVerify: gatewayResult,
        overallMessage,
      },
      gatewayResponse: gatewayResult
        ? this.sm4Util.encrypt(JSON.stringify(gatewayResult))
        : null,
      reportId,
      ip: ip ?? null,
      purpose: dto.purpose ?? null,
      itemCode: dto.itemCode ?? null,
    });

    return {
      passed: finalPassed,
      results: fieldResults,
      overallMessage,
      reportId,
      reportData,
      gatewayVerify: gatewayResult,
    };
  }

  async verifyCertByNo(
    verifierId: string,
    verifierName: string | null,
    verifierType: string,
    dto: CertVerifyByNoDto,
    ip?: string,
  ): Promise<{
    passed: boolean;
    certRecordId?: string;
    overallMessage: string;
    matchedFields: string[];
    unmatchedFields: string[];
    gatewayVerify?: DeptVerifyResult;
  }> {
    const certNoHash = this.sha256Hash(dto.certNo);

    const certRecord = await this.certRecordRepository.findOne({
      where: { certCode: dto.certCode, certNoHash },
    });

    if (!certRecord) {
      return {
        passed: false,
        overallMessage: '未找到对应证照记录',
        matchedFields: [],
        unmatchedFields: Object.keys(dto.verifyData),
      };
    }

    if (certRecord.status !== 'valid') {
      return {
        passed: false,
        certRecordId: certRecord.id,
        overallMessage: `证照状态异常: ${certRecord.status}`,
        matchedFields: [],
        unmatchedFields: Object.keys(dto.verifyData),
      };
    }

    const verifyFieldNames = Object.keys(dto.verifyData);
    const verifyItems: FieldVerifyItem[] = verifyFieldNames.map((name) => ({
      fieldName: name,
      fieldValue: dto.verifyData[name],
    }));

    const verifyDto: CertVerifyDto = {
      certRecordId: certRecord.id,
      verifyMethod: dto.verifyMethod,
      verifyLevel: 'standard',
      verifyItems,
      purpose: '按编号验真',
      generateReport: false,
    };

    const result = await this.verifyCert(
      verifierId,
      verifierName,
      verifierType,
      verifyDto,
      ip,
    );

    const matchedFields = result.results.filter((r) => r.passed).map((r) => r.fieldName);
    const unmatchedFields = result.results.filter((r) => !r.passed).map((r) => r.fieldName);

    return {
      passed: result.passed,
      certRecordId: certRecord.id,
      overallMessage: result.overallMessage,
      matchedFields,
      unmatchedFields,
      gatewayVerify: result.gatewayVerify,
    };
  }

  private async saveVerifyLog(params: {
    verifierId: string;
    verifierName: string | null;
    verifierType: string;
    certRecordId: string;
    certCode: string;
    verifyFields: string[];
    verifyMethod: VerifyMethod;
    verifyLevel: VerifyLevel;
    verifyResult: boolean;
    detail: Record<string, unknown> | null;
    gatewayResponse: string | null;
    reportId: string | undefined;
    ip: string | null;
    purpose: string | null;
    itemCode: string | null;
  }): Promise<CertVerifyLog> {
    const log = this.verifyLogRepository.create({
      verifierId: params.verifierId,
      verifierName: params.verifierName,
      verifierType: params.verifierType,
      certRecordId: params.certRecordId,
      certCode: params.certCode,
      verifyFields: params.verifyFields,
      verifyMethod: params.verifyMethod,
      verifyLevel: params.verifyLevel,
      verifyResult: params.verifyResult,
      detail: params.detail,
      gatewayResponse: params.gatewayResponse,
      reportId: params.reportId ?? null,
      verifyTime: new Date(),
      ip: params.ip,
      purpose: params.purpose,
      itemCode: params.itemCode,
    });

    return this.verifyLogRepository.save(log);
  }

  async getVerifyLogs(
    userId: string,
    query: VerifyLogQueryDto,
    asVerifier: boolean = false,
  ): Promise<{ list: CertVerifyLog[]; total: number }> {
    const { certRecordId, verifyResult, startDate, endDate, page = 1, pageSize = 20 } = query;
    const skip = (page - 1) * pageSize;

    const qb = this.verifyLogRepository.createQueryBuilder('vl');

    if (asVerifier) {
      qb.where('vl.verifier_id = :userId', { userId });
    } else {
      qb.innerJoin(
        CertRecord,
        'cr',
        'cr.id = vl.cert_record_id',
      ).where('cr.user_id = :userId', { userId });
    }

    if (certRecordId) {
      qb.andWhere('vl.cert_record_id = :certRecordId', { certRecordId });
    }
    if (verifyResult !== undefined && verifyResult !== null) {
      qb.andWhere('vl.verify_result = :verifyResult', { verifyResult });
    }
    if (startDate && endDate) {
      qb.andWhere('vl.verify_time BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(endDate + ' 23:59:59'),
      });
    }

    qb.orderBy('vl.verify_time', 'DESC');
    qb.skip(skip).take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  async getVerifyReport(
    userId: string,
    reportId: string,
  ): Promise<VerifyReportData> {
    const log = await this.verifyLogRepository.findOne({
      where: { reportId },
    });

    if (!log) {
      throw new NotFoundException(`验真报告不存在: ${reportId}`);
    }

    const certRecord = await this.certRepositoryService.findCertRecordById(log.certRecordId);
    this.accessControlService.checkUserOwnership(userId, certRecord.userId);

    const detail = log.detail as Record<string, unknown> | null;
    const fieldResults = (detail?.fieldResults as FieldVerifyResult[]) ?? [];

    return {
      reportId: log.reportId ?? reportId,
      verifyTime: log.verifyTime,
      verifyResult: log.verifyResult,
      verifyMethod: log.verifyMethod,
      verifyLevel: log.verifyLevel,
      certRecordId: log.certRecordId,
      certCode: log.certCode ?? certRecord.certCode,
      verifierId: log.verifierId,
      verifierName: log.verifierName,
      fields: fieldResults,
    };
  }

  getVerifyStats(
    verifierId: string,
    days: number = 30,
  ): Promise<{ total: number; passed: number; failed: number; passRate: string }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.verifyLogRepository
      .createQueryBuilder('vl')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN vl.verify_result = true THEN 1 ELSE 0 END)", 'passed')
      .addSelect("SUM(CASE WHEN vl.verify_result = false THEN 1 ELSE 0 END)", 'failed')
      .where('vl.verifier_id = :verifierId', { verifierId })
      .andWhere('vl.verify_time >= :startDate', { startDate })
      .getRawOne()
      .then((raw) => {
        const total = parseInt(raw.total ?? '0', 10);
        const passed = parseInt(raw.passed ?? '0', 10);
        const failed = parseInt(raw.failed ?? '0', 10);
        const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) + '%' : '0%';
        return { total, passed, failed, passRate };
      });
  }
}
