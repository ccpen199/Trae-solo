import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  tags: string;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  answerCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: false })
  isSolved: boolean;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Answer, answer => answer.question)
  answers: Answer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('answers')
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  questionId: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: false })
  isAdopted: boolean;

  @ManyToOne(() => Question, question => question.answers)
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
