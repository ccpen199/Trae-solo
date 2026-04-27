import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { SensorReading } from './sensor-reading.entity';

export enum SensorType {
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  SOIL_MOISTURE = 'soil_moisture',
  SOIL_PH = 'soil_ph',
  LIGHT_INTENSITY = 'light_intensity',
  CO2_SENSOR = 'co2_sensor',
  WIND_SPEED = 'wind_speed',
  RAINFALL = 'rainfall',
}

export enum SensorStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
}

@Entity('sensors')
export class Sensor extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  type: SensorType;

  @Column({
    type: 'varchar',
    length: 50,
    default: SensorStatus.OFFLINE,
  })
  status: SensorStatus;

  @Column({ type: 'varchar', length: 50, name: 'location_zone' })
  locationZone: string;

  @Column({ type: 'float', nullable: true, name: 'install_position_x' })
  installPositionX: number;

  @Column({ type: 'float', nullable: true, name: 'install_position_y' })
  installPositionY: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit: string;

  @Column({ type: 'float', nullable: true, name: 'min_value' })
  minValue: number;

  @Column({ type: 'float', nullable: true, name: 'max_value' })
  maxValue: number;

  @Column({ type: 'float', nullable: true, name: 'accuracy' })
  accuracy: number;

  @Column({ type: 'datetime', nullable: true, name: 'last_calibration_at' })
  lastCalibrationAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'last_heartbeat_at' })
  lastHeartbeatAt: Date;

  @Column({ type: 'simple-json', nullable: true, name: 'config' })
  config: Record<string, any>;

  @OneToMany(() => SensorReading, (reading) => reading.sensor)
  readings: SensorReading[];
}
