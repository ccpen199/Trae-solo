import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type AuditAction =
  | "login"
  | "logout"
  | "position_create"
  | "position_update"
  | "position_publish"
  | "position_delete"
  | "candidate_create"
  | "candidate_update"
  | "candidate_stage_change"
  | "candidate_delete"
  | "interview_schedule"
  | "interview_start"
  | "interview_complete"
  | "approval_create"
  | "approval_approve"
  | "approval_reject"
  | "message_send"
  | "message_read"
  | "file_upload"
  | "file_download"
  | "ats_sync"
  | "ai_screening"
  | "system_config";

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "varchar",
  })
  action: AuditAction;

  @Column({ type: "int", nullable: true })
  userId: number;

  @Column({ nullable: true })
  userName: string;

  @Column({ type: "int", nullable: true })
  targetId: number;

  @Column({ nullable: true })
  targetType: string;

  @Column({ type: "simple-json", nullable: true })
  oldValue: Record<string, any>;

  @Column({ type: "simple-json", nullable: true })
  newValue: Record<string, any>;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ default: false })
  isSensitive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
