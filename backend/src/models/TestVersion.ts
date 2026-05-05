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

@Entity("test_versions")
export class TestVersion {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  version: string;

  @Column({ length: 255, nullable: true })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "timestamp", nullable: true })
  startDate: Date;

  @Column({ type: "timestamp", nullable: true })
  endDate: Date;

  @Column({ type: "uuid" })
  projectId: string;

  @ManyToOne("Project", "versions", {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "projectId" })
  project: any;

  @OneToMany("Bug", "version")
  bugs: any[];

  @OneToMany("TestCase", "version")
  testCases: any[];

  @Column({ type: "uuid", nullable: true })
  createdById: string;

  @ManyToOne("User", { nullable: true })
  @JoinColumn({ name: "createdById" })
  createdBy: any;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
