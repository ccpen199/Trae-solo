const { db } = require('../database');

class SmsCode {
  static create(phone, type, code) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO sms_codes (phone, code, type, expires_at)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(phone, code, type, expiresAt);
    return { phone, code, type, expiresAt };
  }

  static verify(phone, code, type) {
    const result = db.prepare(`
      SELECT * FROM sms_codes 
      WHERE phone = ? AND code = ? AND type = ? AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      LIMIT 1
    `).get(phone, code, type);

    return !!result;
  }

  static generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static cleanupExpired() {
    db.prepare('DELETE FROM sms_codes WHERE expires_at < CURRENT_TIMESTAMP').run();
  }
}

module.exports = SmsCode;
