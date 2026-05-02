const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Bid extends Model {}

Bid.init(
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
    registrationId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '报名记录ID'
    },
    bidNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '出价编号'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: '出价金额'
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '当前排名'
    },
    bidTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '出价时间'
    },
    status: {
      type: DataTypes.ENUM('normal', 'abnormal', 'invalid'),
      defaultValue: 'normal',
      comment: '出价状态：正常、异常、无效'
    },
    abnormalReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '异常原因'
    },
    isWinningBid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否为中标价'
    },
    previousBidId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '前一次出价ID'
    },
    priceDifference: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: '与前一次出价的差价'
    },
    priceChangePercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '价格变化百分比'
    },
    operationSignature: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '操作签名'
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
    modelName: 'Bid',
    tableName: 'bids',
    timestamps: true,
    indexes: [
      { fields: ['bidNumber'], unique: true },
      { fields: ['projectId', 'bidTime'] },
      { fields: ['projectId', 'status'] },
      { fields: ['bidderId'] },
      { fields: ['rank'] }
    ]
  }
);

module.exports = Bid;
