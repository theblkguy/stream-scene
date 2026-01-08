// server/models/Conversation.ts
// Conversation model for messaging

import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../db/connection.js';

interface ConversationAttributes {
  id: number;
  type: 'direct' | 'group';
  name?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface ConversationCreationAttributes extends Optional<ConversationAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
  declare id: number;
  declare type: 'direct' | 'group';
  declare name?: string;
  declare created_at?: Date;
  declare updated_at?: Date;
}

const sequelize = getSequelize();

Conversation.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('direct', 'group'),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
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
  },
  {
    sequelize,
    tableName: 'conversations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Conversation;


