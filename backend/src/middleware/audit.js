const pool = require('../config/database');

const logAudit = async (req, action, module, targetType, targetId, oldValue = null, newValue = null) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const userId = req.user ? req.user.id : null;

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, module, target_type, target_id, old_value, new_value, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, action, module, targetType, targetId, 
       oldValue ? JSON.stringify(oldValue) : null, 
       newValue ? JSON.stringify(newValue) : null, 
       ipAddress, userAgent]
    );
  } catch (err) {
    console.error('审计日志记录失败:', err);
  }
};

module.exports = {
  logAudit,
};
