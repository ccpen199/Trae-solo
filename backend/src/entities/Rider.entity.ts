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
import { RiderPreferenceEntity } from './RiderPreference.entity';
import { OrderEntity } from './Order.entity';
import { LocationReportEntity } from './LocationReport.entity';
import { CreditHistoryEntity } from './CreditHistory.entity';
import { AuditFlowEntity } from './AuditFlow.entity';
import { ComplaintEntity } from './Complaint.entity';
import { VehicleType, AuditStatus, Coordinate } from '@shared/types';

@Entity('riders')
@Index(['phone'], { unique: true })
@Index(['isOnline', 'isFrozen', 'creditScore'])
export class RiderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  phone: string;

  @Column({ length: 100 })
  nickname: string;

  @Column({ length: 255, nullable: true })
  avatar?: string;

  @Column({ length: 50, nullable: true })
  realName?: string;

  @Column({ length: 18, nullable: true })
  idCard?: string;

  @Column({ length: 255, nullable: true })
  idCardFront?: string;

  @Column({ length: 255, nullable: true })
  idCardBack?: string;

  @Column({ length: 255, nullable: true })
  healthCertificate?: string;

  @Column({
    type: 'enum',
    enum: ['bike', 'electric_bike', 'motorcycle', 'car'],
    default: 'electric_bike',
  })
  vehicleType: VehicleType;

  @Column({ length: 20, nullable: true })
  vehiclePlate?: string;

  @Column({ length: 255, nullable: true })
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

  @Column({ length: 500, nullable: true })
  auditRemark?: string;

  @Column({ type: 'int', default: 100 })
  creditScore: number;

  @Column({ default: false })
  isFrozen: boolean;

  @Column({ length: 500, nullable: true })
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

  @Column({ length: 36, nullable: true })
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
