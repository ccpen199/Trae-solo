import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FirmwareEntity, OtaJobEntity } from '../../database/entities/ota.entity';
import { DeviceEntity } from '../../database/entities/device.entity';
import { VendorEntity } from '../../database/entities/vendor.entity';
import { OtaStatus } from '@iot/shared';
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class OtaService {
  private readonly logger = new Logger(OtaService.name);

  constructor(
    @InjectRepository(FirmwareEntity) private readonly firmwareRepo: Repository<FirmwareEntity>,
    @InjectRepository(OtaJobEntity) private readonly otaJobRepo: Repository<OtaJobEntity>,
    @InjectRepository(DeviceEntity) private readonly deviceRepo: Repository<DeviceEntity>,
    @InjectRepository(VendorEntity) private readonly vendorRepo: Repository<VendorEntity>,
    private readonly mqttService: MqttService,
  ) {}

  async uploadFirmware(dto: { vendorId: string; deviceModel: string; version: string; downloadUrl: string; changelog?: string; fileSize?: number; md5Hash?: string; minSupportedVersion?: number; isMandatory?: boolean }) {
    const vendor = await this.vendorRepo.findOne({ where: { id: dto.vendorId } });
    if (!vendor) throw new NotFoundException('厂商不存在');

    const existing = await this.firmwareRepo.findOne({
      where: { vendorId: dto.vendorId, deviceModel: dto.deviceModel, version: dto.version },
    });
    if (existing) throw new BadRequestException('该固件版本已存在');

    const firmware = this.firmwareRepo.create({
      ...dto,
      isActive: true,
      releasedAt: new Date(),
    });
    return this.firmwareRepo.save(firmware);
  }

  async getFirmwareList(vendorId?: string, deviceModel?: string) {
    const where: any = { isActive: true };
    if (vendorId) where.vendorId = vendorId;
    if (deviceModel) where.deviceModel = deviceModel;
    return this.firmwareRepo.find({ where, order: { releasedAt: 'DESC' } });
  }

  async checkUpdate(deviceId: string) {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('设备不存在');

    const latest = await this.firmwareRepo.findOne({
      where: { vendorId: device.vendorId, deviceModel: device.model, isActive: true },
      order: { releasedAt: 'DESC' },
    });

    if (!latest) return { hasUpdate: false };

    const currentVersion = device.firmwareVersion;
    const hasUpdate = this.compareVersions(latest.version, currentVersion) > 0;

    return {
      hasUpdate,
      currentVersion,
      latestVersion: latest.version,
      changelog: latest.changelog,
      isMandatory: latest.isMandatory,
      fileSize: latest.fileSize,
      downloadUrl: latest.downloadUrl,
    };
  }

  async startOta(deviceId: string, firmwareId: string, userId?: string) {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('设备不存在');

    const firmware = await this.firmwareRepo.findOne({ where: { id: firmwareId } });
    if (!firmware) throw new NotFoundException('固件不存在');

    const pending = await this.otaJobRepo.findOne({
      where: { deviceId, status: OtaStatus.PENDING },
    });
    if (pending) throw new BadRequestException('设备已有待处理的OTA任务');

    const inProgress = await this.otaJobRepo.findOne({
      where: [
        { deviceId, status: OtaStatus.DOWNLOADING },
        { deviceId, status: OtaStatus.INSTALLING },
      ],
    });
    if (inProgress) throw new BadRequestException('设备正在升级中');

    const job = this.otaJobRepo.create({
      firmwareId,
      deviceId,
      fromVersion: device.firmwareVersion,
      toVersion: firmware.version,
      status: OtaStatus.PENDING,
    });
    const saved = await this.otaJobRepo.save(job);

    await this.deviceRepo.update(deviceId, { status: 'updating' as any });

    await this.mqttService.publishOtaUpdate(device.vendorId, device.vendorDeviceId, {
      jobId: saved.id,
      version: firmware.version,
      downloadUrl: firmware.downloadUrl,
      md5Hash: firmware.md5Hash,
      fileSize: firmware.fileSize,
    });

    this.logger.log(`OTA job ${saved.id} started for device ${deviceId}`);

    setTimeout(() => this.checkOtaTimeout(saved.id), 10 * 60 * 1000);

    return saved;
  }

  async batchOta(deviceIds: string[], firmwareId: string) {
    const results: any[] = [];
    for (const deviceId of deviceIds) {
      try {
        const job = await this.startOta(deviceId, firmwareId);
        results.push({ deviceId, success: true, jobId: job.id });
      } catch (err: any) {
        results.push({ deviceId, success: false, error: err.message });
      }
    }
    return results;
  }

  async updateOtaProgress(jobId: string, dto: { status: OtaStatus; progress?: number; errorMessage?: string }) {
    const job = await this.otaJobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('OTA任务不存在');

    job.status = dto.status;
    if (dto.progress !== undefined) job.progress = dto.progress;
    if (dto.errorMessage) job.errorMessage = dto.errorMessage;

    if (dto.status === OtaStatus.DOWNLOADING && !job.startedAt) {
      job.startedAt = new Date();
    }
    if (dto.status === OtaStatus.SUCCESS) {
      job.completedAt = new Date();
      await this.deviceRepo.update(job.deviceId, {
        firmwareVersion: job.toVersion,
        status: 'online' as any,
      });
      await this.firmwareRepo.increment({ id: job.firmwareId }, 'upgradeCount', 1);
    }
    if (dto.status === OtaStatus.FAILED) {
      job.completedAt = new Date();
      await this.deviceRepo.update(job.deviceId, { status: 'online' as any });
    }

    return this.otaJobRepo.save(job);
  }

  async getOtaJobs(deviceId?: string, status?: OtaStatus) {
    const where: any = {};
    if (deviceId) where.deviceId = deviceId;
    if (status) where.status = status;
    return this.otaJobRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async cancelOta(jobId: string) {
    const job = await this.otaJobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('OTA任务不存在');
    if ([OtaStatus.SUCCESS, OtaStatus.FAILED, OtaStatus.CANCELED].includes(job.status)) {
      throw new BadRequestException('无法取消已完成的OTA任务');
    }

    job.status = OtaStatus.CANCELED;
    job.completedAt = new Date();
    await this.otaJobRepo.save(job);
    await this.deviceRepo.update(job.deviceId, { status: 'online' as any });
    return { success: true };
  }

  private async checkOtaTimeout(jobId: string) {
    const job = await this.otaJobRepo.findOne({ where: { id: jobId } });
    if (!job) return;
    if ([OtaStatus.PENDING, OtaStatus.DOWNLOADING, OtaStatus.INSTALLING].includes(job.status)) {
      job.status = OtaStatus.FAILED;
      job.errorMessage = 'OTA升级超时';
      job.completedAt = new Date();
      await this.otaJobRepo.save(job);
      await this.deviceRepo.update(job.deviceId, { status: 'online' as any });
      this.logger.warn(`OTA job ${jobId} timed out`);
    }
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.replace(/^v/, '').split('.').map(Number);
    const parts2 = v2.replace(/^v/, '').split('.').map(Number);
    const maxLen = Math.max(parts1.length, parts2.length);
    for (let i = 0; i < maxLen; i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }
}
