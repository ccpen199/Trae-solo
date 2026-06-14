import { db } from '../db/index.js';

export interface Joke {
  id: string;
  content: string;
  status: string;
  createdAt: string;
}

export interface IdiomQuestion {
  id: string;
  idiom: string;
  question: string;
  options: string[];
  answer: string;
  difficulty: number;
}

function rowToJoke(row: any): Joke {
  return {
    id: row.id,
    content: row.content,
    status: row.status,
    createdAt: row.created_at,
  };
}

function rowToIdiomQuestion(row: any): IdiomQuestion {
  return {
    id: row.id,
    idiom: row.idiom,
    question: row.question,
    options: JSON.parse(row.options),
    answer: row.answer,
    difficulty: row.difficulty,
  };
}

export function getJokes(page: number = 1, pageSize: number = 10): { jokes: Joke[]; total: number } {
  const offset = (page - 1) * pageSize;
  const rows = db.prepare(`
    SELECT * FROM jokes 
    WHERE status = 'active' 
    ORDER BY RANDOM() 
    LIMIT ? OFFSET ?
  `).all(pageSize, offset) as any[];

  const total = db.prepare("SELECT COUNT(*) as count FROM jokes WHERE status = 'active'").get() as { count: number };

  return {
    jokes: rows.map(rowToJoke),
    total: total.count,
  };
}

export function getRandomJoke(): Joke | null {
  const row = db.prepare("SELECT * FROM jokes WHERE status = 'active' ORDER BY RANDOM() LIMIT 1").get() as any;
  return row ? rowToJoke(row) : null;
}

export function getIdiomQuestions(count: number = 5): IdiomQuestion[] {
  const rows = db.prepare(`
    SELECT * FROM idiom_questions 
    ORDER BY RANDOM() 
    LIMIT ?
  `).all(count) as any[];

  return rows.map(rowToIdiomQuestion);
}

export function checkIdiomAnswer(questionId: string, answer: string): boolean {
  const row = db.prepare('SELECT answer FROM idiom_questions WHERE id = ?').get(questionId) as any;
  if (!row) return false;
  return row.answer === answer;
}
