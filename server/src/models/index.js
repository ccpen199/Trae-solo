const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Article = require('./Article');
const Question = require('./Question');
const Comment = require('./Comment');
const Answer = require('./Answer');
const Favorite = require('./Favorite');
const Like = require('./Like');
const Follow = require('./Follow');
const Notification = require('./Notification');
const Draft = require('./Draft');

User.hasMany(Article, { foreignKey: 'authorId', as: 'articles' });
Article.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Category.hasMany(Article, { foreignKey: 'categoryId', as: 'articles' });
Article.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

User.hasMany(Question, { foreignKey: 'authorId', as: 'questions' });
Question.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Category.hasMany(Question, { foreignKey: 'categoryId', as: 'questions' });
Question.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Question.hasMany(Answer, { foreignKey: 'questionId', as: 'answers' });
Answer.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

User.hasMany(Answer, { foreignKey: 'authorId', as: 'answers' });
Answer.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });

User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Like, { foreignKey: 'userId', as: 'likes' });
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Follow, { foreignKey: 'followerId', as: 'followings' });
Follow.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });

Follow.belongsTo(User, { foreignKey: 'followingId', as: 'following' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Notification.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

User.hasMany(Draft, { foreignKey: 'userId', as: 'drafts' });
Draft.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Category,
  Article,
  Question,
  Comment,
  Answer,
  Favorite,
  Like,
  Follow,
  Notification,
  Draft
};
