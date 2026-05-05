import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ITask } from '../types';

interface TaskCreationAttributes extends Optional<ITask, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'priority' | 'description' | 'dueDate'> {}

class Task extends Model<ITask, TaskCreationAttributes> implements ITask {
  public id!: number;
  public projectId!: number;
  public name!: string;
  public description!: string;
  public assigneeId!: number;
  public status!: 'pending' | 'in_progress' | 'completed';
  public priority!: 'low' | 'medium' | 'high';
  public dueDate!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'project_id',
      references: {
        model: 'projects',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    assigneeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'assignee_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
      defaultValue: 'pending',
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'due_date'
    }
  },
  {
    sequelize,
    tableName: 'tasks',
    timestamps: true,
    underscored: true
  }
);

export default Task;
