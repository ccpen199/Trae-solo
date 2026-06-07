import crypto from 'crypto';
import { ApplicationRepository } from '../repositories/ApplicationRepository.js';
import { ServiceItemService } from './ServiceItemService.js';
import { LicenseService } from './LicenseService.js';
import { AuditLogRepository } from '../repositories/AuditLogRepository.js';
import {
  Application,
  CreateApplicationRequest,
  ApplicationTimelineItem,
  UserInfo,
} from '../types/index.js';

const applicationRepository = new ApplicationRepository();
const serviceItemService = new ServiceItemService();
const licenseService = new LicenseService();
const auditLogRepository = new AuditLogRepository();

function generateApplicationNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
  return `AH${dateStr}${random}`;
}

function parseApplication(row: any): Application {
  return {
    ...row,
    formData: row.form_data ? JSON.parse(row.form_data) : {},
    scenarioPath: row.scenario_path ? JSON.parse(row.scenario_path) : [],
    materialHashList: row.material_hash_list ? JSON.parse(row.material_hash_list) : [],
    serviceItemName: row.serviceName || row.service_name || row.serviceItemName,
    serviceName: row.serviceName || row.service_name,
    createdAt: row.created_at,
    submittedAt: row.submitted_at,
    completedAt: row.completed_at,
  };
}

export class ApplicationService {
  async create(request: CreateApplicationRequest, user: UserInfo, ip?: string, userAgent?: string): Promise<Application | null> {
    const serviceItem = serviceItemService.findById(request.serviceId);
    if (!serviceItem) {
      return null;
    }

    const applicationNo = generateApplicationNo();
    const materialHashes: string[] = [];

    for (const material of request.materials) {
      let hash = material.fileHash;
      
      if (material.isFromLicense && material.licenseId) {
        const license = licenseService.getLicenseById(material.licenseId, user.id);
        if (license) {
          hash = crypto.createHash('sha256').update(`${license.licenseNumber}-${Date.now()}`).digest('hex');
        }
      }
      
      if (hash) {
        materialHashes.push(hash);
      }
    }

    const applicationId = applicationRepository.create({
      applicationNo,
      serviceId: request.serviceId,
      applicantId: user.id,
      status: 'submitted',
      formData: JSON.stringify(request.formData),
      scenarioPath: JSON.stringify(request.scenarioPath),
      materialHashList: JSON.stringify(materialHashes),
      submittedAt: new Date().toISOString(),
    } as any);

    for (const material of request.materials) {
      applicationRepository.addMaterial({
        applicationId,
        materialName: material.materialName,
        isFromLicense: material.isFromLicense,
        licenseId: material.licenseId,
        fileHash: material.fileHash,
      });
    }

    applicationRepository.addApprovalNode({
      applicationId,
      flowId: request.serviceId,
      nodeName: '提交申请',
      department: serviceItem.department,
      operatorId: user.id,
      action: 'submit',
      comment: '用户提交申请',
      handledAt: new Date().toISOString(),
    });

    serviceItemService.incrementRunningCount(request.serviceId);

    auditLogRepository.create({
      userId: user.id,
      applicationId,
      action: '提交申请',
      details: `提交了"${serviceItem.name}"申请，办件编号：${applicationNo}`,
      ipAddress: ip,
      userAgent,
    });

    const newApp = applicationRepository.findById(applicationId);
    return newApp ? parseApplication(newApp) : null;
  }

  getById(id: number, userId: number): Application | null {
    const app = applicationRepository.findById(id);
    if (!app || app.applicantId !== userId) {
      return null;
    }
    const result = parseApplication(app);
    const serviceItem = serviceItemService.findById(app.serviceId);
    if (serviceItem) {
      result.serviceName = serviceItem.name;
    }
    return result;
  }

  getByUser(userId: number, status?: string, page: number = 1, pageSize: number = 10) {
    const result = applicationRepository.findWithServiceName(userId, status, page, pageSize);
    return {
      ...result,
      data: result.data.map(parseApplication),
    };
  }

  getTimeline(applicationId: number, userId: number): ApplicationTimelineItem[] | null {
    const app = applicationRepository.findById(applicationId);
    if (!app || app.applicantId !== userId) {
      return null;
    }
    return applicationRepository.getTimeline(applicationId);
  }

  getStatsByStatus(userId: number) {
    const allStats = applicationRepository.getStatsByStatus();
    const userApps = applicationRepository.findByApplicantId(userId);
    
    const userStatusMap = new Map<string, number>();
    for (const app of userApps.data) {
      userStatusMap.set(app.status, (userStatusMap.get(app.status) || 0) + 1);
    }
    
    return {
      all: allStats,
      mine: Array.from(userStatusMap.entries()).map(([status, count]) => ({ status, count })),
    };
  }

  async submitSignature(applicationId: number, userId: number, signature: string, ip?: string, userAgent?: string): Promise<boolean> {
    const app = applicationRepository.findById(applicationId);
    if (!app || app.applicantId !== userId) {
      return false;
    }

    auditLogRepository.create({
      userId,
      applicationId,
      action: '电子签名',
      details: `电子签名完成，签名哈希：${crypto.createHash('sha256').update(signature).digest('hex').substring(0, 16)}...`,
      ipAddress: ip,
      userAgent,
    });

    return true;
  }
}
