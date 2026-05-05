import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organization/entities/organization.entity';
import { User } from '../../user/entities/user.entity';

export enum StoreType {
  GAS_STATION = 'gas_station',
  SERVICE_CENTER = 'service_center',
  RETAIL_STORE = 'retail_store',
  WAREHOUSE = 'warehouse',
}

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, comment: '门店编码' })
  code: string;

  @Column({ comment: '门店名称' })
  name: string;

  @Column({ type: 'varchar', default: StoreType.GAS_STATION, comment: '门店性质' })
  type: StoreType;

  @Column({ nullable: true, comment: '负责人ID' })
  managerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @Column({ name: 'is_filling_station', default: false, comment: '是否零灌站' })
  isFillingStation: boolean;

  @Column({ name: 'is_barcode_store', default: false, comment: '是否条码门店' })
  isBarcodeStore: boolean;

  @Column({ name: 'is_gas_station', default: true, comment: '是否气站' })
  isGasStation: boolean;

  @Column({ name: 'is_maintenance_department', default: false, comment: '是否维修部门' })
  isMaintenanceDepartment: boolean;

  @Column({ name: 'organization_id', comment: '所属组织ID' })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.stores)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ nullable: true, comment: '地址' })
  address: string;

  @Column({ nullable: true, comment: '联系电话' })
  phone: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @Column({ name: 'sort_order', default: 0, comment: '排序' })
  sortOrder: number;

  @Column({ default: true, comment: '是否启用' })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
