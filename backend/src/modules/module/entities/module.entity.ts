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
import { RolePermission } from '../../role/entities/role-permission.entity';

export enum ModuleType {
  PARENT = 'parent',
  CHILD = 'child',
}

@Entity('modules')
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, comment: '模块编码' })
  code: string;

  @Column({ comment: '模块名称' })
  name: string;

  @Column({ nullable: true, comment: '模块图标' })
  icon: string;

  @Column({ nullable: true, comment: '路由路径' })
  path: string;

  @Column({ type: 'varchar', default: ModuleType.PARENT, comment: '模块类型' })
  type: ModuleType;

  @Column({ name: 'parent_id', nullable: true, comment: '父模块ID' })
  parentId: string;

  @ManyToOne(() => Module, (module) => module.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Module;

  @OneToMany(() => Module, (module) => module.parent)
  children: Module[];

  @OneToMany(() => RolePermission, (rp) => rp.module)
  rolePermissions: RolePermission[];

  @Column({ name: 'sort_order', default: 0, comment: '排序' })
  sortOrder: number;

  @Column({ default: true, comment: '是否启用' })
  enabled: boolean;

  @Column({ name: 'is_visible', default: true, comment: '是否在菜单显示' })
  isVisible: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
