const { getSequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

let models = null;

const initModels = () => {
  if (models) return models;

  const sequelize = getSequelize();

  const Organization = sequelize.define('Organization', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '机构名称'
    },
    code: {
      type: DataTypes.STRING(50),
      unique: true,
      comment: '机构编码'
    },
    type: {
      type: DataTypes.ENUM('company', 'department', 'group'),
      defaultValue: 'department',
      comment: '机构类型：公司、部门、小组'
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'parent_id',
      comment: '上级机构ID'
    },
    leaderId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'leader_id',
      comment: '负责人ID'
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态：启用、停用'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '描述'
    }
  }, {
    tableName: 'organizations',
    timestamps: true,
    paranoid: true,
    underscored: true
  });

  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      comment: '用户名'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '密码'
    },
    realName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'real_name',
      comment: '真实姓名'
    },
    email: {
      type: DataTypes.STRING(100),
      comment: '邮箱'
    },
    phone: {
      type: DataTypes.STRING(20),
      comment: '手机号'
    },
    avatar: {
      type: DataTypes.STRING(500),
      comment: '头像地址'
    },
    orgId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'org_id',
      comment: '所属机构ID'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'locked'),
      defaultValue: 'active',
      comment: '状态：启用、停用、锁定'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      field: 'last_login_at',
      comment: '最后登录时间'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const bcrypt = require('bcryptjs');
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const bcrypt = require('bcryptjs');
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  User.prototype.validatePassword = async function (password) {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(password, this.password);
  };

  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '角色名称'
    },
    code: {
      type: DataTypes.STRING(50),
      unique: true,
      comment: '角色编码'
    },
    type: {
      type: DataTypes.ENUM('system', 'custom'),
      defaultValue: 'custom',
      comment: '类型：系统角色、自定义角色'
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态：启用、停用'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '描述'
    }
  }, {
    tableName: 'roles',
    timestamps: true,
    paranoid: true,
    underscored: true
  });

  const Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '权限名称'
    },
    code: {
      type: DataTypes.STRING(100),
      unique: true,
      comment: '权限编码'
    },
    type: {
      type: DataTypes.ENUM('menu', 'button', 'api'),
      defaultValue: 'menu',
      comment: '类型：菜单、按钮、API'
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'parent_id',
      comment: '上级权限ID'
    },
    path: {
      type: DataTypes.STRING(255),
      comment: '路由路径'
    },
    icon: {
      type: DataTypes.STRING(100),
      comment: '图标'
    },
    component: {
      type: DataTypes.STRING(255),
      comment: '组件路径'
    },
    method: {
      type: DataTypes.STRING(20),
      comment: 'HTTP方法'
    },
    apiPath: {
      type: DataTypes.STRING(255),
      field: 'api_path',
      comment: 'API路径'
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态：启用、停用'
    }
  }, {
    tableName: 'permissions',
    timestamps: true,
    paranoid: true,
    underscored: true
  });

  const Schedule = sequelize.define('Schedule', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '日程标题'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '日程描述'
    },
    type: {
      type: DataTypes.ENUM('personal', 'department', 'meeting'),
      defaultValue: 'personal',
      comment: '类型：个人日程、部门日程、会议'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_time',
      comment: '开始时间'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_time',
      comment: '结束时间'
    },
    isAllDay: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_all_day',
      comment: '是否全天'
    },
    location: {
      type: DataTypes.STRING(200),
      comment: '地点'
    },
    reminder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '提醒时间（分钟）'
    },
    color: {
      type: DataTypes.STRING(20),
      defaultValue: '#409EFF',
      comment: '日程颜色'
    },
    recurrenceType: {
      type: DataTypes.ENUM('none', 'daily', 'weekly', 'monthly', 'yearly'),
      defaultValue: 'none',
      field: 'recurrence_type',
      comment: '重复类型'
    },
    recurrenceRule: {
      type: DataTypes.JSON,
      field: 'recurrence_rule',
      comment: '重复规则'
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
      defaultValue: 'pending',
      comment: '状态：待确认、已确认、已取消、已完成'
    },
    visibility: {
      type: DataTypes.ENUM('private', 'public', 'department'),
      defaultValue: 'private',
      comment: '可见性：私有、公开、部门可见'
    },
    creatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'creator_id',
      comment: '创建人ID'
    },
    orgId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'org_id',
      comment: '所属机构ID'
    }
  }, {
    tableName: 'schedules',
    timestamps: true,
    paranoid: true,
    underscored: true
  });

  const UserRole = sequelize.define('UserRole', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'role_id'
    }
  }, {
    tableName: 'user_roles',
    timestamps: true,
    underscored: true
  });

  const RolePermission = sequelize.define('RolePermission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'role_id'
    },
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'permission_id'
    }
  }, {
    tableName: 'role_permissions',
    timestamps: true,
    underscored: true
  });

  User.belongsTo(Organization, { as: 'organization', foreignKey: 'orgId' });
  Organization.hasMany(User, { as: 'users', foreignKey: 'orgId' });

  Organization.belongsTo(Organization, { as: 'parent', foreignKey: 'parentId', onDelete: 'SET NULL' });
  Organization.hasMany(Organization, { as: 'children', foreignKey: 'parentId' });

  User.belongsToMany(Role, { through: UserRole, as: 'roles', foreignKey: 'userId' });
  Role.belongsToMany(User, { through: UserRole, as: 'users', foreignKey: 'roleId' });

  Role.belongsToMany(Permission, { through: RolePermission, as: 'permissions', foreignKey: 'roleId' });
  Permission.belongsToMany(Role, { through: RolePermission, as: 'roles', foreignKey: 'permissionId' });

  Permission.belongsTo(Permission, { as: 'parent', foreignKey: 'parentId', onDelete: 'CASCADE' });
  Permission.hasMany(Permission, { as: 'children', foreignKey: 'parentId' });

  Schedule.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
  User.hasMany(Schedule, { as: 'schedules', foreignKey: 'creatorId' });

  Schedule.belongsTo(Organization, { as: 'organization', foreignKey: 'orgId' });
  Organization.hasMany(Schedule, { as: 'schedules', foreignKey: 'orgId' });

  models = {
    sequelize,
    Organization,
    User,
    Role,
    Permission,
    Schedule,
    UserRole,
    RolePermission
  };

  return models;
};

module.exports = initModels;
