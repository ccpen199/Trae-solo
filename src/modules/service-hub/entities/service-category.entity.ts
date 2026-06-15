import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ServiceItem } from './service-item.entity';

@Entity('sh_service_category')
export class ServiceCategory extends BaseEntity {
  @Column({ name: 'parent_id', type: 'uuid', nullable: true, comment: '父级分类ID' })
  @Index('idx_category_parent_id')
  parentId: string | null;

  @Column({ name: 'name', type: 'varchar', length: 100, comment: '分类名称' })
  name: string;

  @Column({ name: 'code', type: 'varchar', length: 50, unique: true, comment: '分类编码' })
  @Index('idx_category_code', { unique: true })
  code: string;

  @Column({ name: 'level', type: 'int', default: 1, comment: '层级' })
  level: number;

  @Column({ name: 'sort', type: 'int', default: 0, comment: '排序号' })
  sort: number;

  @Column({ name: 'dept_code', type: 'varchar', length: 50, nullable: true, comment: '所属委办局编码' })
  @Index('idx_category_dept_code')
  deptCode: string | null;

  @ManyToOne(() => ServiceCategory, (category) => category.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: ServiceCategory | null;

  @OneToMany(() => ServiceCategory, (category) => category.parent)
  children: ServiceCategory[];

  @OneToMany(() => ServiceItem, (item) => item.category)
  items: ServiceItem[];
}
