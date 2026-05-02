import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { MasterWaybill } from './MasterWaybill';
import { Space } from './Space';

export enum FlightStatus {
  SCHEDULED = 'scheduled',
  DELAYED = 'delayed',
  BOARDING = 'boarding',
  DEPARTED = 'departed',
  IN_FLIGHT = 'in_flight',
  LANDED = 'landed',
  ARRIVED = 'arrived',
  CANCELLED = 'cancelled',
}

@Entity('flights')
export class Flight extends BaseEntity {
  @Column({ name: 'flight_no', type: 'varchar', unique: true })
  flightNo!: string;

  @Column({ name: 'airline_code', type: 'varchar' })
  airlineCode!: string;

  @Column({ name: 'airline_name', type: 'varchar', nullable: true })
  airlineName?: string;

  @Column({ name: 'flight_number', type: 'varchar' })
  flightNumber!: string;

  @Column({ name: 'origin_airport', type: 'varchar' })
  originAirport!: string;

  @Column({ name: 'origin_airport_name', type: 'varchar', nullable: true })
  originAirportName?: string;

  @Column({ name: 'destination_airport', type: 'varchar' })
  destinationAirport!: string;

  @Column({ name: 'destination_airport_name', type: 'varchar', nullable: true })
  destinationAirportName?: string;

  @Column({ name: 'scheduled_departure_time', type: 'datetime' })
  scheduledDepartureTime!: Date;

  @Column({ name: 'scheduled_arrival_time', type: 'datetime' })
  scheduledArrivalTime!: Date;

  @Column({ name: 'actual_departure_time', type: 'datetime', nullable: true })
  actualDepartureTime?: Date;

  @Column({ name: 'actual_arrival_time', type: 'datetime', nullable: true })
  actualArrivalTime?: Date;

  @Column({ type: 'simple-enum', enum: FlightStatus, default: FlightStatus.SCHEDULED })
  status!: FlightStatus;

  @Column({ name: 'status_display', type: 'varchar', nullable: true })
  statusDisplay?: string;

  @Column({ name: 'aircraft_type', type: 'varchar', nullable: true })
  aircraftType?: string;

  @Column({ name: 'aircraft_reg_no', type: 'varchar', nullable: true })
  aircraftRegNo?: string;

  @Column({ name: 'total_capacity_weight', type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalCapacityWeight?: number;

  @Column({ name: 'total_capacity_volume', type: 'decimal', precision: 10, scale: 3, nullable: true })
  totalCapacityVolume?: number;

  @Column({ name: 'used_capacity_weight', type: 'decimal', precision: 10, scale: 2, default: 0 })
  usedCapacityWeight!: number;

  @Column({ name: 'used_capacity_volume', type: 'decimal', precision: 10, scale: 3, default: 0 })
  usedCapacityVolume!: number;

  @Column({ name: 'available_capacity_weight', type: 'decimal', precision: 10, scale: 2, nullable: true })
  availableCapacityWeight?: number;

  @Column({ name: 'available_capacity_volume', type: 'decimal', precision: 10, scale: 3, nullable: true })
  availableCapacityVolume?: number;

  @Column({ name: 'delay_reason', type: 'text', nullable: true })
  delayReason?: string;

  @Column({ name: 'delay_minutes', type: 'integer', nullable: true })
  delayMinutes?: number;

  @Column({ name: 'route', type: 'text', nullable: true })
  route?: string;

  @Column({ name: 'stopover_airports', type: 'text', nullable: true })
  stopoverAirports?: string;

  @Column({ name: 'is_international', type: 'boolean', default: false })
  isInternational!: boolean;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark?: string;

  @OneToMany(() => Space, (space) => space.flight)
  spaces!: Space[];

  @OneToMany(() => MasterWaybill, (waybill) => waybill.flight)
  waybills!: MasterWaybill[];
}
