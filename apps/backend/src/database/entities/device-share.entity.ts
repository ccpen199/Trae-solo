import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { DeviceEntity } from './device.entity';
import { UserEntity } from './user.entity';
import { SharePermission } from '@iot/shared';

@Entity('device_shares')
@Index(['deviceId', 'shareeId'], { unique: true })
export class DeviceShareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  deviceId: string;

  @Index()
  @Column()
  ownerId: string;

  @Index()
  @Column()
  shareeId: string;

  @Column({ type: 'simple-enum', enum: SharePermission, default: SharePermission.VIEW_ONLY })
  permission: SharePermission;

  @Column({ type: 'datetime', nullable: true })
  expiredAt: Date;

  @Column({ type: 'simple-json', nullable: true })
  restrictedCapabilities: string[];

  @ManyToOne(() => DeviceEntity, device => device.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deviceId' })
  device: DeviceEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'ownerId' })
  owner: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'shareeId' })
  sharee: UserEntity;

  @CreateDateColumn()
  createdAt: Date;
}
