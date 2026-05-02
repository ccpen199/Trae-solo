import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { WaybillDetail } from './WaybillDetail';
import { StatusFlow } from './StatusFlow';
import { Attachment } from './Attachment';
import { Comment } from './Comment';
import { Notification } from './Notification';
import { Todo } from './Todo';
import { User } from './User';
import { Flight } from './Flight';

export enum WaybillStatus {
  DRAFT = 'draft',
  BOOKING_SUBMITTED = 'booking_submitted',
  BOOKING_CONFIRMED = 'booking_confirmed',
  RECEIVING = 'receiving',
  RECEIVED = 'received',
  SECURITY_CHECKING = 'security_checking',
  SECURITY_PASSED = 'security_passed',
  SECURITY_REJECTED = 'security_rejected',
  LOADING = 'loading',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived',
  PICKING_UP = 'picking_up',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXCEPTION = 'exception',
}

@Entity('master_waybills')
export class MasterWaybill extends BaseEntity {
  @Column({ name: 'master_no', type: 'varchar', unique: true })
  masterNo!: string;

  @Column({ name: 'booking_no', type: 'varchar', nullable: true })
  bookingNo?: string;

  @Column({ type: 'simple-enum', enum: WaybillStatus, default: WaybillStatus.DRAFT })
  status!: WaybillStatus;

  @Column({ name: 'status_display', type: 'varchar', nullable: true })
  statusDisplay?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'forwarder_id' })
  forwarder!: User;

  @Column({ name: 'forwarder_id', type: 'varchar' })
  forwarderId!: string;

  @ManyToOne(() => Flight, { nullable: true })
  @JoinColumn({ name: 'flight_id' })
  flight?: Flight;

  @Column({ name: 'flight_id', type: 'varchar', nullable: true })
  flightId?: string;

  @Column({ name: 'airline_code', type: 'varchar', nullable: true })
  airlineCode?: string;

  @Column({ name: 'origin_airport', type: 'varchar' })
  originAirport!: string;

  @Column({ name: 'destination_airport', type: 'varchar' })
  destinationAirport!: string;

  @Column({ name: 'shipper_name', type: 'varchar' })
  shipperName!: string;

  @Column({ name: 'shipper_phone', type: 'varchar', nullable: true })
  shipperPhone?: string;

  @Column({ name: 'shipper_address', type: 'text', nullable: true })
  shipperAddress?: string;

  @Column({ name: 'consignee_name', type: 'varchar' })
  consigneeName!: string;

  @Column({ name: 'consignee_phone', type: 'varchar', nullable: true })
  consigneePhone?: string;

  @Column({ name: 'consignee_address', type: 'text', nullable: true })
  consigneeAddress?: string;

  @Column({ name: 'total_pieces', type: 'integer', default: 0 })
  totalPieces!: number;

  @Column({ name: 'total_weight', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalWeight!: number;

  @Column({ name: 'total_volume', type: 'decimal', precision: 10, scale: 3, default: 0 })
  totalVolume!: number;

  @Column({ name: 'chargeable_weight', type: 'decimal', precision: 10, scale: 2, nullable: true })
  chargeableWeight?: number;

  @Column({ name: 'goods_description', type: 'text', nullable: true })
  goodsDescription?: string;

  @Column({ name: 'goods_type', type: 'varchar', nullable: true })
  goodsType?: string;

  @Column({ name: 'is_dangerous', type: 'boolean', default: false })
  isDangerous!: boolean;

  @Column({ name: 'dangerous_goods_info', type: 'text', nullable: true })
  dangerousGoodsInfo?: string;

  @Column({ name: 'expected_departure_date', type: 'datetime', nullable: true })
  expectedDepartureDate?: Date;

  @Column({ name: 'expected_arrival_date', type: 'datetime', nullable: true })
  expectedArrivalDate?: Date;

  @Column({ name: 'actual_departure_date', type: 'datetime', nullable: true })
  actualDepartureDate?: Date;

  @Column({ name: 'actual_arrival_date', type: 'datetime', nullable: true })
  actualArrivalDate?: Date;

  @Column({ name: 'current_responsible_id', type: 'varchar', nullable: true })
  currentResponsibleId?: string;

  @Column({ name: 'current_responsible_role', type: 'varchar', nullable: true })
  currentResponsibleRole?: string;

  @Column({ name: 'current_node', type: 'varchar', nullable: true })
  currentNode?: string;

  @Column({ name: 'booking_date', type: 'datetime', nullable: true })
  bookingDate?: Date;

  @Column({ name: 'receiving_date', type: 'datetime', nullable: true })
  receivingDate?: Date;

  @Column({ name: 'security_date', type: 'datetime', nullable: true })
  securityDate?: Date;

  @Column({ name: 'loading_date', type: 'datetime', nullable: true })
  loadingDate?: Date;

  @Column({ name: 'arrival_date', type: 'datetime', nullable: true })
  arrivalDate?: Date;

  @Column({ name: 'pickup_date', type: 'datetime', nullable: true })
  pickupDate?: Date;

  @Column({ name: 'priority', type: 'varchar', default: 'normal' })
  priority!: string;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark?: string;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason?: string;

  @Column({ name: 'exception_type', type: 'varchar', nullable: true })
  exceptionType?: string;

  @Column({ name: 'exception_description', type: 'text', nullable: true })
  exceptionDescription?: string;

  @OneToMany(() => WaybillDetail, (detail) => detail.masterWaybill)
  details!: WaybillDetail[];

  @OneToMany(() => StatusFlow, (flow) => flow.masterWaybill)
  statusFlows!: StatusFlow[];

  @OneToMany(() => Attachment, (attachment) => attachment.masterWaybill)
  attachments!: Attachment[];

  @OneToMany(() => Comment, (comment) => comment.masterWaybill)
  comments!: Comment[];

  @OneToMany(() => Notification, (notification) => notification.masterWaybill)
  notifications!: Notification[];

  @OneToMany(() => Todo, (todo) => todo.masterWaybill)
  todos!: Todo[];
}
