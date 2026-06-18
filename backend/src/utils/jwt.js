const jwt = require('jsonwebtoken');

const generateToken = (userId, expiresIn = '7d') => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
};

module.exports = {
  generateToken,
  verifyToken,
};
