import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Candidate } from "./Candidate";
import { Position } from "./Position";

export type ApprovalType = "position_publish" | "candidate_advance" | "offer_approval" | "interview_schedule";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";

@Entity()
export class Approval {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "varchar",
  })
  type: ApprovalType;

  @Column({
    type: "varchar",
    default: "pending",
  })
  status: ApprovalStatus;

  @ManyToOne(() => User, (user) => user.approvals)
  @JoinColumn({ name: "approverId" })
  approver: User;

  @Column()
  approverId: number;

  @Column({ type: "int", nullable: true })
  applicantId: number;

  @ManyToOne(() => Candidate, (candidate) => candidate.approvals, { nullable: true })
  @JoinColumn({ name: "candidateId" })
  candidate: Candidate;

  @Column({ type: "int", nullable: true })
  candidateId: number;

  @Column({ type: "int", nullable: true })
  positionId: number;

  @Column({ type: "text", nullable: true })
  reason: string;

  @Column({ type: "text", nullable: true })
  approvalComments: string;

  @Column({ type: "simple-json", nullable: true })
  approvalData: Record<string, any>;

  @Column({ type: "int", default: 0 })
  approvalOrder: number;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  rejectedAt: Date;

  @Column({ nullable: true })
  nextApproverId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
