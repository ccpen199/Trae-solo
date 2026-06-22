import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { RiderPreferenceEntity } from './RiderPreference.entity.js';
import { OrderEntity } from './Order.entity.js';
import { LocationReportEntity } from './LocationReport.entity.js';
import { CreditHistoryEntity } from './CreditHistory.entity.js';
import { AuditFlowEntity } from './AuditFlow.entity.js';
import { ComplaintEntity } from './Complaint.entity.js';
import { VehicleType, AuditStatus, Coordinate } from '@shared/types';

@Entity('riders')
@Index(['phone'], { unique: true })
@Index(['isOnline', 'isFrozen', 'creditScore'])
export class RiderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 100 })
  nickname: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  realName?: string;

  @Column({ type: 'varchar', length: 18, nullable: true })
  idCard?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  idCardFront?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  idCardBack?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  healthCertificate?: string;

  @Column({
    type: 'enum',
    enum: ['bike', 'electric_bike', 'motorcycle', 'car'],
    default: 'electric_bike',
  })
  vehicleType: VehicleType;

  @Column({ type: 'varchar', length: 20, nullable: true })
  vehiclePlate?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vehicleLicense?: string;

  @Column({ default: false })
  realNameVerified: boolean;

  @Column({ default: false })
  qualificationVerified: boolean;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  auditStatus: AuditStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  auditRemark?: string;

  @Column({ type: 'int', default: 100 })
  creditScore: number;

  @Column({ default: false })
  isFrozen: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  frozenReason?: string;

  @Column({ type: 'timestamp', nullable: true })
  frozenUntil?: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  currentLocation?: Coordinate;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ type: 'uuid', nullable: true })
  currentTaskId?: string;

  @Column({ type: 'int', default: 0 })
  completedOrders: number;

  @Column({ type: 'float', default: 0 })
  totalDistance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => RiderPreferenceEntity, (pref) => pref.rider)
  preference: RiderPreferenceEntity;

  @OneToMany(() => OrderEntity, (order) => order.rider)
  orders: OrderEntity[];

  @OneToMany(() => LocationReportEntity, (report) => report.rider)
  locationReports: LocationReportEntity[];

  @OneToMany(() => CreditHistoryEntity, (history) => history.rider)
  creditHistories: CreditHistoryEntity[];

  @OneToMany(() => AuditFlowEntity, (flow) => flow.applicantId)
  auditFlows: AuditFlowEntity[];

  @OneToMany(() => ComplaintEntity, (complaint) => complaint.reporterId)
  complaints: ComplaintEntity[];
}
