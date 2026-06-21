import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getStudentProfile, getStudentByUserId } from '../services/studentService.js';
import { getStudentTransactions, getSemesterSummary, getAvailableSemesters, getTransactionById } from '../services/transactionService.js';

const router = Router();

router.get('/profile', authMiddleware(['student']), (req, res): void => {
  const profile = getStudentProfile(req.auth!.userId);
  if (!profile) {
    res.status(404).json({ code: 404, message: '学生档案不存在', data: null });
    return;
  }
  res.json({ code: 200, message: 'success', data: profile });
});

router.get('/transactions', authMiddleware(['student']), (req, res): void => {
  const student = getStudentByUserId(req.auth!.userId);
  if (!student) {
    res.status(404).json({ code: 404, message: '学生档案不存在', data: null });
    return;
  }

  const limit = Number(req.query.limit) || 50;
  const offset = Number(req.query.offset) || 0;

  const result = getStudentTransactions(student.id, limit, offset);
  res.json({ code: 200, message: 'success', data: result });
});

router.get('/transactions/:id', authMiddleware(['student']), (req, res): void => {
  const tx = getTransactionById(req.params.id);
  if (!tx) {
    res.status(404).json({ code: 404, message: '交易记录不存在', data: null });
    return;
  }
  res.json({ code: 200, message: 'success', data: tx });
});

router.get('/summary/semesters', authMiddleware(['student']), (req, res): void => {
  const student = getStudentByUserId(req.auth!.userId);
  if (!student) {
    res.status(404).json({ code: 404, message: '学生档案不存在', data: null });
    return;
  }
  const semesters = getAvailableSemesters(student.id);
  res.json({ code: 200, message: 'success', data: semesters });
});

router.get('/summary', authMiddleware(['student']), (req, res): void => {
  const student = getStudentByUserId(req.auth!.userId);
  if (!student) {
    res.status(404).json({ code: 404, message: '学生档案不存在', data: null });
    return;
  }
  const semester = req.query.semester as string | undefined;
  const summary = getSemesterSummary(student.id, semester);
  res.json({ code: 200, message: 'success', data: summary });
});

export default router;
