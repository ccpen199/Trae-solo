import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { OtaStatus } from '@iot/shared';

@Entity('firmware')
export class FirmwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  vendorId: string;

  @Column()
  deviceModel: string;

  @Column({ length: 50 })
  version: string;

  @Column({ type: 'text', nullable: true })
  changelog: string;

  @Column()
  downloadUrl: string;

  @Column({ default: 0 })
  fileSize: number;

  @Column({ nullable: true })
  md5Hash: string;

  @Column({ type: 'int', default: 0 })
  minSupportedVersion: number;

  @Column({ default: false })
  isMandatory: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  upgradeCount: number;

  @Column({ type: 'timestamp', nullable: true })
  releasedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('ota_jobs')
export class OtaJobEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  firmwareId: string;

  @Index()
  @Column()
  deviceId: string;

  @Column({ length: 50 })
  fromVersion: string;

  @Column({ length: 50 })
  toVersion: string;

  @Column({ type: 'enum', enum: OtaStatus, default: OtaStatus.PENDING })
  status: OtaStatus;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ default: 0 })
  retryCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
