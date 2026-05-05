import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

export enum TestCasePriority {
  P0 = "P0",
  P1 = "P1",
  P2 = "P2",
  P3 = "P3",
}

export enum TestCaseStatus {
  DRAFT = "DRAFT",
  REVIEW = "REVIEW",
  APPROVED = "APPROVED",
  DEPRECATED = "DEPRECATED",
}

@Entity("test_cases")
export class TestCase {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 50 })
  caseNumber: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "text", nullable: true })
  precondition: string;

  @Column({ type: "simple-json", nullable: true })
  steps: { action: string; expectedResult: string }[];

  @Column({
    type: "enum",
    enum: TestCasePriority,
    default: TestCasePriority.P2,
  })
  priority: TestCasePriority;

  @Column({
    type: "enum",
    enum: TestCaseStatus,
    default: TestCaseStatus.DRAFT,
  })
  status: TestCaseStatus;

  @Column({ type: "text", nullable: true })
  tags: string;

  @Column({ type: "uuid", nullable: true })
  projectId: string;

  @ManyToOne("Project", "testCases", {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "projectId" })
  project: any;

  @Column({ type: "uuid", nullable: true })
  moduleId: string;

  @ManyToOne("Module", "testCases", {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "moduleId" })
  module: any;

  @Column({ type: "uuid", nullable: true })
  requirementId: string;

  @ManyToOne("TestRequirement", "testCases", {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "requirementId" })
  requirement: any;

  @Column({ type: "uuid", nullable: true })
  versionId: string;

  @ManyToOne("TestVersion", "testCases", {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "versionId" })
  version: any;

  @Column({ type: "uuid", nullable: true })
  createdById: string;

  @ManyToOne("User", { nullable: true })
  @JoinColumn({ name: "createdById" })
  createdBy: any;

  @Column({ type: "uuid", nullable: true })
  updatedById: string;

  @ManyToOne("User", { nullable: true })
  @JoinColumn({ name: "updatedById" })
  updatedBy: any;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
