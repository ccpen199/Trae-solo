import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const PORT = 28765;
const JWT_SECRET = 'ExamJwtSecretKey2024VeryLongKeyForSecurity';
const JWT_EXPIRES_IN = '24h';

enum UserRole {
  ADMIN = 'admin',
  QUESTION_SETTER = 'question_setter',
  EXAMINEE = 'examinee',
  GRADER = 'grader',
}

enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
  ESSAY = 'essay',
}

enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

enum ExamStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ONGOING = 'ongoing',
  ENDED = 'ended',
  ARCHIVED = 'archived',
}

interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  department?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface KnowledgePoint {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
}

interface QuestionOption {
  id: string;
  label: string;
  content: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  title: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  score: number;
  content: string;
  explanation?: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  knowledgePointId?: string;
  creatorId: string;
  isShared: boolean;
  isActive: boolean;
  useCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ExamPaper {
  id: string;
  name: string;
  description?: string;
  totalScore: number;
  totalQuestions: number;
  status: 'draft' | 'published' | 'archived';
  isRandomQuestions: boolean;
  isRandomOptions: boolean;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Exam {
  id: string;
  name: string;
  description?: string;
  examPaperId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: ExamStatus;
  totalScore: number;
  passScore: number;
  allowLateEntry: boolean;
  lateEntryMinutes: number;
  showResultImmediately: boolean;
  allowReview: boolean;
  isRandomOrder: boolean;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UserExam {
  id: string;
  userId: string;
  examId: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'graded';
  score?: number;
  startTime?: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UserAnswer {
  id: string;
  userExamId: string;
  questionId: string;
  answer?: string;
  isCorrect?: boolean;
  score?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface AnomalyRecord {
  id: string;
  userExamId: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  createdAt: Date;
}

interface GradingRecord {
  id: string;
  userAnswerId: string;
  graderId?: string;
  score: number;
  comment?: string;
  isAutoGraded: boolean;
  gradedAt: Date;
  createdAt: Date;
}

const db = {
  users: [] as User[],
  knowledgePoints: [] as KnowledgePoint[],
  questions: [] as Question[],
  examPapers: [] as ExamPaper[],
  exams: [] as Exam[],
  userExams: [] as UserExam[],
  userAnswers: [] as UserAnswer[],
  anomalyRecords: [] as AnomalyRecord[],
  gradingRecords: [] as GradingRecord[],
};

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

const generateToken = (user: User): string => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const initDatabase = async () => {
  console.log('初始化内存数据库...');

  const users: User[] = [
    {
      id: uuidv4(),
      username: 'admin',
      password: await hashPassword('Admin@123'),
      name: '系统管理员',
      role: UserRole.ADMIN,
      email: 'admin@exam.com',
      phone: '13800000001',
      department: '系统管理部',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      username: 'setter01',
      password: await hashPassword('Setter@123'),
      name: '张老师',
      role: UserRole.QUESTION_SETTER,
      email: 'zhang@exam.com',
      phone: '13800000002',
      department: '教学部',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      username: 'grader01',
      password: await hashPassword('Grader@123'),
      name: '王阅卷',
      role: UserRole.GRADER,
      email: 'wang@exam.com',
      phone: '13800000004',
      department: '阅卷组',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      username: 'student01',
      password: await hashPassword('Student@123'),
      name: '小明',
      role: UserRole.EXAMINEE,
      email: 'xiaoming@exam.com',
      phone: '13900000001',
      department: '一班',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      username: 'student02',
      password: await hashPassword('Student@123'),
      name: '小红',
      role: UserRole.EXAMINEE,
      email: 'xiaohong@exam.com',
      phone: '13900000002',
      department: '一班',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  db.users = users;

  const kpId1 = uuidv4();
  const kpId2 = uuidv4();
  const kpId3 = uuidv4();
  const kpId6 = uuidv4();
  const kpId10 = uuidv4();

  const knowledgePoints: KnowledgePoint[] = [
    { id: kpId1, name: '计算机基础', code: 'CS-BASICS', sortOrder: 1, isActive: true },
    { id: kpId2, name: '数据结构', code: 'DS', parentId: kpId1, sortOrder: 1, isActive: true },
    { id: kpId3, name: '算法', code: 'ALG', parentId: kpId1, sortOrder: 2, isActive: true },
    { id: kpId6, name: '数组', code: 'DS-ARRAY', parentId: kpId2, sortOrder: 1, isActive: true },
    { id: kpId10, name: '排序算法', code: 'ALG-SORT', parentId: kpId3, sortOrder: 1, isActive: true },
  ];

  db.knowledgePoints = knowledgePoints;

  const setterUser = users.find(u => u.username === 'setter01')!;

  const questions: Question[] = [
    {
      id: uuidv4(),
      title: '以下哪个是线性数据结构？',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      score: 2,
      content: '以下哪个是线性数据结构？',
      explanation: '线性数据结构是数据元素之间存在一对一关系的数据结构。数组、链表、栈、队列都是线性结构。',
      options: [
        { id: uuidv4(), label: 'A', content: '树', isCorrect: false },
        { id: uuidv4(), label: 'B', content: '图', isCorrect: false },
        { id: uuidv4(), label: 'C', content: '数组', isCorrect: true },
        { id: uuidv4(), label: 'D', content: '堆', isCorrect: false },
      ],
      knowledgePointId: kpId6,
      creatorId: setterUser.id,
      isShared: true,
      isActive: true,
      useCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      title: '以下哪些是常见的排序算法？',
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.MEDIUM,
      score: 3,
      content: '以下哪些是常见的排序算法？（多选）',
      explanation: '冒泡排序、快速排序、归并排序都是常见的排序算法。哈希是一种查找技术，不是排序算法。',
      options: [
        { id: uuidv4(), label: 'A', content: '冒泡排序', isCorrect: true },
        { id: uuidv4(), label: 'B', content: '快速排序', isCorrect: true },
        { id: uuidv4(), label: 'C', content: '哈希', isCorrect: false },
        { id: uuidv4(), label: 'D', content: '归并排序', isCorrect: true },
      ],
      knowledgePointId: kpId10,
      creatorId: setterUser.id,
      isShared: true,
      isActive: true,
      useCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      title: '栈是一种先进先出（FIFO）的数据结构。',
      type: QuestionType.TRUE_FALSE,
      difficulty: DifficultyLevel.EASY,
      score: 1,
      content: '栈是一种先进先出（FIFO）的数据结构。',
      explanation: '栈是一种后进先出（LIFO）的数据结构，队列才是先进先出（FIFO）的数据结构。',
      correctAnswer: 'false',
      knowledgePointId: kpId2,
      creatorId: setterUser.id,
      isShared: true,
      isActive: true,
      useCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      title: '请简述快速排序的基本思想和时间复杂度。',
      type: QuestionType.SHORT_ANSWER,
      difficulty: DifficultyLevel.MEDIUM,
      score: 5,
      content: '请简述快速排序的基本思想和时间复杂度。',
      explanation: '快速排序采用分治策略：选择一个基准元素，将数组分成两部分，一部分都比基准小，另一部分都比基准大，然后递归排序这两部分。平均时间复杂度O(nlogn)，最坏情况O(n²)。',
      knowledgePointId: kpId10,
      creatorId: setterUser.id,
      isShared: true,
      isActive: true,
      useCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  db.questions = questions;

  const examPaper: ExamPaper = {
    id: uuidv4(),
    name: '计算机基础期中测试',
    description: '数据结构与算法基础知识测试',
    totalScore: 11,
    totalQuestions: 4,
    status: 'published',
    isRandomQuestions: false,
    isRandomOptions: false,
    creatorId: setterUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  db.examPapers = [examPaper];

  const now = new Date();
  const exam: Exam = {
    id: uuidv4(),
    name: '2024学年第一学期计算机基础考试',
    description: '计算机基础期中测试',
    examPaperId: examPaper.id,
    startTime: new Date(now.getTime() - 3600000),
    endTime: new Date(now.getTime() + 7200000),
    duration: 60,
    status: ExamStatus.ONGOING,
    totalScore: 11,
    passScore: 6,
    allowLateEntry: true,
    lateEntryMinutes: 15,
    showResultImmediately: true,
    allowReview: true,
    isRandomOrder: false,
    maxAttempts: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  db.exams = [exam];

  console.log('✅ 内存数据库初始化完成');
  console.log('');
  console.log('📋 默认账号信息：');
  console.log('');
  console.log('👨‍💼 管理员：');
  console.log('   用户名: admin');
  console.log('   密码: Admin@123');
  console.log('');
  console.log('👨‍🏫 出题人：');
  console.log('   用户名: setter01');
  console.log('   密码: Setter@123');
  console.log('');
  console.log('✍️ 阅卷老师：');
  console.log('   用户名: grader01');
  console.log('   密码: Grader@123');
  console.log('');
  console.log('👨‍🎓 考生：');
  console.log('   用户名: student01 / student02');
  console.log('   密码: Student@123');
  console.log('');
};

const app = express();

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(
  cors({
    origin: ['http://localhost:29876', 'http://127.0.0.1:29876'],
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未授权访问',
    });
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string };
    const user = db.users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '无效的token' });
  }
};

const roleMiddleware = (...roles: UserRole[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user as User;
    if (!roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
      });
    }
    next();
  };
};

app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Online Exam System API is running',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
      });
    }

    const user = db.users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
    }

    user.lastLoginAt = new Date();
    const token = generateToken(user);

    const userWithoutPassword = { ...user, password: undefined };

    res.json({
      success: true,
      data: {
        token,
        user: userWithoutPassword,
      },
      message: '登录成功',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
    });
  }
});

app.post('/api/v1/auth/logout', authMiddleware, (_req, res) => {
  res.json({
    success: true,
    message: '登出成功',
  });
});

app.get('/api/v1/auth/profile', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const userWithoutPassword = { ...user, password: undefined };
  res.json({
    success: true,
    data: { user: userWithoutPassword },
  });
});

app.get('/api/v1/auth/me', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const userWithoutPassword = { ...user, password: undefined };
  res.json({
    success: true,
    data: { user: userWithoutPassword },
  });
});

app.get('/api/v1/questions', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 10, type, difficulty } = req.query;
  let questions = [...db.questions];

  if (type) {
    questions = questions.filter(q => q.type === type);
  }
  if (difficulty) {
    questions = questions.filter(q => q.difficulty === difficulty);
  }

  const start = (Number(page) - 1) * Number(pageSize);
  const end = start + Number(pageSize);
  const paginatedQuestions = questions.slice(start, end);

  res.json({
    success: true,
    data: {
      data: paginatedQuestions,
      total: questions.length,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(questions.length / Number(pageSize)),
    },
  });
});

app.get('/api/v1/questions/:id', authMiddleware, (req, res) => {
  const question = db.questions.find(q => q.id === req.params.id);
  if (!question) {
    return res.status(404).json({ success: false, message: '题目不存在' });
  }
  res.json({ success: true, data: question });
});

app.post('/api/v1/questions', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.QUESTION_SETTER), (req, res) => {
  const user = (req as any).user as User;
  const question: Question = {
    id: uuidv4(),
    ...req.body,
    creatorId: user.id,
    isActive: true,
    useCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  db.questions.push(question);
  res.status(201).json({ success: true, data: question, message: '题目创建成功' });
});

app.get('/api/v1/exam-papers', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const start = (Number(page) - 1) * Number(pageSize);
  const end = start + Number(pageSize);
  const paginatedItems = db.examPapers.slice(start, end);

  res.json({
    success: true,
    data: {
      data: paginatedItems,
      total: db.examPapers.length,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(db.examPapers.length / Number(pageSize)),
    },
  });
});

app.get('/api/v1/exam-papers/:id', authMiddleware, (req, res) => {
  const examPaper = db.examPapers.find(p => p.id === req.params.id);
  if (!examPaper) {
    return res.status(404).json({ success: false, message: '试卷不存在' });
  }
  res.json({ success: true, data: examPaper });
});

app.get('/api/v1/exams', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  let exams = [...db.exams];

  if (user.role === UserRole.EXAMINEE) {
    const userExams = db.userExams.filter(ue => ue.userId === user.id);
    const examIds = userExams.map(ue => ue.examId);
    exams = exams.filter(e => examIds.includes(e.id) || e.status === ExamStatus.ONGOING || e.status === ExamStatus.PUBLISHED);
  }

  res.json({
    success: true,
    data: {
      data: exams,
      total: exams.length,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    },
  });
});

app.get('/api/v1/exams/:id', authMiddleware, (req, res) => {
  const exam = db.exams.find(e => e.id === req.params.id);
  if (!exam) {
    return res.status(404).json({ success: false, message: '考试不存在' });
  }
  res.json({ success: true, data: exam });
});

app.get('/api/v1/exams/:id/questions', authMiddleware, (req, res) => {
  const exam = db.exams.find(e => e.id === req.params.id);
  if (!exam) {
    return res.status(404).json({ success: false, message: '考试不存在' });
  }

  const examPaper = db.examPapers.find(p => p.id === exam.examPaperId);

  const questions = db.questions.slice(0, 4).map((q, index) => ({
    id: q.id,
    examPaperQuestionId: uuidv4(),
    title: q.title,
    type: q.type,
    difficulty: q.difficulty,
    score: q.score,
    content: q.content,
    options: q.options?.map(o => ({
      id: o.id,
      label: o.label,
      content: o.content,
    })),
    sortOrder: index + 1,
  }));

  res.json({
    success: true,
    data: {
      exam,
      examPaper,
      questions,
    },
  });
});

app.post('/api/v1/exams/:id/start', authMiddleware, roleMiddleware(UserRole.EXAMINEE), (req, res) => {
  const user = (req as any).user as User;
  const exam = db.exams.find(e => e.id === req.params.id);
  const examPaper = exam ? db.examPapers.find(p => p.id === exam.examPaperId) : undefined;

  if (!exam) {
    return res.status(404).json({ success: false, message: '考试不存在' });
  }

  let userExam = db.userExams.find(ue => ue.userId === user.id && ue.examId === exam.id);
  
  if (!userExam) {
    userExam = {
      id: uuidv4(),
      userId: user.id,
      examId: exam.id,
      status: 'in_progress',
      startTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.userExams.push(userExam);
  } else if (userExam.status === 'pending') {
    userExam.status = 'in_progress';
    userExam.startTime = new Date();
  }

  const questions = db.questions.slice(0, 4).map((q, index) => ({
    id: q.id,
    examPaperQuestionId: uuidv4(),
    title: q.title,
    type: q.type,
    difficulty: q.difficulty,
    score: q.score,
    content: q.content,
    options: q.options?.map(o => ({
      id: o.id,
      label: o.label,
      content: o.content,
    })),
    sortOrder: index + 1,
  }));

  const responseData = {
    userExam: {
      id: userExam.id,
      examId: userExam.examId,
      status: 'in_progress',
      startTime: userExam.startTime,
      duration: examPaper?.duration || 60,
      endTime: exam.endTime,
      isLate: false,
    },
    exam: {
      id: exam.id,
      name: exam.name,
      description: exam.description,
      totalScore: examPaper?.totalScore || 100,
      passScore: exam.passScore || 60,
      duration: examPaper?.duration || 60,
      allowReview: exam.allowReview,
    },
    questions,
  };

  res.json({
    success: true,
    data: responseData,
    message: '考试开始',
  });
});

app.post('/api/v1/exams/:id/submit', authMiddleware, roleMiddleware(UserRole.EXAMINEE), (req, res) => {
  const user = (req as any).user as User;
  const { answers } = req.body;

  const userExam = db.userExams.find(ue => ue.userId === user.id && ue.examId === req.params.id);
  if (!userExam) {
    return res.status(404).json({ success: false, message: '考试记录不存在' });
  }

  userExam.status = 'submitted';
  userExam.submittedAt = new Date();
  userExam.updatedAt = new Date();

  if (answers && Array.isArray(answers)) {
    for (const ans of answers) {
      const userAnswer: UserAnswer = {
        id: uuidv4(),
        userExamId: userExam.id,
        questionId: ans.questionId,
        answer: ans.answer,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      db.userAnswers.push(userAnswer);
    }
  }

  let totalScore = 0;
  let objectiveCount = 0;

  for (const ua of db.userAnswers.filter(a => a.userExamId === userExam.id)) {
    const question = db.questions.find(q => q.id === ua.questionId);
    if (question) {
      let isCorrect = false;

      if (question.type === QuestionType.SINGLE_CHOICE && question.options) {
        const correctOption = question.options.find(o => o.isCorrect);
        isCorrect = ua.answer === correctOption?.id;
      } else if (question.type === QuestionType.TRUE_FALSE) {
        isCorrect = ua.answer === question.correctAnswer;
      }

      if (isCorrect) {
        ua.isCorrect = true;
        ua.score = question.score;
        totalScore += question.score;
        objectiveCount++;

        const gradingRecord: GradingRecord = {
          id: uuidv4(),
          userAnswerId: ua.id,
          score: question.score,
          isAutoGraded: true,
          gradedAt: new Date(),
          createdAt: new Date(),
        };
        db.gradingRecords.push(gradingRecord);
      }
    }
  }

  if (objectiveCount > 0) {
    userExam.score = totalScore;
  }

  res.json({
    success: true,
    data: userExam,
    message: '考试提交成功',
  });
});

app.post('/api/v1/exams/anomaly', authMiddleware, roleMiddleware(UserRole.EXAMINEE), (req, res) => {
  const user = (req as any).user as User;
  const { userExamId, type, description, severity } = req.body;

  const anomaly: AnomalyRecord = {
    id: uuidv4(),
    userExamId,
    type: type || 'unknown',
    description: description || '',
    severity: severity || 'medium',
    timestamp: new Date(),
    createdAt: new Date(),
  };

  db.anomalyRecords.push(anomaly);

  const userExam = db.userExams.find(ue => ue.id === userExamId);
  if (userExam) {
    const userAnomalies = db.anomalyRecords.filter(a => a.userExamId === userExamId);
    const highCount = userAnomalies.filter(a => a.severity === 'high').length;
    
    if (highCount >= 3) {
      userExam.status = 'submitted';
    }
  }

  res.json({
    success: true,
    data: anomaly,
    message: '异常行为已记录',
  });
});

app.get('/api/v1/statistics', authMiddleware, roleMiddleware(UserRole.ADMIN), (_req, res) => {
  const stats = {
    overview: {
      totalUsers: db.users.length,
      totalQuestions: db.questions.length,
      totalExams: db.exams.length,
      totalExamPapers: db.examPapers.length,
    },
    roleDistribution: {
      admin: db.users.filter(u => u.role === UserRole.ADMIN).length,
      question_setter: db.users.filter(u => u.role === UserRole.QUESTION_SETTER).length,
      grader: db.users.filter(u => u.role === UserRole.GRADER).length,
      examinee: db.users.filter(u => u.role === UserRole.EXAMINEE).length,
    },
    userExamStats: {
      total: db.userExams.length,
      inProgress: db.userExams.filter(ue => ue.status === 'in_progress').length,
      submitted: db.userExams.filter(ue => ue.status === 'submitted').length,
      graded: db.userExams.filter(ue => ue.status === 'graded').length,
      hasAnomaly: db.anomalyRecords.length,
    },
    activeExams: db.exams.filter(e => e.status === ExamStatus.ONGOING),
    recentExams: db.exams.slice(0, 10),
  };

  res.json({
    success: true,
    data: stats,
  });
});

app.get('/api/v1/statistics/dashboard', authMiddleware, (_req, res) => {
  const stats = {
    overview: {
      totalUsers: db.users.length,
      totalQuestions: db.questions.length,
      totalExams: db.exams.length,
      totalExamPapers: db.examPapers.length,
    },
    roleDistribution: {
      admin: db.users.filter(u => u.role === UserRole.ADMIN).length,
      question_setter: db.users.filter(u => u.role === UserRole.QUESTION_SETTER).length,
      grader: db.users.filter(u => u.role === UserRole.GRADER).length,
      examinee: db.users.filter(u => u.role === UserRole.EXAMINEE).length,
    },
    userExamStats: {
      total: db.userExams.length,
      inProgress: db.userExams.filter(ue => ue.status === 'in_progress').length,
      submitted: db.userExams.filter(ue => ue.status === 'submitted').length,
      graded: db.userExams.filter(ue => ue.status === 'graded').length,
      hasAnomaly: db.anomalyRecords.length,
    },
    activeExams: db.exams.filter(e => e.status === ExamStatus.ONGOING),
    recentExams: db.exams.slice(0, 10),
  };

  res.json({
    success: true,
    data: stats,
  });
});

app.get('/api/v1/knowledge-points', authMiddleware, (_req, res) => {
  res.json({
    success: true,
    data: db.knowledgePoints,
  });
});

app.get('/api/v1/grading/pending', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.GRADER), (_req, res) => {
  const pendingAnswers = db.userAnswers.filter(a => a.score === undefined);
  const withDetails = pendingAnswers.map(ua => {
    const question = db.questions.find(q => q.id === ua.questionId);
    const userExam = db.userExams.find(ue => ue.id === ua.userExamId);
    const exam = userExam ? db.exams.find(e => e.id === userExam.examId) : undefined;
    const user = userExam ? db.users.find(u => u.id === userExam.userId) : undefined;

    return {
      ...ua,
      question,
      exam,
      user: user ? { ...user, password: undefined } : undefined,
    };
  });

  res.json({
    success: true,
    data: {
      data: withDetails,
      total: withDetails.length,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    },
  });
});

app.post('/api/v1/grading/:id', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.GRADER), (req, res) => {
  const user = (req as any).user as User;
  const { score, comment } = req.body;

  const userAnswer = db.userAnswers.find(a => a.id === req.params.id);
  if (!userAnswer) {
    return res.status(404).json({ success: false, message: '答案不存在' });
  }

  userAnswer.score = score;
  userAnswer.updatedAt = new Date();

  const gradingRecord: GradingRecord = {
    id: uuidv4(),
    userAnswerId: userAnswer.id,
    graderId: user.id,
    score,
    comment,
    isAutoGraded: false,
    gradedAt: new Date(),
    createdAt: new Date(),
  };
  db.gradingRecords.push(gradingRecord);

  const userExam = db.userExams.find(ue => ue.id === userAnswer.userExamId);
  if (userExam) {
    const allAnswers = db.userAnswers.filter(a => a.userExamId === userExam.id);
    const allGraded = allAnswers.every(a => a.score !== undefined);
    if (allGraded) {
      userExam.status = 'graded';
      userExam.score = allAnswers.reduce((sum, a) => sum + (a.score || 0), 0);
    }
  }

  res.json({
    success: true,
    data: userAnswer,
    message: '阅卷完成',
  });
});

app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
  });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
  });
});

const startServer = async () => {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log('');
    console.log('🚀 在线考试系统后端服务已启动');
    console.log('');
    console.log(`📡 服务端口: ${PORT}`);
    console.log(`🔗 API地址: http://localhost:${PORT}/api/v1`);
    console.log(`✅ 健康检查: http://localhost:${PORT}/api/v1/health`);
    console.log('');
    console.log('---------------------------------------------------');
    console.log('📋 访问前端: http://localhost:29876');
    console.log('---------------------------------------------------');
    console.log('');
  });
};

startServer();
