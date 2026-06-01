const jwt = require("jsonwebtoken");
const db = require("../db");
const { error } = require("../utils/response");

const JWT_SECRET = process.env.JWT_SECRET || "may-63456-nursing-service-secret";

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return res.status(401).json(error("未提供访问令牌", 401));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db
      .prepare("SELECT id, username, name, role, phone, status FROM users WHERE id = ?")
      .get(payload.userId);
    if (!user || user.status !== "active") {
      return res.status(401).json(error("用户不存在或已停用", 401));
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json(error("访问令牌无效或已过期", 401));
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json(error("没有权限执行该操作", 403));
  }
  next();
};

module.exports = { authenticate, authorize, JWT_SECRET };
