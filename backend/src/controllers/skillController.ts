import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../utils/database';
import fs from 'fs';
import path from 'path';

export function getExamQuestions(req: AuthRequest, res: Response) {
  const { tradeId } = req.params;
  
  const questions = db.prepare(`
    SELECT id, question_text, options, question_type, difficulty
    FROM exam_questions 
    WHERE trade_id = ?
    ORDER BY RANDOM()
    LIMIT 10
  `).all(tradeId) as any[];

  const formatted = questions.map((q: any) => ({
    ...q,
    question_text: q.question_text,
    options: q.options ? JSON.parse(q.options) : []
  }));

  res.json(formatted);
}

export function submitExam(req: AuthRequest, res: Response) {
  const workerId = req.user!.id;
  const { tradeId, answers } = req.body;

  if (!tradeId || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ message: '请提交有效的答题结果' });
  }

  const questionIds = answers.map((a: any) => a.questionId);
  const placeholders = questionIds.map(() => '?').join(',');
  
  const questions = db.prepare(`
    SELECT id, correct_answer
    FROM exam_questions 
    WHERE id IN (${placeholders})
  `).all(...questionIds);

  let correctCount = 0;
  for (const q of questions as any[]) {
    const userAnswer = answers.find((a: any) => a.questionId === q.id)?.answer;
    if (userAnswer === q.correct_answer) {
      correctCount++;
    }
  }

  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= 60;

  let assessment = db.prepare(`
    SELECT * FROM skill_assessments 
    WHERE worker_id = ? AND trade_id = ? AND assessment_status = 'pending'
  `).get(workerId, tradeId) as any;

  if (!assessment) {
    const insert = db.prepare(`
      INSERT INTO skill_assessments (worker_id, trade_id, theory_score, theory_passed, assessment_status)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = insert.run(workerId, tradeId, score, passed ? 1 : 0, passed ? 'theory_passed' : 'failed');
    assessment = { id: result.lastInsertRowid };
  } else {
    db.prepare(`
      UPDATE skill_assessments 
      SET theory_score = ?, theory_passed = ?, assessment_status = ?
      WHERE id = ?
    `).run(score, passed ? 1 : 0, passed ? 'theory_passed' : 'failed', assessment.id);
  }

  res.json({
    assessmentId: assessment.id,
    score,
    passed,
    totalQuestions: questions.length,
    correctCount,
    message: passed ? '理论考试通过，请上传实操视频' : '理论考试未通过，请重新考试'
  });
}

export function uploadPracticalVideo(req: AuthRequest, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: '请上传实操视频' });
  }

  const uploadDir = path.join(__dirname, '../../uploads/practical');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileName = `${Date.now()}_${req.file.originalname}`;
  const filePath = path.join(uploadDir, fileName);
  
  fs.writeFileSync(filePath, req.file.buffer);

  const url = `/uploads/practical/${fileName}`;
  res.json({ url, fileName });
}

export function submitPractical(req: AuthRequest, res: Response) {
  const workerId = req.user!.id;
  const { assessmentId, practicalVideoUrl } = req.body;

  if (!assessmentId || !practicalVideoUrl) {
    return res.status(400).json({ message: '请提供评估ID和视频地址' });
  }

  const assessment = db.prepare(`
    SELECT * FROM skill_assessments WHERE id = ? AND worker_id = ?
  `).get(assessmentId, workerId) as any;

  if (!assessment) {
    return res.status(404).json({ message: '评估记录不存在' });
  }

  if (assessment.theory_passed !== 1) {
    return res.status(400).json({ message: '请先通过理论考试' });
  }

  const practicalScore = simulatePracticalAssessment();
  const practicalPassed = practicalScore >= 60;

  let overallLevel = 0;
  let status = 'practical_passed';
  if (practicalPassed) {
    const avgScore = (assessment.theory_score + practicalScore) / 2;
    if (avgScore >= 90) overallLevel = 5;
    else if (avgScore >= 80) overallLevel = 4;
    else if (avgScore >= 70) overallLevel = 3;
    else if (avgScore >= 60) overallLevel = 2;
    status = 'completed';
  } else {
    status = 'failed';
  }

  db.prepare(`
    UPDATE skill_assessments 
    SET practical_video_url = ?, practical_score = ?, practical_passed = ?, 
        overall_level = ?, assessment_status = ?, assessed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(practicalVideoUrl, practicalScore, practicalPassed ? 1 : 0, overallLevel, status, assessmentId);

  if (overallLevel > 0) {
    db.prepare(`
      UPDATE worker_profiles 
      SET skill_level = MAX(skill_level, ?) 
      WHERE user_id = ?
    `).run(overallLevel, workerId);
  }

  res.json({
    assessmentId,
    practicalScore,
    practicalPassed,
    overallLevel,
    status,
    message: practicalPassed ? `技能评定完成，等级为${overallLevel}级` : '实操考核未通过，请重新上传视频'
  });
}

function simulatePracticalAssessment() {
  return 60 + Math.floor(Math.random() * 40);
}

export function getMyAssessments(req: AuthRequest, res: Response) {
  const workerId = req.user!.id;
  
  const assessments = db.prepare(`
    SELECT sa.*, t.gb_code, t.gb_name, t.category
    FROM skill_assessments sa
    JOIN trades t ON sa.trade_id = t.id
    WHERE sa.worker_id = ?
    ORDER BY sa.created_at DESC
  `).all(workerId) as any[];

  res.json(assessments);
}

export function getAssessmentDetail(req: AuthRequest, res: Response) {
  const { id } = req.params;
  
  const assessment = db.prepare(`
    SELECT sa.*, t.gb_code, t.gb_name, t.category, u.real_name as worker_name
    FROM skill_assessments sa
    JOIN trades t ON sa.trade_id = t.id
    JOIN users u ON sa.worker_id = u.id
    WHERE sa.id = ?
  `).get(id) as any;

  if (!assessment) {
    return res.status(404).json({ message: '评估记录不存在' });
  }

  if (req.user!.role === 'worker' && assessment.worker_id !== req.user!.id) {
    return res.status(403).json({ message: '无权查看他人评估' });
  }

  res.json(assessment);
}
