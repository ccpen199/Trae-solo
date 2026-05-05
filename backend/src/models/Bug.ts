import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { BugStatus, BugSeverity, BugPriority } from "../utils/enums";

@Entity("bugs")
export class Bug {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 50 })
  bugNumber: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({
    type: "enum",
    enum: BugStatus,
    default: BugStatus.NEW,
  })
  status: BugStatus;

  @Column({
    type: "enum",
    enum: BugSeverity,
    default: BugSeverity.MEDIUM,
  })
  severity: BugSeverity;

  @Column({
    type: "enum",
    enum: BugPriority,
    default: BugPriority.P3,
  })
  priority: BugPriority;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ type: "uuid" })
  projectId: string;

  @ManyToOne("Project", "bugs", {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "projectId" })
  project: any;

  @Column({ type: "uuid", nullable: true })
  moduleId: string;

  @ManyToOne("Module", "bugs", {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "moduleId" })
  module: any;

  @Column({ type: "uuid", nullable: true })
  requirementId: string;

  @ManyToOne("TestRequirement", "bugs", {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "requirementId" })
  requirement: any;

  @Column({ type: "uuid", nullable: true })
  versionId: string;

  @ManyToOne("TestVersion", "bugs", {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "versionId" })
  version: any;

  @Column({ type: "uuid", nullable: true })
  reporterId: string;

  @ManyToOne("User", "reportedBugs", {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "reporterId" })
  reporter: any;

  @Column({ type: "uuid", nullable: true })
  assigneeId: string;

  @ManyToOne("User", "assignedBugs", {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "assigneeId" })
  assignee: any;

  @Column({ type: "text", nullable: true })
  stepsToReproduce: string;

  @Column({ type: "text", nullable: true })
  expectedResult: string;

  @Column({ type: "text", nullable: true })
  actualResult: string;

  @Column({ type: "text", nullable: true })
  environment: string;

  @Column({ type: "text", nullable: true })
  attachments: string;

  @OneToMany("BugHistory", "bug")
  history: any[];

  @Column({ type: "timestamp", nullable: true })
  resolvedAt: Date;

  @Column({ type: "timestamp", nullable: true })
  closedAt: Date;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
