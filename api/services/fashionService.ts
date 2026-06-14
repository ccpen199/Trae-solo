import { db } from '../db/index.js';
import { generateId } from '../utils/index.js';

export interface FashionQuiz {
  id: string;
  title: string;
  type: string;
  description: string;
  reward: number;
  status: string;
  createdAt: string;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  question: string;
  options: string[];
  imageUrl?: string;
  sortOrder: number;
}

export interface QuizResult {
  id: string;
  userId: string;
  quizId: string;
  answers: string[];
  result: string;
  createdAt: string;
}

function rowToQuiz(row: any): FashionQuiz {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    description: row.description,
    reward: parseFloat(row.reward),
    status: row.status,
    createdAt: row.created_at,
  };
}

function rowToQuestion(row: any): QuizQuestion {
  return {
    id: row.id,
    quizId: row.quiz_id,
    question: row.question,
    options: JSON.parse(row.options),
    imageUrl: row.image_url || undefined,
    sortOrder: row.sort_order,
  };
}

export function getFashionQuizzes(): FashionQuiz[] {
  const rows = db.prepare("SELECT * FROM fashion_quizzes WHERE status = 'active' ORDER BY created_at DESC").all() as any[];
  return rows.map(rowToQuiz);
}

export function getQuizById(quizId: string): FashionQuiz | null {
  const row = db.prepare('SELECT * FROM fashion_quizzes WHERE id = ?').get(quizId) as any;
  if (!row) return null;

  const quiz = rowToQuiz(row);
  const questions = db.prepare(`
    SELECT * FROM quiz_questions 
    WHERE quiz_id = ? 
    ORDER BY sort_order ASC
  `).all(quizId) as any[];

  quiz.questions = questions.map(rowToQuestion);
  return quiz;
}

export function submitQuizResult(
  userId: string,
  quizId: string,
  answers: { questionId: string; answer: string }[]
): {
  success: boolean;
  result: string;
  reward: number;
  message?: string;
} {
  const quiz = getQuizById(quizId);
  if (!quiz) {
    return { success: false, result: '', reward: 0, message: '测评不存在' };
  }

  const existing = db.prepare(`
    SELECT * FROM user_quiz_answers 
    WHERE user_id = ? AND quiz_id = ?
  `).get(userId, quizId) as any;

  if (existing) {
    return { success: false, result: '', reward: 0, message: '已完成过此测评' };
  }

  const resultText = analyzeQuizResult(quiz, answers);

  const answerId = generateId('qa-');
  db.prepare(`
    INSERT INTO user_quiz_answers (id, user_id, quiz_id, answers, result)
    VALUES (?, ?, ?, ?, ?)
  `).run(answerId, userId, quizId, JSON.stringify(answers), resultText);

  return {
    success: true,
    result: resultText,
    reward: quiz.reward,
  };
}

function analyzeQuizResult(quiz: FashionQuiz, answers: { questionId: string; answer: string }[]): string {
  const answerMap = new Map(answers.map(a => [a.questionId, a.answer]));

  if (quiz.type === 'hairstyle') {
    const firstAnswer = answerMap.get(quiz.questions?.[0]?.id || '');
    if (firstAnswer?.includes('鹅蛋')) return '你最适合齐肩微卷发型，温柔又修饰脸型！';
    if (firstAnswer?.includes('圆')) return '你最适合侧分长卷发，拉长脸型显精致！';
    if (firstAnswer?.includes('方')) return '你最适合空气刘海锁骨发，柔化脸部线条！';
    if (firstAnswer?.includes('长')) return '你最适合齐刘海短发，缩短脸型更可爱！';
    return '你的专属发型是层次中长发，百搭又时尚！';
  }

  if (quiz.type === 'clothing') {
    const firstAnswer = answerMap.get(quiz.questions?.[0]?.id || '');
    if (firstAnswer?.includes('黑白')) return '你的穿搭风格是极简主义，高级感满满！';
    if (firstAnswer?.includes('莫兰迪')) return '你的穿搭风格是温柔知性，优雅又耐看！';
    if (firstAnswer?.includes('明亮')) return '你的穿搭风格是活力元气，青春又吸睛！';
    if (firstAnswer?.includes('大地')) return '你的穿搭风格是复古文艺，气质超绝！';
    return '你的穿搭风格是百搭通勤，简洁又大方！';
  }

  return '恭喜你完成测评，继续探索你的风格吧！';
}

export function getUserQuizResults(userId: string): QuizResult[] {
  const rows = db.prepare(`
    SELECT * FROM user_quiz_answers 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).all(userId) as any[];

  return rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    quizId: row.quiz_id,
    answers: JSON.parse(row.answers),
    result: row.result,
    createdAt: row.created_at,
  }));
}
