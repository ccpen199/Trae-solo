import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../database';
import { UserRole } from '../types';

interface UserAttributes {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl?: string;
  nickname?: string;
  bio?: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isActive' | 'isVerified' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public username!: string;
  public email!: string;
  public passwordHash!: string;
  public role!: UserRole;
  public avatarUrl?: string;
  public nickname?: string;
  public bio?: string;
  public isActive!: boolean;
  public isVerified!: boolean;
  public lastLoginAt?: Date;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt?: Date;

  public toJSON(): Omit<UserAttributes, 'passwordHash'> {
    const values = { ...this.get() } as UserAttributes;
    delete values.passwordHash;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        isAlphanumeric: true,
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    role: {
      type: DataTypes.ENUM('viewer', 'creator', 'auditor', 'advertiser', 'admin'),
      allowNull: false,
      defaultValue: 'viewer',
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      field: 'avatar_url',
      validate: {
        isUrl: true,
      },
    },
    nickname: {
      type: DataTypes.STRING(100),
    },
    bio: {
      type: DataTypes.TEXT,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_verified',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      field: 'last_login_at',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ['username'],
      },
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['role'],
      },
    ],
  }
);
