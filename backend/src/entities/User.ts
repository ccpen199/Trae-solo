import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Position } from "./Position";
import { Interview } from "./Interview";
import { Approval } from "./Approval";
import { IMMessage } from "./IMMessage";

export type UserRole = "admin" | "hr" | "hiring_manager" | "interviewer";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: "varchar",
    default: "hr",
  })
  role: UserRole;

  @Column({ nullable: true })
  department: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  avatar: string;

  @OneToMany(() => Position, (position) => position.createdBy)
  positions: Position[];

  @OneToMany(() => Interview, (interview) => interview.interviewer)
  interviews: Interview[];

  @OneToMany(() => Approval, (approval) => approval.approver)
  approvals: Approval[];

  @OneToMany(() => IMMessage, (message) => message.sender)
  sentMessages: IMMessage[];

  @OneToMany(() => IMMessage, (message) => message.receiver)
  receivedMessages: IMMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
