import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { User } from "./User";
import { Candidate } from "./Candidate";

export type PositionStatus = "draft" | "pending_approval" | "approved" | "published" | "closed";
export type PositionChannel = "boss" | "51job" | "zhilian" | "lagou" | "internal";

@Entity()
export class Position {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  department: string;

  @Column({ nullable: true })
  jobType: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "text", nullable: true })
  requirements: string;

  @Column({ type: "text", nullable: true })
  benefits: string;

  @Column({ type: "int", default: 1 })
  headcount: number;

  @Column({ type: "int", default: 0 })
  hiredCount: number;

  @Column({ nullable: true })
  salaryMin: number;

  @Column({ nullable: true })
  salaryMax: number;

  @Column({ nullable: true })
  experienceMin: number;

  @Column({ nullable: true })
  experienceMax: number;

  @Column({ nullable: true })
  education: string;

  @Column({
    type: "varchar",
    default: "draft",
  })
  status: PositionStatus;

  @Column({ type: "simple-array", nullable: true })
  keywords: string[];

  @Column({ type: "simple-array", nullable: true })
  publishChannels: PositionChannel[];

  @Column({ type: "simple-json", nullable: true })
  publishStatus: Record<string, {
    channel: string;
    status: "synced" | "syncing" | "failed" | "pending";
    syncedAt: Date;
    error?: string;
    postUrl?: string;
  }>;

  @Column({ type: "simple-array", nullable: true })
  skillTags: string[];

  @ManyToOne(() => User, (user) => user.positions)
  @JoinColumn({ name: "createdById" })
  createdBy: User;

  @Column()
  createdById: number;

  @Column({ type: "int", nullable: true })
  hiringManagerId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "hiringManagerId" })
  hiringManager: User;

  @OneToMany(() => Candidate, (candidate) => candidate.position)
  candidates: Candidate[];

  @Column({ nullable: true })
  closedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
