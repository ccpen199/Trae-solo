import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BugStatus } from "../utils/enums";

@Entity("bug_history")
export class BugHistory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  bugId: string;

  @ManyToOne("Bug", "history", {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "bugId" })
  bug: any;

  @Column({
    type: "enum",
    enum: BugStatus,
    nullable: true,
  })
  previousStatus: BugStatus;

  @Column({
    type: "enum",
    enum: BugStatus,
    nullable: true,
  })
  newStatus: BugStatus;

  @Column({ type: "text", nullable: true })
  comment: string;

  @Column({ type: "simple-json", nullable: true })
  changedFields: Record<string, { old: any; new: any }>;

  @Column({ type: "uuid", nullable: true })
  userId: string;

  @ManyToOne("User", { nullable: true })
  @JoinColumn({ name: "userId" })
  user: any;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;
}
