import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ResourceType {
  VIDEO = 'video',
  DOCUMENT = 'document',
  SOFTWARE = 'software'
}

export enum ResourceAccessLevel {
  PUBLIC = 'public',
  LOGIN_REQUIRED = 'login_required',
  VIP_ONLY = 'vip_only',
  TEACHER_ONLY = 'teacher_only'
}

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  cover: string;

  @Column({
    type: 'enum',
    enum: ResourceType
  })
  type: ResourceType;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ nullable: true })
  fileName: string;

  @Column({ default: 0 })
  fileSize: number;

  @Column({
    type: 'enum',
    enum: ResourceAccessLevel,
    default: ResourceAccessLevel.PUBLIC
  })
  accessLevel: ResourceAccessLevel;

  @Column({ default: 0 })
  downloadCount: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
