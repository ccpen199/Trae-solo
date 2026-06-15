import { Injectable, Logger, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Brackets } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { CertCatalog, CertFieldDef } from '../entities/cert-catalog.entity';
import { CertCatalogQueryDto } from '../dto/cert-query.dto';

export interface SystemConfigCert {
  code: string;
  name: string;
  category: string;
  dept: string;
}

export interface SystemConfig {
  appName: string;
  version: string;
  departments: Array<{ code: string; name: string; fullName: string }>;
  certTypes: SystemConfigCert[];
}

const DEFAULT_FIELDS_MAP: Record<string, CertFieldDef[]> = {
  SFZ: [
    { name: 'name', label: '姓名', type: 'string', encrypted: true, masked: false, required: true },
    { name: 'idCardNo', label: '公民身份号码', type: 'string', encrypted: true, masked: true, maskPattern: 'idCard', required: true },
    { name: 'gender', label: '性别', type: 'string', encrypted: false, masked: false, required: true, enumValues: ['男', '女'] },
    { name: 'ethnicity', label: '民族', type: 'string', encrypted: false, masked: false, required: true },
    { name: 'birthDate', label: '出生日期', type: 'date', encrypted: false, masked: false, required: true },
    { name: 'address', label: '住址', type: 'string', encrypted: true, masked: true, maskPattern: 'address', required: true },
    { name: 'issueAuthority', label: '签发机关', type: 'string', encrypted: false, masked: false, required: true },
    { name: 'photo', label: '人像照片', type: 'string', encrypted: true, masked: false, required: false },
  ],
  HKZ: [
    { name: 'householderName', label: '户主姓名', type: 'string', encrypted: true, masked: false, required: true },
    { name: 'householdNo', label: '户号', type: 'string', encrypted: true, masked: true, maskPattern: 'default', required: true },
    { name: 'address', label: '住址', type: 'string', encrypted: true, masked: true, maskPattern: 'address', required: true },
    { name: 'members', label: '户成员', type: 'string', encrypted: true, masked: false, required: false },
    { name: 'issueAuthority', label: '签发机关', type: 'string', encrypted: false, masked: false, required: true },
  ],
  JHZ: [
    { name: 'husbandName', label: '男方姓名', type: 'string', encrypted: true, masked: false, required: true },
    { name: 'husbandIdCardNo', label: '男方身份证号', type: 'string', encrypted: true, masked: true, maskPattern: 'idCard', required: true },
    { name: 'wifeName', label: '女方姓名', type: 'string', encrypted: true, masked: false, required: true },
    { name: 'wifeIdCardNo', label: '女方身份证号', type: 'string', encrypted: true, masked: true, maskPattern: 'idCard', required: true },
    { name: 'marriageDate', label: '登记日期', type: 'date', encrypted: false, masked: false, required: true },
    { name: 'issueAuthority', label: '发证机关', type: 'string', encrypted: false, masked: false, required: true },
  ],
  SBK: [
    { name: 'name', label: '姓名', type: 'string', encrypted: true, masked: false, required: true },
    { name: 'idCardNo', label: '身份证号', type: 'string', encrypted: true, masked: true, maskPattern: 'idCard', required: true },
    { name: 'cardNo', label: '社会保障号码', type: 'string', encrypted: true, masked: true, maskPattern: 'default', required: true },
    { name: 'bankCardNo', label: '关联银行卡号', type: 'string', encrypted: true, masked: true, maskPattern: 'bankCard', required: false },
    { name: 'socialSecurityType', label: '社保类型', type: 'string', encrypted: false, masked: false, required: true },
    { name: 'issueDate', label: '发卡日期', type: 'date', encrypted: false, masked: false, required: true },
  ],
  YLZ: [
    { name: 'name', label: '姓名', type: 'string', encrypted: true, masked: false, required: true },
    { name: 'idCardNo', label: '身份证号', type: 'string', encrypted: true, masked: true, maskPattern: 'idCard', required: true },
    { name: 'medicalCardNo', label: '医保卡号', type: 'string', encrypted: true, masked: true, maskPattern: 'default', required: true },
    { name: 'insuredType', label: '参保类型', type: 'string', encrypted: false, masked: false, required: true },
    { name: 'insuredArea', label: '参保地区', type: 'string', encrypted: false, masked: false, required: true },
  ],
  JDZ: [
    { name: 'name', label: '姓名', type: 'string', encrypted: true, masked: false, required: true },
    { name: 'idCardNo', label: '身份证号', type: 'string', encrypted: true, masked: true, maskPattern: 'idCard', required: true },
    { name: 'licenseNo', label: '驾驶证号', type: 'string', encrypted: true, masked: true, maskPattern: 'default', required: true },
    { name: 'licenseType', label: '准驾车型', type: 'string', encrypted: false, masked: false, required: true },
    { name: 'firstIssueDate', label: '初次领证日期', type: 'date', encrypted: false, masked: false, required: true },
    { name: 'validFrom', label: '有效期起始', type: 'date', encrypted: false, masked: false, required: true },
    { name: 'validTo', label: '有效期截止', type: 'date', encrypted: false, masked: false, required: true },
    { name: 'issueAuthority', label: '发证机关', type: 'string', encrypted: false, masked: false, required: true },
    { name: 'photo', label: '照片', type: 'string', encrypted: true, masked: false, required: false },
  ],
  BDCZH: [
    { name: 'obligee', label: '权利人', type: 'string', encrypted: true, masked: false, required: true },
    { name: 'obligeeIdCard', label: '权利人身份证号', type: 'string', encrypted: true, masked: true, maskPattern: 'idCard', required: true },
    { name: 'certificateNo', label: '不动产权证号', type: 'string', encrypted: true, masked: true, maskPattern: 'default', required: true },
    { name: 'propertyType', label: '权利类型', type: 'string', encrypted: false, masked: false, required: true },
    { name: 'propertyNature', label: '权利性质', type: 'string', encrypted: false, masked: false, required: true },
    { name: 'location', label: '坐落', type: 'string', encrypted: true, masked: true, maskPattern: 'address', required: true },
    { name: 'area', label: '面积(㎡)', type: 'number', encrypted: false, masked: false, required: true },
    { name: 'issueDate', label: '登记日期', type: 'date', encrypted: false, masked: false, required: true },
    { name: 'issueAuthority', label: '登记机构', type: 'string', encrypted: false, masked: false, required: true },
  ],
  YWZ: [
    { name: 'enterpriseName', label: '企业名称', type: 'string', encrypted: false, masked: false, required: true },
    { name: 'unifiedSocialCreditCode', label: '统一社会信用代码', type: 'string', encrypted: false, masked: false, required: true },
    { name: 'legalRepresentative', label: '法定代表人', type: 'string', encrypted: true, masked: false, required: true },
    { name: 'legalRepIdCard', label: '法人身份证号', type: 'string', encrypted: true, masked: true, maskPattern: 'idCard', required: true },
    { name: 'registeredCapital', label: '注册资本', type: 'string', encrypted: false, masked: false, required: true },
    { name: 'establishDate', label: '成立日期', type: 'date', encrypted: false, masked: false, required: true },
    { name: 'businessScope', label: '经营范围', type: 'string', encrypted: false, masked: false, required: true },
    { name: 'address', label: '住所', type: 'string', encrypted: true, masked: true, maskPattern: 'address', required: true },
    { name: 'issueAuthority', label: '登记机关', type: 'string', encrypted: false, masked: false, required: true },
  ],
  BYZ: [
    { name: 'name', label: '姓名', type: 'string', encrypted: true, masked: false, required: true },
    { name: 'idCardNo', label: '身份证号', type: 'string', encrypted: true, masked: true, maskPattern: 'idCard', required: true },
    { name: 'schoolName', label: '学校名称', type: 'string', encrypted: false, masked: false, required: true },
    { name: 'major', label: '专业', type: 'string', encrypted: false, masked: false, required: true },
    { name: 'educationLevel', label: '学历层次', type: 'string', encrypted: false, masked: false, required: true },
    { name: 'graduationDate', label: '毕业日期', type: 'date', encrypted: false, masked: false, required: true },
    { name: 'certificateNo', label: '证书编号', type: 'string', encrypted: true, masked: true, maskPattern: 'default', required: true },
    { name: 'principalName', label: '校长姓名', type: 'string', encrypted: false, masked: false, required: false },
  ],
  JSZG: [
    { name: 'name', label: '姓名', type: 'string', encrypted: true, masked: false, required: true },
    { name: 'idCardNo', label: '身份证号', type: 'string', encrypted: true, masked: true, maskPattern: 'idCard', required: true },
    { name: 'certificateNo', label: '证书编号', type: 'string', encrypted: true, masked: true, maskPattern: 'default', required: true },
    { name: 'qualificationLevel', label: '资格等级', type: 'string', encrypted: false, masked: false, required: true },
    { name: 'teachSubject', label: '任教学科', type: 'string', encrypted: false, masked: false, required: true },
    { name: 'firstIssueDate', label: '首次发证日期', type: 'date', encrypted: false, masked: false, required: true },
    { name: 'issueAuthority', label: '发证机关', type: 'string', encrypted: false, masked: false, required: true },
  ],
};

const GENERIC_FIELDS: CertFieldDef[] = [
  { name: 'name', label: '姓名', type: 'string', encrypted: true, masked: false, required: true },
  { name: 'idCardNo', label: '身份证号', type: 'string', encrypted: true, masked: true, maskPattern: 'idCard', required: true },
  { name: 'certificateNo', label: '证书编号', type: 'string', encrypted: true, masked: true, maskPattern: 'default', required: true },
  { name: 'issueDate', label: '发证日期', type: 'date', encrypted: false, masked: false, required: true },
  { name: 'issueAuthority', label: '发证机关', type: 'string', encrypted: false, masked: false, required: true },
];

@Injectable()
export class CertCatalogService implements OnModuleInit {
  private readonly logger = new Logger(CertCatalogService.name);

  constructor(
    @InjectRepository(CertCatalog)
    private readonly certCatalogRepository: Repository<CertCatalog>,
  ) {}

  async onModuleInit() {
    try {
      await this.initializeCatalogs();
    } catch (error) {
      this.logger.error(`初始化证照目录失败: ${error.message}`, error.stack);
    }
  }

  private loadSystemConfig(): SystemConfig | null {
    try {
      const configPath = path.join(
        process.cwd(),
        'src',
        'config',
        'system-config.json',
      );
      const raw = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(raw) as SystemConfig;
    } catch (error) {
      this.logger.error(`加载system-config.json失败: ${error.message}`);
      return null;
    }
  }

  private getDefaultFields(certCode: string): CertFieldDef[] {
    if (DEFAULT_FIELDS_MAP[certCode]) {
      return DEFAULT_FIELDS_MAP[certCode];
    }
    return [...GENERIC_FIELDS];
  }

  private getValidPeriod(certCode: string): number {
    const periodMap: Record<string, number> = {
      SFZ: 3650,
      JDZ: 2190,
      BYZ: 0,
      XWZ: 0,
      BDCZH: 0,
      YWZ: 0,
      SHXYDM: 0,
    };
    return periodMap[certCode] ?? 1825;
  }

  async initializeCatalogs(): Promise<void> {
    const config = this.loadSystemConfig();
    if (!config) {
      this.logger.warn('无法加载配置，跳过证照目录初始化');
      return;
    }

    const deptMap = new Map(config.departments.map((d) => [d.code, d]));

    for (const certType of config.certTypes) {
      const existing = await this.catalogExists(certType.code);
      if (existing) {
        continue;
      }

      const dept = deptMap.get(certType.dept);
      const catalog = this.certCatalogRepository.create({
        code: certType.code,
        name: certType.name,
        category: certType.category,
        deptCode: certType.dept,
        deptName: dept?.fullName ?? dept?.name ?? certType.dept,
        validPeriod: this.getValidPeriod(certType.code),
        certFieldsDef: this.getDefaultFields(certType.code),
        icon: null,
        description: `${certType.name}电子证照，由${dept?.fullName ?? certType.dept}签发`,
        status: 'active',
      });

      await this.certCatalogRepository.save(catalog);
      this.logger.log(`初始化证照目录: ${certType.code} - ${certType.name}`);
    }

    this.logger.log(`证照目录初始化完成，共 ${config.certTypes.length} 类`);
  }

  async catalogExists(code: string): Promise<boolean> {
    const count = await this.certCatalogRepository.count({ where: { code } });
    return count > 0;
  }

  async findAll(query: CertCatalogQueryDto): Promise<{ list: CertCatalog[]; total: number }> {
    const { category, deptCode, keyword, page = 1, pageSize = 20 } = query;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { status: 'active' };
    const qb = this.certCatalogRepository.createQueryBuilder('c');
    qb.where('c.status = :status', { status: 'active' });

    if (category) {
      qb.andWhere('c.category = :category', { category });
    }
    if (deptCode) {
      qb.andWhere('c.dept_code = :deptCode', { deptCode });
    }
    if (keyword) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('c.name LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('c.code LIKE :keyword', { keyword: `%${keyword}%` });
        }),
      );
    }

    qb.orderBy('c.dept_code', 'ASC').addOrderBy('c.code', 'ASC');
    qb.skip(skip).take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  async findAllSimple(): Promise<CertCatalog[]> {
    return this.certCatalogRepository.find({
      where: { status: 'active' },
      order: { deptCode: 'ASC', code: 'ASC' },
    });
  }

  async findByCode(code: string): Promise<CertCatalog> {
    const catalog = await this.certCatalogRepository.findOne({ where: { code, status: 'active' } });
    if (!catalog) {
      throw new NotFoundException(`证照目录不存在: ${code}`);
    }
    return catalog;
  }

  async findById(id: string): Promise<CertCatalog> {
    const catalog = await this.certCatalogRepository.findOne({ where: { id } });
    if (!catalog) {
      throw new NotFoundException(`证照目录不存在: ${id}`);
    }
    return catalog;
  }

  async create(data: Partial<CertCatalog>): Promise<CertCatalog> {
    const catalog = this.certCatalogRepository.create(data);
    return this.certCatalogRepository.save(catalog);
  }

  async update(id: string, data: Partial<CertCatalog>): Promise<CertCatalog> {
    await this.certCatalogRepository.update(id, data);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.certCatalogRepository.softDelete(id);
  }

  getDeptMap(): Map<string, { code: string; name: string; fullName: string }> {
    const config = this.loadSystemConfig();
    if (!config) return new Map();
    return new Map(config.departments.map((d) => [d.code, d]));
  }

  getFieldNames(certCode: string): string[] {
    const fields = DEFAULT_FIELDS_MAP[certCode] ?? GENERIC_FIELDS;
    return fields.map((f) => f.name);
  }

  getMaskedFieldNames(certCode: string): string[] {
    const fields = DEFAULT_FIELDS_MAP[certCode] ?? GENERIC_FIELDS;
    return fields.filter((f) => f.masked).map((f) => f.name);
  }
}
