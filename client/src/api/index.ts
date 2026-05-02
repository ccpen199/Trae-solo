import { apiGet, apiPost, apiPut, apiDelete } from './client';
import {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  Question,
  QuestionType,
  DifficultyLevel,
  CreateQuestionRequest,
  ExamPaper,
  Exam,
  UserExam,
  StartExamResponse,
  SaveAnswerRequest,
  ReportAnomalyRequest,
  ExamStatistics,
  KnowledgePoint,
  GradingRecord,
  PaginatedResponse,
} from '@/types';

export const authApi = {
  login: (data: LoginRequest): Promise<LoginResponse> => {
    return apiPost<LoginResponse>('/auth/login', data);
  },

  register: (data: RegisterRequest): Promise<LoginResponse> => {
    return apiPost<LoginResponse>('/auth/register', data);
  },

  getCurrentUser: (): Promise<{ user: User }> => {
    return apiGet<{ user: User }>('/auth/me');
  },

  updatePassword: (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    return apiPut<void>('/auth/password', data);
  },

  updateProfile: (data: Partial<User>): Promise<{ user: User }> => {
    return apiPut<{ user: User }>('/auth/profile', data);
  },
};

export const questionApi = {
  getQuestions: (params?: {
    type?: QuestionType;
    difficulty?: DifficultyLevel;
    knowledgePointId?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Question>> => {
    return apiGet<PaginatedResponse<Question>>('/questions', { params });
  },

  getQuestion: (id: string): Promise<{ question: Question }> => {
    return apiGet<{ question: Question }>(`/questions/${id}`);
  },

  createQuestion: (data: CreateQuestionRequest): Promise<{ question: Question }> => {
    return apiPost<{ question: Question }>('/questions', data);
  },

  batchCreateQuestions: (data: { questions: CreateQuestionRequest[] }): Promise<{ questions: Question[]; count: number }> => {
    return apiPost<{ questions: Question[]; count: number }>('/questions/batch', data);
  },

  updateQuestion: (id: string, data: Partial<CreateQuestionRequest>): Promise<{ question: Question }> => {
    return apiPut<{ question: Question }>(`/questions/${id}`, data);
  },

  deleteQuestion: (id: string): Promise<void> => {
    return apiDelete<void>(`/questions/${id}`);
  },

  getStatistics: (params?: { knowledgePointId?: string; creatorId?: string }) => {
    return apiGet('/questions/statistics', { params });
  },

  getTypes: () => {
    return apiGet('/questions/types');
  },

  getDifficulties: () => {
    return apiGet('/questions/difficulties');
  },
};

export const examPaperApi = {
  getPapers: (params?: {
    status?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<ExamPaper>> => {
    return apiGet<PaginatedResponse<ExamPaper>>('/exam-papers', { params });
  },

  getPaper: (id: string) => {
    return apiGet(`/exam-papers/${id}`);
  },

  createIntelligentPaper: (data: {
    name: string;
    description?: string;
    rules: Array<{
      knowledgePointId?: string;
      knowledgePointName?: string;
      questionType?: string;
      difficulty?: string;
      count: number;
      scorePerQuestion: number;
    }>;
    isRandomQuestions?: boolean;
    isRandomOptions?: boolean;
  }) => {
    return apiPost('/exam-papers/intelligent', data);
  },

  createManualPaper: (data: {
    name: string;
    description?: string;
    questions: Array<{
      questionId: string;
      score: number;
      sortOrder?: number;
      section?: string;
    }>;
    isRandomQuestions?: boolean;
    isRandomOptions?: boolean;
  }) => {
    return apiPost('/exam-papers/manual', data);
  },

  updatePaper: (id: string, data: Partial<ExamPaper>) => {
    return apiPut(`/exam-papers/${id}`, data);
  },

  publishPaper: (id: string) => {
    return apiPost(`/exam-papers/${id}/publish`);
  },

  archivePaper: (id: string) => {
    return apiPost(`/exam-papers/${id}/archive`);
  },

  deletePaper: (id: string) => {
    return apiDelete(`/exam-papers/${id}`);
  },
};

export const examApi = {
  getExams: (params?: {
    status?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Exam>> => {
    return apiGet<PaginatedResponse<Exam>>('/exams', { params });
  },

  getExam: (id: string): Promise<{ exam: Exam }> => {
    return apiGet<{ exam: Exam }>(`/exams/${id}`);
  },

  createExam: (data: {
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
  }): Promise<{ exam: Exam }> => {
    return apiPost<{ exam: Exam }>('/exams', data);
  },

  updateExam: (id: string, data: Partial<Exam>) => {
    return apiPut(`/exams/${id}`, data);
  },

  publishExam: (id: string) => {
    return apiPost(`/exams/${id}/publish`);
  },

  startExam: (examId: string): Promise<StartExamResponse> => {
    return apiPost<StartExamResponse>(`/exams/${examId}/start`);
  },

  saveAnswer: (userExamId: string, data: SaveAnswerRequest) => {
    return apiPost(`/exams/${userExamId}/save`, data);
  },

  submitExam: (userExamId: string) => {
    return apiPost(`/exams/${userExamId}/submit`);
  },

  reportAnomaly: (userExamId: string, data: ReportAnomalyRequest) => {
    return apiPost(`/exams/${userExamId}/anomaly`, data);
  },

  getUserExam: (userExamId: string) => {
    return apiGet(`/exams/user-exam/${userExamId}`);
  },

  addExaminees: (examId: string, data: { examineeIds: string[] }) => {
    return apiPost(`/exams/${examId}/examinees`, data);
  },

  getExamExaminees: (examId: string, params?: {
    status?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) => {
    return apiGet(`/exams/${examId}/examinees`, { params });
  },
};

export const gradingApi = {
  getPendingGradings: (params?: {
    examId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<UserExam>> => {
    return apiGet<PaginatedResponse<UserExam>>('/grading/pending', { params });
  },

  getGradingDetails: (userExamId: string) => {
    return apiGet(`/grading/details/${userExamId}`);
  },

  gradeAnswer: (userAnswerId: string, data: { score: number; comment?: string }): Promise<{ gradingRecord: GradingRecord }> => {
    return apiPost<{ gradingRecord: GradingRecord }>(`/grading/grade/${userAnswerId}`, data);
  },

  batchGrade: (data: {
    gradings: Array<{
      userAnswerId: string;
      score: number;
      comment?: string;
    }>;
  }) => {
    return apiPost('/grading/batch-grade', data);
  },

  assignGradingTask: (data: {
    userExamId: string;
    graderId: string;
    questionIds?: string[];
  }) => {
    return apiPost('/grading/assign', data);
  },

  getGradingStatistics: (params?: { examId?: string; graderId?: string }) => {
    return apiGet('/grading/statistics', { params });
  },

  getMyGradingTasks: (params?: {
    status?: string;
    examId?: string;
    page?: number;
    pageSize?: number;
  }) => {
    return apiGet('/grading/my-tasks', { params });
  },
};

export const statisticsApi = {
  getDashboardStatistics: () => {
    return apiGet('/statistics/dashboard');
  },

  getExamStatistics: (examId: string): Promise<{ exam: Exam; statistics: ExamStatistics }> => {
    return apiGet<{ exam: Exam; statistics: ExamStatistics }>(`/statistics/exam/${examId}`);
  },

  exportExamResults: (examId: string) => {
    return apiGet(`/statistics/exam/${examId}/export`);
  },

  getKnowledgePointAnalysis: (examId: string) => {
    return apiGet(`/statistics/exam/${examId}/knowledge-points`);
  },
};

export const knowledgePointApi = {
  getKnowledgePoints: (params?: {
    parentId?: string;
    isActive?: boolean;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<KnowledgePoint & { questionCount: number }>> => {
    return apiGet<PaginatedResponse<KnowledgePoint & { questionCount: number }>>('/knowledge-points', { params });
  },

  getKnowledgePoint: (id: string) => {
    return apiGet(`/knowledge-points/${id}`);
  },

  getKnowledgePointTree: (params?: { isActive?: boolean }) => {
    return apiGet('/knowledge-points/tree', { params });
  },

  createKnowledgePoint: (data: {
    name: string;
    code: string;
    parentId?: string;
    description?: string;
    sortOrder?: number;
  }): Promise<{ knowledgePoint: KnowledgePoint }> => {
    return apiPost<{ knowledgePoint: KnowledgePoint }>('/knowledge-points', data);
  },

  updateKnowledgePoint: (id: string, data: Partial<KnowledgePoint>) => {
    return apiPut(`/knowledge-points/${id}`, data);
  },

  deleteKnowledgePoint: (id: string) => {
    return apiDelete(`/knowledge-points/${id}`);
  },
};
