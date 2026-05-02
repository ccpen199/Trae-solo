const { get, run } = require('../database');

const IDEMPOTENT_HEADER = 'X-Idempotent-Key';
const IDEMPOTENT_TTL = 24 * 60 * 60 * 1000;

const checkIdempotency = async (req, res, next) => {
  const idempotentKey = req.headers[IDEMPOTENT_HEADER.toLowerCase()] || 
                        req.body.idempotentKey || 
                        req.query.idempotentKey;

  if (!idempotentKey) {
    return next();
  }

  try {
    const existing = await get(
      `SELECT * FROM idempotent_records WHERE idempotent_key = ?`,
      [idempotentKey]
    );

    if (existing) {
      if (existing.status === 'processing') {
        return res.status(409).json({
          success: false,
          message: '请求正在处理中，请稍后重试',
          idempotentKey,
          retryCount: existing.retry_count
        });
      }

      if (existing.status === 'success') {
        let responseData = {};
        try {
          responseData = JSON.parse(existing.response_data);
        } catch (e) {
          responseData = existing.response_data;
        }

        return res.status(200).json({
          ...responseData,
          idempotentKey,
          fromCache: true
        });
      }

      if (existing.status === 'failed' && existing.retry_count < existing.max_retries) {
        await run(`
          UPDATE idempotent_records 
          SET status = 'processing', retry_count = retry_count + 1 
          WHERE idempotent_key = ?
        `, [idempotentKey]);

        req.idempotentKey = idempotentKey;
        return next();
      }

      return res.status(429).json({
        success: false,
        message: '请求已失败且超过最大重试次数',
        idempotentKey,
        retryCount: existing.retry_count
      });
    }

    await run(`
      INSERT INTO idempotent_records 
      (idempotent_key, resource_type, request_data, status, max_retries, created_at)
      VALUES (?, ?, ?, 'processing', 3, CURRENT_TIMESTAMP)
    `, [
      idempotentKey,
      req.method + ' ' + req.path,
      JSON.stringify({
        body: req.body,
        query: req.query,
        params: req.params
      })
    ]);

    req.idempotentKey = idempotentKey;
    next();
  } catch (error) {
    console.error('幂等性检查错误:', error);
    next();
  }
};

const saveIdempotentResult = async (idempotentKey, status, responseData) => {
  if (!idempotentKey) return;

  try {
    await run(`
      UPDATE idempotent_records 
      SET status = ?, response_data = ?, processed_at = CURRENT_TIMESTAMP 
      WHERE idempotent_key = ?
    `, [
      status,
      typeof responseData === 'string' ? responseData : JSON.stringify(responseData),
      idempotentKey
    ]);
  } catch (error) {
    console.error('保存幂等结果错误:', error);
  }
};

const wrapResponse = (req, res) => {
  const originalJson = res.json.bind(res);
  
  res.json = (data) => {
    if (req.idempotentKey) {
      const status = data.success ? 'success' : 'failed';
      saveIdempotentResult(req.idempotentKey, status, data);
    }
    return originalJson(data);
  };

  return res;
};

const idempotentMiddleware = (req, res, next) => {
  wrapResponse(req, res);
  checkIdempotency(req, res, next);
};

module.exports = {
  idempotentMiddleware,
  checkIdempotency,
  saveIdempotentResult,
  IDEMPOTENT_HEADER
};
