const sequelize = require('../config/database');

const User = require('./User');
const Category = require('./Category');
const Resource = require('./Resource');
const Comment = require('./Comment');
const Favorite = require('./Favorite');
const Group = require('./Group');
const GroupMember = require('./GroupMember');
const GroupPost = require('./GroupPost');
const Friendship = require('./Friendship');
const ActivityLog = require('./ActivityLog');
const SearchLog = require('./SearchLog');

User.hasMany(Resource, { foreignKey: 'userId', as: 'resources' });
Resource.belongsTo(User, { foreignKey: 'userId', as: 'author' });

Category.hasMany(Resource, { foreignKey: 'categoryId', as: 'resources' });
Resource.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' });

Resource.hasMany(Comment, { foreignKey: 'resourceId', as: 'comments' });
Comment.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' });

GroupPost.hasMany(Comment, { foreignKey: 'groupPostId', as: 'comments' });
Comment.belongsTo(GroupPost, { foreignKey: 'groupPostId', as: 'groupPost' });

Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });

User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Resource.hasMany(Favorite, { foreignKey: 'resourceId', as: 'favorites' });
Favorite.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' });

GroupPost.hasMany(Favorite, { foreignKey: 'groupPostId', as: 'favorites' });
Favorite.belongsTo(GroupPost, { foreignKey: 'groupPostId', as: 'groupPost' });

User.hasMany(Group, { foreignKey: 'ownerId', as: 'ownedGroups' });
Group.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.belongsToMany(Group, { through: GroupMember, foreignKey: 'userId', as: 'groups' });
Group.belongsToMany(User, { through: GroupMember, foreignKey: 'groupId', as: 'members' });

GroupMember.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
GroupMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Group.hasMany(GroupPost, { foreignKey: 'groupId', as: 'posts' });
GroupPost.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });

User.hasMany(GroupPost, { foreignKey: 'userId', as: 'groupPosts' });
GroupPost.belongsTo(User, { foreignKey: 'userId', as: 'author' });

User.belongsToMany(User, { 
  through: Friendship, 
  foreignKey: 'userId', 
  as: 'friends',
  otherKey: 'friendId'
});

User.belongsToMany(User, { 
  through: Friendship, 
  foreignKey: 'friendId', 
  as: 'friendRequests',
  otherKey: 'userId'
});

module.exports = {
  sequelize,
  User,
  Category,
  Resource,
  Comment,
  Favorite,
  Group,
  GroupMember,
  GroupPost,
  Friendship,
  ActivityLog,
  SearchLog,
};
