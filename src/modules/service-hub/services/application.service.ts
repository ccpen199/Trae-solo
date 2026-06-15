import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { nanoid } from 'nanoid';
import {
  Application,
  ApplicationStatus,
  ScenarioPathItem,
} from '../entities/application.entity';
import {
  ApplicationMaterial,
  MaterialStatus,
} from '../entities/application-material.entity';
import {
  ApplicationProgress,
  ProgressAction,
} from '../entities/application-progress.entity';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
  SubmitApplicationDto,
  QueryApplicationDto,
  RevokeApplicationDto,
  ApplicationMaterialDto,
} from '../dto/application.dto';
import { ServiceItemService } from './service-item.service';
import { ServiceSubitemService } from './service-subitem.service';

export interface CertServiceMockResult {
  success: boolean;
  certNo?: string;
  certData?: Record<string, unknown>;
  message?: string;
}

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(ApplicationMaterial)
    private readonly materialRepository: Repository<ApplicationMaterial>,
    @InjectRepository(ApplicationProgress)
    private readonly progressRepository: Repository<ApplicationProgress>,
    private readonly dataSource: DataSource,
    private readonly itemService: ServiceItemService,
    private readonly subitemService: ServiceSubitemService,
  ) {}

  async createDraft(userId: string, dto: CreateApplicationDto): Promise<Application> {
    return this.dataSource.transaction(async (manager) => {
      const item = await this.itemService.findById(dto.itemId);

      const trackingNo = this.generateTrackingNo();

      const application = manager.create(Application, {
        userId,
        itemId: dto.itemId,
        subitemId: dto.subitemId || null,
        trackingNo,
        status: 'draft' as ApplicationStatus,
        applicantInfo: {
          ...dto.applicantInfo,
          userId,
        },
        scenarioPath: (dto.scenarioPath as ScenarioPathItem[]) || null,
        formData: dto.formData || null,
        deptCode: item.deptCode,
        remark: dto.remark || null,
      });
      const savedApp = await manager.save(application);

      let materialsToCreate = dto.materials || [];
      if (materialsToCreate.length === 0 && item.materialsRequired) {
        materialsToCreate = item.materialsRequired.map((m, idx) => ({
          materialName: m.name,
          materialCode: m.code || null,
          certType: m.certType || null,
          required: m.required,
          sort: idx,
        }));
      }

      if (materialsToCreate.length > 0) {
        const materialEntities = materialsToCreate.map((m, idx) =>
          manager.create(ApplicationMaterial, {
            applicationId: savedApp.id,
            materialName: m.materialName,
            materialCode: m.materialCode || null,
            certType: m.certType || null,
            required: m.required ?? true,
            sort: m.sort ?? idx,
            status: 'pending' as MaterialStatus,
          }),
        );
        await manager.save(materialEntities);
      }

      await manager.save(
        manager.create(ApplicationProgress, {
          applicationId: savedApp.id,
          nodeName: '创建草稿',
          nodeCode: 'create_draft',
          operatorId: userId,
          operator: dto.applicantInfo.name,
          operatorRole: 'applicant',
          action: 'create' as ProgressAction,
          fromStatus: null,
          toStatus: 'draft',
        }),
      );

      return savedApp;
    });
  }

  async updateDraft(
    userId: string,
    applicationId: string,
    dto: UpdateApplicationDto,
  ): Promise<Application> {
    return this.dataSource.transaction(async (manager) => {
      const application = await manager.findOne(Application, { where: { id: applicationId } });
      if (!application) {
        throw new NotFoundException('申报单不存在');
      }
      if (application.userId !== userId) {
        throw new ForbiddenException('无权修改此申报单');
      }
      if (application.status !== 'draft') {
        throw new BadRequestException('仅草稿状态可以修改');
      }

      if (dto.subitemId !== undefined) application.subitemId = dto.subitemId;
      if (dto.applicantInfo) application.applicantInfo = { ...dto.applicantInfo, userId };
      if (dto.scenarioPath !== undefined)
        application.scenarioPath = (dto.scenarioPath as ScenarioPathItem[]) || null;
      if (dto.formData !== undefined) application.formData = dto.formData;
      if (dto.remark !== undefined) application.remark = dto.remark;

      const savedApp = await manager.save(application);

      if (dto.materials) {
        await manager.delete(ApplicationMaterial, { applicationId });
        const materialEntities = dto.materials.map((m, idx) =>
          manager.create(ApplicationMaterial, {
            applicationId: savedApp.id,
            materialName: m.materialName,
            materialCode: m.materialCode || null,
            fileUrl: m.fileUrl || null,
            fileName: m.fileName || null,
            certType: m.certType || null,
            required: m.required ?? true,
            sort: m.sort ?? idx,
            status: m.fileUrl ? ('uploaded' as MaterialStatus) : ('pending' as MaterialStatus),
          }),
        );
        await manager.save(materialEntities);
      }

      return savedApp;
    });
  }

  async submit(userId: string, dto: SubmitApplicationDto): Promise<Application> {
    return this.dataSource.transaction(async (manager) => {
      let application: Application;
      let isNew = false;

      if (dto.applicationId) {
        application = await manager.findOne(Application, { where: { id: dto.applicationId } });
        if (!application) {
          throw new NotFoundException('申报单不存在');
        }
        if (application.userId !== userId) {
          throw new ForbiddenException('无权操作此申报单');
        }
        if (application.status !== 'draft') {
          throw new BadRequestException('仅草稿状态可以提交');
        }

        if (dto.subitemId !== undefined) application.subitemId = dto.subitemId;
        if (dto.applicantInfo)
          application.applicantInfo = { ...dto.applicantInfo, userId };
        if (dto.scenarioPath !== undefined)
          application.scenarioPath = (dto.scenarioPath as ScenarioPathItem[]) || null;
        if (dto.formData !== undefined) application.formData = dto.formData;
      } else {
        if (!dto.itemId) {
          throw new BadRequestException('新建提交必须指定itemId');
        }
        isNew = true;
        const item = await this.itemService.findById(dto.itemId);
        const trackingNo = this.generateTrackingNo();

        application = manager.create(Application, {
          userId,
          itemId: dto.itemId,
          subitemId: dto.subitemId || null,
          trackingNo,
          status: 'draft' as ApplicationStatus,
          applicantInfo: {
            ...(dto.applicantInfo || {}),
            userId,
          },
          scenarioPath: (dto.scenarioPath as ScenarioPathItem[]) || null,
          formData: dto.formData || null,
          deptCode: item.deptCode,
        });
        application = await manager.save(application);

        if (dto.itemId) {
          const item = await this.itemService.findById(dto.itemId);
          if (item.materialsRequired) {
            const materialEntities = item.materialsRequired.map((m, idx) =>
              manager.create(ApplicationMaterial, {
                applicationId: application.id,
                materialName: m.name,
                materialCode: m.code || null,
                certType: m.certType || null,
                required: m.required,
                sort: idx,
                status: 'pending' as MaterialStatus,
              }),
            );
            await manager.save(materialEntities);
          }
        }
      }

      if (dto.materials) {
        await manager.delete(ApplicationMaterial, { applicationId: application.id });
        const materialEntities = dto.materials.map((m, idx) =>
          manager.create(ApplicationMaterial, {
            applicationId: application.id,
            materialName: m.materialName,
            materialCode: m.materialCode || null,
            fileUrl: m.fileUrl || null,
            fileName: m.fileName || null,
            certType: m.certType || null,
            required: m.required ?? true,
            sort: m.sort ?? idx,
            status: m.fileUrl ? ('uploaded' as MaterialStatus) : ('pending' as MaterialStatus),
          }),
        );
        await manager.save(materialEntities);
      }

      const materials = await manager.find(ApplicationMaterial, {
        where: { applicationId: application.id },
      });

      for (const material of materials) {
        if (material.certType && !material.fileUrl) {
          const certResult = await this.mockFetchElectronicCert(
            userId,
            material.certType,
            application.applicantInfo,
          );
          if (certResult.success) {
            material.certNo = certResult.certNo || null;
            material.certData = certResult.certData || null;
            material.status = 'cert_filled' as MaterialStatus;
            await manager.save(material);
          }
        }
      }

      const requiredMaterials = materials.filter((m) => m.required);
      const allRequiredReady = requiredMaterials.every(
        (m) => m.status === 'uploaded' || m.status === 'cert_filled' || m.status === 'verified',
      );
      if (!allRequiredReady) {
        throw new BadRequestException('存在未上传的必填材料，请先补充材料');
      }

      const fromStatus = application.status;
      application.status = 'submitted' as ApplicationStatus;
      application.submitTime = new Date();
      const savedApp = await manager.save(application);

      await manager.save(
        manager.create(ApplicationProgress, {
          applicationId: savedApp.id,
          nodeName: isNew ? '创建并提交申报' : '提交申报',
          nodeCode: 'submit',
          operatorId: userId,
          operator: application.applicantInfo.name,
          operatorRole: 'applicant',
          action: 'submit' as ProgressAction,
          fromStatus,
          toStatus: 'submitted',
        }),
      );

      return savedApp;
    });
  }

  async revoke(
    userId: string,
    applicationId: string,
    dto: RevokeApplicationDto,
  ): Promise<Application> {
    return this.dataSource.transaction(async (manager) => {
      const application = await manager.findOne(Application, { where: { id: applicationId } });
      if (!application) {
        throw new NotFoundException('申报单不存在');
      }
      if (application.userId !== userId) {
        throw new ForbiddenException('无权操作此申报单');
      }

      const allowedStatuses: ApplicationStatus[] = ['submitted', 'accepted', 'reviewing'];
      if (!allowedStatuses.includes(application.status)) {
        throw new BadRequestException(`当前状态「${application.status}」不允许撤销`);
      }

      const fromStatus = application.status;
      application.status = 'revoked' as ApplicationStatus;
      application.remark = dto.reason;
      const savedApp = await manager.save(application);

      await manager.save(
        manager.create(ApplicationProgress, {
          applicationId: savedApp.id,
          nodeName: '撤销申报',
          nodeCode: 'revoke',
          operatorId: userId,
          operator: application.applicantInfo.name,
          operatorRole: 'applicant',
          action: 'revoke' as ProgressAction,
          fromStatus,
          toStatus: 'revoked',
          remark: dto.reason,
        }),
      );

      return savedApp;
    });
  }

  async findById(userId: string, applicationId: string): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['item', 'subitem', 'materials', 'progresses'],
    });
    if (!application) {
      throw new NotFoundException('申报单不存在');
    }
    if (application.userId !== userId) {
      throw new ForbiddenException('无权查看此申报单');
    }
    if (application.progresses) {
      application.progresses.sort(
        (a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime(),
      );
    }
    return application;
  }

  async findByUser(
    userId: string,
    query: QueryApplicationDto,
  ): Promise<{ list: Application[]; total: number }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const qb = this.applicationRepository.createQueryBuilder('a');
    qb.where('a.userId = :userId', { userId });

    if (query.itemId) {
      qb.andWhere('a.itemId = :itemId', { itemId: query.itemId });
    }
    if (query.subitemId) {
      qb.andWhere('a.subitemId = :subitemId', { subitemId: query.subitemId });
    }
    if (query.status) {
      qb.andWhere('a.status = :status', { status: query.status });
    }
    if (query.trackingNo) {
      qb.andWhere('a.trackingNo LIKE :trackingNo', { trackingNo: `%${query.trackingNo}%` });
    }
    if (query.deptCode) {
      qb.andWhere('a.deptCode = :deptCode', { deptCode: query.deptCode });
    }

    qb.leftJoinAndSelect('a.item', 'item')
      .leftJoinAndSelect('a.subitem', 'subitem')
      .orderBy('a.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  async getProgress(applicationId: string): Promise<ApplicationProgress[]> {
    return this.progressRepository.find({
      where: { applicationId },
      order: { createTime: 'ASC' },
    });
  }

  async getMaterials(applicationId: string): Promise<ApplicationMaterial[]> {
    return this.materialRepository.find({
      where: { applicationId },
      order: { sort: 'ASC' },
    });
  }

  async updateMaterialStatus(
    applicationId: string,
    materialId: string,
    status: MaterialStatus,
    remark?: string,
  ): Promise<ApplicationMaterial> {
    const material = await this.materialRepository.findOne({
      where: { id: materialId, applicationId },
    });
    if (!material) {
      throw new NotFoundException('申报材料不存在');
    }
    material.status = status;
    if (remark !== undefined) material.remark = remark;
    return this.materialRepository.save(material);
  }

  private generateTrackingNo(): string {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const rand = nanoid(10).toUpperCase();
    return `SB${yyyy}${mm}${dd}${rand}`;
  }

  private async mockFetchElectronicCert(
    userId: string,
    certType: string,
    applicantInfo: any,
  ): Promise<CertServiceMockResult> {
    this.logger.log(
      `[电子证照模拟调用] userId=${userId}, certType=${certType}, userName=${applicantInfo?.name}`,
    );

    const certRegistry: Record<string, { certName: string; fields: string[] }> = {
      ID_CARD: {
        certName: '居民身份证',
        fields: ['name', 'idCard', 'gender', 'ethnicity', 'address'],
      },
      HOUSEHOLD_REGISTER: {
        certName: '居民户口簿',
        fields: ['householdNo', 'members'],
      },
      BUSINESS_LICENSE: {
        certName: '营业执照',
        fields: ['creditCode', 'companyName', 'legalPerson', 'address'],
      },
      REAL_ESTATE_CERT: {
        certName: '不动产权证书',
        fields: ['certNo', 'owner', 'location', 'area'],
      },
      SOCIAL_SECURITY_CARD: {
        certName: '社会保障卡',
        fields: ['cardNo', 'name', 'idCard', 'socialSecurityNo'],
      },
      MARRIAGE_CERT: {
        certName: '结婚证',
        fields: ['certNo', 'spouse1Name', 'spouse2Name', 'marriageDate'],
      },
      BIRTH_CERT: {
        certName: '出生医学证明',
        fields: ['certNo', 'childName', 'motherName', 'fatherName', 'birthDate'],
      },
      EDUCATION_DEGREE: {
        certName: '学历学位证书',
        fields: ['certNo', 'name', 'school', 'major', 'degree', 'graduateDate'],
      },
    };

    const certConfig = certRegistry[certType];

    await new Promise((resolve) => setTimeout(resolve, 200));

    if (certConfig) {
      const certData: Record<string, unknown> = {
        certType,
        certName: certConfig.certName,
        issueDate: new Date().toISOString().split('T')[0],
      };

      for (const field of certConfig.fields) {
        if (applicantInfo && applicantInfo[field]) {
          certData[field] = applicantInfo[field];
        } else {
          certData[field] = this.generateMockFieldValue(field, applicantInfo);
        }
      }

      return {
        success: true,
        certNo: `${certType}-${nanoid(12).toUpperCase()}`,
        certData,
      };
    }

    return {
      success: false,
      message: `证照类型「${certType}」未配置，用户需手动上传`,
    };
  }

  private generateMockFieldValue(field: string, applicantInfo: any): string {
    const mockData: Record<string, () => string> = {
      idCard: () => '6401' + Math.floor(Math.random() * 1000000000000).toString().slice(0, 14),
      gender: () => (Math.random() > 0.5 ? '男' : '女'),
      ethnicity: () => '汉族',
      address: () => applicantInfo?.address || '宁夏银川市兴庆区某街道XX号',
      householdNo: () => 'NX' + Math.floor(Math.random() * 1000000),
      creditCode: () => '9164' + Math.floor(Math.random() * 100000000000000).toString().slice(0, 14),
      companyName: () => applicantInfo?.companyName || '宁夏示例企业管理有限公司',
      legalPerson: () => applicantInfo?.legalPerson || applicantInfo?.name || '张三',
      cardNo: () => 'SMC' + Math.floor(Math.random() * 1000000000),
      socialSecurityNo: () => '6401' + Math.floor(Math.random() * 1000000000),
      certNo: () => nanoid(18).toUpperCase(),
      owner: () => applicantInfo?.name || '张三',
      location: () => '宁夏银川市金凤区XX小区X号楼X单元X室',
      area: () => (Math.random() * 100 + 60).toFixed(1) + '平方米',
      spouse1Name: () => applicantInfo?.name || '张三',
      spouse2Name: () => '李四',
      marriageDate: () => '2020-05-20',
      childName: () => '张小宝',
      motherName: () => applicantInfo?.name || '李四',
      fatherName: () => '张三',
      birthDate: () => new Date(Date.now() - 365 * 24 * 60 * 60 * 1000 * Math.floor(Math.random() * 5 + 1)).toISOString().split('T')[0],
      school: () => '宁夏大学',
      major: () => ['计算机科学与技术', '法学', '经济学', '医学'][Math.floor(Math.random() * 4)],
      degree: () => ['学士', '硕士', '博士'][Math.floor(Math.random() * 3)],
      graduateDate: () => '202' + Math.floor(Math.random() * 4) + '-06-30',
      members: () => '户主、配偶、子女共3人',
    };

    return mockData[field] ? mockData[field]() : '';
  }
}
