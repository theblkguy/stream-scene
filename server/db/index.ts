// server/db/index.ts
// Don't load environment variables here - let app.ts handle it
// import dotenv from 'dotenv';
// dotenv.config();

import { Sequelize } from 'sequelize';

let sequelize: Sequelize | null = null;
export const getSequelize = () => {
  if (!sequelize) {
    // Debug database configuration
    console.log('Database configuration:');
    console.log('DB_HOST:', process.env.DB_HOST || 'NOT SET');
    console.log('DB_NAME:', process.env.DB_NAME || 'NOT SET');
    console.log('DB_USER:', process.env.DB_USER || 'NOT SET');
    console.log('DB_PASS:', process.env.DB_PASS ? '***SET***' : 'NOT SET');
    
    sequelize = new Sequelize({
      dialect: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'streamscene_db',
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      logging: false,
    });
  }
  return sequelize;
};

// Create instance early
const sequelizeInstance = getSequelize();

// import model initializers **after** sequelizeInstance exists
import { initFileModel } from '../models/initFileModel.js';
import { Share } from '../models/Share.js';
import { initSocialAccountTokenModel, SocialAccountToken } from '../models/initSocialAccountToken.js';
import { initScheduledPostModel, ScheduledPost } from '../models/initScheduledPost.js';

// Initialize models
const File = initFileModel(sequelizeInstance);
initSocialAccountTokenModel(sequelizeInstance);
initScheduledPostModel(sequelizeInstance);

// (Associations are set inside initScheduledPostModel via belongsTo)
export const associate = () => {
  console.log('Database associations set up');
};

export const testConnection = async () => {
  try {
    await sequelizeInstance.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    console.log('Continuing with in-memory storage fallback...');
  }
};

// Sync EVERYTHING (not just File)
export const syncDB = async (force = false) => {
  try {
    await sequelizeInstance.sync({ force });
    console.log('Database sync complete (File, SocialAccountToken, ScheduledPost)');
  } catch (error) {
    console.error('Database sync failed:', error);
    throw error;
  }
};

export const db = {
  sequelize: sequelizeInstance,
  File,
  Share,
  SocialAccountToken,
  ScheduledPost,
  associate,
};

export type DB = typeof db;
export default db;
