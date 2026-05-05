import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { IProject } from '../types';

interface ProjectCreationAttributes extends Optional<IProject, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'description' | 'startDate' | 'endDate'> {}

class Project extends Model<IProject, ProjectCreationAttributes> implements IProject {
  public id!: number;
  public name!: string;
  public description!: string;
  public customerId!: number;
  public managerId!: number;
  public status!: 'planning' | 'ongoing' | 'completed' | 'cancelled';
  public startDate!: Date;
  public endDate!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Project.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'customer_id',
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    managerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'manager_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('planning', 'ongoing', 'completed', 'cancelled'),
      defaultValue: 'planning',
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'end_date'
    }
  },
  {
    sequelize,
    tableName: 'projects',
    timestamps: true,
    underscored: true
  }
);

export default Project;
