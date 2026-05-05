import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

@Entity('test_papers')
export class TestPaper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 0 })
  duration: number;

  @Column({ default: 100 })
  totalScore: number;

  @Column({ default: 60 })
  passScore: number;

  @Column({ default: true })
  isFree: boolean;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => TestQuestion, question => question.testPaper)
  questions: TestQuestion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  JUDGMENT = 'judgment',
  FILL_BLANK = 'fill_blank'
}

@Entity('test_questions')
export class TestQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  testPaperId: string;

  @Column({
    type: 'enum',
    enum: QuestionType
  })
  type: QuestionType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  options: string;

  @Column({ type: 'text' })
  correctAnswer: string;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ default: 10 })
  score: number;

  @Column({ default: 0 })
  sort: number;

  @ManyToOne(() => TestPaper, testPaper => testPaper.questions)
  @JoinColumn({ name: 'testPaperId' })
  testPaper: TestPaper;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('test_records')
export class TestRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  testPaperId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  score: number;

  @Column({ default: false })
  isPassed: boolean;

  @Column({ type: 'text', nullable: true })
  answers: string;

  @Column({ default: 0 })
  duration: number;

  @Column({ default: 1 })
  attemptCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
