import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  READ = 'read',
  APPROVE = 'approve',
  REJECT = 'reject',
  FREEZE = 'freeze',
  UNFREEZE = 'unfreeze',
  EXCHANGE = 'exchange',
  ROLLBACK = 'rollback',
  EXPIRE = 'expire',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export enum AuditResource {
  USER = 'user',
  MEMBER = 'member',
  POINTS_ACCOUNT = 'points_account',
  POINTS_TRANSACTION = 'points_transaction',
  RULE_CONFIG = 'rule_config',
  LEDGER_VOUCHER = 'ledger_voucher',
  EXCHANGE_ORDER = 'exchange_order',
  POINTS_EXPIRY = 'points_expiry',
  NOTIFICATION = 'notification',
  DAILY_RECONCILIATION = 'daily_reconciliation',
  SYSTEM = 'system',
}

export enum AuditResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PENDING = 'pending',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  auditNo: string

  @Column()
  action: AuditAction

  @Column()
  resource: AuditResource

  @Column({ nullable: true })
  resourceId: string

  @Column()
  actorId: string

  @Column({ nullable: true })
  actorRole: string

  @Column({
    type: 'simple-enum',
    enum: AuditResult,
    default: AuditResult.SUCCESS,
  })
  result: AuditResult

  @Column({ nullable: true })
  description: string

  @Column({ type: 'simple-json', nullable: true })
  beforeData: Record<string, any>

  @Column({ type: 'simple-json', nullable: true })
  afterData: Record<string, any>

  @Column({ type: 'simple-json', nullable: true })
  requestData: Record<string, any>

  @Column({ type: 'simple-json', nullable: true })
  responseData: Record<string, any>

  @Column({ nullable: true })
  businessNo: string

  @Column({ nullable: true })
  transactionId: string

  @Column({ nullable: true })
  voucherId: string

  @Column({ nullable: true, type: 'text' })
  errorMessage: string

  @Column({ nullable: true })
  ipAddress: string

  @Column({ nullable: true })
  userAgent: string

  @CreateDateColumn()
  createdAt: Date
}
