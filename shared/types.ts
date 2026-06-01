export type UserRole = 'student' | 'ta' | 'teacher' | 'admin';

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  email?: string;
  studentId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface GradeRecord {
  id: number;
  submissionId: number;
  courseId: number;
  classId?: number;
  experimentId: number;
  studentId: number;
  finalScore: number;
  version: number;
  createdAt: string;
  studentName?: string;
  studentNumber?: string;
  courseName?: string;
  experimentTitle?: string;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  teacherId?: number;
  createdAt: string;
}

export interface Class {
  id: number;
  name: string;
  courseId: number;
  createdAt: string;
}

export type ExperimentStatus = 'draft' | 'published' | 'closed';

export interface Experiment {
  id: number;
  title: string;
  description: string;
  objectives: string;
  template?: string;
  courseId: number;
  deadline: string;
  lateDeadline?: string;
  status: ExperimentStatus;
  version: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  rubricItems?: RubricItem[];
}

export interface RubricItem {
  id: number;
  experimentId: number;
  name: string;
  description: string;
  maxScore: number;
  weight: number;
  sortOrder: number;
}

export type SubmissionStatus = 'draft' | 'submitted' | 'late' | 'resubmitted' | 'returned' | 'graded';

export interface Submission {
  id: number;
  experimentId: number;
  studentId: number;
  status: SubmissionStatus;
  submittedAt?: string;
  gradedAt?: string;
  gradedBy?: number;
  totalScore?: number;
  version: number;
  createdAt: string;
  files?: SubmissionFile[];
  annotations?: Annotation[];
  studentName?: string;
  experimentTitle?: string;
}

export interface SubmissionFile {
  id: number;
  submissionId: number;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface Grade {
  id: number;
  submissionId: number;
  rubricItemId: number;
  score: number;
  comment?: string;
  gradedBy: number;
  createdAt: string;
}

export interface Annotation {
  id: number;
  submissionId: number;
  content: string;
  createdBy: number;
  createdAt: string;
  resolved: boolean;
}

export interface GradeArchive {
  id: number;
  submissionId: number;
  courseId: number;
  classId?: number;
  experimentId: number;
  studentId: number;
  totalScore: number;
  gradingVersion: number;
  archivedBy: number;
  archivedAt: string;
  adjustmentReason?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export const roleNames: Record<UserRole, string> = {
  student: '学生',
  ta: '助教',
  teacher: '教师',
  admin: '管理员',
};

export const statusColors: Record<SubmissionStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  late: 'bg-orange-100 text-orange-700',
  resubmitted: 'bg-yellow-100 text-yellow-700',
  returned: 'bg-red-100 text-red-700',
  graded: 'bg-green-100 text-green-700',
};

export const statusNames: Record<SubmissionStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  late: '迟交',
  resubmitted: '重交',
  returned: '已退回',
  graded: '已批改',
};
