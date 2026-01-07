// test/config/sqlite-config.ts
// SQLite in-memory database configuration for tests (no setup required!)

import { Sequelize } from 'sequelize';
import path from 'path';
import fs from 'fs';

let testSequelize: Sequelize | null = null;

/**
 * Get SQLite test database connection
 * Uses in-memory database - no MySQL required!
 */
export const getSQLiteTestDatabase = (): Sequelize => {
  if (!testSequelize) {
    // Use in-memory SQLite database - super fast, no setup needed
    testSequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:', // In-memory database
      logging: false, // Disable logging for cleaner test output
      pool: {
        max: 1,
        min: 0,
        idle: 10000,
      },
      // SQLite doesn't need these MySQL-specific options
    });
  }
  return testSequelize;
};

/**
 * Initialize SQLite test database
 */
export const initSQLiteTestDatabase = async (): Promise<Sequelize> => {
  const sequelize = getSQLiteTestDatabase();
  
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite test database ready (in-memory)');
    return sequelize;
  } catch (error) {
    console.error('❌ Failed to initialize SQLite test database:', error);
    throw error;
  }
};

/**
 * Close SQLite test database
 */
export const closeSQLiteTestDatabase = async (): Promise<void> => {
  if (testSequelize) {
    await testSequelize.close();
    testSequelize = null;
  }
};

