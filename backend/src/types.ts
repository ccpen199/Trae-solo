export type BookStatus = 'not_started' | 'reading' | 'paused' | 'completed' | 'abandoned';
export type TimerMode = 'manual' | 'dwell' | 'voice';
export type NoteSourceType = 'ocr' | 'manual' | 'clip';
export type EntityType = 'person' | 'concept' | 'event' | 'place' | 'work';

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  publishDate?: string;
  isbn10?: string;
  isbn13?: string;
  category?: string;
  coverImage?: string;
  coverImageData?: string;
  totalPages: number;
  currentPage: number;
  progress: number;
  status: BookStatus;
  tagIds: string[];
  startDate?: string;
  endDate?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingSession {
  id: string;
  bookId: string | null;
  mode: TimerMode;
  durationSeconds: number;
  startTime: string;
  endTime?: string;
  startPage?: number;
  endPage?: number;
  notes?: string;
}

export interface Note {
  id: string;
  bookId: string | null;
  title?: string;
  content: string;
  sourceType: NoteSourceType;
  sourceImageId?: string;
  createdAt: string;
  updatedAt: string;
}
