import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { IUser, UserRole } from '../types';

interface UserCreationAttributes extends Optional<IUser, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> {}

class User extends Model<IUser, UserCreationAttributes> implements IUser {
  public id!: number;
  public username!: string;
  public password!: string;
  public name!: string;
  public email!: string;
  public phone!: string;
  public departmentId!: number;
  public role!: UserRole;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'department_id'
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.EMPLOYEE
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true
  }
);

export default User;
