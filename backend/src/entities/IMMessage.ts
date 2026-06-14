import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

export type MessageType = "text" | "file" | "image" | "system";

@Entity()
export class IMMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.sentMessages)
  @JoinColumn({ name: "senderId" })
  sender: User;

  @Column()
  senderId: number;

  @ManyToOne(() => User, (user) => user.receivedMessages)
  @JoinColumn({ name: "receiverId" })
  receiver: User;

  @Column()
  receiverId: number;

  @Column({
    type: "varchar",
    default: "text",
  })
  type: MessageType;

  @Column({ type: "text", nullable: true })
  content: string;

  @Column({ type: "simple-json", nullable: true })
  fileInfo: {
    fileName: string;
    fileSize: number;
    fileType: string;
    filePath: string;
    encrypted: boolean;
    encryptionKey?: string;
  };

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @Column({ default: false })
  isEncrypted: boolean;

  @Column({ nullable: true })
  encryptionType: string;

  @Column({ default: false })
  isAudited: boolean;

  @Column({ type: "varchar", default: "normal" })
  auditStatus: "normal" | "pending" | "warning" | "violation";

  @Column({ type: "simple-json", nullable: true })
  auditResult: {
    hasSensitiveContent: boolean;
    sensitiveWords: string[];
    riskLevel: "low" | "medium" | "high";
    notes?: string;
  };

  @Column({ type: "simple-json", nullable: true })
  attachments: Array<{
    fileName: string;
    fileSize: number;
    fileType: string;
    filePath: string;
  }>;

  @Column({ type: "simple-json", nullable: true })
  auditInfo: {
    auditedBy: number;
    auditedAt: Date;
    auditResult: "compliant" | "warning" | "violation";
    violationType?: string;
    notes?: string;
  };

  @Column({ type: "simple-json", nullable: true })
  complianceCheck: {
    hasSensitiveContent: boolean;
    sensitiveWords: string[];
    riskLevel: "low" | "medium" | "high";
  };

  @Column({ nullable: true })
  conversationId: string;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
