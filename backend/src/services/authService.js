const db = require('../utils/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'flight-booking-secret-key-2024';

const login = (username, password) => {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user) {
    return { error: '用户不存在' };
  }
  
  if (!bcrypt.compareSync(password, user.password)) {
    return { error: '密码错误' };
  }
  
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone
    }
  };
};

const getPermissionsByRole = (role) => {
  const rolePermissions = {
    admin: {
      visiblePages: ['dashboard', 'flights', 'orders', 'tickets', 'users', 'reports', 'settings'],
      allowedActions: ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'reassign']
    },
    passenger: {
      visiblePages: ['dashboard', 'my_orders', 'my_tickets', 'flights'],
      allowedActions: ['view', 'create_order', 'cancel_order', 'request_rebook', 'request_refund']
    },
    agent: {
      visiblePages: ['dashboard', 'flights', 'orders', 'tickets'],
      allowedActions: ['view', 'create_order', 'select_cabin', 'pay', 'issue_ticket', 'cancel_order']
    },
    customer_service: {
      visiblePages: ['dashboard', 'orders', 'tickets', 'rebook_refund'],
      allowedActions: ['view', 'approve', 'reject', 'request_more_info', 'reassign']
    },
    airline: {
      visiblePages: ['dashboard', 'flights', 'reports'],
      allowedActions: ['view', 'edit_flight']
    }
  };
  
  return rolePermissions[role] || rolePermissions.passenger;
};

module.exports = {
  login,
  getPermissionsByRole
};
