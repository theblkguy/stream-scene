import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../db/connection.js';

// User attributes interface
interface UserAttributes {
  id: number;
  email: string;
  name: string;
  google_id?: string;
  username?: string;
  bio?: string;
  profile_picture_url?: string;
  contact_email?: string;
  phone?: string;
  social_links?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Creation attributes (optional id and timestamps)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at'> {}

// Sequelize User model class
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare email: string;
  declare name: string;
  declare google_id?: string;
  declare username?: string;
  declare bio?: string;
  declare profile_picture_url?: string;
  declare contact_email?: string;
  declare phone?: string;
  declare social_links?: string;
  declare created_at?: Date;
  declare updated_at?: Date;

  // Compatibility getters for the old in-memory model properties
  get googleId(): string | undefined {
    return this.google_id;
  }

  get firstName(): string {
    return this.name.split(' ')[0] || '';
  }

  get lastName(): string {
    const parts = this.name.split(' ');
    return parts.slice(1).join(' ') || '';
  }

  get profilePic(): string | undefined {
    return this.profile_picture_url;
  }

  get socialLinks(): Record<string, string> | undefined {
    if (!this.social_links) return undefined;
    try {
      return JSON.parse(this.social_links);
    } catch {
      return undefined;
    }
  }

  set socialLinks(links: Record<string, string> | undefined) {
    this.social_links = links ? JSON.stringify(links) : undefined;
  }
}

// Initialize the model with the database connection
const sequelize = getSequelize();

User.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    google_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    username: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      validate: {
        len: [3, 20],
        is: /^[a-zA-Z0-9_]+$/, // Alphanumeric and underscores only
      },
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500], // Max 500 characters
      },
    },
    profile_picture_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    contact_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    social_links: {
      type: DataTypes.TEXT,
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
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default User;