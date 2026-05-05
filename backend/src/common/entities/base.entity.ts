import { 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  Column,
  ManyToOne,
  OneToMany,
  Entity,
  Index 
} from 'typeorm';
import { SiteType, DomainType } from '../types';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'boolean', name: 'is_deleted', default: false })
  isDeleted: boolean;
}

@Entity('sites')
@Index(['domain'], { unique: true, where: "is_deleted = false" })
@Index(['directory'], { unique: true, where: "directory IS NOT NULL AND is_deleted = false" })
export class Site extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ 
    type: 'varchar', 
    default: SiteType.SUB,
    name: 'site_type' 
  })
  siteType: SiteType;

  @Column({ 
    type: 'varchar', 
    default: DomainType.SUBDOMAIN,
    name: 'domain_type' 
  })
  domainType: DomainType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  domain: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  directory: string;

  @Column({ type: 'uuid', name: 'parent_id', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Site, site => site.children, { nullable: true, onDelete: 'SET NULL' })
  parent: Site | null;

  @OneToMany(() => Site, site => site.parent)
  children: Site[];

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'logo_url' })
  logoUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'favicon_url' })
  faviconUrl: string;

  @Column({ type: 'simple-json', nullable: true, name: 'seo_config' })
  seoConfig: Record<string, any> | null;

  @Column({ type: 'integer', default: 0, name: 'sort_order' })
  sortOrder: number;
}
