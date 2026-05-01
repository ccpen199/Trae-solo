const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: `Account is ${user.status}. Please contact support.`
      });
    }

    req.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      creditScore: user.creditScore,
      creditLevel: user.creditLevel
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please login again.'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

const requireRole = (...requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${requiredRoles.join(', ')}`
      });
    }

    next();
  };
};

const requireMinCreditScore = (minScore) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (req.user.creditScore < minScore) {
      return res.status(403).json({
        success: false,
        error: `Credit score too low. Required: ${minScore}, Current: ${req.user.creditScore}`
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.status === 'active') {
        req.user = {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          creditScore: user.creditScore,
          creditLevel: user.creditLevel
        };
      }
    } catch (error) {
      console.warn('Optional auth token verification failed:', error.message);
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireMinCreditScore,
  optionalAuth
};
