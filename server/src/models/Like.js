const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

const LIKE_TARGETS = {
  POST: 'post',
  COMMENT: 'comment'
};

class Like extends Model {
  static getLikeTargets() {
    return LIKE_TARGETS;
  }
}

Like.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    targetType: {
      type: DataTypes.ENUM(...Object.values(LIKE_TARGETS)),
      allowNull: false,
      field: 'target_type'
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'target_id'
    }
  },
  {
    sequelize,
    modelName: 'Like',
    tableName: 'likes',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['target_type', 'target_id']
      },
      {
        fields: ['user_id', 'target_type', 'target_id'],
        unique: true
      }
    ]
  }
);

module.exports = Like;
