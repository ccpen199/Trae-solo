const sequelize = require('../config/database');

const User = require('./User');
const Role = require('./Role');
const Category = require('./Category');
const Board = require('./Board');
const Topic = require('./Topic');
const Reply = require('./Reply');
const OperationLog = require('./OperationLog');

Role.hasMany(User, {
  foreignKey: 'roleId',
  as: 'users'
});

User.belongsTo(Role, {
  foreignKey: 'roleId',
  as: 'role'
});

Category.hasMany(Board, {
  foreignKey: 'categoryId',
  as: 'boards'
});

Board.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category'
});

Board.hasMany(Board, {
  foreignKey: 'parentId',
  as: 'children'
});

Board.belongsTo(Board, {
  foreignKey: 'parentId',
  as: 'parent'
});

Board.hasMany(Topic, {
  foreignKey: 'boardId',
  as: 'topics'
});

Topic.belongsTo(Board, {
  foreignKey: 'boardId',
  as: 'board'
});

User.hasMany(Topic, {
  foreignKey: 'userId',
  as: 'topics'
});

Topic.belongsTo(User, {
  foreignKey: 'userId',
  as: 'author'
});

Topic.hasMany(Reply, {
  foreignKey: 'topicId',
  as: 'replies'
});

Reply.belongsTo(Topic, {
  foreignKey: 'topicId',
  as: 'topic'
});

User.hasMany(Reply, {
  foreignKey: 'userId',
  as: 'replies'
});

Reply.belongsTo(User, {
  foreignKey: 'userId',
  as: 'author'
});

Reply.hasMany(Reply, {
  foreignKey: 'parentReplyId',
  as: 'children'
});

Reply.belongsTo(Reply, {
  foreignKey: 'parentReplyId',
  as: 'parentReply'
});

module.exports = {
  sequelize,
  User,
  Role,
  Category,
  Board,
  Topic,
  Reply,
  OperationLog
};
