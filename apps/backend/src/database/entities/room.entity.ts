import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { HomeEntity } from './home.entity';
import { DeviceEntity } from './device.entity';

@Entity('rooms')
export class RoomEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  homeId: string;

  @Column({ length: 50 })
  name: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  icon: string;

  @ManyToOne(() => HomeEntity, home => home.rooms)
  @JoinColumn({ name: 'homeId' })
  home: HomeEntity;

  @OneToMany(() => DeviceEntity, device => device.room)
  devices: DeviceEntity[];
}
