import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid', nullable: true })
  memberId: string;

  @Column({ type: 'int', default: 5 })
  overallRating: number;

  @Column({ type: 'int', nullable: true })
  foodRating: number;

  @Column({ type: 'int', nullable: true })
  serviceRating: number;

  @Column({ type: 'int', nullable: true })
  environmentRating: number;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'simple-json', nullable: true })
  images: string[];

  @Column({ type: 'text', nullable: true })
  reply: string;

  @Column({ type: 'uuid', nullable: true })
  repliedBy: string;

  @Column({ type: 'datetime', nullable: true })
  repliedAt: Date;

  @Column({ type: 'boolean', default: false })
  isAnonymous: boolean;

  @Column({ type: 'boolean', default: true })
  isVisible: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
