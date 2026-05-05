import { Entity, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { BaseEntity, Site } from '../../../common/entities/base.entity';
import { ContentType } from '../../../common/types';

export { PublishStatus } from '../../../common/types';

@Entity('categories')
@Index(['siteId', 'parentId', 'sortOrder'])
export class Category extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'uuid', name: 'site_id' })
  siteId: string;

  @ManyToOne(() => Site, { onDelete: 'CASCADE' })
  site: Site;

  @Column({ type: 'uuid', name: 'parent_id', nullable: true })
  parentId: string;

  @ManyToOne(() => Category, category => category.children, { nullable: true, onDelete: 'CASCADE' })
  parent: Category;

  @OneToMany(() => Category, category => category.parent)
  children: Category[];

  @Column({ type: 'simple-array', name: 'allowed_content_types', default: 'news' })
  allowedContentTypes: ContentType[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'template_list' })
  templateList: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'template_detail' })
  templateDetail: string;

  @Column({ type: 'simple-json', nullable: true, name: 'display_rules' })
  displayRules: Record<string, any>;

  @Column({ type: 'integer', default: 0, name: 'sort_order' })
  sortOrder: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_navigation' })
  isNavigation: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'cover_url' })
  coverUrl: string;

  @Column({ type: 'simple-json', nullable: true, name: 'seo_config' })
  seoConfig: Record<string, any>;

  @Column({ type: 'integer', default: 0, name: 'level' })
  level: number;

  @Column({ type: 'text', name: 'path', nullable: true })
  path: string;
}
