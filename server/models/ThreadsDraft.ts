import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../db/connection.js';

const sequelize = getSequelize();

// Draft attributes interface
interface ThreadsDraftAttributes {
  id: number;
  userId: number;
  content: string;
  media_urls?: string[];
  media_type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  scheduled_time?: Date;
  timezone?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
  created_at: Date;
  updated_at: Date;
}

// Optional attributes for creation
type ThreadsDraftCreationAttributes = Optional<ThreadsDraftAttributes, 'id' | 'created_at' | 'updated_at'>;

// ThreadsDraft model class
class ThreadsDraft extends Model<ThreadsDraftAttributes, ThreadsDraftCreationAttributes> implements ThreadsDraftAttributes {
  public id!: number;
  public userId!: number;
  public content!: string;
  public media_urls?: string[];
  public media_type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  public scheduled_time?: Date;
  public timezone?: string;
  public status!: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
  public created_at!: Date;
  public updated_at!: Date;
}

// Initialize the model
ThreadsDraft.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    media_urls: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    media_type: {
      type: DataTypes.ENUM('TEXT', 'IMAGE', 'VIDEO', 'CAROUSEL'),
      allowNull: true,
      defaultValue: 'TEXT',
    },
    scheduled_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'UTC',
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED'),
      allowNull: false,
      defaultValue: 'DRAFT',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ThreadsDraft',
    tableName: 'threads_drafts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export { ThreadsDraft, ThreadsDraftAttributes, ThreadsDraftCreationAttributes };