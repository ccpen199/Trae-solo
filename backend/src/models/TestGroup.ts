import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";

@Entity("test_groups")
export class TestGroup {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "uuid", nullable: true })
  parentId: string;

  @ManyToOne("TestGroup", "children", {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "parentId" })
  parent: any;

  @OneToMany("TestGroup", "parent")
  children: any[];

  @ManyToMany("User", "groups")
  users: any[];

  @ManyToMany("Project", "groups")
  projects: any[];

  @Column({ type: "int", default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
