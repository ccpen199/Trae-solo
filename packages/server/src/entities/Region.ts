import { Entity, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { PricePolicy } from './PricePolicy.js';
import { Warehouse } from './Warehouse.js';
import { RetailStore } from './RetailStore.js';

export enum RegionLevel {
  COUNTRY = 'country',
  PROVINCE = 'province',
  CITY = 'city',
  DISTRICT = 'district',
  TOWN = 'town',
}

@Entity('regions')
@Index(['parentId', 'code'], { unique: false })
export class Region extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: RegionLevel,
  })
  level: RegionLevel;

  @Column({ type: 'varchar', length: 100, nullable: true })
  pinyin: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  shortName: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Region, (region) => region.children)
  parent: Region | null;

  @OneToMany(() => Region, (region) => region.parent)
  children: Region[];

  @OneToMany(() => PricePolicy, (pricePolicy) => pricePolicy.region)
  pricePolicies: PricePolicy[];

  @OneToMany(() => Warehouse, (warehouse) => warehouse.region)
  warehouses: Warehouse[];

  @OneToMany(() => RetailStore, (retailStore) => retailStore.region)
  retailStores: RetailStore[];
}
