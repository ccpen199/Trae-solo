import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database/sequelize';

export interface KnowledgePointAttributes {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class KnowledgePoint extends Model<KnowledgePointAttributes> implements KnowledgePointAttributes {
  public id!: string;
  public name!: string;
  public code!: string;
  public parentId?: string;
  public description?: string;
  public sortOrder!: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

KnowledgePoint.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'knowledge_points',
        key: 'id',
      },
      field: 'parent_id',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    tableName: 'knowledge_points',
    indexes: [
      { unique: true, fields: ['code'] },
      { fields: ['parent_id'] },
      { fields: ['sort_order'] },
      { fields: ['is_active'] },
    ],
  }
);
