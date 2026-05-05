const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Job extends Model {}

Job.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '职位名称'
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '职位分类ID'
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '所属部门'
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '工作地点'
    },
    salary_min: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '最低薪资'
    },
    salary_max: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '最高薪资'
    },
    salary_unit: {
      type: DataTypes.STRING(20),
      defaultValue: 'K',
      comment: '薪资单位'
    },
    experience: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '经验要求'
    },
    education: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '学历要求'
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '招聘人数'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '职位描述'
    },
    requirements: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '任职要求'
    },
    benefits: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '福利待遇'
    },
    contact_person: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '联系人'
    },
    contact_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '联系电话'
    },
    contact_email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '联系邮箱'
    },
    is_top: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否置顶'
    },
    is_hot: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否热门'
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
    },
    view_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '浏览次数'
    },
    apply_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '申请次数'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'closed'),
      defaultValue: 'active',
      comment: '状态：招聘中、已下架、已关闭'
    },
    publish_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '发布时间'
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '截止时间'
    }
  },
  {
    sequelize,
    modelName: 'Job',
    tableName: 'jobs',
    comment: '招聘职位表'
  }
);

module.exports = Job;