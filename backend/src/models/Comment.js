const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const { Package } = require('./Package');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '用户ID'
  },
  packageId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '套餐ID'
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '关联订单ID'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '评论内容'
  },
  rating: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    validate: {
      min: 1,
      max: 5
    },
    comment: '评分（1-5星）'
  },
  images: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '评论图片URL列表（JSON数组）'
  },
  tags: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '标签列表（如：性价比高、服务好）'
  },
  isAnonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否匿名'
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否置顶'
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '父评论ID（用于回复）'
  },
  replyToId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '回复的评论ID'
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '点赞数'
  },
  replyCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '回复数'
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '状态：1-已发布，0-待审核，-1-已删除'
  },
  auditReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '审核不通过原因'
  },
  attributeSelections: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '购买时选择的套餐属性（JSON对象）'
  },
  houseArea: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '购买时的房屋面积'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: '购买时的总价'
  }
}, {
  tableName: 'comments',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['packageId'] },
    { fields: ['userId'] },
    { fields: ['orderId'] },
    { fields: ['parentId'] },
    { fields: ['status'] }
  ]
});

const CommentLike = sequelize.define('CommentLike', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '用户ID'
  },
  commentId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '评论ID'
  }
}, {
  tableName: 'comment_likes',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'commentId'] }
  ]
});

Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Comment.belongsTo(Package, { foreignKey: 'packageId', as: 'package' });
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });

CommentLike.belongsTo(User, { foreignKey: 'userId', as: 'user' });
CommentLike.belongsTo(Comment, { foreignKey: 'commentId', as: 'comment' });

module.exports = {
  Comment,
  CommentLike
};
