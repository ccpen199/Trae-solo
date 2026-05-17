const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 2592000000) return `${Math.floor(diff / 86400000)}天前`;
  
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const successResponse = (res, data = null, message = '操作成功') => {
  res.json({
    success: true,
    data,
    message
  });
};

const errorResponse = (res, message = '操作失败', status = 400) => {
  res.status(status).json({
    success: false,
    data: null,
    message
  });
};

module.exports = {
  formatTime,
  formatDate,
  generateCode,
  successResponse,
  errorResponse
};
