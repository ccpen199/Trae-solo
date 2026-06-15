import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import {
  CertAuthorization,
  AuthorizationStatus,
  AuthorizationScope,
} from '../entities/cert-authorization.entity';
import { CertCatalog } from '../entities/cert-catalog.entity';
import {
  CreateCertAuthorizationDto,
  RevokeAuthorizationDto,
  ValidateAuthorizationDto,
} from '../dto/cert-authorize.dto';
import { AuthorizationListQueryDto } from '../dto/cert-query.dto';
import { CertCatalogService } from './cert-catalog.service';

export interface AuthorizationTokenPayload {
  sub: string;
  grantorId: string;
  granteeDeptCode: string;
  granteeUserId?: string;
  certCode: string;
  scope: AuthorizationScope;
  allowedFields?: string[];
  itemCode?: string;
  jti: string;
  iat: number;
  exp: number;
}

export interface ValidationResult {
  allowed: boolean;
  authorizationId?: string;
  allowedFields: string[];
  denyReason?: string;
  tokenPayload?: AuthorizationTokenPayload;
}

@Injectable()
export class CertAccessControlService {
  private readonly logger = new Logger(CertAccessControlService.name);
  private readonly TOKEN_SECRET = 'ecert-authz-secret-key-change-in-prod-2024';

  constructor(
    @InjectRepository(CertAuthorization)
    private readonly authorizationRepository: Repository<CertAuthorization>,
    @InjectRepository(CertCatalog)
    private readonly certCatalogRepository: Repository<CertCatalog>,
    private readonly jwtService: JwtService,
    private readonly certCatalogService: CertCatalogService,
  ) {}

  private generateTokenId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private generateAuthorizationToken(
    authorization: CertAuthorization,
  ): string {
    const payload: Omit<AuthorizationTokenPayload, 'iat' | 'exp' | 'jti'> = {
      sub: authorization.id,
      grantorId: authorization.grantorId,
      granteeDeptCode: authorization.granteeDeptCode,
      granteeUserId: authorization.granteeUserId ?? undefined,
      certCode: authorization.certCode,
      scope: authorization.scope,
      allowedFields: authorization.allowedFields ?? undefined,
      itemCode: authorization.itemCode ?? undefined,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.TOKEN_SECRET,
      jwtid: this.generateTokenId(),
      expiresIn: Math.floor(
        (new Date(authorization.validTo).getTime() - Date.now()) / 1000,
      ),
      notBefore: Math.floor(
        (new Date(authorization.validFrom).getTime() - Date.now()) / 1000,
      ),
    });

    return token;
  }

  async createAuthorization(
    grantorId: string,
    dto: CreateCertAuthorizationDto,
  ): Promise<CertAuthorization> {
    const validFrom = new Date(dto.validFrom);
    const validTo = new Date(dto.validTo);

    if (validFrom >= validTo) {
      throw new BadRequestException('授权生效时间必须早于失效时间');
    }

    if (validTo.getTime() - validFrom.getTime() > 365 * 24 * 3600 * 1000) {
      throw new BadRequestException('单次授权最长有效期不超过1年');
    }

    if (dto.certCode !== '*') {
      try {
        await this.certCatalogService.findByCode(dto.certCode);
      } catch (error) {
        throw new BadRequestException(`证照编码不存在: ${dto.certCode}`);
      }
    }

    const deptMap = this.certCatalogService.getDeptMap();
    const deptInfo = deptMap.get(dto.granteeDeptCode);

    const authorization = this.authorizationRepository.create({
      grantorId,
      granteeDeptCode: dto.granteeDeptCode,
      granteeDeptName: deptInfo?.fullName ?? deptInfo?.name ?? dto.granteeDeptCode,
      granteeUserId: dto.granteeUserId ?? null,
      certCode: dto.certCode,
      scope: dto.scope,
      allowedFields: dto.allowedFields ?? null,
      itemCode: dto.itemCode ?? null,
      itemName: dto.itemName ?? null,
      validFrom,
      validTo,
      authorizationToken: 'PENDING',
      status: 'active',
      timesUsed: 0,
      maxUses: dto.maxUses ?? null,
    });

    const saved = await this.authorizationRepository.save(authorization);
    saved.authorizationToken = this.generateAuthorizationToken(saved);
    const final = await this.authorizationRepository.save(saved);

    this.logger.log(
      `用户[${grantorId}]创建授权: ${final.id} -> 委办局[${dto.granteeDeptCode}] 证照[${dto.certCode}]`,
    );

    return final;
  }

  async getMyAuthorizations(
    grantorId: string,
    query: AuthorizationListQueryDto,
  ): Promise<{ list: CertAuthorization[]; total: number }> {
    const { status, granteeDeptCode, certCode, page = 1, pageSize = 20 } = query;
    const skip = (page - 1) * pageSize;

    const qb = this.authorizationRepository.createQueryBuilder('a');
    qb.where('a.grantor_id = :grantorId', { grantorId });

    if (status) {
      qb.andWhere('a.status = :status', { status });
    }
    if (granteeDeptCode) {
      qb.andWhere('a.grantee_dept_code = :granteeDeptCode', { granteeDeptCode });
    }
    if (certCode) {
      qb.andWhere('(a.cert_code = :certCode OR a.cert_code = \'*\')', { certCode });
    }

    qb.orderBy('a.created_at', 'DESC');
    qb.skip(skip).take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  async findById(id: string): Promise<CertAuthorization> {
    const auth = await this.authorizationRepository.findOne({ where: { id } });
    if (!auth) {
      throw new NotFoundException(`授权记录不存在: ${id}`);
    }
    return auth;
  }

  async revokeAuthorization(
    grantorId: string,
    authorizationId: string,
    dto: RevokeAuthorizationDto,
  ): Promise<CertAuthorization> {
    const authorization = await this.findById(authorizationId);

    if (authorization.grantorId !== grantorId) {
      throw new ForbiddenException('无权撤销此授权');
    }

    if (authorization.status === 'revoked') {
      throw new BadRequestException('授权已撤销，无需重复操作');
    }

    authorization.status = 'revoked';
    authorization.revokedAt = new Date();
    authorization.revokedReason = dto.reason ?? '用户主动撤销';

    const result = await this.authorizationRepository.save(authorization);
    this.logger.log(
      `用户[${grantorId}]撤销授权: ${authorizationId}, 原因: ${dto.reason ?? '用户主动撤销'}`,
    );
    return result;
  }

  async validateAuthorization(dto: ValidateAuthorizationDto): Promise<ValidationResult> {
    const now = new Date();

    try {
      const payload = this.jwtService.verify<AuthorizationTokenPayload>(
        dto.authorizationToken,
        { secret: this.TOKEN_SECRET },
      );

      const authorization = await this.authorizationRepository.findOne({
        where: { id: payload.sub },
      });

      if (!authorization) {
        return {
          allowed: false,
          allowedFields: [],
          denyReason: '授权记录不存在',
        };
      }

      if (authorization.status !== 'active') {
        return {
          allowed: false,
          allowedFields: [],
          denyReason: `授权状态异常: ${authorization.status}`,
        };
      }

      if (authorization.granteeDeptCode !== dto.granteeDeptCode) {
        return {
          allowed: false,
          allowedFields: [],
          denyReason: '被授权委办局不匹配',
        };
      }

      if (authorization.certCode !== '*' && authorization.certCode !== dto.certCode) {
        return {
          allowed: false,
          allowedFields: [],
          denyReason: `授权证照范围不包含: ${dto.certCode}`,
        };
      }

      if (dto.itemCode && authorization.itemCode && authorization.itemCode !== dto.itemCode) {
        return {
          allowed: false,
          allowedFields: [],
          denyReason: '授权事项不匹配',
        };
      }

      if (authorization.maxUses !== null && authorization.timesUsed >= authorization.maxUses) {
        return {
          allowed: false,
          allowedFields: [],
          denyReason: '授权使用次数已达上限',
        };
      }

      let allowedFields: string[] = [];
      switch (authorization.scope) {
        case 'all':
          allowedFields = this.getAllAllowedFields(dto.certCode);
          break;
        case 'readonly':
          allowedFields = this.getReadonlyFields(dto.certCode);
          break;
        case 'specific_fields':
          allowedFields = authorization.allowedFields ?? [];
          break;
      }

      const notAllowed = dto.requestedFields.filter(
        (f) => !allowedFields.includes(f),
      );
      if (notAllowed.length > 0) {
        return {
          allowed: false,
          allowedFields,
          denyReason: `字段访问超出授权范围: ${notAllowed.join(', ')}`,
        };
      }

      authorization.timesUsed += 1;
      await this.authorizationRepository.save(authorization);

      return {
        allowed: true,
        authorizationId: authorization.id,
        allowedFields: dto.requestedFields,
        tokenPayload: payload,
      };
    } catch (error) {
      this.logger.warn(`授权令牌校验失败: ${error.message}`);
      return {
        allowed: false,
        allowedFields: [],
        denyReason: `授权令牌无效: ${error.message}`,
      };
    }
  }

  checkUserOwnership(userId: string, resourceUserId: string): void {
    if (userId !== resourceUserId) {
      throw new ForbiddenException('无权访问他人的证照数据');
    }
  }

  checkFieldsInScope(
    requestedFields: string[],
    allowedFields: string[],
  ): { allowed: boolean; denyReason?: string } {
    const notAllowed = requestedFields.filter((f) => !allowedFields.includes(f));
    if (notAllowed.length > 0) {
      return {
        allowed: false,
        denyReason: `字段访问超出授权范围: ${notAllowed.join(', ')}`,
      };
    }
    return { allowed: true };
  }

  private getAllAllowedFields(certCode: string): string[] {
    return this.certCatalogService.getFieldNames(certCode);
  }

  private getReadonlyFields(certCode: string): string[] {
    const allFields = this.certCatalogService.getFieldNames(certCode);
    return allFields.filter((f) => !['photo', 'signature', 'fingerprint'].includes(f));
  }

  async cleanupExpiredAuthorizations(): Promise<number> {
    const now = new Date();
    const expiredAuths = await this.authorizationRepository.find({
      where: {
        status: 'active',
        validTo: LessThan(now),
      },
    });

    if (expiredAuths.length === 0) {
      return 0;
    }

    const ids = expiredAuths.map((a) => a.id);
    await this.authorizationRepository
      .createQueryBuilder()
      .update(CertAuthorization)
      .set({ status: 'expired' })
      .whereInIds(ids)
      .execute();

    this.logger.log(`自动清理过期授权: ${ids.length} 条`);
    return ids.length;
  }

  async countActiveAuthorizations(grantorId: string): Promise<number> {
    return this.authorizationRepository.count({
      where: {
        grantorId,
        status: 'active',
        validFrom: LessThan(new Date()),
        validTo: MoreThan(new Date()),
      },
    });
  }

  maskFieldValue(fieldName: string, value: unknown, pattern?: string): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    const strValue = String(value);

    const actualPattern =
      pattern ?? this.detectMaskPattern(fieldName);

    switch (actualPattern) {
      case 'idCard':
        return this.maskIdCard(strValue);
      case 'bankCard':
        return this.maskBankCard(strValue);
      case 'phone':
        return this.maskPhone(strValue);
      case 'address':
        return this.maskAddress(strValue);
      case 'name':
        return this.maskName(strValue);
      default:
        return this.maskDefault(strValue);
    }
  }

  private detectMaskPattern(fieldName: string): string {
    const lower = fieldName.toLowerCase();
    if (lower.includes('idcard') || lower.includes('id_card') || lower.includes('身份证')) {
      return 'idCard';
    }
    if (lower.includes('bank') || lower.includes('银行卡') || lower.includes('cardno')) {
      return 'bankCard';
    }
    if (lower.includes('phone') || lower.includes('mobile') || lower.includes('电话')) {
      return 'phone';
    }
    if (lower.includes('address') || lower.includes('住址') || lower.includes('地址')) {
      return 'address';
    }
    if (lower.includes('name') && lower.includes('id') === false) {
      return 'name';
    }
    return 'default';
  }

  private maskIdCard(value: string): string {
    if (value.length < 8) {
      return '*'.repeat(value.length);
    }
    const start = value.slice(0, 6);
    const end = value.slice(-4);
    return `${start}********${end}`;
  }

  private maskBankCard(value: string): string {
    if (value.length < 8) {
      return '*'.repeat(value.length);
    }
    const start = value.slice(0, 4);
    const end = value.slice(-4);
    const middle = '*'.repeat(Math.max(value.length - 8, 4));
    return `${start}${middle}${end}`;
  }

  private maskPhone(value: string): string {
    if (value.length < 7) {
      return '*'.repeat(value.length);
    }
    const start = value.slice(0, 3);
    const end = value.slice(-4);
    return `${start}****${end}`;
  }

  private maskAddress(value: string): string {
    if (value.length < 6) {
      return '*'.repeat(value.length);
    }
    const keepLength = Math.min(Math.floor(value.length * 0.4), 10);
    return value.slice(0, keepLength) + '****' + value.slice(-3);
  }

  private maskName(value: string): string {
    if (value.length <= 1) {
      return value;
    }
    if (value.length === 2) {
      return value[0] + '*';
    }
    return value[0] + '*'.repeat(value.length - 2) + value.slice(-1);
  }

  private maskDefault(value: string): string {
    if (value.length < 4) {
      return '*'.repeat(value.length);
    }
    const keep = Math.floor(value.length * 0.3);
    const maskLen = value.length - keep * 2;
    return value.slice(0, keep) + '*'.repeat(Math.max(maskLen, 2)) + value.slice(-keep);
  }
}
