import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organization/entities/organization.entity';
import { Role } from '../../role/entities/role.entity';
import { Store } from '../../store/entities/store.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  UNKNOWN = 'unknown',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, comment: '人员编号' })
  code: string;

  @Column({ unique: true, comment: '用户名' })
  username: string;

  @Column({ select: false, comment: '密码' })
  password: string;

  @Column({ comment: '姓名' })
  name: string;

  @Column({ name: 'organization_id', nullable: true, comment: '所属部门ID' })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.users, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'store_id', nullable: true, comment: '所属门店ID' })
  storeId: string;

  @ManyToOne(() => Store, { nullable: true })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ type: 'date', nullable: true, comment: '生日' })
  birthday: Date;

  @Column({ unique: true, nullable: true, comment: '身份证号' })
  idCard: string;

  @Column({ type: 'varchar', default: Gender.UNKNOWN, comment: '性别' })
  gender: Gender;

  @Column({ nullable: true, comment: '电话' })
  phone: string;

  @Column({ nullable: true, comment: '邮箱' })
  email: string;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @Column({ default: true, comment: '是否启用' })
  enabled: boolean;

  @Column({ name: 'last_login_at', nullable: true, comment: '最后登录时间' })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
