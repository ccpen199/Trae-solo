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

@Entity("test_requirements")
export class TestRequirement {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ length: 100, nullable: true })
  code: string;

  @Column({ type: "int", default: 0 })
  sortOrder: number;

  @Column({ type: "uuid", nullable: true })
  parentId: string;

  @ManyToOne("TestRequirement", "children", {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "parentId" })
  parent: any;

  @OneToMany("TestRequirement", "parent")
  children: any[];

  @Column({ type: "uuid" })
  projectId: string;

  @ManyToOne("Project", "requirements", {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "projectId" })
  project: any;

  @OneToMany("Bug", "requirement")
  bugs: any[];

  @OneToMany("TestCase", "requirement")
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
