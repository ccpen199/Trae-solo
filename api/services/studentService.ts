import db from '../db/database.js';
import { StudentAccount } from '../../shared/types.js';

export function getStudentProfile(userId: string): StudentAccount | null {
  const result = db.prepare(`
    SELECT sp.id, sp.user_id, sp.student_no, sp.balance, sp.campus_card_id, 
           u.name, u.phone
    FROM student_profiles sp
    JOIN users u ON sp.user_id = u.id
    WHERE sp.user_id = ?
  `).get(userId) as {
    id: string; user_id: string; student_no: string; balance: number;
    campus_card_id: string; name: string; phone: string;
  } | undefined;

  if (!result) return null;

  return {
    id: result.id,
    userId: result.user_id,
    studentNo: result.student_no,
    name: result.name,
    balance: result.balance,
    campusCardId: result.campus_card_id,
    phone: result.phone,
  };
}

export function updateStudentBalance(studentId: string, amount: number): void {
  db.prepare(`
    UPDATE student_profiles SET balance = balance + ? WHERE id = ?
  `).run(amount, studentId);
}

export function getStudentByUserId(userId: string): { id: string } | null {
  return db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(userId) as { id: string } | null || null;
}
