import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ContentStatus } from '../../common/enums';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 100 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Category;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('contents')
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 500 })
  title: string;

  @Column({ unique: true, length: 500, nullable: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ name: 'content_body', type: 'text', nullable: true })
  contentBody: string;

  @Column({ name: 'featured_image_url', length: 500, nullable: true })
  featuredImageUrl: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: ContentStatus.DRAFT,
  })
  status: ContentStatus;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'author_id' })
  authorId: string;

  @Column({ name: 'current_version', default: 1 })
  currentVersion: number;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'is_urgent', default: false })
  isUrgent: boolean;

  @Column({ name: 'scheduled_publish_at', nullable: true })
  scheduledPublishAt: Date;

  @Column({ name: 'actual_publish_at', nullable: true })
  actualPublishAt: Date;

  @Column({ name: 'archived_at', nullable: true })
  archivedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt: Date;
}
