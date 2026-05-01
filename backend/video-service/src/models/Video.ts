import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../database';
import { VideoStatus } from '../types';

interface VideoAttributes {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  originalUrl: string;
  thumbnailUrl?: string;
  duration: number;
  width?: number;
  height?: number;
  fileSize: number;
  format?: string;
  status: VideoStatus;
  visibility: string;
  category?: string;
  tags?: string[];
  hotScore: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  collectCount: number;
  completeRate: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface VideoCreationAttributes extends Optional<VideoAttributes, 'id' | 'duration' | 'fileSize' | 'status' | 'visibility' | 'hotScore' | 'viewCount' | 'likeCount' | 'commentCount' | 'shareCount' | 'collectCount' | 'completeRate' | 'version' | 'createdAt' | 'updatedAt'> {}

export class Video extends Model<VideoAttributes, VideoCreationAttributes> implements VideoAttributes {
  public id!: string;
  public creatorId!: string;
  public title!: string;
  public description?: string;
  public originalUrl!: string;
  public thumbnailUrl?: string;
  public duration!: number;
  public width?: number;
  public height?: number;
  public fileSize!: number;
  public format?: string;
  public status!: VideoStatus;
  public visibility!: string;
  public category?: string;
  public tags?: string[];
  public hotScore!: number;
  public viewCount!: number;
  public likeCount!: number;
  public commentCount!: number;
  public shareCount!: number;
  public collectCount!: number;
  public completeRate!: number;
  public version!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt?: Date;
}

Video.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    creatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'creator_id',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200],
      },
    },
    description: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 2000],
      },
    },
    originalUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'original_url',
    },
    thumbnailUrl: {
      type: DataTypes.STRING(500),
      field: 'thumbnail_url',
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    width: {
      type: DataTypes.INTEGER,
    },
    height: {
      type: DataTypes.INTEGER,
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      field: 'file_size',
    },
    format: {
      type: DataTypes.STRING(20),
    },
    status: {
      type: DataTypes.ENUM('uploading', 'transcoding', 'safety_checking', 'pending_review', 'published', 'rejected', 'taken_down'),
      allowNull: false,
      defaultValue: 'uploading',
    },
    visibility: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'public',
    },
    category: {
      type: DataTypes.STRING(50),
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
    },
    hotScore: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'hot_score',
    },
    viewCount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      field: 'view_count',
    },
    likeCount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      field: 'like_count',
    },
    commentCount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      field: 'comment_count',
    },
    shareCount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      field: 'share_count',
    },
    collectCount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      field: 'collect_count',
    },
    completeRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'complete_rate',
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    tableName: 'videos',
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        fields: ['creator_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['hot_score'],
        order: [['hot_score', 'DESC']],
      },
      {
        fields: ['category'],
      },
      {
        fields: ['visibility'],
      },
    ],
  }
);
