const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Project extends Model {}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    projectNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '项目编号，自动生成'
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '项目名称'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '项目描述'
    },
    budget: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: '预算金额'
    },
    depositAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: '保证金金额'
    },
    status: {
      type: DataTypes.ENUM(
        'draft',
        'announcing',
        'registration',
        'bidding',
        'completed',
        'finished'
      ),
      defaultValue: 'draft',
      comment: '草稿、公告中、报名中、竞价中、已成交、已完成'
    },
    announcementTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '公告时间'
    },
    registrationDeadline: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '报名截止时间'
    },
    biddingStartTime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '竞价开始时间'
    },
    biddingEndTime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '竞价结束时间'
    },
    tendererId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '招标方ID'
    },
    branchCenter: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '所属分中心'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '项目类别'
    },
    winningBidderId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '中标竞买人ID'
    },
    winningAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: '成交金额'
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
    modelName: 'Project',
    tableName: 'projects',
    timestamps: true,
    indexes: [
      { fields: ['projectNumber'], unique: true },
      { fields: ['status'] },
      { fields: ['tendererId'] },
      { fields: ['announcementTime'] }
    ]
  }
);

module.exports = Project;
