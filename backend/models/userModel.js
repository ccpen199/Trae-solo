const db = require('../database');
const bcrypt = require('bcryptjs');

const findByUsername = (username) => {
  return new Promise((resolve, reject) => {
    try {
      const user = db.findByUsername(username);
      resolve(user);
    } catch (err) {
      reject(err);
    }
  });
};

const findById = (id) => {
  return new Promise((resolve, reject) => {
    try {
      const user = db.findById(id);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        resolve(userWithoutPassword);
      } else {
        resolve(null);
      }
    } catch (err) {
      reject(err);
    }
  });
};

const createUser = (userData) => {
  return new Promise((resolve, reject) => {
    try {
      const newUser = db.createUser(userData);
      const { password, ...userWithoutPassword } = newUser;
      resolve(userWithoutPassword);
    } catch (err) {
      reject(err);
    }
  });
};

const updateUser = (id, userData) => {
  return new Promise((resolve, reject) => {
    try {
      const updatedUser = db.updateUser(id, userData);
      if (updatedUser) {
        const { password, ...userWithoutPassword } = updatedUser;
        resolve(userWithoutPassword);
      } else {
        resolve(null);
      }
    } catch (err) {
      reject(err);
    }
  });
};

const deleteUser = (id) => {
  return new Promise((resolve, reject) => {
    try {
      const deleted = db.deleteUser(id);
      resolve(deleted);
    } catch (err) {
      reject(err);
    }
  });
};

const getAllUsers = (filters = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const users = db.getAllUsers(filters);
      const usersWithoutPassword = users.map(({ password, ...user }) => user);
      resolve(usersWithoutPassword);
    } catch (err) {
      reject(err);
    }
  });
};

const verifyPassword = (plainPassword, hashedPassword) => {
  return bcrypt.compareSync(plainPassword, hashedPassword);
};

module.exports = {
  findByUsername,
  findById,
  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
  verifyPassword
};
