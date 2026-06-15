import { Router, type Request, type Response } from 'express';
import {
  MOCK_CAMPUS_SESSIONS,
  generateWrittenExam,
  generateAIInterview,
} from '../mock/mockData.js';
import {
  ApiResponse,
  CampusSession,
  WrittenExam,
  AIInterview,
  AIScoreReport,
} from '../../shared/types/index.js';

const router = Router();

function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

function fail(error: string): ApiResponse {
  return { success: false, error };
}

router.get('/sessions', async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 12;
  const format = req.query.format as string;
  const university = (req.query.university as string)?.trim();

  let sessions = [...MOCK_CAMPUS_SESSIONS];
  if (format) {
    sessions = sessions.filter(s => s.format === format);
  }
  if (university) {
    sessions = sessions.filter(s => s.university.includes(university));
  }

  sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const total = sessions.length;
  const startIdx = (page - 1) * pageSize;
  const paginated = sessions.slice(startIdx, startIdx + pageSize);
  const totalPages = Math.ceil(total / pageSize);

  res.json({
    success: true,
    data: paginated,
    pagination: { page, pageSize, total, totalPages },
  });
});

router.post('/sessions/:id/register', async (req: Request, res: Response): Promise<void> => {
  const sessionId = req.params.id;
  const session = MOCK_CAMPUS_SESSIONS.find(s => s.id === sessionId);

  if (!session) {
    res.status(404).json(fail('宣讲会不存在'));
    return;
  }

  if (session.registered >= session.capacity) {
    res.status(400).json(fail('宣讲会名额已满'));
    return;
  }

  res.json(ok({
    sessionId,
    registered: session.registered + 1,
    registrationCode: `REG_${Date.now()}`,
  }, '预约成功'));
});

router.get('/sessions/:id/replay', async (req: Request, res: Response): Promise<void> => {
  const sessionId = req.params.id;
  const session = MOCK_CAMPUS_SESSIONS.find(s => s.id === sessionId);

  if (!session) {
    res.status(404).json(fail('宣讲会不存在'));
    return;
  }

  if (!session.replayUrl) {
    res.status(404).json(fail('该宣讲会暂无回放'));
    return;
  }

  res.json(ok({
    sessionId,
    replayUrl: session.replayUrl,
    duration: 90,
    views: Math.floor(Math.random() * 500) + 100,
  }));
});

router.get('/exams/:positionId', async (req: Request, res: Response): Promise<void> => {
  const positionId = req.params.positionId;
  const exam: WrittenExam = generateWrittenExam(positionId);

  res.json(ok<WrittenExam>(exam));
});

router.post('/exams/:positionId/submit', async (req: Request, res: Response): Promise<void> => {
  const positionId = req.params.positionId;
  const answers = req.body.answers as Array<{ questionIndex: number; answer: string | string[] }>;

  const exam = generateWrittenExam(positionId);
  let correctCount = 0;
  let totalScore = 0;
  const details = exam.questions.map((q, idx) => {
    const userAnswer = answers.find(a => a.questionIndex === idx)?.answer;
    let isCorrect = false;
    if (Array.isArray(q.answer) && Array.isArray(userAnswer)) {
      isCorrect = q.answer.sort().join(',') === userAnswer.sort().join(',');
    } else {
      isCorrect = userAnswer === q.answer;
    }
    if (isCorrect) {
      correctCount++;
      totalScore += q.score;
    }
    return { questionIndex: idx, correct: isCorrect, score: isCorrect ? q.score : 0, maxScore: q.score };
  });

  const maxScore = exam.questions.reduce((s, q) => s + q.score, 0);
  const passed = totalScore >= exam.passScore;

  res.json(ok({
    positionId,
    totalScore,
    maxScore,
    correctCount,
    totalQuestions: exam.questions.length,
    passed,
    passScore: exam.passScore,
    details,
  }, passed ? '恭喜通过笔试！' : '很遗憾，笔试未通过'));
});

router.get('/ai-interview/:positionId', async (req: Request, res: Response): Promise<void> => {
  const positionId = req.params.positionId;
  const interview: AIInterview = generateAIInterview(positionId);

  res.json(ok<AIInterview>(interview));
});

router.post('/ai-interview/:positionId/submit', async (req: Request, res: Response): Promise<void> => {
  const positionId = req.params.positionId;
  const { videoUrls, candidateId } = req.body as { videoUrls?: string[]; candidateId?: string };

  const expression = 70 + Math.floor(Math.random() * 25);
  const speech = 65 + Math.floor(Math.random() * 30);
  const semantics = 60 + Math.floor(Math.random() * 35);
  const aiWeights = { expression: 0.25, speech: 0.25, semantics: 0.5 };

  const totalScore = Math.round(
    expression * aiWeights.expression +
    speech * aiWeights.speech +
    semantics * aiWeights.semantics
  );

  const keywordHitRate = 60 + Math.floor(Math.random() * 35);

  const feedbackParts: string[] = [];
  if (expression >= 85) feedbackParts.push('整体精神面貌良好，表达自信');
  else if (expression < 70) feedbackParts.push('建议面试时保持眼神交流，展现更积极的精神状态');

  if (speech >= 85) feedbackParts.push('语言表达流畅，语速适中');
  else if (speech < 70) feedbackParts.push('语速需要调整，表达可更清晰有条理');

  if (semantics >= 85) feedbackParts.push('回答内容充实，能够结合实际案例');
  else if (semantics < 70) feedbackParts.push('回答可更具体，建议结合过往经历展开');

  if (totalScore >= 80) feedbackParts.push('整体表现优秀，建议进入下一轮面试');
  else if (totalScore >= 60) feedbackParts.push('整体表现合格，部分方面有待提升');
  else feedbackParts.push('整体有待提高，建议加强面试准备');

  const report: AIScoreReport = {
    id: `aisr_${Date.now()}`,
    interviewId: `ai_${positionId.slice(-5)}`,
    candidateId: candidateId || 'anonymous',
    overallScore: totalScore,
    dimensions: { expression, speech, semantics },
    keywordHitRate,
    feedback: feedbackParts.join('；') + '。',
  } as any;

  res.json(ok<AIScoreReport>(report, 'AI评分完成'));
});

router.get('/universities', async (req: Request, res: Response): Promise<void> => {
  const universities = Array.from(new Set(MOCK_CAMPUS_SESSIONS.map(s => s.university))).map(name => ({
    name,
    sessionCount: MOCK_CAMPUS_SESSIONS.filter(s => s.university === name).length,
    schools: Array.from(new Set(MOCK_CAMPUS_SESSIONS.filter(s => s.university === name).map(s => s.school))),
  }));

  res.json(ok(universities));
});

export default router;
