// server/db/connection.ts
// Database connection singleton - separate from model imports to avoid circular dependencies

import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

// Always load environment variables first
dotenv.config();

let sequelize: Sequelize | null = null;

export const getSequelize = () => {
  if (!sequelize) {
    // Validate required environment variables in production
    if (process.env.NODE_ENV === 'production') {
      const requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS'];
      const missing = requiredVars.filter(varName => !process.env[varName]);
      
      if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }
    }

    const isTest = process.env.NODE_ENV === 'test';
    
    // Use SQLite for tests - no setup required!
    if (isTest && process.env.USE_SQLITE_FOR_TESTS !== 'false') {
      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:', // In-memory database - super fast, no setup needed
        logging: false,
        pool: {
          max: 1,
          min: 0,
          idle: 10000,
        },
      });
    } else {
      // Use MySQL for development/production
      sequelize = new Sequelize({
        dialect: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || (isTest ? 'streamscene_test' : 'streamscene_db'), 
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        logging: isTest ? false : (process.env.NODE_ENV === 'development' ? console.log : false),
        pool: {
          max: isTest ? 5 : 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        retry: {
          max: 3
        },
        // MySQL-specific options
        dialectOptions: isTest ? {
          connectTimeout: 60000,
        } : {}
      });
    }
  }
  return sequelize;
};

export const testConnection = async () => {
  try {
    const sequelizeInstance = getSequelize();
    await sequelizeInstance.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    console.log('Continuing with in-memory storage fallback...');
  }
};
