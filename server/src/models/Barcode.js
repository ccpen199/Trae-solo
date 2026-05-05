const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Barcode extends Model {}

Barcode.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '条码编号'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '姓名/名称'
    },
    type: {
      type: DataTypes.ENUM('attendee', 'exhibitor', 'staff', 'vip'),
      defaultValue: 'attendee',
      comment: '类型：attendee-参会人员, exhibitor-参展商, staff-工作人员, vip-VIP'
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '所属部门ID'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '联系电话'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '邮箱'
    },
    company: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '公司/单位'
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '职位'
    },
    entryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '已入场次数'
    },
    maxEntryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '最大入场次数'
    },
    cateringCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '已消费餐饮次数'
    },
    maxCateringCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '最大餐饮次数'
    },
    bookletCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '已领取图册次数'
    },
    maxBookletCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '最大图册领取次数'
    },
    validFrom: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '有效开始时间'
    },
    validTo: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '有效结束时间'
    },
    entryTimeSlots: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
      comment: '允许入场的时段ID列表'
    },
    cateringTimeSlots: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
      comment: '允许餐饮的时段ID列表'
    },
    bookletTimeSlots: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
      comment: '允许领取图册的时段ID列表'
    },
    status: {
      type: DataTypes.ENUM('active', 'used', 'expired', 'cancelled'),
      defaultValue: 'active',
      comment: '状态：active-有效, used-已使用, expired-已过期, cancelled-已取消'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '备注'
    }
  },
  {
    sequelize,
    modelName: 'Barcode',
    tableName: 'barcodes',
    timestamps: true,
    paranoid: true,
    comment: '条码信息表',
    indexes: [
      {
        unique: true,
        fields: ['code']
      },
      {
        fields: ['status']
      },
      {
        fields: ['type']
      },
      {
        fields: ['departmentId']
      }
    ]
  }
);

module.exports = Barcode;
