import type { Resume } from './resume';

export interface HRReview {
  id: string;
  anchor: string;
  comment: string;
  type: 'positive' | 'suggestion' | 'warning';
}

export interface ResumeCase {
  id: string;
  industry: string;
  position: string;
  experienceLevel: 'junior' | 'mid' | 'senior' | 'executive';
  title: string;
  resumeSnapshot: Resume;
  hrReviews: HRReview[];
  rating: number;
  tags: string[];
  thumbnail: string;
}
