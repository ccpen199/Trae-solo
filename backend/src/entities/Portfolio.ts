import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Resume } from './Resume';

export type PortfolioType = 'prepress' | 'printing' | 'postpress';

@Entity()
export class Portfolio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  resumeId: number;

  @Column({
    type: 'text',
    default: 'printing'
  })
  type: PortfolioType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  fileUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Resume, resume => resume.portfolios)
  @JoinColumn({ name: 'resumeId' })
  resume: Resume;
}
