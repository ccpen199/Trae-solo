import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
  JoinTable,
} from "typeorm";
import { UserRole } from "../utils/enums";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 100 })
  fullName: string;

  @Column({ unique: true, length: 100, nullable: true })
  email: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany("Project", "users")
  @JoinTable({ name: "user_projects" })
  projects: any[];

  @ManyToMany("TestGroup", "users")
  @JoinTable({ name: "user_groups" })
  groups: any[];

  @OneToMany("Bug", "reporter")
  reportedBugs: any[];

  @OneToMany("Bug", "assignee")
  assignedBugs: any[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
