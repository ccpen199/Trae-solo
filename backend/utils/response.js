function success(data = null, message = 'success') {
  return {
    success: true,
    code: 200,
    message,
    data
  };
}

function error(message = 'error', code = 500, data = null) {
  return {
    success: false,
    code,
    message,
    data
  };
}

function paginate(list, page = 1, pageSize = 10) {
  const total = list.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    list: list.slice(start, end),
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPages: Math.ceil(total / pageSize)
  };
}

function formatDate(date) {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function logOperation(db, userId, userType, module, operation, ip, userAgent) {
  try {
    db.query(
      'INSERT INTO operation_logs (user_id, user_type, module, operation, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, userType, module, operation, ip, userAgent || '']
    );
  } catch (e) {
    console.error('记录操作日志失败:', e.message);
  }
}

module.exports = {
  success,
  error,
  paginate,
  formatDate,
  logOperation
};
