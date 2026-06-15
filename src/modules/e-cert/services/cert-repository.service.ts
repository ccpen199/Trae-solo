import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, MoreThan, Between } from 'typeorm';
import * as crypto from 'crypto';
import { CertRecord, CertStatus } from '../entities/cert-record.entity';
import { CertField } from '../entities/cert-field.entity';
import { CertAccessLog, CallerType } from '../entities/cert-access-log.entity';
import { CertCatalog, CertFieldDef } from '../entities/cert-catalog.entity';
import { User } from '../../auth/entities/user.entity';
import { Sm4Util } from '../../../common/utils/sm4.util';
import {
  MyCertListQueryDto,
  AccessLogQueryDto,
  DeptPullCertDto,
} from '../dto/cert-query.dto';
import { CertCatalogService } from './cert-catalog.service';
import { DeptGatewayService, DeptCertRecord } from './dept-gateway.service';
import { CertAccessControlService } from './cert-access-control.service';

export interface CertRecordDetail {
  id: string;
  userId: string;
  certCode: string;
  certName: string;
  certCategory: string;
  certNo: string;
  certNoPlain?: string;
  issueDept: string;
  issueDeptCode: string;
  issueDate: Date;
  expireDate: Date | null;
  status: CertStatus;
  fields: Record<string, unknown>;
  fieldsMasked: Record<string, unknown>;
  dataSource: string;
  syncTime: Date | null;
  createdAt: Date;
}

@Injectable()
export class CertRepositoryService {
  private readonly logger = new Logger(CertRepositoryService.name);
  private readonly ACCESS_LOG_RETENTION_DAYS = 90;

  constructor(
    @InjectRepository(CertRecord)
    private readonly certRecordRepository: Repository<CertRecord>,
    @InjectRepository(CertField)
    private readonly certFieldRepository: Repository<CertField>,
    @InjectRepository(CertAccessLog)
    private readonly accessLogRepository: Repository<CertAccessLog>,
    @InjectRepository(CertCatalog)
    private readonly certCatalogRepository: Repository<CertCatalog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly sm4Util: Sm4Util,
    private readonly certCatalogService: CertCatalogService,
    private readonly deptGatewayService: DeptGatewayService,
    private readonly accessControlService: CertAccessControlService,
  ) {}

  private sha256Hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  async getMyCertList(
    userId: string,
    query: MyCertListQueryDto,
  ): Promise<{ list: CertRecordDetail[]; total: number }> {
    const { certCode, category, status, page = 1, pageSize = 20 } = query;
    const skip = (page - 1) * pageSize;

    const qb = this.certRecordRepository
      .createQueryBuilder('cr')
      .innerJoinAndMapOne(
        'cr.catalog',
        CertCatalog,
        'cc',
        'cc.code = cr.cert_code',
      )
      .where('cr.user_id = :userId', { userId });

    if (certCode) {
      qb.andWhere('cr.cert_code = :certCode', { certCode });
    }
    if (category) {
      qb.andWhere('cc.category = :category', { category });
    }
    if (status) {
      qb.andWhere('cr.status = :status', { status });
    }

    qb.orderBy('cr.created_at', 'DESC');
    qb.skip(skip).take(pageSize);

    const [records, total] = await qb.getManyAndCount();
    const list: CertRecordDetail[] = [];

    for (const record of records) {
      const catalog = (record as any).catalog as CertCatalog;
      list.push(
        await this.buildCertRecordDetail(record, catalog, userId, false),
      );
    }

    return { list, total };
  }

  async getMyCertByCode(
    userId: string,
    certCode: string,
  ): Promise<CertRecordDetail[]> {
    const records = await this.certRecordRepository.find({
      where: { userId, certCode },
      order: { createdAt: 'DESC' },
    });

    if (records.length === 0) {
      return [];
    }

    const catalog = await this.certCatalogService.findByCode(certCode);
    const details: CertRecordDetail[] = [];

    for (const record of records) {
      details.push(
        await this.buildCertRecordDetail(record, catalog, userId, true),
      );
    }

    return details;
  }

  async getCertDetail(
    userId: string,
    certRecordId: string,
    callerType: CallerType = 'user',
    callerId?: string,
    callerName?: string,
    purpose?: string,
    ip?: string,
    userAgent?: string,
  ): Promise<CertRecordDetail> {
    const record = await this.certRecordRepository.findOne({
      where: { id: certRecordId },
    });

    if (!record) {
      throw new NotFoundException(`证照记录不存在: ${certRecordId}`);
    }

    if (callerType === 'user') {
      this.accessControlService.checkUserOwnership(userId, record.userId);
    }

    const catalog = await this.certCatalogService.findByCode(record.certCode);
    const actualCallerId = callerId ?? userId;

    const fieldNames = this.certCatalogService.getFieldNames(record.certCode);

    await this.createAccessLog({
      userId: record.userId,
      callerType,
      callerId: actualCallerId,
      callerName,
      certRecordId,
      certCode: record.certCode,
      accessedFields: fieldNames,
      purpose: purpose ?? '查看证照详情',
      ip: ip ?? '0.0.0.0',
      userAgent,
      accessResult: 'success',
    });

    const isOwner = userId === record.userId;
    return this.buildCertRecordDetail(record, catalog, userId, isOwner);
  }

  private async buildCertRecordDetail(
    record: CertRecord,
    catalog: CertCatalog,
    currentUserId: string,
    includePlain: boolean,
  ): Promise<CertRecordDetail> {
    let certData: Record<string, unknown> = {};
    try {
      certData = this.sm4Util.decryptObject<Record<string, unknown>>(
        record.certData,
      );
    } catch (error) {
      this.logger.warn(`解密证照数据失败: ${record.id}, ${error.message}`);
    }

    const isOwner = currentUserId === record.userId;
    const fieldsMasked = this.applyMasking(
      catalog.certFieldsDef,
      certData,
      isOwner ? 'owner' : 'viewer',
    );

    const detail: CertRecordDetail = {
      id: record.id,
      userId: record.userId,
      certCode: record.certCode,
      certName: catalog.name,
      certCategory: catalog.category,
      certNo: isOwner ? this.sm4Util.decrypt(record.certNo) : this.maskCertNo(record.certNo),
      certNoPlain: includePlain && isOwner ? this.sm4Util.decrypt(record.certNo) : undefined,
      issueDept: record.issueDept,
      issueDeptCode: record.issueDeptCode ?? '',
      issueDate: record.issueDate,
      expireDate: record.expireDate,
      status: record.status,
      fields: isOwner ? certData : {},
      fieldsMasked,
      dataSource: record.dataSource,
      syncTime: record.syncTime,
      createdAt: record.createdAt,
    };

    return detail;
  }

  private applyMasking(
    fieldDefs: CertFieldDef[],
    data: Record<string, unknown>,
    viewerType: 'owner' | 'viewer',
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const fieldDef of fieldDefs) {
      const value = data[fieldDef.name];
      if (value === undefined || value === null) {
        result[fieldDef.name] = value;
        continue;
      }

      if (viewerType === 'owner' && !fieldDef.masked) {
        result[fieldDef.name] = value;
      } else if (viewerType === 'owner' && fieldDef.masked) {
        result[fieldDef.name] = value;
      } else if (viewerType === 'viewer') {
        result[fieldDef.name] = this.accessControlService.maskFieldValue(
          fieldDef.name,
          value,
          fieldDef.maskPattern,
        );
      }
    }

    return result;
  }

  private maskCertNo(encryptedCertNo: string): string {
    try {
      const plain = this.sm4Util.decrypt(encryptedCertNo);
      return this.accessControlService.maskFieldValue('certNo', plain) as string;
    } catch {
      return '************';
    }
  }

  async pullAndSyncCertsFromDept(
    userId: string,
    dto: DeptPullCertDto,
    ip?: string,
  ): Promise<{
    synced: number;
    total: number;
    certs: Array<{ certCode: string; certName: string; status: string }>;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`用户不存在: ${userId}`);
    }

    let idCardNo = '';
    let name = user.realName ?? '用户';
    try {
      if (user.idCard) {
        idCardNo = this.sm4Util.decrypt(user.idCard);
      }
    } catch (error) {
      this.logger.warn(`解密用户身份证失败: ${userId}`);
    }

    if (!idCardNo) {
      throw new ForbiddenException('用户未实名认证，无法同步证照');
    }

    const gatewayRecords = await this.deptGatewayService.pullUserCerts(
      userId,
      idCardNo,
      name,
      dto.certCodes,
    );

    const syncResults: Array<{ certCode: string; certName: string; status: string }> = [];

    for (const gr of gatewayRecords) {
      try {
        const result = await this.upsertCertFromGateway(userId, gr);
        syncResults.push({
          certCode: gr.certCode,
          certName: gr.fields['name'] ? `${gr.fields['name']}的${result.catalogName}` : result.catalogName,
          status: result.status,
        });
      } catch (error) {
        this.logger.error(
          `同步证照失败: ${gr.certCode}, userId=${userId}: ${error.message}`,
        );
        syncResults.push({
          certCode: gr.certCode,
          certName: gr.certCode,
          status: `error: ${error.message}`,
        });
      }
    }

    const successCount = syncResults.filter((r) =>
      ['created', 'updated', 'skipped'].includes(r.status),
    ).length;

    return {
      synced: successCount,
      total: gatewayRecords.length,
      certs: syncResults,
    };
  }

  private async upsertCertFromGateway(
    userId: string,
    gr: DeptCertRecord,
  ): Promise<{ status: string; catalogName: string }> {
    const catalog = await this.certCatalogService.findByCode(gr.certCode);
    const certNoEncrypted = this.sm4Util.encrypt(gr.certNo);
    const certNoHash = this.sha256Hash(gr.certNo);

    const certDataStr = JSON.stringify(gr.fields);
    const certDataEncrypted = this.sm4Util.encrypt(certDataStr);
    const certDataHash = this.sha256Hash(certDataStr);

    let existing = await this.certRecordRepository.findOne({
      where: [
        { userId, certCode: gr.certCode, sourceId: gr.sourceId },
        { userId, certCode: gr.certCode, certNoHash },
      ],
    });

    const fieldsToSave = this.prepareFieldsForSave(
      catalog.certFieldsDef,
      gr.fields,
    );

    const now = new Date();

    if (existing) {
      if (existing.certDataHash === certDataHash) {
        existing.syncTime = now;
        existing.dataSource = 'gateway';
        await this.certRecordRepository.save(existing);
        this.logger.log(
          `证照无变化，跳过更新: userId=${userId}, cert=${gr.certCode}`,
        );
        return { status: 'skipped', catalogName: catalog.name };
      }

      existing.certNo = certNoEncrypted;
      existing.certNoHash = certNoHash;
      existing.issueDept = gr.issueDept;
      existing.issueDeptCode = gr.issueDeptCode;
      existing.issueDate = new Date(gr.issueDate);
      existing.expireDate = gr.expireDate ? new Date(gr.expireDate) : null;
      existing.status = gr.status;
      existing.certData = certDataEncrypted;
      existing.certDataHash = certDataHash;
      existing.dataSource = 'gateway';
      existing.syncTime = now;
      existing.sourceId = gr.sourceId;

      await this.certRecordRepository.save(existing);
      await this.updateCertFields(existing.id, fieldsToSave);

      this.logger.log(
        `更新证照记录: userId=${userId}, cert=${gr.certCode}, id=${existing.id}`,
      );
      return { status: 'updated', catalogName: catalog.name };
    }

    const record = this.certRecordRepository.create({
      userId,
      certCode: gr.certCode,
      certNo: certNoEncrypted,
      certNoHash,
      issueDept: gr.issueDept,
      issueDeptCode: gr.issueDeptCode,
      issueDate: new Date(gr.issueDate),
      expireDate: gr.expireDate ? new Date(gr.expireDate) : null,
      status: gr.status,
      certData: certDataEncrypted,
      certDataHash,
      dataSource: 'gateway',
      syncTime: now,
      sourceId: gr.sourceId,
    });

    const saved = await this.certRecordRepository.save(record);
    await this.saveCertFields(saved.id, fieldsToSave);

    this.logger.log(
      `创建新证照记录: userId=${userId}, cert=${gr.certCode}, id=${saved.id}`,
    );
    return { status: 'created', catalogName: catalog.name };
  }

  private prepareFieldsForSave(
    fieldDefs: CertFieldDef[],
    fields: Record<string, unknown>,
  ): Array<{ fieldName: string; fieldValue: string; fieldType: string }> {
    const result: Array<{ fieldName: string; fieldValue: string; fieldType: string }> = [];

    for (const def of fieldDefs) {
      const rawValue = fields[def.name];
      if (rawValue === undefined || rawValue === null) {
        continue;
      }

      const strValue = String(rawValue);
      result.push({
        fieldName: def.name,
        fieldValue: strValue,
        fieldType: def.type,
      });
    }

    return result;
  }

  private async saveCertFields(
    certRecordId: string,
    fields: Array<{ fieldName: string; fieldValue: string; fieldType: string }>,
  ): Promise<void> {
    const entities: CertField[] = [];

    for (const f of fields) {
      entities.push(
        this.certFieldRepository.create({
          certRecordId,
          fieldName: f.fieldName,
          fieldValueSm4: this.sm4Util.encrypt(f.fieldValue),
          fieldValueHash: this.sha256Hash(f.fieldValue),
          fieldType: f.fieldType,
        }),
      );
    }

    if (entities.length > 0) {
      await this.certFieldRepository.save(entities);
    }
  }

  private async updateCertFields(
    certRecordId: string,
    fields: Array<{ fieldName: string; fieldValue: string; fieldType: string }>,
  ): Promise<void> {
    await this.certFieldRepository.delete({ certRecordId });
    await this.saveCertFields(certRecordId, fields);
  }

  async createAccessLog(params: {
    userId: string;
    callerType: CallerType;
    callerId: string;
    callerName?: string | null;
    certRecordId: string;
    certCode?: string | null;
    accessedFields: string[];
    purpose?: string | null;
    itemCode?: string | null;
    authorizationId?: string | null;
    ip: string;
    userAgent?: string | null;
    accessResult?: string;
    denyReason?: string | null;
  }): Promise<CertAccessLog> {
    const now = new Date();
    const retentionUntil = new Date(
      now.getTime() + this.ACCESS_LOG_RETENTION_DAYS * 24 * 3600 * 1000,
    );

    const log = this.accessLogRepository.create({
      userId: params.userId,
      callerType: params.callerType,
      callerId: params.callerId,
      callerName: params.callerName ?? null,
      certRecordId: params.certRecordId,
      certCode: params.certCode ?? null,
      accessedFields: params.accessedFields,
      purpose: params.purpose ?? null,
      itemCode: params.itemCode ?? null,
      authorizationId: params.authorizationId ?? null,
      ip: params.ip,
      userAgent: params.userAgent ?? null,
      accessResult: params.accessResult ?? 'success',
      denyReason: params.denyReason ?? null,
      accessTime: now,
      retentionUntil,
    });

    return this.accessLogRepository.save(log);
  }

  async getAccessLogs(
    userId: string,
    query: AccessLogQueryDto,
  ): Promise<{ list: CertAccessLog[]; total: number }> {
    const { certRecordId, callerType, startDate, endDate, page = 1, pageSize = 20 } = query;
    const skip = (page - 1) * pageSize;

    const qb = this.accessLogRepository
      .createQueryBuilder('al')
      .where('al.user_id = :userId', { userId });

    if (certRecordId) {
      qb.andWhere('al.cert_record_id = :certRecordId', { certRecordId });
    }
    if (callerType) {
      qb.andWhere('al.caller_type = :callerType', { callerType });
    }
    if (startDate && endDate) {
      qb.andWhere('al.access_time BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(endDate + ' 23:59:59'),
      });
    }

    qb.orderBy('al.access_time', 'DESC');
    qb.skip(skip).take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  async findCertRecordById(id: string): Promise<CertRecord> {
    const record = await this.certRecordRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`证照记录不存在: ${id}`);
    }
    return record;
  }

  async getFieldValuesPlain(
    certRecordId: string,
    fieldNames: string[],
  ): Promise<Record<string, string>> {
    const fields = await this.certFieldRepository.find({
      where: { certRecordId, fieldName: In(fieldNames) },
    });

    const result: Record<string, string> = {};
    for (const f of fields) {
      try {
        result[f.fieldName] = this.sm4Util.decrypt(f.fieldValueSm4);
      } catch (error) {
        this.logger.warn(`解密字段失败: ${certRecordId}.${f.fieldName}`);
        result[f.fieldName] = '';
      }
    }
    return result;
  }

  async getFieldHashes(
    certRecordId: string,
    fieldNames: string[],
  ): Promise<Record<string, string>> {
    const fields = await this.certFieldRepository.find({
      where: { certRecordId, fieldName: In(fieldNames) },
    });

    const result: Record<string, string> = {};
    for (const f of fields) {
      result[f.fieldName] = f.fieldValueHash;
    }
    return result;
  }

  async cleanupExpiredAccessLogs(): Promise<number> {
    const now = new Date();
    const result = await this.accessLogRepository
      .createQueryBuilder()
      .delete()
      .where('retention_until < :now', { now })
      .execute();

    const count = result.affected ?? 0;
    if (count > 0) {
      this.logger.log(`清理过期访问日志: ${count} 条`);
    }
    return count;
  }

  async checkCertStatusAndRenew(certRecordId: string): Promise<CertRecord> {
    const record = await this.findCertRecordById(certRecordId);
    const now = new Date();

    if (
      record.status === 'valid' &&
      record.expireDate &&
      record.expireDate < now
    ) {
      record.status = 'expired';
      await this.certRecordRepository.save(record);
      this.logger.log(`证照自动标记为过期: ${certRecordId}`);
    }

    return record;
  }
}
