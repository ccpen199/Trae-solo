export type BookStatus = 'not_started' | 'reading' | 'paused' | 'completed' | 'abandoned';

export type TimerMode = 'manual' | 'dwell' | 'voice';

export type NoteSourceType = 'ocr' | 'manual' | 'clip';

export type EntityType = 'person' | 'concept' | 'event' | 'place' | 'work';

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: Date | string;
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
  startDate?: Date | string;
  endDate?: Date | string;
  summary?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ReadingSession {
  id: string;
  bookId: string | null;
  mode: TimerMode;
  durationSeconds: number;
  startTime: Date | string;
  endTime?: Date | string;
  startPage?: number;
  endPage?: number;
  notes?: string;
  pauseReason?: 'user' | 'dwell_timeout' | 'voice_pause' | 'app_background' | null;
  voiceProgress?: number | null;
  targetProgress?: number | null;
  progressDelta?: number | null;
  savedAt?: Date | string | null;
  status?: 'active' | 'paused' | 'completed' | 'discarded';
  pauseEvents?: { reason: string; at: string }[];
  dwellDetections?: number;
  lastPauseAt?: string | null;
  snapshotCount?: number;
}

export interface Note {
  id: string;
  bookId: string | null;
  title?: string;
  content: string;
  sourceType: NoteSourceType;
  sourceImageId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface NoteParagraph {
  id: string;
  noteId: string;
  orderIndex: number;
  text: string;
  bbox?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface PageAnchor {
  id: string;
  noteId: string;
  pageNumber: number;
  confidence?: number;
  comment?: string;
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  description?: string;
  aliases?: string[];
  noteIds: string[];
  createdAt: Date | string;
}

export interface EntityRelation {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: string;
  noteId: string;
}

export interface OCRImage {
  id: string;
  noteId?: string;
  hash: string;
  dataUrl: string;
  width?: number;
  height?: number;
  createdAt: Date | string;
}

export interface OCRParagraph {
  orderIndex: number;
  text: string;
  bbox?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  confidence: number;
}

export interface OCRResult {
  imageId: string;
  text: string;
  paragraphs: OCRParagraph[];
}

export interface ExportConfig {
  scope: 'all' | 'books' | 'daterange';
  bookIds?: string[];
  startDate?: Date | string;
  endDate?: Date | string;
  includeImages: boolean;
  format: 'md' | 'md+json';
}

export interface DailyStat {
  date: string;
  durationSeconds: number;
  noteCount: number;
  pagesRead: number;
}

export type IdGenerator = () => string;

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  mode: TimerMode;
  bookId: string | null;
  startTime: Date | string | null;
  elapsedSeconds: number;
  startPage: number | null;
  endPage: number | null;
}
