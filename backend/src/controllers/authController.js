const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { success, error } = require("../utils/response");
const { JWT_SECRET } = require("../middleware/auth");

const login = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json(error("用户名和密码不能为空"));
  }
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user) {
    return res.status(401).json(error("用户名或密码错误"));
  }
  const isValidPassword = bcrypt.compareSync(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json(error("用户名或密码错误"));
  }
  const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  const { password: _, ...userInfo } = user;
  res.json(success({ token, user: userInfo }, "登录成功"));
};

const getCurrentUser = (req, res) => {
  res.json(success(req.user, "获取用户信息成功"));
};

module.exports = { login, getCurrentUser };
