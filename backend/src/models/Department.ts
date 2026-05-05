import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { IDepartment } from '../types';

interface DepartmentCreationAttributes extends Optional<IDepartment, 'id' | 'createdAt' | 'updatedAt' | 'description'> {}

class Department extends Model<IDepartment, DepartmentCreationAttributes> implements IDepartment {
  public id!: number;
  public name!: string;
  public description!: string;
  public managerId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Department.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    managerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'manager_id'
    }
  },
  {
    sequelize,
    tableName: 'departments',
    timestamps: true,
    underscored: true
  }
);

export default Department;
