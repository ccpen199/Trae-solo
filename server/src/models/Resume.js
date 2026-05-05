const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Resume extends Model {}

Resume.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '用户ID（已登录用户）'
    },
    job_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '申请职位ID'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '姓名'
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'unknown'),
      defaultValue: 'unknown',
      comment: '性别'
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '出生日期'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '联系电话'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '邮箱'
    },
    education: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '最高学历'
    },
    major: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '专业'
    },
    school: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '毕业院校'
    },
    experience: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '工作经验'
    },
    current_city: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '当前所在城市'
    },
    expected_salary: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '期望薪资'
    },
    expected_position: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '期望职位'
    },
    expected_city: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '期望工作城市'
    },
    work_experience: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '工作经历'
    },
    project_experience: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '项目经历'
    },
    education_experience: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '教育经历'
    },
    skills: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '技能特长'
    },
    self_introduction: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '自我介绍'
    },
    attachment_path: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '附件简历路径'
    },
    attachment_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '附件简历名称'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已读'
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewing', 'interview', 'offer', 'rejected', 'hired'),
      defaultValue: 'pending',
      comment: '状态：待处理、审核中、面试中、已发offer、已拒绝、已录用'
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'IP地址'
    }
  },
  {
    sequelize,
    modelName: 'Resume',
    tableName: 'resumes',
    comment: '简历表'
  }
);

module.exports = Resume;