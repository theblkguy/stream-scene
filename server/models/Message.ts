// server/models/Message.ts
// Message model for messaging

import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../db/connection.js';

interface MessageAttributes {
  id: number;
  conversation_id: number;
  user_id?: number;
  content: string;
  message_type: 'text' | 'image' | 'file';
  file_url?: string;
  created_at?: Date;
  updated_at?: Date;
  edited_at?: Date;
  deleted_at?: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'user_id' | 'file_url' | 'created_at' | 'updated_at' | 'edited_at' | 'deleted_at'> {}

export class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  declare id: number;
  declare conversation_id: number;
  declare user_id?: number;
  declare content: string;
  declare message_type: 'text' | 'image' | 'file';
  declare file_url?: string;
  declare created_at?: Date;
  declare updated_at?: Date;
  declare edited_at?: Date;
  declare deleted_at?: Date;
}

const sequelize = getSequelize();

Message.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    conversation_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'conversations',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    message_type: {
      type: DataTypes.ENUM('text', 'image', 'file'),
      allowNull: false,
      defaultValue: 'text',
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
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
    edited_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Message;


