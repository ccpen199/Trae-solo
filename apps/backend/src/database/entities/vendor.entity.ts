import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { DeviceEntity } from './device.entity';
import { VendorAuthType } from '@iot/shared';

@Entity('vendors')
export class VendorEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-enum', enum: VendorAuthType, default: VendorAuthType.API_KEY })
  authType: VendorAuthType;

  @Column({ unique: true })
  apiKey: string;

  @Column()
  apiSecret: string;

  @Column({ default: true })
  whitelistEnabled: boolean;

  @Column({ type: 'simple-json', nullable: true })
  allowedIpRanges: string[];

  @Column({ default: 1000 })
  rateLimit: number;

  @Column({ default: 0 })
  deviceCount: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'suspended' | 'pending';

  @Column({ type: 'simple-json', nullable: true })
  capabilityMappings: Record<string, any>;

  @OneToMany(() => DeviceEntity, device => device.vendor)
  devices: DeviceEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
