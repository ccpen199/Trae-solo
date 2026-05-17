const { run } = require('../models/database');

const logOperation = async (userId, action, module, requestData = null, responseData = null, ip = null, userAgent = null) => {
  try {
    await run(
      `INSERT INTO operation_logs (user_id, action, module, request_data, response_data, ip, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        module,
        requestData ? JSON.stringify(requestData) : null,
        responseData ? JSON.stringify(responseData) : null,
        ip,
        userAgent
      ]
    );
  } catch (err) {
    console.error('Failed to log operation:', err);
  }
};

module.exports = {
  logOperation
};
