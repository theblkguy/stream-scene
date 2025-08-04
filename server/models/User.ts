<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 9bac74e2 (Fix/ session continutuity maintained upon login)
=======
>>>>>>> 3d24405f (AI API calls working)
// Simple in-memory user storage for demo purposes
// In production, this would be replaced with proper database persistence

interface UserRecord {
=======
import { DataTypes, Model, Optional } from 'sequelize';
import db from '../db/index';

export interface UserAttributes {
>>>>>>> 645559b4 (AI API calls working)
  id: number;
  googleId: string;
  firstName: string;
  lastName: string;
  email: string;
<<<<<<< HEAD
<<<<<<< HEAD
=======
=======
=======
>>>>>>> 3d24405f (AI API calls working)
  profilePic?: string;
}

// In-memory user storage
const userStorage = new Map<number, UserRecord>();
const userByGoogleId = new Map<string, number>(); // googleId -> userId mapping
let nextUserId = 1;

>>>>>>> 9bac74e2 (Fix/ session continutuity maintained upon login)
// Minimal User class - NO Sequelize imports or decorators
export class User {
  id!: number;
  googleId!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
<<<<<<< HEAD
>>>>>>> 741fab68 (fixed google OAuth authentication -Fixed Express Version Conflict, Changed GoogleLoginButton with styling, set up different routes for auth/google in cloud console, cleaned up conflicting server files, updated landing page to use new button)
=======
=======
>>>>>>> 645559b4 (AI API calls working)
>>>>>>> 3d24405f (AI API calls working)
  profilePic?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

<<<<<<< HEAD
  static async findOne(options: any): Promise<User | null> {
    console.log('User.findOne called with:', options);
    
    if (options.where && options.where.googleId) {
      const googleId = options.where.googleId;
      const userId = userByGoogleId.get(googleId);
      
      if (userId) {
        const userRecord = userStorage.get(userId);
        if (userRecord) {
          return new User(userRecord);
        }
      }
    }
    
    return null;
  }
  
  static async create(data: any): Promise<User> {
    console.log('User.create called with:', data);
    
    const userId = nextUserId++;
    const userRecord: UserRecord = {
      id: userId,
      ...data
    };
    
    userStorage.set(userId, userRecord);
    userByGoogleId.set(data.googleId, userId);
    
    console.log('User created with ID:', userId);
    return new User(userRecord);
  }
  
  static async findByPk(id: number): Promise<User | null> {
    console.log('User.findByPk called with:', id);
    
    const userRecord = userStorage.get(id);
    if (userRecord) {
      console.log('Found user:', userRecord.firstName, userRecord.lastName);
      return new User(userRecord);
    }
    
    console.log('User not found for ID:', id);
    return null;
  }

  // Debug method to see stored users
  static getStorageStats() {
    return {
      totalUsers: userStorage.size,
      users: Array.from(userStorage.values())
    };
=======
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public googleId!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public profilePic?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Static method to find by Google ID
  static async findByGoogleId(googleId: string): Promise<User | null> {
    return await User.findOne({
      where: { googleId }
    });
>>>>>>> 645559b4 (AI API calls working)
  }
}

<<<<<<< HEAD
// In-memory user storage
const userStorage = new Map<number, UserRecord>();
const userByGoogleId = new Map<string, number>(); // googleId -> userId mapping
let nextUserId = 1;

// Minimal User class - NO Sequelize imports or decorators
export class User {
  id!: number;
  googleId!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  profilePic?: string;

  constructor(data: UserRecord) {
    this.id = data.id;
    this.googleId = data.googleId;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.email = data.email;
    this.profilePic = data.profilePic;
  }
  static async findOne(options: any): Promise<User | null> {
    console.log('User.findOne called with:', options);
    
    if (options.where && options.where.googleId) {
      const googleId = options.where.googleId;
      const userId = userByGoogleId.get(googleId);
      
      if (userId) {
        const userRecord = userStorage.get(userId);
        if (userRecord) {
          return new User(userRecord);
        }
      }
    }
    
    return null;
  }
  
  static async create(data: any): Promise<User> {
    console.log('User.create called with:', data);
    
    const userId = nextUserId++;
    const userRecord: UserRecord = {
      id: userId,
      ...data
    };
    
    userStorage.set(userId, userRecord);
    userByGoogleId.set(data.googleId, userId);
    
    console.log('User created with ID:', userId);
    return new User(userRecord);
  }
  
  static async findByPk(id: number): Promise<User | null> {
    console.log('User.findByPk called with:', id);
    
    const userRecord = userStorage.get(id);
    if (userRecord) {
      console.log('Found user:', userRecord.firstName, userRecord.lastName);
      return new User(userRecord);
    }
    
    console.log('User not found for ID:', id);
    return null;
  }

  // Debug method to see stored users
  static getStorageStats() {
    return {
      totalUsers: userStorage.size,
      users: Array.from(userStorage.values())
    };
  }
}
=======
User.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  profilePic: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize: db.sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['googleId'], unique: true },
    { fields: ['email'], unique: true },
  ],
});
>>>>>>> 3d24405f (AI API calls working)

export default User;