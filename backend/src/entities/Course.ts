import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

@Entity('course_categories')
export class CourseCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 0 })
  level: number;

  @Column({ nullable: true })
  parentId: string;

  @ManyToOne(() => CourseCategory, category => category.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: CourseCategory;

  @OneToMany(() => CourseCategory, category => category.parent)
  children: CourseCategory[];

  @OneToMany(() => Course, course => course.category)
  courses: Course[];

  @Column({ default: 0 })
  sort: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  cover: string;

  @Column('uuid')
  categoryId: string;

  @ManyToOne(() => CourseCategory, category => category.courses)
  @JoinColumn({ name: 'categoryId' })
  category: CourseCategory;

  @Column('uuid', { nullable: true })
  teacherId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice: number;

  @Column({ default: 0 })
  duration: number;

  @Column({ default: 0 })
  studentCount: number;

  @Column({ type: 'text', nullable: true })
  outline: string;

  @Column({ type: 'enum', enum: ['draft', 'published', 'archived'], default: 'draft' })
  status: string;

  @Column({ default: true })
  isFeatured: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('course_chapters')
export class CourseChapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  courseId: string;

  @Column()
  title: string;

  @Column({ default: 0 })
  sort: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('course_lessons')
export class CourseLesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  chapterId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ default: 0 })
  duration: number;

  @Column({ default: 0 })
  sort: number;

  @Column({ default: true })
  isFree: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
