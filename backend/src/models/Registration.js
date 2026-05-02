const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Registration extends Model {}

Registration.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '项目ID'
    },
    bidderId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '竞买人ID'
    },
    registrationNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '报名编号'
    },
    depositStatus: {
      type: DataTypes.ENUM(
        'pending',
        'locked',
        'activated',
        'refunded',
        'deducted'
      ),
      defaultValue: 'pending',
      comment: '保证金状态：待锁定、已锁定、已激活、已退回、已扣除'
    },
    depositLockedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '保证金锁定时间'
    },
    depositActivatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '保证金激活时间'
    },
    depositRefundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '保证金退回时间'
    },
    bankTransactionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '银行交易流水号'
    },
    biddingRight: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否拥有竞价权'
    },
    qualificationStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      comment: '资格审核状态'
    },
    qualificationApprovedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '资格审核人ID'
    },
    qualificationApprovedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '资格审核时间'
    },
    registrationTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '报名时间'
    },
    isWinner: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否中标'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'Registration',
    tableName: 'registrations',
    timestamps: true,
    indexes: [
      { fields: ['registrationNumber'], unique: true },
      { fields: ['projectId', 'bidderId'], unique: true },
      { fields: ['depositStatus'] },
      { fields: ['biddingRight'] }
    ]
  }
);

module.exports = Registration;
