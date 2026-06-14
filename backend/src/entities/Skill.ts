import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type SkillCategory = 'prepress' | 'printing' | 'postpress' | 'management';

@Entity()
export class Skill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'text',
    default: 'printing'
  })
  category: SkillCategory;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-json', nullable: true })
  relatedSkills: string[];
}
