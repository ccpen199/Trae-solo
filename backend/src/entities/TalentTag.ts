import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from "typeorm";
import { Candidate } from "./Candidate";

export type TagCategory = "skill" | "project" | "resignation_reason" | "performance" | "personality" | "source";

@Entity()
export class TalentTag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: "varchar",
    default: "skill",
  })
  category: TagCategory;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "simple-json", nullable: true })
  metadata: Record<string, any>;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Candidate)
  @JoinTable({
    name: "candidate_tags",
    joinColumn: { name: "tagId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "candidateId", referencedColumnName: "id" },
  })
  candidates: Candidate[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
