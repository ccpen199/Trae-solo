export type UserRole = 'student' | 'ta' | 'teacher' | 'admin';

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  email?: string;
  studentId?: string;
  createdAt: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
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
