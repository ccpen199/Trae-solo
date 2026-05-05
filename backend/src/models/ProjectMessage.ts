import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { IProjectMessage } from '../types';

interface ProjectMessageCreationAttributes extends Optional<IProjectMessage, 'id' | 'createdAt' | 'messageType' | 'parentMessageId'> {}

class ProjectMessage extends Model<IProjectMessage, ProjectMessageCreationAttributes> implements IProjectMessage {
  public id!: number;
  public projectId!: number;
  public userId!: number;
  public content!: string;
  public messageType!: 'discussion' | 'request';
  public parentMessageId!: number;
  public readonly createdAt!: Date;
}

ProjectMessage.init(
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    messageType: {
      type: DataTypes.ENUM('discussion', 'request'),
      defaultValue: 'discussion',
      field: 'message_type'
    },
    parentMessageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'parent_message_id',
      references: {
        model: 'project_messages',
        key: 'id'
      }
    }
  },
  {
    sequelize,
    tableName: 'project_messages',
    timestamps: true,
    updatedAt: false,
    underscored: true
  }
);

export default ProjectMessage;
