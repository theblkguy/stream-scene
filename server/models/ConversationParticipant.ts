// server/models/ConversationParticipant.ts
// Conversation participant model for messaging

import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../db/connection.js';

interface ConversationParticipantAttributes {
  id: number;
  conversation_id: number;
  user_id: number;
  role?: 'admin' | 'member';
  joined_at?: Date;
  left_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface ConversationParticipantCreationAttributes extends Optional<ConversationParticipantAttributes, 'id' | 'role' | 'joined_at' | 'left_at' | 'created_at' | 'updated_at'> {}

export class ConversationParticipant extends Model<ConversationParticipantAttributes, ConversationParticipantCreationAttributes> implements ConversationParticipantAttributes {
  declare id: number;
  declare conversation_id: number;
  declare user_id: number;
  declare role?: 'admin' | 'member';
  declare joined_at?: Date;
  declare left_at?: Date;
  declare created_at?: Date;
  declare updated_at?: Date;
}

const sequelize = getSequelize();

ConversationParticipant.init(
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
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.ENUM('admin', 'member'),
      allowNull: true,
      defaultValue: 'member',
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    left_at: {
      type: DataTypes.DATE,
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
    tableName: 'conversation_participants',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default ConversationParticipant;


