import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { MenuItemStatus, SpiceLevel } from '../../common/types';
import { MenuCategory } from './menu-category.entity';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice: number;

  @Column({ type: 'text', nullable: true })
  imageUrl: string;

  @Column({
    type: 'enum',
    enum: MenuItemStatus,
    default: MenuItemStatus.AVAILABLE,
  })
  status: MenuItemStatus;

  @Column({
    type: 'enum',
    enum: SpiceLevel,
    default: SpiceLevel.NONE,
    nullable: true,
  })
  spiceLevel: SpiceLevel;

  @Column({ type: 'simple-json', nullable: true })
  attributes: {
    vegetarian?: boolean;
    spicy?: boolean;
    cold?: boolean;
    new?: boolean;
    recommended?: boolean;
  };

  @Column({ type: 'simple-json', nullable: true })
  specifications: Array<{
    name: string;
    priceAdjustment: number;
  }>;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'int', default: 0 })
  salesCount: number;

  @Column({ type: 'int', default: 0 })
  preparationTime: number;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('MenuCategory', 'items')
  category: any;

  @OneToMany('OrderItem', 'menuItem')
  orderItems: any[];
}
