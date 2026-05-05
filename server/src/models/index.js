const sequelize = require('../config/database');

const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const ProductCategory = require('./ProductCategory');
const Product = require('./Product');
const NewsCategory = require('./NewsCategory');
const News = require('./News');
const DownloadCategory = require('./DownloadCategory');
const Download = require('./Download');
const Message = require('./Message');
const Job = require('./Job');
const Resume = require('./Resume');

const UserRole = sequelize.define('UserRole', {}, { tableName: 'user_roles', timestamps: true, underscored: true });
const RolePermission = sequelize.define('RolePermission', {}, { tableName: 'role_permissions', timestamps: true, underscored: true });

User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id', otherKey: 'role_id' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id', otherKey: 'user_id' });

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', otherKey: 'permission_id' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', otherKey: 'role_id' });

Permission.belongsTo(Permission, { as: 'parent', foreignKey: 'parent_id' });
Permission.hasMany(Permission, { as: 'children', foreignKey: 'parent_id' });

ProductCategory.belongsTo(ProductCategory, { as: 'parent', foreignKey: 'parent_id' });
ProductCategory.hasMany(ProductCategory, { as: 'children', foreignKey: 'parent_id' });

Product.belongsTo(ProductCategory, { as: 'category', foreignKey: 'category_id' });
ProductCategory.hasMany(Product, { as: 'products', foreignKey: 'category_id' });

NewsCategory.belongsTo(NewsCategory, { as: 'parent', foreignKey: 'parent_id' });
NewsCategory.hasMany(NewsCategory, { as: 'children', foreignKey: 'parent_id' });

News.belongsTo(NewsCategory, { as: 'category', foreignKey: 'category_id' });
NewsCategory.hasMany(News, { as: 'news', foreignKey: 'category_id' });

DownloadCategory.belongsTo(DownloadCategory, { as: 'parent', foreignKey: 'parent_id' });
DownloadCategory.hasMany(DownloadCategory, { as: 'children', foreignKey: 'parent_id' });

Download.belongsTo(DownloadCategory, { as: 'category', foreignKey: 'category_id' });
DownloadCategory.hasMany(Download, { as: 'downloads', foreignKey: 'category_id' });

Message.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
Message.belongsTo(User, { as: 'replyUser', foreignKey: 'reply_user_id' });

Resume.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
Resume.belongsTo(Job, { as: 'job', foreignKey: 'job_id' });
Job.hasMany(Resume, { as: 'resumes', foreignKey: 'job_id' });

module.exports = {
  sequelize,
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  ProductCategory,
  Product,
  NewsCategory,
  News,
  DownloadCategory,
  Download,
  Message,
  Job,
  Resume
};