import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { UserEntity } from './user.entity';
import { RoomEntity } from './room.entity';
import { DeviceShareEntity } from './device-share.entity';

@Entity('homes')
export class HomeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column()
  ownerId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'ownerId' })
  owner: UserEntity;

  @Column({ type: 'simple-json', nullable: true })
  members: { userId: string; role: 'owner' | 'admin' | 'member' }[];

  @OneToMany(() => RoomEntity, room => room.home)
  rooms: RoomEntity[];

  @OneToMany(() => DeviceShareEntity, share => share.device)
  shares: DeviceShareEntity[];

  @CreateDateColumn()
  createdAt: Date;
}
