import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { BaseEntity, Site } from '../../../common/entities/base.entity';
import { ContentType, PublishStatus } from '../../../common/types';
import { Category } from '../../categories/entities/category.entity';

@Entity('contents')
@Index(['siteId', 'categoryId'])
export class Content extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'sub_title' })
  subTitle: string;

  @Column({ type: 'varchar', length: 255, name: 'seo_title', nullable: true })
  seoTitle: string;

  @Column({ type: 'varchar', length: 500, name: 'seo_keywords', nullable: true })
  seoKeywords: string;

  @Column({ type: 'varchar', length: 1000, name: 'seo_description', nullable: true })
  seoDescription: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'uuid', name: 'site_id' })
  siteId: string;

  @ManyToOne(() => Site, { onDelete: 'CASCADE' })
  site: Site;

  @Column({ type: 'uuid', name: 'category_id', nullable: true })
  categoryId: string;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  category: Category;

  @Column({ type: 'varchar', length: 50, name: 'content_type', default: ContentType.NEWS })
  contentType: ContentType;

  @Column({ type: 'varchar', length: 50, name: 'publish_status', default: PublishStatus.DRAFT })
  publishStatus: PublishStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'cover_url' })
  coverUrl: string;

  @Column({ type: 'simple-json', nullable: true, name: 'cover_urls' })
  coverUrls: string[];

  @Column({ type: 'uuid', name: 'author_id', nullable: true })
  authorId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  author: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'copy_from' })
  copyFrom: string;

  @Column({ type: 'integer', default: 0, name: 'view_count' })
  viewCount: number;

  @Column({ type: 'integer', default: 0, name: 'like_count' })
  likeCount: number;

  @Column({ type: 'integer', default: 0, name: 'comment_count' })
  commentCount: number;

  @Column({ type: 'integer', default: 0, name: 'sort_order' })
  sortOrder: number;

  @Column({ type: 'boolean', default: false, name: 'is_top' })
  isTop: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_recommend' })
  isRecommend: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_hot' })
  isHot: boolean;

  @Column({ type: 'datetime', nullable: true, name: 'published_at' })
  publishedAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'expired_at' })
  expiredAt: Date;

  @Column({ type: 'simple-json', nullable: true, name: 'custom_fields' })
  customFields: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'redirect_url' })
  redirectUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'template_name' })
  templateName: string;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', name: 'updated_by', nullable: true })
  updatedBy: string;
}
