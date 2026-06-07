import db from '../db.js';
import { BaseRepository } from './BaseRepository.js';
import { User } from '../types/index.js';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  findByIdCard(idCard: string): User | undefined {
    return this.findByField('id_card', idCard);
  }

  findByIdCardAndType(idCard: string, userType: string): User | undefined {
    const stmt = db.prepare(`
      SELECT * FROM users 
      WHERE id_card = ? AND user_type = ?
    `);
    return stmt.get(idCard, userType) as User | undefined;
  }

  search(keyword: string, page: number = 1, pageSize: number = 10) {
    const where = 'name LIKE ? OR id_card LIKE ?';
    const params = [`%${keyword}%`, `%${keyword}%`];
    return this.paginate(page, pageSize, where, params);
  }
}
