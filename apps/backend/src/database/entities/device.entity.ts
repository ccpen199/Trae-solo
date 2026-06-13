import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { VendorEntity } from './vendor.entity';
import { RoomEntity } from './room.entity';
import { DeviceShareEntity } from './device-share.entity';
import { DeviceCategory, DeviceConnectivity, DeviceStatus } from '@iot/shared';

@Entity('devices')
@Index(['vendorId', 'vendorDeviceId'], { unique: true })
export class DeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  vendorId: string;

  @Index()
  @Column({ length: 100 })
  vendorDeviceId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, nullable: true })
  model: string;

  @Column({ type: 'simple-enum', enum: DeviceCategory })
  category: DeviceCategory;

  @Column({ type: 'simple-json' })
  connectivity: DeviceConnectivity[];

  @Column({ type: 'simple-enum', enum: DeviceStatus, default: DeviceStatus.OFFLINE })
  status: DeviceStatus;

  @Column({ nullable: true })
  firmwareVersion: string;

  @Column({ type: 'simple-json', default: '{}' })
  properties: Record<string, any>;

  @Column({ type: 'simple-json', default: '[]' })
  capabilities: string[];

  @Column({ type: 'float', default: 0 })
  powerConsumption: number;

  @Index()
  @Column({ nullable: true })
  roomId: string;

  @Column({ nullable: true })
  homeId: string;

  @Column({ type: 'datetime', nullable: true })
  lastSeen: Date;

  @Column({ type: 'datetime', nullable: true })
  lastTelemetryAt: Date;

  @Column({ default: 0 })
  onlineSecondsToday: number;

  @Column({ default: false })
  isFavorite: boolean;

  @Column({ type: 'simple-json', nullable: true })
  tags: string[];

  @ManyToOne(() => VendorEntity, vendor => vendor.devices)
  @JoinColumn({ name: 'vendorId' })
  vendor: VendorEntity;

  @ManyToOne(() => RoomEntity, room => room.devices, { nullable: true })
  @JoinColumn({ name: 'roomId' })
  room: RoomEntity;

  @OneToMany(() => DeviceShareEntity, share => share.device)
  shares: DeviceShareEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
