const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const hashPassword = (password) => {
  return crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
};

const verifyPassword = (password, hashedPassword) => {
  return hashPassword(password) === hashedPassword;
};

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
      realName: user.real_name
    },
    process.env.JWT_SECRET || 'e-sign-system-secret-key-2024',
    { expiresIn: '24h' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || 'e-sign-system-secret-key-2024'
    );
  } catch (error) {
    return null;
  }
};

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

const generateId = () => {
  return require('uuid').v4();
};

const computeFileHash = (buffer, algorithm = 'sha256') => {
  return crypto
    .createHash(algorithm)
    .update(buffer)
    .digest('hex');
};

const buildSuccessResponse = (data, message = '操作成功') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

const buildErrorResponse = (error, message = '操作失败') => {
  return {
    success: false,
    message,
    error: error.message || error,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  formatDate,
  generateId,
  computeFileHash,
  buildSuccessResponse,
  buildErrorResponse
};
