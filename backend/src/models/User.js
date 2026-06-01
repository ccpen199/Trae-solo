const { db } = require('../database');
const bcrypt = require('bcryptjs');

class User {
  static create(data) {
    const { phone, email, password, nickname, avatar, third_party_id, third_party_type, is_phone_bound } = data;
    
    let hashedPassword = null;
    if (password) {
      hashedPassword = bcrypt.hashSync(password, 10);
    }

    const stmt = db.prepare(`
      INSERT INTO users (phone, email, password, nickname, avatar, third_party_id, third_party_type, is_phone_bound)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(phone, email, hashedPassword, nickname, avatar, third_party_id, third_party_type, is_phone_bound ? 1 : 0);
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    return db.prepare('SELECT id, phone, email, nickname, avatar, is_phone_bound, third_party_type, created_at FROM users WHERE id = ?').get(id);
  }

  static findByPhone(phone) {
    return db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  }

  static findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }

  static findByThirdParty(third_party_id, third_party_type) {
    return db.prepare('SELECT * FROM users WHERE third_party_id = ? AND third_party_type = ?').get(third_party_id, third_party_type);
  }

  static update(id, data) {
    const fields = [];
    const values = [];

    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
    if (data.password !== undefined) { 
      fields.push('password = ?'); 
      values.push(bcrypt.hashSync(data.password, 10)); 
    }
    if (data.nickname !== undefined) { fields.push('nickname = ?'); values.push(data.nickname); }
    if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar); }
    if (data.is_phone_bound !== undefined) { fields.push('is_phone_bound = ?'); values.push(data.is_phone_bound ? 1 : 0); }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return this.findById(id);
  }

  static verifyPassword(user, password) {
    if (!user.password) return false;
    return bcrypt.compareSync(password, user.password);
  }

  static findByAccount(account) {
    if (account.includes('@')) {
      return this.findByEmail(account);
    }
    return this.findByPhone(account);
  }
}

module.exports = User;
