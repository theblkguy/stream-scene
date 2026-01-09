// test/config/database.ts
// Test database configuration and setup

import { getSequelize } from '../../server/db/connection.js';
import { associate } from '../../server/db/index.js';
import { syncDB } from '../../server/db/index.js';

/**
 * Initialize test database
 * Creates tables and sets up associations
 */
export const initTestDatabase = async (): Promise<void> => {
  try {
    const sequelize = getSequelize();
    
    // Test connection
    await sequelize.authenticate();
    const dbType = sequelize.getDialect();
    if (dbType === 'sqlite') {
      console.log('✅ Using SQLite in-memory database (no MySQL setup required!)');
    } else {
      console.log(`✅ Test database connection established (${dbType})`);
    }
    
    // Set up associations
    associate();
    
    // Sync database schema (creates tables if they don't exist)
    // For SQLite, we use force:true to ensure clean state each time
    await sequelize.sync({ 
      force: dbType === 'sqlite', // Drop and recreate for SQLite (it's in-memory anyway)
      alter: false, // Don't alter existing tables
    });
    
    console.log('✅ Test database initialized');
  } catch (error: any) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.name === 'SequelizeAccessDeniedError') {
      console.error('❌ MySQL access denied. Tip: Tests use SQLite by default (no setup needed!)');
      console.error('   To use MySQL instead, set USE_SQLITE_FOR_TESTS=false in .env.test');
    } else {
      console.error('❌ Failed to initialize test database:', error.message || error);
    }
    throw error;
  }
};

/**
 * Drop all tables in test database
 * Use with caution - this deletes all data!
 */
export const dropTestDatabase = async (): Promise<void> => {
  try {
    const sequelize = getSequelize();
    
    // Drop all tables in reverse order of dependencies
    const tables = [
      'messages',
      'conversation_participants',
      'conversations',
      'comment_reactions',
      'comments',
      'canvas_collaborators',
      'canvases',
      'shares',
      'files',
      'tasks',
      'budget_entries',
      'budget_projects',
      'users',
    ];
    
    for (const table of tables) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
      } catch (error) {
        // Ignore errors for tables that don't exist
      }
    }
    
    console.log('✅ Test database dropped');
  } catch (error) {
    console.error('❌ Failed to drop test database:', error);
    throw error;
  }
};

/**
 * Close test database connection
 */
export const closeTestDatabase = async (): Promise<void> => {
  try {
    const sequelize = getSequelize();
    await sequelize.close();
    console.log('✅ Test database connection closed');
  } catch (error) {
    console.error('❌ Failed to close test database:', error);
  }
};

