import { get, post } from '../api';
import type { 
  PaginatedResponse, Course, Exam, RankingItem 
} from '../../../shared/types';

export async function getCourses(params?: { page?: number; pageSize?: number; category?: string }) {
  return get<Course[]>('/training/courses', params);
}

export async function getCourse(id: number) {
  return get<Course>(`/training/courses/${id}`);
}

export async function getExams() {
  return get<Exam[]>('/training/exams');
}

export async function getExam(id: number) {
  return get<Exam>(`/training/exams/${id}`);
}

export async function getExamDetail(id: number) {
  return get<Exam>(`/training/exams/${id}`);
}

export async function submitExam(id: number, answers: Record<number, unknown>) {
  return post<{ score: number; totalScore: number; passingScore: number; passed: boolean }>(`/training/exams/${id}/submit`, { answers });
}

export async function getRankings(params?: { type?: string; period?: string; limit?: number }) {
  return get<RankingItem[]>('/training/ranking', params);
}
