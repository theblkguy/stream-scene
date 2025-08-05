// server/db/index.ts
// Always load environment variables first
import dotenv from 'dotenv';
dotenv.config();

<<<<<<< HEAD
<<<<<<< HEAD
import { Sequelize } from 'sequelize';


let sequelize: Sequelize | null = null;
export const getSequelize = () => {
  if (!sequelize) {
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
=======
// Import Sequelize and your models
import { Sequelize } from 'sequelize-typescript';
// import { User } from '../models/User'; // Temporarily disabled - using mock User
=======
// Import Sequelize 
import { Sequelize } from 'sequelize';
<<<<<<< HEAD
>>>>>>> f858fd26 (built AIWeeklyPlanner component, made click function on landing page, created routes to create tasks, tasklist)
=======
import { File } from '../models/File';
>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)

// Set up Sequelize connection
const sequelize = new Sequelize({
  dialect: 'mysql', 
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'streamscene_db',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  logging: false,
});

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

// Simplified associations 
export const associate = () => {
  console.log('Database associations set up');
};

// call this to sync the DB (excluding File model for now)
export const syncDB = async (force = false) => {
  try {
    // Skip File model sync since we're using in-memory storage
    console.log('Database sync skipped - using in-memory file storage');
  } catch (error) {
    console.error('Database sync failed:', error);
  }
};

// Test connection on startup
testConnection();

// Export everything in one object
export const db = {
  sequelize,
<<<<<<< HEAD
>>>>>>> 741fab68 (fixed google OAuth authentication -Fixed Express Version Conflict, Changed GoogleLoginButton with styling, set up different routes for auth/google in cloud console, cleaned up conflicting server files, updated landing page to use new button)
=======
  File, // This is now our in-memory File class
>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)
  associate,
};

export type DB = typeof db;
export default db;