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
import { User } from '../../user/entities/user.entity';
import { Store } from '../../store/entities/store.entity';

export enum OrganizationType {
  HEADQUARTERS = 'headquarters',
  BRANCH = 'branch',
  DEPARTMENT = 'department',
  TEAM = 'team',
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, comment: '组织编码' })
  code: string;

  @Column({ comment: '组织名称' })
  name: string;

  @Column({ type: 'varchar', default: OrganizationType.DEPARTMENT, comment: '机构性质' })
  type: OrganizationType;

  @Column({ nullable: true, comment: '位置/地址' })
  address: string;

  @Column({ nullable: true, comment: '联系电话' })
  phone: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @Column({ name: 'parent_id', nullable: true, comment: '上级组织ID' })
  parentId: string;

  @ManyToOne(() => Organization, (org) => org.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Organization;

  @OneToMany(() => Organization, (org) => org.parent)
  children: Organization[];

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => Store, (store) => store.organization)
  stores: Store[];

  @Column({ name: 'sort_order', default: 0, comment: '排序' })
  sortOrder: number;

  @Column({ default: true, comment: '是否启用' })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
