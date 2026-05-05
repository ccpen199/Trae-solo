import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../entities/User';
import { Course, CourseCategory, CourseChapter, CourseLesson } from '../entities/Course';
import { Resource } from '../entities/Resource';
import { Question, Answer } from '../entities/Question';
import { TestPaper, TestQuestion, TestRecord } from '../entities/Test';
import { Job, EmploymentGuide } from '../entities/Job';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'zhihui_education',
  synchronize: true,
  logging: false,
  entities: [
    User,
    Course,
    CourseCategory,
    CourseChapter,
    CourseLesson,
    Resource,
    Question,
    Answer,
    TestPaper,
    TestQuestion,
    TestRecord,
    Job,
    EmploymentGuide
  ],
  migrations: [],
  subscribers: [],
});

export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    const dataSource = await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
    return dataSource;
  } catch (error) {
    console.error('❌ Error connecting to database:', error);
    throw error;
  }
};
