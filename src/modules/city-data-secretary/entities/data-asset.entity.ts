import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type AssetType = 'cert' | 'social_security' | 'housing_fund' | 'tax' | 'medical' | 'education' | 'transport';

@Entity('cds_data_asset')
export class DataAsset extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', comment: '用户ID' })
  @Index('idx_da_user_id')
  userId: string;

  @Column({
    name: 'asset_type',
    type: 'varchar',
    length: 30,
    comment: '资产类型: cert-证照 social_security-社保 housing_fund-公积金 tax-税务 medical-医保 education-教育 transport-交通',
  })
  @Index('idx_da_asset_type')
  assetType: AssetType;

  @Column({
    name: 'asset_code',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '资产编码/证件号',
  })
  assetCode: string | null;

  @Column({
    name: 'asset_count',
    type: 'int',
    default: 0,
    comment: '资产数量',
  })
  assetCount: number;

  @Column({
    name: 'total_amount',
    type: 'json',
    nullable: true,
    comment: '总额/扩展数据(JSON)',
  })
  totalAmount: Record<string, any> | null;

  @Column({
    name: 'last_updated',
    type: 'timestamp',
    nullable: true,
    comment: '数据来源方最后更新时间',
  })
  lastUpdated: Date | null;

  @Column({
    name: 'is_synced',
    type: 'boolean',
    default: false,
    comment: '是否已同步',
  })
  isSynced: boolean;

  @Column({
    name: 'source_dept',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '数据来源部门',
  })
  sourceDept: string | null;
}
