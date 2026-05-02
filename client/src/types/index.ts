export enum UserRole {
  ADMIN = 'admin',
  QUESTION_SETTER = 'question_setter',
  EXAMINEE = 'examinee',
  GRADER = 'grader',
}

export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
  ESSAY = 'essay',
  MATERIAL = 'material',
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  VERY_HARD = 'very_hard',
}

export enum ExamStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ONGOING = 'ongoing',
  ENDED = 'ended',
  ARCHIVED = 'archived',
}

export enum ExamPaperStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum UserExamStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  SUBMITTED = 'submitted',
  GRADED = 'graded',
  FORCE_SUBMITTED = 'force_submitted',
}

export enum AnswerStatus {
  SAVED = 'saved',
  SUBMITTED = 'submitted',
  GRADED = 'graded',
}

export enum AnomalyType {
  SCREEN_SWITCH = 'screen_switch',
  COPY_PASTE = 'copy_paste',
  IDLE_TIMEOUT = 'idle_timeout',
  MULTIPLE_TABS = 'multiple_tabs',
  FORCE_SUBMIT = 'force_submit',
  SUSPICIOUS_BEHAVIOR = 'suspicious_behavior',
}

export enum AnomalySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AnomalyStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  DISMISSED = 'dismissed',
  CONFIRMED = 'confirmed',
}

export enum GradingStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REVIEWED = 'reviewed',
}

export interface User {
  id: string;
  username: string;
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

export interface KnowledgePoint {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionOption {
  id: string;
  label: string;
  content: string;
  isCorrect?: boolean;
}

export interface Question {
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
  knowledgePoint?: KnowledgePoint;
  creatorId: string;
  creator?: User;
  isShared: boolean;
  isActive: boolean;
  useCount: number;
  correctRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamPaper {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  creator?: User;
  status: ExamPaperStatus;
  totalScore: number;
  totalQuestions: number;
  isRandomQuestions: boolean;
  isRandomOptions: boolean;
  strategyData?: {
    type: 'intelligent' | 'manual';
    intelligentRules?: Array<{
      knowledgePointId?: string;
      knowledgePointName?: string;
      questionType?: string;
      difficulty?: string;
      count: number;
      scorePerQuestion: number;
    }>;
    manualQuestions?: Array<{
      questionId: string;
      score: number;
      sortOrder: number;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamPaperQuestion {
  id: string;
  examPaperId: string;
  questionId: string;
  question?: Question;
  score: number;
  sortOrder: number;
  section?: string;
}

export interface Exam {
  id: string;
  name: string;
  description?: string;
  examPaperId: string;
  examPaper?: ExamPaper;
  creatorId: string;
  creator?: User;
  status: ExamStatus;
  startTime: Date;
  endTime: Date;
  duration: number;
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

export interface UserExam {
  id: string;
  examId: string;
  exam?: Exam;
  userId: string;
  user?: User;
  status: UserExamStatus;
  attemptNumber: number;
  startTime?: Date;
  endTime?: Date;
  timeSpent?: number;
  totalScore?: number;
  objectiveScore?: number;
  subjectiveScore?: number;
  isPassed?: boolean;
  isLate: boolean;
  screenSwitchCount: number;
  copyPasteCount: number;
  warningCount: number;
  hasAnomaly: boolean;
  autoSavedAt?: Date;
  submittedAt?: Date;
  gradedAt?: Date;
  gradedById?: string;
  gradedBy?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAnswer {
  id: string;
  userExamId: string;
  questionId: string;
  question?: Question;
  examPaperQuestionId: string;
  answerContent?: string;
  answerOptions?: string[];
  isCorrect?: boolean;
  score?: number;
  maxScore: number;
  status: AnswerStatus;
  isAutoGraded: boolean;
  gradingComment?: string;
  gradedById?: string;
  gradedAt?: Date;
  autoSavedAt?: Date;
  submittedAt?: Date;
}

export interface AnomalyRecord {
  id: string;
  userExamId: string;
  userId: string;
  examId: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  description: string;
  details?: Record<string, unknown>;
  occurredAt: Date;
  reviewedById?: string;
  reviewedBy?: User;
  reviewedAt?: Date;
  reviewComment?: string;
}

export interface GradingRecord {
  id: string;
  userExamId: string;
  userAnswerId: string;
  questionId: string;
  graderId: string;
  grader?: User;
  status: GradingStatus;
  originalScore?: number;
  givenScore?: number;
  maxScore: number;
  gradingComment?: string;
  isAutoGraded: boolean;
  autoGradeScore?: number;
  autoGradeReason?: string;
  startedAt?: Date;
  completedAt?: Date;
  reviewedById?: string;
  reviewedBy?: User;
  reviewedAt?: Date;
  reviewComment?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
}

export interface CreateQuestionRequest {
  title: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  score: number;
  content: string;
  explanation?: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  knowledgePointId?: string;
  isShared?: boolean;
}

export interface CreateExamRequest {
  name: string;
  description?: string;
  examPaperId: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalScore?: number;
  passScore?: number;
  allowLateEntry?: boolean;
  lateEntryMinutes?: number;
  showResultImmediately?: boolean;
  allowReview?: boolean;
  isRandomOrder?: boolean;
  maxAttempts?: number;
  examineeIds?: string[];
}

export interface ExamQuestion {
  id: string;
  examPaperQuestionId: string;
  title: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  score: number;
  content: string;
  options?: Array<{
    id: string;
    label: string;
    content: string;
  }>;
  sortOrder: number;
  section?: string;
}

export interface StartExamResponse {
  userExam: {
    id: string;
    examId: string;
    status: UserExamStatus;
    startTime?: Date;
    duration: number;
    endTime: Date;
    isLate: boolean;
  };
  exam: {
    id: string;
    name: string;
    description?: string;
    totalScore: number;
    passScore: number;
    duration: number;
    allowReview: boolean;
  };
  questions: ExamQuestion[];
}

export interface SaveAnswerRequest {
  questionId: string;
  answerContent?: string;
  answerOptions?: string[];
}

export interface ReportAnomalyRequest {
  type: AnomalyType;
  details?: Record<string, unknown>;
}

export interface GradeAnswerRequest {
  score: number;
  comment?: string;
}

export interface ExamStatistics {
  totalExaminees: number;
  participatedCount: number;
  referenceRate: number;
  passedCount: number;
  passRate: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
  scoreSegments: Array<{
    min: number;
    max: number;
    count: number;
  }>;
  questionAnalysis: Array<{
    questionId: string;
    questionTitle: string;
    correctRate: number;
    avgScore: number;
    maxScore: number;
    totalAttempts: number;
  }>;
  knowledgePointAnalysis: Array<{
    knowledgePointId: string;
    knowledgePointName: string;
    correctRate: number;
    avgScore: number;
    totalScore: number;
    questionCount: number;
  }>;
}
