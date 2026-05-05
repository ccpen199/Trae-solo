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

@Entity("modules")
export class Module {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, nullable: true })
  code: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "int", default: 0 })
  sortOrder: number;

  @Column({ type: "uuid", nullable: true })
  parentId: string | null;

  @ManyToOne("Module", "children", {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "parentId" })
  parent: any;

  @OneToMany("Module", "parent")
  children: any[];

  @Column({ type: "uuid" })
  projectId: string;

  @ManyToOne("Project", "modules", {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "projectId" })
  project: any;

  @OneToMany("Bug", "module")
  bugs: any[];

  @OneToMany("TestCase", "module")
  testCases: any[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
