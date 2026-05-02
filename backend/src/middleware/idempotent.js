const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

const checkIdempotency = (req, res, next) => {
  const idempotentKey = req.headers['x-idempotency-key'] || req.body.idempotentKey;
  
  if (!idempotentKey) {
    return next();
  }

  db.get(
    'SELECT * FROM idempotent_records WHERE key = ?',
    [idempotentKey],
    (err, record) => {
      if (err) {
        return res.status(500).json({ success: false, message: '数据库错误' });
      }
      
      if (record) {
        if (record.status === 'completed') {
          try {
            const result = JSON.parse(record.result);
            return res.json({ ...result, idempotent: true });
          } catch (e) {
            return res.json({ success: true, data: record.result, idempotent: true });
          }
        }
        if (record.status === 'processing') {
          return res.status(409).json({ 
            success: false, 
            message: '请求正在处理中，请稍后重试',
            status: 'processing'
          });
        }
      }
      
      const newRecordId = uuidv4();
      const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      db.run(
        'INSERT INTO idempotent_records (id, key, status, expired_at) VALUES (?, ?, ?, ?)',
        [newRecordId, idempotentKey, 'processing', expiredAt.toISOString()],
        (err) => {
          if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
              return res.status(409).json({ 
                success: false, 
                message: '幂等键冲突，请重试'
              });
            }
            return res.status(500).json({ success: false, message: '数据库错误' });
          }
          
          req.idempotentRecordId = newRecordId;
          req.idempotentKey = idempotentKey;
          
          const originalJson = res.json.bind(res);
          res.json = function(data) {
            if (req.idempotentKey && req.idempotentRecordId) {
              const status = data.success ? 'completed' : 'failed';
              db.run(
                'UPDATE idempotent_records SET status = ?, result = ? WHERE id = ?',
                [status, JSON.stringify(data), req.idempotentRecordId]
              );
            }
            return originalJson(data);
          };
          
          next();
        }
      );
    }
  );
};

module.exports = { checkIdempotency };
