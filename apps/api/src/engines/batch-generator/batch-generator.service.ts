import { Injectable, Inject } from '@nestjs/common';
import dayjs from 'dayjs';
import Redis from 'ioredis';

export type BatchType = 'MATERIAL' | 'PRODUCT' | 'WORK_ORDER' | 'REQUISITION' | 'INSPECTION' | 'SHIPMENT';

export interface BatchConfig {
  prefix: string;
  dateFormat: string;
  sequenceLength: number;
}

const BATCH_CONFIGS: Record<BatchType, BatchConfig> = {
  MATERIAL: {
    prefix: 'RM',
    dateFormat: 'YYYYMMDD',
    sequenceLength: 4,
  },
  PRODUCT: {
    prefix: 'FG',
    dateFormat: 'YYYYMMDD',
    sequenceLength: 4,
  },
  WORK_ORDER: {
    prefix: 'WO',
    dateFormat: 'YYYYMMDD',
    sequenceLength: 5,
  },
  REQUISITION: {
    prefix: 'MR',
    dateFormat: 'YYYYMMDD',
    sequenceLength: 5,
  },
  INSPECTION: {
    prefix: 'QC',
    dateFormat: 'YYYYMMDD',
    sequenceLength: 5,
  },
  SHIPMENT: {
    prefix: 'SH',
    dateFormat: 'YYYYMMDD',
    sequenceLength: 5,
  },
};

@Injectable()
export class BatchGeneratorService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async generate(type: BatchType, customPrefix?: string): Promise<string> {
    const config = BATCH_CONFIGS[type];
    const prefix = customPrefix || config.prefix;
    const dateStr = dayjs().format(config.dateFormat);
    const key = `batch:counter:${prefix}:${dateStr}`;

    const sequence = await this.redis.incr(key);
    await this.redis.expire(key, 24 * 3600);

    const sequenceStr = sequence.toString().padStart(config.sequenceLength, '0');

    return `${prefix}${dateStr}${sequenceStr}`;
  }

  async generateMaterialBatch(): Promise<string> {
    return this.generate('MATERIAL');
  }

  async generateProductBatch(): Promise<string> {
    return this.generate('PRODUCT');
  }

  async generateWorkOrderNo(): Promise<string> {
    return this.generate('WORK_ORDER');
  }

  async generateRequisitionNo(): Promise<string> {
    return this.generate('REQUISITION');
  }

  async generateInspectionNo(): Promise<string> {
    return this.generate('INSPECTION');
  }

  async generateShipmentNo(): Promise<string> {
    return this.generate('SHIPMENT');
  }
}
