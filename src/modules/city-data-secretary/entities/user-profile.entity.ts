import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type AgeRange = '0-17' | '18-25' | '26-35' | '36-45' | '46-55' | '56-65' | '66+';
export type Gender = 'male' | 'female' | 'other';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';
export type EducationLevel = 'primary' | 'junior_high' | 'senior_high' | 'college' | 'bachelor' | 'master' | 'phd';
export type OccupationType = 'government' | 'institution' | 'enterprise' | 'self_employed' | 'freelance' | 'student' | 'retired' | 'unemployed' | 'other';
export type IncomeRange = 'below_3k' | '3k-5k' | '5k-10k' | '10k-20k' | '20k-50k' | 'above_50k';
export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'chronic';
export type HousingStatus = 'own_full' | 'own_mortgage' | 'rental' | 'family' | 'public_housing' | 'other';
export type SocialSecurityStatus = 'active' | 'paused' | 'retired' | 'uninsured';

@Entity('cds_user_profile')
export class UserProfile extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', comment: '用户ID' })
  @Index('idx_user_id')
  userId: string;

  @Column({
    name: 'age_range',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '年龄段',
  })
  ageRange: AgeRange | null;

  @Column({
    name: 'gender',
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: '性别',
  })
  gender: Gender | null;

  @Column({
    name: 'marital_status',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '婚姻状况',
  })
  maritalStatus: MaritalStatus | null;

  @Column({
    name: 'has_children',
    type: 'boolean',
    default: false,
    comment: '是否有子女',
  })
  hasChildren: boolean;

  @Column({
    name: 'education_level',
    type: 'varchar',
    length: 30,
    nullable: true,
    comment: '学历水平',
  })
  educationLevel: EducationLevel | null;

  @Column({
    name: 'occupation_type',
    type: 'varchar',
    length: 30,
    nullable: true,
    comment: '职业类型',
  })
  occupationType: OccupationType | null;

  @Column({
    name: 'income_range',
    type: 'varchar',
    length: 30,
    nullable: true,
    comment: '收入区间',
  })
  incomeRange: IncomeRange | null;

  @Column({
    name: 'city',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '所在城市',
  })
  city: string | null;

  @Column({
    name: 'district',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '所在区县',
  })
  district: string | null;

  @Column({
    name: 'community',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '所在社区',
  })
  community: string | null;

  @Column({
    name: 'resident_years',
    type: 'int',
    nullable: true,
    comment: '居住年限(年)',
  })
  residentYears: number | null;

  @Column({
    name: 'health_status',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '健康状况',
  })
  healthStatus: HealthStatus | null;

  @Column({
    name: 'housing_status',
    type: 'varchar',
    length: 30,
    nullable: true,
    comment: '住房状况',
  })
  housingStatus: HousingStatus | null;

  @Column({
    name: 'car_owner',
    type: 'boolean',
    default: false,
    comment: '是否有车',
  })
  carOwner: boolean;

  @Column({
    name: 'social_security_status',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '社保状态',
  })
  socialSecurityStatus: SocialSecurityStatus | null;
}
