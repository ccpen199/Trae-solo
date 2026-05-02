import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from '../../../common/enums/role.enum';
import { Style } from '../../styles/entities/style.entity';
import { Pattern } from '../../patterns/entities/pattern.entity';
import { PurchaseOrder } from '../../purchases/entities/purchase-order.entity';
import { ProductionOrder } from '../../production/entities/production-order.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { Communication } from '../../communications/entities/communication.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string;

  @Column()
  name: string;

  @Column({
    type: 'varchar', length: 50,
    default: Role.DESIGNER,
  })
  role: Role;

  @Column({ name: 'department', nullable: true })
  department: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => Style, (style) => style.designer)
  designedStyles: Style[];

  @OneToMany(() => Pattern, (pattern) => pattern.patternMaker)
  patterns: Pattern[];

  @OneToMany(() => PurchaseOrder, (po) => po.purchaser)
  purchaseOrders: PurchaseOrder[];

  @OneToMany(() => ProductionOrder, (po) => po.factory)
  productionOrders: ProductionOrder[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Communication, (comm) => comm.sender)
  sentCommunications: Communication[];

  @OneToMany(() => Communication, (comm) => comm.receiver)
  receivedCommunications: Communication[];
}
