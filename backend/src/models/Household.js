const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

const HOUSEHOLD_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MOVED: 'moved',
  DELETED: 'deleted'
};

const GENDER = {
  MALE: 'male',
  FEMALE: 'female'
};

class Household extends Model {
  static validateIdCard(idCard) {
    // 简单的身份证号格式验证（18位或15位）
    const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return reg.test(idCard);
  }
}

Household.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: '姓名不能为空' },
        len: { args: [2, 50], msg: '姓名长度应在2-50个字符之间' }
      }
    },
    idCard: {
      type: DataTypes.STRING(18),
      allowNull: false,
      unique: true,
      field: 'id_card',
      validate: {
        notEmpty: { msg: '身份证号不能为空' },
        isValidIdCard(value) {
          if (!Household.validateIdCard(value)) {
            throw new Error('身份证号格式不正确');
          }
        }
      }
    },
    gender: {
      type: DataTypes.ENUM(...Object.values(GENDER)),
      allowNull: false,
      validate: {
        isIn: {
          args: [Object.values(GENDER)],
          msg: '性别选择无效'
        }
      }
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [0], msg: '年龄不能为负数' },
        max: { args: [150], msg: '年龄不能超过150岁' }
      }
    },
    birthday: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '出生日期'
    },
    ethnicity: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '民族'
    },
    birthPlace: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'birth_place',
      comment: '出生地'
    },
    currentAddress: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'current_address',
      validate: {
        notEmpty: { msg: '现住址不能为空' }
      }
    },
    householdAddress: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'household_address',
      validate: {
        notEmpty: { msg: '户籍地址不能为空' }
      }
    },
    status: {
      type: DataTypes.ENUM(...Object.values(HOUSEHOLD_STATUS)),
      allowNull: false,
      defaultValue: HOUSEHOLD_STATUS.ACTIVE,
      comment: '户籍状态'
    },
    householdType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'household_type',
      comment: '户口类型（农业/非农业等）'
    },
    education: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '学历'
    },
    occupation: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '职业'
    },
    maritalStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'marital_status',
      comment: '婚姻状况'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '联系电话'
    },
    emergencyContact: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'emergency_contact',
      comment: '紧急联系人'
    },
    emergencyPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'emergency_phone',
      comment: '紧急联系电话'
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注信息'
    }
  },
  {
    sequelize,
    modelName: 'Household',
    tableName: 'households',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['id_card'] },
      { fields: ['name'] },
      { fields: ['status'] },
      { fields: ['current_address'] },
      { fields: ['household_address'] }
    ]
  }
);

module.exports = {
  Household,
  HOUSEHOLD_STATUS,
  GENDER
};
