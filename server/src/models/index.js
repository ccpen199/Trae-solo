const sequelize = require('../config/database');

const User = require('./User');
const Post = require('./Post');
const Comment = require('./Comment');
const Like = require('./Like');
const PregnancyRecord = require('./PregnancyRecord');
const FetalMovement = require('./FetalMovement');
const Knowledge = require('./Knowledge');

User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' });

Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parentComment' });

User.hasMany(PregnancyRecord, { foreignKey: 'userId', as: 'pregnancyRecords' });
PregnancyRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(FetalMovement, { foreignKey: 'userId', as: 'fetalMovements' });
FetalMovement.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Post,
  Comment,
  Like,
  PregnancyRecord,
  FetalMovement,
  Knowledge
};
