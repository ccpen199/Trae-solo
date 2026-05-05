import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
} from "typeorm";

@Entity("projects")
export class Project {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 50 })
  code: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "int", default: 0 })
  sortOrder: number;

  @ManyToMany("User", "projects")
  users: any[];

  @ManyToMany("TestGroup", "projects")
  groups: any[];

  @OneToMany("Module", "project")
  modules: any[];

  @OneToMany("TestRequirement", "project")
  requirements: any[];

  @OneToMany("TestVersion", "project")
  versions: any[];

  @OneToMany("Bug", "project")
  bugs: any[];

  @OneToMany("TestCase", "project")
  testCases: any[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
